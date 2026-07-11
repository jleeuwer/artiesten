const Artist = require("../models/artist");
const Discogs = require("../services/discogsClient");

function normalizePayload(body = {}) {
  const text = (value) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === "" ? null : trimmed;
  };

  const isoDate = (value) => {
    const normalized = text(value);
    if (!normalized) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const err = new Error("Invalid date format. Use YYYY-MM-DD.");
      err.statusCode = 400;
      throw err;
    }
    return normalized;
  };

  return {
    ar_artist_name: text(body.ar_artist_name),
    ar_artist_dateofbirth: isoDate(body.ar_artist_dateofbirth),
    ar_artist_passing: isoDate(body.ar_artist_passing),
    ar_website_url: text(body.ar_website_url),
    ar_artist_notes: text(body.ar_artist_notes),
    ar_artist_type: text(body.ar_artist_type) || 'unknown',
  };
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return String(value).toLowerCase() === "true";
}

async function list(req, res) {
  const search = (req.query.search ?? "").toString();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const sort = (req.query.sort ?? "favorite_first").toString();
  const mergeStatus = (req.query.mergeStatus ?? "active").toString();

  const includeDeleted = parseBoolean(req.query.includeDeleted);
  const onlyDeleted = parseBoolean(req.query.onlyDeleted);
  const favoriteOnly = parseBoolean(req.query.favoriteOnly);

  const data = await Artist.list({ search, limit, offset, includeDeleted, onlyDeleted, favoriteOnly, sort, mergeStatus });
  res.json(data);
}

async function get(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const artist = await Artist.getById(id);
  if (!artist) return res.status(404).json({ error: "Not found" });

  res.json(artist);
}

async function getRelations(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const relations = await Artist.getRelations(id);
  if (!relations) return res.status(404).json({ error: "Not found" });

  res.json(relations);
}


async function getDiscogsConfigStatus(req, res) {
  res.json(Discogs.getDiscogsStatus(process.env));
}

async function searchDiscogsForArtist(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const artist = await Artist.getById(id);
  if (!artist) return res.status(404).json({ error: "Artist not found" });

  const query = (req.query.q ?? artist.ar_artist_name ?? "").toString().trim();
  const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 25);

  try {
    const result = await Discogs.searchArtists(query, { limit, env: process.env });
    res.json({
      artist: {
        ar_artist_key: artist.ar_artist_key,
        ar_artist_name: artist.ar_artist_name,
      },
      discogs: result,
      config: Discogs.getDiscogsStatus(process.env),
    });
  } catch (err) {
    if (err.code === "DISCOGS_NOT_CONFIGURED" || err.statusCode === 503) {
      return res.status(503).json({
        error: "Discogs is niet geconfigureerd.",
        disabledReason: err.message,
        config: Discogs.getDiscogsStatus(process.env),
      });
    }
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, discogsStatusCode: err.discogsStatusCode || null });
    throw err;
  }
}

async function getDiscogsArtistDetail(req, res) {
  const discogsArtistId = Number(req.params.discogsArtistId);
  if (!Number.isFinite(discogsArtistId) || discogsArtistId <= 0) {
    return res.status(400).json({ error: "Invalid Discogs artist id" });
  }

  try {
    const detail = await Discogs.getArtistDetail(discogsArtistId, { env: process.env });
    res.json({ detail, config: Discogs.getDiscogsStatus(process.env) });
  } catch (err) {
    if (err.code === "DISCOGS_NOT_CONFIGURED" || err.statusCode === 503) {
      return res.status(503).json({
        error: "Discogs is niet geconfigureerd.",
        disabledReason: err.message,
        config: Discogs.getDiscogsStatus(process.env),
      });
    }
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, discogsStatusCode: err.discogsStatusCode || null });
    throw err;
  }
}


