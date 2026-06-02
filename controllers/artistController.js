const Artist = require("../models/artist");

function normalizePayload(body = {}) {
  const text = (value) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === "" ? null : trimmed;
  };

  return {
    ar_artist_name: text(body.ar_artist_name),
    ar_artist_dateofbirth: text(body.ar_artist_dateofbirth),
    ar_artist_passing: text(body.ar_artist_passing),
    ar_website_url: text(body.ar_website_url),
    ar_artist_notes: text(body.ar_artist_notes),
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

async function getMergeHistory(req, res) {
  const artistKey = req.query.artistKey !== undefined ? Number(req.query.artistKey) : null;
  if (artistKey !== null && !Number.isFinite(artistKey)) return res.status(400).json({ error: "Invalid artistKey" });

  const limit = Math.min(Math.max(Number(req.query.limit ?? 100), 1), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const data = await Artist.getMergeHistory({ artistKey, limit, offset });
  res.json(data);
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
  getMergeHistory,
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