async function linkDiscogsArtist(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const discogsArtistId = Number(req.body?.discogsArtistId ?? req.body?.discogs_artist_id);
  if (!Number.isFinite(discogsArtistId) || discogsArtistId <= 0) {
    return res.status(400).json({ error: "Invalid Discogs artist id" });
  }

  const artist = await Artist.getById(id);
  if (!artist) return res.status(404).json({ error: "Artist not found" });

  try {
    const detail = await Discogs.getArtistDetail(discogsArtistId, { env: process.env });
    const result = await Artist.linkDiscogsArtist({
      artistKey: id,
      discogsDetail: detail,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
      cacheTtlSeconds: Discogs.getDiscogsStatus(process.env).cacheTtlSeconds,
    });
    res.status(201).json({ ...result, detail, config: Discogs.getDiscogsStatus(process.env) });
  } catch (err) {
    if (err.code === "DISCOGS_NOT_CONFIGURED" || err.statusCode === 503) {
      return res.status(503).json({
        error: "Discogs is niet geconfigureerd.",
        disabledReason: err.message,
        config: Discogs.getDiscogsStatus(process.env),
      });
    }
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, discogsStatusCode: err.discogsStatusCode || null });
    throw err;
  }
}


async function getDiscogsImages(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await Artist.listDiscogsImages(id);
    if (!data) return res.status(404).json({ error: "Artist not found" });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}

async function setPrimaryDiscogsImage(req, res) {
  const id = Number(req.params.id);
  const imageId = Number(req.params.imageId);
  if (!Number.isFinite(id) || !Number.isFinite(imageId)) {
    return res.status(400).json({ error: "Invalid artist id or image id" });
  }

  try {
    const data = await Artist.setPrimaryDiscogsImage({
      artistKey: id,
      imageId,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}



async function getDiscogsEnrichmentProposals(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await Artist.listDiscogsEnrichmentProposals(id);
    if (!data) return res.status(404).json({ error: "Artist not found" });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}

async function generateDiscogsEnrichmentProposals(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await Artist.generateDiscogsEnrichmentProposals(id);
    if (!data) return res.status(404).json({ error: "Artist not found" });
    res.status(201).json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}


async function updateDiscogsEnrichmentProposalStatus(req, res) {
  const id = Number(req.params.id);
  const proposalId = Number(req.params.proposalId);
  if (!Number.isFinite(id) || !Number.isFinite(proposalId)) {
    return res.status(400).json({ error: "Invalid artist id or proposal id" });
  }

  try {
    const data = await Artist.updateDiscogsEnrichmentProposalStatus({
      artistKey: id,
      proposalId,
      status: req.body?.status,
      note: req.body?.note || "",
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code || null });
    throw err;
  }
}

async function applyDiscogsEnrichmentProposal(req, res) {
  const id = Number(req.params.id);
  const proposalId = Number(req.params.proposalId);
  if (!Number.isFinite(id) || !Number.isFinite(proposalId)) {
    return res.status(400).json({ error: "Invalid artist id or proposal id" });
  }

  try {
    const data = await Artist.applyDiscogsEnrichmentProposal({
      artistKey: id,
      proposalId,
      confirmOverwrite: req.body?.confirmOverwrite === true,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    res.json(data);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code || null,
        proposalId: err.proposalId || proposalId,
        targetField: err.targetField || null,
      });
    }
    throw err;
  }
}

async function listDiscogsNameProposals(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await Artist.listDiscogsNameProposals(id, {
      status: req.query?.status || "all",
      type: req.query?.type || "all",
      q: req.query?.q || "",
    });
    if (!data) return res.status(404).json({ error: "Artist not found" });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code || null });
    throw err;
  }
}

async function generateDiscogsNameProposals(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await Artist.generateDiscogsNameProposals(id);
    if (!data) return res.status(404).json({ error: "Artist not found" });
    res.status(201).json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code || null });
    throw err;
  }
}

async function updateDiscogsNameProposalStatus(req, res) {
  const id = Number(req.params.id);
  const proposalId = Number(req.params.proposalId);
  if (!Number.isFinite(id) || !Number.isFinite(proposalId)) {
    return res.status(400).json({ error: "Invalid artist id or proposal id" });
  }

  try {
    const data = await Artist.updateDiscogsNameProposalStatus({
      artistKey: id,
      proposalId,
      status: req.body?.status,
      note: req.body?.note || "",
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code || null });
    throw err;
  }
}

async function applyDiscogsNameProposalAsSpelling(req, res) {
  const id = Number(req.params.id);
  const proposalId = Number(req.params.proposalId);
  if (!Number.isFinite(id) || !Number.isFinite(proposalId)) {
    return res.status(400).json({ error: "Invalid artist id or proposal id" });
  }

  try {
    const data = await Artist.applyDiscogsNameProposalAsSpelling({
      artistKey: id,
      proposalId,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    if (!data) return res.status(404).json({ error: "Artist or proposal not found" });
    res.status(201).json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code || null });
    throw err;
  }
}

async function getDiscogsSpellingProposals(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await Artist.getDiscogsSpellingProposals(id);
    if (!data) return res.status(404).json({ error: "Artist not found" });
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}


async function addDiscogsAlternativeSpelling(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await Artist.addDiscogsAlternativeSpelling({
      artistKey: id,
      proposedName: req.body?.proposedName || req.body?.proposed_name,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    if (!result) return res.status(404).json({ error: "Artist not found" });
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code || null,
        conflictingArtistKey: err.conflictingArtistKey || null,
        conflictingArtistName: err.conflictingArtistName || null,
      });
    }
    throw err;
  }
}



async function getDiscogsCanonicalRenamePreview(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await Artist.getDiscogsCanonicalRenamePreview({
      artistKey: id,
      proposedName: req.body?.proposedName || req.body?.proposed_name,
    });
    if (!result) return res.status(404).json({ error: "Artist not found" });
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code || null });
    }
    throw err;
  }
}


async function executeDiscogsCanonicalRename(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await Artist.executeDiscogsCanonicalRename({
      artistKey: id,
      proposedName: req.body?.proposedName || req.body?.proposed_name,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
    });
    if (!result) return res.status(404).json({ error: "Artist not found" });
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code || null,
        conflictingArtistKey: err.conflictingArtistKey || null,
        conflictingArtistName: err.conflictingArtistName || null,
      });
    }
    throw err;
  }
}

async function getMergeHistory(req, res) {
  const artistKey = req.query.artistKey !== undefined ? Number(req.query.artistKey) : null;
  if (artistKey !== null && !Number.isFinite(artistKey)) return res.status(400).json({ error: "Invalid artistKey" });

  const limit = Math.min(Math.max(Number(req.query.limit ?? 100), 1), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const data = await Artist.getMergeHistory({ artistKey, limit, offset });
  res.json(data);
}



async function listDuplicateReviewCandidates(req, res) {
  const status = (req.query.status ?? "open").toString();
  const search = (req.query.search ?? "").toString();
  const minScore = req.query.minScore !== undefined && req.query.minScore !== "" ? Number(req.query.minScore) : null;
  const scanRunId = req.query.scanRunId !== undefined && req.query.scanRunId !== "" ? Number(req.query.scanRunId) : null;
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  const data = await Artist.listDuplicateReviewCandidates({ status, search, minScore, scanRunId, limit, offset });
  res.json(data);
}

async function updateDuplicateCandidateStatus(req, res) {
  const candidateId = Number(req.params.candidateId);
  if (!Number.isFinite(candidateId)) return res.status(400).json({ error: "Invalid candidate id" });

  try {
    const updated = await Artist.updateDuplicateCandidateStatus(candidateId, {
      status: req.body?.status,
      note: req.body?.note,
      reviewedBy: req.body?.reviewedBy || req.user?.username || "artist-app",
    });
    if (!updated) return res.status(404).json({ error: "Candidate not found" });
    res.json(updated);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}

async function findDuplicateCandidates(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 50);
  const minScore = Math.min(Math.max(Number(req.query.minScore ?? 0.72), 0.1), 1);
  const data = await Artist.findDuplicateCandidates(id, { limit, minScore });
  if (!data) return res.status(404).json({ error: "Not found" });

  res.json(data);
}

async function getMergeImpact(req, res) {
  const redundantArtistKey = Number(req.query.redundantArtistKey ?? req.query.redundant);
  const replacementArtistKey = Number(req.query.replacementArtistKey ?? req.query.replacement);

  if (!Number.isFinite(redundantArtistKey) || !Number.isFinite(replacementArtistKey)) {
    return res.status(400).json({ error: "Both redundantArtistKey and replacementArtistKey are required" });
  }
  if (redundantArtistKey === replacementArtistKey) {
    return res.status(400).json({ error: "Redundant and replacement artist must be different" });
  }

  try {
    const data = await Artist.getMergeImpact({ redundantArtistKey, replacementArtistKey });
    if (!data) return res.status(404).json({ error: "One or both artists were not found" });

    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    throw err;
  }
}

async function executeMerge(req, res) {
  const redundantArtistKey = Number(req.body?.redundantArtistKey ?? req.body?.redundant);
  const replacementArtistKey = Number(req.body?.replacementArtistKey ?? req.body?.replacement);

  if (!Number.isFinite(redundantArtistKey) || !Number.isFinite(replacementArtistKey)) {
    return res.status(400).json({ error: "Both redundantArtistKey and replacementArtistKey are required" });
  }
  if (redundantArtistKey === replacementArtistKey) {
    return res.status(400).json({ error: "Redundant and replacement artist must be different" });
  }

  try {
    const result = await Artist.executeArtistMerge({
      redundantArtistKey,
      replacementArtistKey,
      reason: req.body?.reason,
      performedBy: req.body?.performedBy || req.user?.username || "artist-app",
      duplicateCandidateId: req.body?.duplicateCandidateId,
    });
    res.status(201).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (err.safeMessage || err.mergeStep) {
      return res.status(statusCode).json({
        error: err.safeMessage || "Merge is niet uitgevoerd; de transactie is teruggedraaid.",
        detail: statusCode >= 500 ? "Zie serverlog voor technische details." : err.message,
        mergeStep: err.mergeStep || null,
        transaction: "rolled_back",
      });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    throw err;
  }
}

async function create(req, res) {
  const payload = normalizePayload(req.body);
  if (!payload.ar_artist_name) {
    return res.status(400).json({ error: "Artist name is required" });
  }

  const created = await Artist.create(payload);
  res.status(201).json(created);
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const payload = normalizePayload(req.body);
  if (!payload.ar_artist_name) {
    return res.status(400).json({ error: "Artist name is required" });
  }

  const updated = await Artist.update(id, payload);
  if (!updated) return res.status(404).json({ error: "Not found" });

  res.json(updated);
}

async function setFavorite(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const favorite = parseBoolean(req.body?.favorite, false);
  const updated = await Artist.setFavorite(id, favorite);
  if (!updated) return res.status(404).json({ error: "Not found" });

  res.json(updated);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const deleted = await Artist.softDelete(id);
  if (!deleted) return res.status(404).json({ error: "Not found (or already deleted)" });

  res.json({ deleted: true, soft: true, ar_artist_key: id });
}

async function restore(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const restored = await Artist.restore(id);
  if (!restored) return res.status(404).json({ error: "Not found (or not deleted)" });

  res.json({ restored: true, ar_artist_key: id });
}

async function hardDelete(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await Artist.hardDelete(id);
    if (!result) return res.status(404).json({ error: "Not found" });

    if (result.blockedBy === "file_details") {
      return res.status(409).json({
        error: "Cannot delete forever: artist is referenced by file details.",
        blockedBy: "file_details",
        ar_artist_key: id,
      });
    }

    return res.json({ deleted: true, soft: false, ar_artist_key: id });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error: "Cannot delete forever: artist is still referenced by other records.",
        blockedBy: "other_reference",
        ar_artist_key: id,
      });
    }

    throw err;
  }
}

module.exports = {
  list,
  get,
  getRelations,
  getDiscogsConfigStatus,
  searchDiscogsForArtist,
  getDiscogsArtistDetail,
  linkDiscogsArtist,
  getDiscogsImages,
  setPrimaryDiscogsImage,
  getDiscogsEnrichmentProposals,
  generateDiscogsEnrichmentProposals,
  updateDiscogsEnrichmentProposalStatus,
  applyDiscogsEnrichmentProposal,
  listDiscogsNameProposals,
  generateDiscogsNameProposals,
  updateDiscogsNameProposalStatus,
  applyDiscogsNameProposalAsSpelling,
  getDiscogsSpellingProposals,
  addDiscogsAlternativeSpelling,
  getDiscogsCanonicalRenamePreview,
  executeDiscogsCanonicalRename,
  getMergeHistory,
  listDuplicateReviewCandidates,
  updateDuplicateCandidateStatus,
  findDuplicateCandidates,
  getMergeImpact,
  executeMerge,
  create,
  update,
  setFavorite,
  remove,
  restore,
  hardDelete,
};
