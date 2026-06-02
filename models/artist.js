const { pool } = require("../config/db");
const { logger } = require("../config/logger");

const SORT_SQL = {
  name_asc: "a.ar_artist_name ASC",
  name_desc: "a.ar_artist_name DESC",
  weight_desc: "artist_weight DESC, a.ar_artist_name ASC",
  weight_asc: "artist_weight ASC, a.ar_artist_name ASC",
  favorite_first: "a.ar_is_favorite DESC, artist_weight DESC, a.ar_artist_name ASC",
};

function normalizeSort(sort) {
  return SORT_SQL[sort] ? sort : "favorite_first";
}


function normalizeArtistName(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bthe\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a = "", b = "") {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j < previous.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

function tokenOverlapScore(a = "", b = "") {
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  return overlap / Math.max(aTokens.size, bTokens.size);
}

function fuzzyScore(a = "", b = "") {
  const left = normalizeArtistName(a);
  const right = normalizeArtistName(b);
  if (!left || !right) return { score: 0, method: "empty", normalizedLeft: left, normalizedRight: right };
  if (left === right) return { score: 1, method: "normalized_exact", normalizedLeft: left, normalizedRight: right };

  const maxLen = Math.max(left.length, right.length, 1);
  const distanceScore = 1 - (levenshtein(left, right) / maxLen);
  const overlap = tokenOverlapScore(left, right);
  const containsBoost = left.includes(right) || right.includes(left) ? 0.12 : 0;
  const score = Math.max(distanceScore, overlap) + containsBoost;
  const bounded = Math.max(0, Math.min(0.99, score));
  return {
    score: bounded,
    method: overlap >= distanceScore ? "token_overlap" : "levenshtein",
    normalizedLeft: left,
    normalizedRight: right,
  };
}

function candidateReason({ sourceLabel, candidateLabel, match }) {
  if (match.method === "normalized_exact") {
    return `Genormaliseerde overeenkomst tussen '${sourceLabel}' en '${candidateLabel}'.`;
  }
  if (match.method === "token_overlap") {
    return `Gedeelde genormaliseerde woorden tussen '${sourceLabel}' en '${candidateLabel}'.`;
  }
  return `Fuzzy overeenkomst tussen '${sourceLabel}' en '${candidateLabel}' op basis van Levenshtein-afstand.`;
}


function buildWhere({ search, includeDeleted, onlyDeleted, favoriteOnly, mergeStatus = "active" }, params) {
  const clauses = [];

  const s = (search || "").trim();
  if (s) {
    params.push(`%${s}%`);
    clauses.push(`a.ar_artist_name ILIKE $${params.length}`);
  }

  if (mergeStatus === "merged_only") {
    clauses.push(`a.ar_merged_into_artist_key IS NOT NULL`);
  } else if (onlyDeleted) {
    clauses.push(`a.ar_is_deleted = true`);
  } else if (mergeStatus === "include_merged") {
    clauses.push(`(a.ar_is_deleted = false OR a.ar_merged_into_artist_key IS NOT NULL)`);
  } else if (!includeDeleted) {
    clauses.push(`a.ar_is_deleted = false`);
    clauses.push(`a.ar_merged_into_artist_key IS NULL`);
  }

  if (favoriteOnly) {
    clauses.push(`a.ar_is_favorite = true`);
  }

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

function baseArtistSelect() {
  return `
    SELECT
      a.ar_artist_key,
      a.ar_artist_name,
      a.ar_artist_dateofbirth,
      a.ar_artist_passing,
      a.ar_website_url,
      a.ar_artist_notes,
      a.ar_is_deleted,
      a.ar_deleted_at,
      COALESCE(a.ar_is_favorite, false) AS ar_is_favorite,
      a.ar_merged_into_artist_key,
      a.ar_merged_at,
      a.ar_merge_note,
      replacement.ar_artist_name AS ar_merged_into_artist_name,
      COALESCE(fd_stats.artist_weight, 0)::int AS artist_weight,
      COALESCE(fd_stats.version_count, 0)::int AS version_count,
      COALESCE(fd_stats.hitlijst_count, 0)::int AS hitlijst_count,
      COALESCE(spelling_stats.spelling_count, 0)::int AS spelling_count
    FROM public.artist a
    LEFT JOIN public.artist replacement
      ON replacement.ar_artist_key = a.ar_merged_into_artist_key
    LEFT JOIN (
      SELECT
        fd_artist_key,
        COUNT(DISTINCT lower(trim(fd_tag_title))) FILTER (
          WHERE fd_tag_title IS NOT NULL
            AND trim(fd_tag_title) <> ''
            AND (fd_action IS NULL OR lower(fd_action) <> 'delete')
        ) AS artist_weight,
        COUNT(*) FILTER (WHERE fd_action IS NULL OR lower(fd_action) <> 'delete') AS version_count,
        COUNT(DISTINCT fd_hitlijst) FILTER (
          WHERE fd_hitlijst IS NOT NULL
            AND (fd_action IS NULL OR lower(fd_action) <> 'delete')
        ) AS hitlijst_count
      FROM public.file_details
      GROUP BY fd_artist_key
    ) fd_stats ON fd_stats.fd_artist_key = a.ar_artist_key
    LEFT JOIN (
      SELECT as_artist_key, COUNT(*) AS spelling_count
      FROM public.artiesten_spelling
      GROUP BY as_artist_key
    ) spelling_stats ON spelling_stats.as_artist_key = a.ar_artist_key
  `;
}

async function list({
  search = "",
  limit = 50,
  offset = 0,
  includeDeleted = false,
  onlyDeleted = false,
  favoriteOnly = false,
  sort = "favorite_first",
  mergeStatus = "active",
}) {
  const params = [];
  const where = buildWhere({ search, includeDeleted, onlyDeleted, favoriteOnly, mergeStatus }, params);
  const orderBy = SORT_SQL[normalizeSort(sort)];

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const listSql = `
    ${baseArtistSelect()}
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countParams = [];
  const countWhere = buildWhere({ search, includeDeleted, onlyDeleted, favoriteOnly, mergeStatus }, countParams);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.artist a
    ${countWhere}
  `;

  const [rowsRes, countRes] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, countParams)
  ]);

  return { items: rowsRes.rows, total: countRes.rows[0]?.total ?? 0, limit, offset, sort: normalizeSort(sort), favoriteOnly, mergeStatus };
}

async function getById(id) {
  const r = await pool.query(
    `
    ${baseArtistSelect()}
    WHERE a.ar_artist_key = $1
    `,
    [id]
  );
  return r.rows[0] || null;
}

async function create(a) {
  const r = await pool.query(
    `
    INSERT INTO public.artist
      (ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing,
      ar_website_url, ar_artist_notes, ar_is_deleted, ar_deleted_at,
      COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes]
  );
  return r.rows[0];
}

async function update(id, a) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_artist_name = $1,
        ar_artist_dateofbirth = $2,
        ar_artist_passing = $3,
        ar_website_url = $4,
        ar_artist_notes = $5
    WHERE ar_artist_key = $6
    RETURNING
      ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing,
      ar_website_url, ar_artist_notes, ar_is_deleted, ar_deleted_at,
      COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes, id]
  );
  return r.rows[0] || null;
}

async function setFavorite(id, favorite) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_is_favorite = $1
    WHERE ar_artist_key = $2
    RETURNING ar_artist_key, ar_artist_name, COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [favorite, id]
  );
  return r.rows[0] || null;
}

async function getRelations(id) {
  const artist = await getById(id);
  if (!artist) return null;

  const fileDetailsSql = `
    SELECT
      fd_key,
      fd_tag_title,
      fd_correct_artist,
      fd_file_name,
      fd_hitlijst,
      fd_action,
      fd_duration::text AS fd_duration,
      fd_year_song_publish,
      fd_year_song_version,
      fd_discogs
    FROM public.file_details
    WHERE fd_artist_key = $1
    ORDER BY fd_tag_title ASC, fd_year_song_version NULLS LAST, fd_file_name ASC
    LIMIT 100
  `;

  const spellingsSql = `
    SELECT
      as_alternatieve_spelling,
      as_artist_key
    FROM public.artiesten_spelling
    WHERE as_artist_key = $1
    ORDER BY as_alternatieve_spelling ASC
    LIMIT 100
  `;

  const hitlijstenSql = `
    SELECT
      fd_hitlijst,
      COUNT(DISTINCT lower(trim(fd_tag_title))) FILTER (
        WHERE fd_tag_title IS NOT NULL
          AND trim(fd_tag_title) <> ''
          AND (fd_action IS NULL OR lower(fd_action) <> 'delete')
      )::int AS song_count,
      COUNT(*) FILTER (WHERE fd_action IS NULL OR lower(fd_action) <> 'delete')::int AS version_count,
      MIN(fd_year_song_publish) AS first_publish_year,
      MAX(fd_year_song_publish) AS last_publish_year
    FROM public.file_details
    WHERE fd_artist_key = $1
      AND fd_hitlijst IS NOT NULL
      AND (fd_action IS NULL OR lower(fd_action) <> 'delete')
    GROUP BY fd_hitlijst
    ORDER BY song_count DESC, fd_hitlijst ASC
    LIMIT 100
  `;

  const mergeHistorySql = `
    SELECT
      merge_id,
      redundant_artist_key,
      replacement_artist_key,
      redundant_artist_name,
      replacement_artist_name,
      merge_reason,
      performed_by,
      performed_at,
      affected_counts,
      conflict_summary,
      notification_status,
      status
    FROM public.artist_merge_history
    WHERE redundant_artist_key = $1 OR replacement_artist_key = $1
    ORDER BY performed_at DESC, merge_id DESC
    LIMIT 25
  `;

  const [fileDetailsRes, spellingsRes, hitlijstenRes, mergeHistoryRes] = await Promise.all([
    pool.query(fileDetailsSql, [id]),
    pool.query(spellingsSql, [id]),
    pool.query(hitlijstenSql, [id]),
    pool.query(mergeHistorySql, [id]).catch((err) => {
      // Older installations before ART-015C migration should still show relations.
      if (err.code === "42P01") return { rows: [] };
      throw err;
    }),
  ]);

  return {
    artist,
    fileDetails: fileDetailsRes.rows,
    spellings: spellingsRes.rows,
    hitlijsten: hitlijstenRes.rows,
    mergeHistory: mergeHistoryRes.rows,
    albums: {
      status: "future",
      message: "Albums worden in ART-014 functioneel uitgewerkt en zijn bewust nog niet geïmplementeerd in Sprint 6.",
    },
  };
}

async function getMergeHistory({ artistKey = null, limit = 100, offset = 0 } = {}) {
  const params = [];
  let where = "";
  if (artistKey !== null && artistKey !== undefined && artistKey !== "") {
    params.push(Number(artistKey));
    where = `WHERE h.redundant_artist_key = $${params.length} OR h.replacement_artist_key = $${params.length}`;
  }

  params.push(Math.max(1, Math.min(Number(limit) || 100, 200)));
  const limitIdx = params.length;
  params.push(Math.max(0, Number(offset) || 0));
  const offsetIdx = params.length;

  const sql = `
    SELECT
      h.merge_id,
      h.redundant_artist_key,
      h.replacement_artist_key,
      h.redundant_artist_name,
      h.replacement_artist_name,
      h.merge_reason,
      h.performed_by,
      h.performed_at,
      h.affected_counts,
      h.conflict_summary,
      h.notification_status,
      h.status,
      redundant.ar_is_deleted AS redundant_is_deleted,
      redundant.ar_merged_into_artist_key,
      replacement.ar_artist_name AS current_replacement_artist_name
    FROM public.artist_merge_history h
    LEFT JOIN public.artist redundant ON redundant.ar_artist_key = h.redundant_artist_key
    LEFT JOIN public.artist replacement ON replacement.ar_artist_key = h.replacement_artist_key
    ${where}
    ORDER BY h.performed_at DESC, h.merge_id DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.artist_merge_history h
    ${where}
  `;
  const [rowsRes, countRes] = await Promise.all([
    pool.query(sql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return { items: rowsRes.rows, total: countRes.rows[0]?.total ?? 0, limit: params[limitIdx - 1], offset: params[offsetIdx - 1] };
}


async function getArtistNameVariants(id) {
  const artist = await getById(id);
  if (!artist) return null;

  const spellingRes = await pool.query(
    `SELECT as_alternatieve_spelling FROM public.artiesten_spelling WHERE as_artist_key = $1`,
    [id]
  );

  const variants = [
    { label: artist.ar_artist_name, source: "artist" },
    ...spellingRes.rows.map((row) => ({ label: row.as_alternatieve_spelling, source: "artiesten_spelling" })),
  ].filter((item) => item.label && normalizeArtistName(item.label));

  return { artist, variants };
}

async function findDuplicateCandidates(id, { limit = 20, minScore = 0.72 } = {}) {
  const source = await getArtistNameVariants(id);
  if (!source) return null;

  const candidatesRes = await pool.query(
    `
    ${baseArtistSelect()}
    WHERE a.ar_artist_key <> $1
      AND a.ar_is_deleted = false
      AND a.ar_merged_into_artist_key IS NULL
    ORDER BY a.ar_artist_name ASC
    LIMIT 5000
    `,
    [id]
  );

  const candidateIds = candidatesRes.rows.map((row) => row.ar_artist_key);
  const spellingsByArtist = new Map();
  if (candidateIds.length) {
    const spellingRes = await pool.query(
      `
      SELECT as_artist_key, as_alternatieve_spelling
      FROM public.artiesten_spelling
      WHERE as_artist_key = ANY($1::bigint[])
      ORDER BY as_artist_key, as_alternatieve_spelling
      `,
      [candidateIds]
    );
    for (const row of spellingRes.rows) {
      const arr = spellingsByArtist.get(row.as_artist_key) || [];
      arr.push(row.as_alternatieve_spelling);
      spellingsByArtist.set(row.as_artist_key, arr);
    }
  }

  const results = [];
  for (const candidate of candidatesRes.rows) {
    const candidateVariants = [
      { label: candidate.ar_artist_name, source: "artist" },
      ...(spellingsByArtist.get(candidate.ar_artist_key) || []).map((label) => ({ label, source: "artiesten_spelling" })),
    ].filter((item) => item.label && normalizeArtistName(item.label));

    let best = null;
    for (const sourceVariant of source.variants) {
      for (const candidateVariant of candidateVariants) {
        const match = fuzzyScore(sourceVariant.label, candidateVariant.label);
        if (!best || match.score > best.score) {
          best = {
            score: match.score,
            matchMethod: match.method,
            sourceLabel: sourceVariant.label,
            sourceField: sourceVariant.source,
            candidateLabel: candidateVariant.label,
            candidateField: candidateVariant.source,
            normalizedSource: match.normalizedLeft,
            normalizedCandidate: match.normalizedRight,
            reason: candidateReason({ sourceLabel: sourceVariant.label, candidateLabel: candidateVariant.label, match }),
          };
        }
      }
    }

    if (best && best.score >= minScore) {
      results.push({
        candidate,
        score: Number(best.score.toFixed(3)),
        matchMethod: best.matchMethod,
        matchReason: best.reason,
        matchedSource: best.sourceLabel,
        matchedSourceField: best.sourceField,
        matchedCandidate: best.candidateLabel,
        matchedCandidateField: best.candidateField,
        normalizedSource: best.normalizedSource,
        normalizedCandidate: best.normalizedCandidate,
      });
    }
  }

  results.sort((a, b) => b.score - a.score || String(a.candidate.ar_artist_name).localeCompare(String(b.candidate.ar_artist_name)));
  return {
    sourceArtist: source.artist,
    minScore,
    items: results.slice(0, Math.max(1, Math.min(Number(limit) || 20, 50))),
    totalCandidates: results.length,
    mode: "interactive_fuzzy_search",
    note: "Fuzzy matching is alleen kandidaatdetectie. Samenvoegen blijft altijd handmatig bevestigd via impactscan en latere merge-flow.",
  };
}

async function getMergeImpact({ redundantArtistKey, replacementArtistKey }) {
  if (!Number.isFinite(Number(redundantArtistKey)) || !Number.isFinite(Number(replacementArtistKey))) {
    throw new Error("Invalid artist keys");
  }
  if (Number(redundantArtistKey) === Number(replacementArtistKey)) {
    throw new Error("Redundant and replacement artist must be different");
  }

  const [redundantArtist, replacementArtist] = await Promise.all([
    getById(redundantArtistKey),
    getById(replacementArtistKey),
  ]);
  if (!redundantArtist || !replacementArtist) return null;
  if (redundantArtist.ar_merged_into_artist_key || redundantArtist.ar_merged_at) {
    throw Object.assign(new Error("Redundant artist is already merged"), { statusCode: 409 });
  }
  if (replacementArtist.ar_merged_into_artist_key || replacementArtist.ar_merged_at || replacementArtist.ar_is_deleted) {
    throw Object.assign(new Error("Replacement artist must be an active canonical artist"), { statusCode: 409 });
  }

  const fileDetailsSummarySql = `
    SELECT
      COUNT(*)::int AS record_count,
      COUNT(DISTINCT lower(trim(fd_tag_title))) FILTER (WHERE fd_tag_title IS NOT NULL AND trim(fd_tag_title) <> '')::int AS unique_title_count,
      COUNT(DISTINCT fd_hitlijst) FILTER (WHERE fd_hitlijst IS NOT NULL)::int AS hitlijst_count
    FROM public.file_details
    WHERE fd_artist_key = $1
  `;

  const fileDetailsSampleSql = `
    SELECT fd_key, fd_tag_title, fd_correct_artist, fd_file_name, fd_hitlijst, fd_action,
           fd_year_song_publish, fd_year_song_version
    FROM public.file_details
    WHERE fd_artist_key = $1
    ORDER BY fd_tag_title ASC, fd_year_song_version NULLS LAST, fd_file_name ASC
    LIMIT 25
  `;

  const spellingSummarySql = `
    SELECT
      COUNT(*)::int AS record_count,
      COUNT(*) FILTER (
        WHERE lower(trim(as_alternatieve_spelling::text)) IN (
          SELECT lower(trim(rep.as_alternatieve_spelling::text))
          FROM public.artiesten_spelling rep
          WHERE rep.as_artist_key = $2
        )
      )::int AS conflict_count
    FROM public.artiesten_spelling
    WHERE as_artist_key = $1
  `;

  const spellingSampleSql = `
    SELECT
      src.as_alternatieve_spelling,
      EXISTS (
        SELECT 1
        FROM public.artiesten_spelling rep
        WHERE rep.as_artist_key = $2
          AND lower(trim(rep.as_alternatieve_spelling::text)) = lower(trim(src.as_alternatieve_spelling::text))
      ) AS conflicts_with_replacement
    FROM public.artiesten_spelling src
    WHERE src.as_artist_key = $1
    ORDER BY src.as_alternatieve_spelling ASC
    LIMIT 25
  `;

  const [fileSummaryRes, fileSampleRes, spellingSummaryRes, spellingSampleRes] = await Promise.all([
    pool.query(fileDetailsSummarySql, [redundantArtistKey]),
    pool.query(fileDetailsSampleSql, [redundantArtistKey]),
    pool.query(spellingSummarySql, [redundantArtistKey, replacementArtistKey]),
    pool.query(spellingSampleSql, [redundantArtistKey, replacementArtistKey]),
  ]);

  const tableImpacts = [
    {
      table: "file_details",
      column: "fd_artist_key",
      action: "would_update_artist_key",
      recordCount: fileSummaryRes.rows[0]?.record_count || 0,
      uniqueTitleCount: fileSummaryRes.rows[0]?.unique_title_count || 0,
      hitlijstCount: fileSummaryRes.rows[0]?.hitlijst_count || 0,
      sample: fileSampleRes.rows,
    },
    {
      table: "artiesten_spelling",
      column: "as_artist_key",
      action: "would_update_or_deduplicate_spelling_artist_key",
      recordCount: spellingSummaryRes.rows[0]?.record_count || 0,
      conflictCount: spellingSummaryRes.rows[0]?.conflict_count || 0,
      sample: spellingSampleRes.rows,
    },
  ];

  const warnings = [];
  if ((spellingSummaryRes.rows[0]?.conflict_count || 0) > 0) {
    warnings.push("Een of meer alternatieve spellingen bestaan al bij de vervangende artiest en moeten bij de echte merge worden samengevoegd of overgeslagen.");
  }
  if (redundantArtist.ar_is_favorite && !replacementArtist.ar_is_favorite) {
    warnings.push("De redundante artiest is favoriet, maar de vervangende artiest niet. ART-015C moet bepalen of favoriet-status wordt overgenomen.");
  }

  return {
    mode: "read_only_impactscan",
    redundantArtist,
    replacementArtist,
    tableImpacts,
    warnings,
    futureScopes: [
      "albums en album_artists worden in ART-014/ART-015 later meegenomen",
      "artist relationships voor muzikant/band-relaties worden later meegenomen",
      "Discogs artist links worden later meegenomen",
      "periodieke maintenance/staging-kandidaten worden later aangesloten op dezelfde merge-flow",
    ],
    canExecuteMergeInThisSprint: true,
    note: "ART-015C kan deze merge uitvoeren na expliciete bevestiging. De backend valideert de impact opnieuw binnen één transactie.",
  };
}

function sumCounts(counts = {}) {
  return Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
}

function createMergeLogger({ redundantId, replacementId }) {
  const base = { module: "artist_merge", redundantArtistKey: redundantId, replacementArtistKey: replacementId };
  return {
    debug(step, extra = {}) { logger.debug(`artist_merge.${step}`, { ...base, step, ...extra }); },
    info(step, extra = {}) { logger.info(`artist_merge.${step}`, { ...base, step, ...extra }); },
    warn(step, extra = {}) { logger.warn(`artist_merge.${step}`, { ...base, step, ...extra }); },
    error(step, err, extra = {}) {
      logger.error(`artist_merge.${step}`, {
        ...base,
        step,
        errorMessage: err?.message,
        errorCode: err?.code,
        errorDetail: err?.detail,
        errorConstraint: err?.constraint,
        ...extra,
      });
    },
  };
}

function annotateMergeError(err, step) {
  if (err && typeof err === "object") {
    err.mergeStep = err.mergeStep || step;
    err.safeMessage = "Merge is niet uitgevoerd; de transactie is teruggedraaid.";
  }
  return err;
}

async function executeArtistMerge({ redundantArtistKey, replacementArtistKey, reason = "", performedBy = "artist-app" }) {
  const redundantId = Number(redundantArtistKey);
  const replacementId = Number(replacementArtistKey);
  if (!Number.isFinite(redundantId) || !Number.isFinite(replacementId)) {
    throw Object.assign(new Error("Invalid artist keys"), { statusCode: 400 });
  }
  if (redundantId === replacementId) {
    throw Object.assign(new Error("Redundant and replacement artist must be different"), { statusCode: 400 });
  }

  const cleanReason = String(reason || "").trim();
  if (!cleanReason) {
    throw Object.assign(new Error("Merge reason is required"), { statusCode: 400 });
  }

  const mergeLog = createMergeLogger({ redundantId, replacementId });
  const client = await pool.connect();
  let currentStep = "begin";
  try {
    mergeLog.info("start", { performedBy });
    await client.query("BEGIN");
    mergeLog.debug("begin");

    currentStep = "lock_artists";
    const artistsRes = await client.query(
      `
      SELECT ar_artist_key, ar_artist_name, ar_is_deleted, COALESCE(ar_is_favorite, false) AS ar_is_favorite,
             ar_merged_into_artist_key, ar_merged_at
      FROM public.artist
      WHERE ar_artist_key = ANY($1::int[])
      ORDER BY ar_artist_key
      FOR UPDATE
      `,
      [[redundantId, replacementId]]
    );

    const redundantArtist = artistsRes.rows.find((row) => Number(row.ar_artist_key) === redundantId);
    const replacementArtist = artistsRes.rows.find((row) => Number(row.ar_artist_key) === replacementId);
    if (!redundantArtist || !replacementArtist) {
      throw Object.assign(new Error("One or both artists were not found"), { statusCode: 404 });
    }
    if (redundantArtist.ar_merged_into_artist_key || redundantArtist.ar_merged_at) {
      throw Object.assign(new Error("Redundant artist is already merged"), { statusCode: 409 });
    }
    if (replacementArtist.ar_merged_into_artist_key || replacementArtist.ar_merged_at || replacementArtist.ar_is_deleted) {
      throw Object.assign(new Error("Replacement artist must be an active canonical artist"), { statusCode: 409 });
    }

    currentStep = "collect_affected_titles";
    mergeLog.debug("collect_affected_titles");
    const affectedTitlesRes = await client.query(
      `
      SELECT DISTINCT lower(trim(fd_tag_title::text)) AS title_group_key
      FROM public.file_details
      WHERE fd_artist_key = $1::integer
        AND fd_tag_title IS NOT NULL
        AND trim(fd_tag_title::text) <> ''
      `,
      [redundantId]
    );
    const affectedTitleKeys = affectedTitlesRes.rows.map((row) => row.title_group_key).filter(Boolean);

    currentStep = "deduplicate_artist_spellings";
    mergeLog.debug("deduplicate_artist_spellings");
    const spellingConflictRes = await client.query(
      `
      DELETE FROM public.artiesten_spelling src
      WHERE src.as_artist_key = $1::integer
        AND EXISTS (
          SELECT 1
          FROM public.artiesten_spelling rep
          WHERE rep.as_artist_key = $2::integer
            AND lower(trim(rep.as_alternatieve_spelling::text)) = lower(trim(src.as_alternatieve_spelling::text))
        )
      RETURNING src.as_alternatieve_spelling
      `,
      [redundantId, replacementId]
    );

    currentStep = "update_artist_spellings";
    const spellingUpdateRes = await client.query(
      `
      UPDATE public.artiesten_spelling
      SET as_artist_key = $2::integer
      WHERE as_artist_key = $1::integer
      RETURNING as_alternatieve_spelling
      `,
      [redundantId, replacementId]
    );

    currentStep = "update_file_details";
    const fileDetailsRes = await client.query(
      `
      UPDATE public.file_details
      SET fd_artist_key = $2::integer,
          fd_correct_artist = $3::public.citext
      WHERE fd_artist_key = $1::integer
      RETURNING fd_key
      `,
      [redundantId, replacementId, replacementArtist.ar_artist_name]
    );

    currentStep = "update_hitlijsten";
    const hitlijstenRes = await client.query(
      `
      UPDATE public.hitlijsten
      SET ar_artist_key = $2::integer
      WHERE ar_artist_key = $1::integer
      RETURNING hl_hitlijst, hl_uitzendjaar, hl_positie
      `,
      [redundantId, replacementId]
    );

    currentStep = "update_staging_hitlijsten";
    const stagingHitlijstenRes = await client.query(
      `
      UPDATE public.staging_hitlijsten
      SET hl_artist_key = $2::integer
      WHERE hl_artist_key = $1::integer
      RETURNING hl_hitlijst, hl_uitzendjaar, hl_positie, hl_import_run_id
      `,
      [redundantId, replacementId]
    );

    currentStep = "update_import_scan_items";
    const importScanItemsRes = await client.query(
      `
      UPDATE public.import_scan_items
      SET fd_artist_key = $2::integer,
          fd_correct_artist = $3::public.citext
      WHERE fd_artist_key = $1::integer
      RETURNING scan_id, row_id
      `,
      [redundantId, replacementId, replacementArtist.ar_artist_name]
    );

    let validationsRes = { rowCount: 0, rows: [] };
    if (affectedTitleKeys.length) {
      currentStep = "reset_validations";
      validationsRes = await client.query(
        `
        UPDATE public.file_details_version_group_validations
        SET reset_at = now(),
            reset_reason = $4::text,
            reset_source = 'artist_merge',
            reset_criteria = jsonb_build_object(
              'redundant_artist_key', $1::integer,
              'replacement_artist_key', $2::integer,
              'affected_title_group_keys', $3::text[]
            ),
            updated_at = now()
        WHERE fd_artist_key = ANY($5::int[])
          AND lower(trim(title_group_key::text)) = ANY($3::text[])
          AND reset_at IS NULL
        RETURNING validation_id
        `,
        [redundantId, replacementId, affectedTitleKeys, `ART-015C artist merge ${redundantId} -> ${replacementId}`, [redundantId, replacementId]]
      );
    }

    let replacementFavoriteAdopted = false;
    if (redundantArtist.ar_is_favorite && !replacementArtist.ar_is_favorite) {
      currentStep = "adopt_favorite";
      await client.query(
        `UPDATE public.artist SET ar_is_favorite = true WHERE ar_artist_key = $1::integer`,
        [replacementId]
      );
      replacementFavoriteAdopted = true;
    }

    currentStep = "mark_redundant_artist";
    await client.query(
      `
      UPDATE public.artist
      SET ar_is_deleted = true,
          ar_deleted_at = COALESCE(ar_deleted_at, now()),
          ar_merged_into_artist_key = $2::integer,
          ar_merged_at = now(),
          ar_merge_note = $3::text,
          ar_is_favorite = false
      WHERE ar_artist_key = $1::integer
      `,
      [redundantId, replacementId, cleanReason]
    );

    const affectedCounts = {
      file_details: fileDetailsRes.rowCount,
      artiesten_spelling_updated: spellingUpdateRes.rowCount,
      artiesten_spelling_deduplicated: spellingConflictRes.rowCount,
      hitlijsten: hitlijstenRes.rowCount,
      staging_hitlijsten: stagingHitlijstenRes.rowCount,
      import_scan_items: importScanItemsRes.rowCount,
      file_details_version_group_validations_reset: validationsRes.rowCount,
      replacement_favorite_adopted: replacementFavoriteAdopted ? 1 : 0,
    };

    const conflictSummary = {
      spelling_conflicts_resolved: spellingConflictRes.rows.map((row) => row.as_alternatieve_spelling),
      affected_title_group_keys: affectedTitleKeys,
    };

    const severity = sumCounts(affectedCounts) >= 100 || spellingConflictRes.rowCount > 0 ? "warning" : "info";
    currentStep = "insert_artist_merge_history";
    mergeLog.debug("insert_artist_merge_history", { affectedCounts });
    const historyRes = await client.query(
      `
      INSERT INTO public.artist_merge_history (
        redundant_artist_key, replacement_artist_key, redundant_artist_name, replacement_artist_name,
        merge_reason, performed_by, affected_counts, conflict_summary, notification_status, status
      )
      VALUES ($1::integer, $2::integer, $3::public.citext, $4::public.citext, $5::text, $6::text, $7::jsonb, $8::jsonb, $9::jsonb, 'completed')
      RETURNING merge_id, performed_at
      `,
      [
        redundantId,
        replacementId,
        redundantArtist.ar_artist_name,
        replacementArtist.ar_artist_name,
        cleanReason,
        performedBy,
        JSON.stringify(affectedCounts),
        JSON.stringify(conflictSummary),
        JSON.stringify({ alert_planned: true, severity }),
      ]
    );
    const mergeHistory = historyRes.rows[0];

    currentStep = "insert_admin_audit_log";
    await client.query(
      `
      INSERT INTO public.admin_audit_log (
        actor_username, entity_type, entity_key, action_type, old_values, new_values, context
      )
      VALUES ($1::text, 'artist', $2::text, 'artist_merge', $3::jsonb, $4::jsonb, $5::jsonb)
      `,
      [
        performedBy,
        String(redundantId),
        JSON.stringify({ redundant_artist_key: redundantId, redundant_artist_name: redundantArtist.ar_artist_name }),
        JSON.stringify({ replacement_artist_key: replacementId, replacement_artist_name: replacementArtist.ar_artist_name }),
        JSON.stringify({ merge_id: mergeHistory.merge_id, affected_counts: affectedCounts, conflict_summary: conflictSummary }),
      ]
    );

    const alertBody = `Artiest '${redundantArtist.ar_artist_name}' (#${redundantId}) is samengevoegd met '${replacementArtist.ar_artist_name}' (#${replacementId}). ${sumCounts(affectedCounts)} records/acties verwerkt.`;
    currentStep = "insert_shellstarter_alert";
    const alertRes = await client.query(
      `
      INSERT INTO public.alerts (app_key, module_key, title, body, severity, status)
      VALUES ('artist', 'artist-merge', 'Artiesten merge uitgevoerd', $1::text, $2::text, 'open')
      RETURNING id
      `,
      [alertBody, severity]
    );

    currentStep = "update_artist_merge_notification_status";
    await client.query(
      `
      UPDATE public.artist_merge_history
      SET notification_status = $2::jsonb
      WHERE merge_id = $1::bigint
      `,
      [mergeHistory.merge_id, JSON.stringify({ alert_created: true, alert_id: alertRes.rows[0]?.id || null, severity, mail_created: false })]
    );

    currentStep = "commit";
    await client.query("COMMIT");
    mergeLog.info("commit", { mergeId: mergeHistory.merge_id, affectedCount: sumCounts(affectedCounts), alertId: alertRes.rows[0]?.id || null });

    return {
      mergeId: mergeHistory.merge_id,
      performedAt: mergeHistory.performed_at,
      redundantArtist: { ar_artist_key: redundantId, ar_artist_name: redundantArtist.ar_artist_name },
      replacementArtist: { ar_artist_key: replacementId, ar_artist_name: replacementArtist.ar_artist_name },
      affectedCounts,
      conflictSummary,
      alert: { id: alertRes.rows[0]?.id || null, severity },
      transaction: "committed",
      message: "Artist merge completed transactionally",
    };
  } catch (err) {
    const annotated = annotateMergeError(err, currentStep);
    try {
      await client.query("ROLLBACK");
      mergeLog.error("rollback", annotated, { failedStep: currentStep, rollback: "completed" });
    } catch (rollbackErr) {
      mergeLog.error("rollback_failed", rollbackErr, { failedStep: currentStep, originalErrorMessage: err?.message });
    }
    throw annotated;
  } finally {
    client.release();
  }
}

async function softDelete(id) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_is_deleted = true,
        ar_deleted_at = now()
    WHERE ar_artist_key = $1 AND ar_is_deleted = false
    RETURNING ar_artist_key, ar_artist_name, ar_is_deleted, ar_deleted_at, COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [id]
  );
  return r.rows[0] || null;
}

async function restore(id) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_is_deleted = false,
        ar_deleted_at = NULL
    WHERE ar_artist_key = $1 AND ar_is_deleted = true
    RETURNING ar_artist_key, ar_artist_name, ar_is_deleted, ar_deleted_at, COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [id]
  );
  return r.rows[0] || null;
}

async function hardDelete(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fileDetailsRef = await client.query(
      `SELECT 1 FROM public.file_details WHERE fd_artist_key = $1 LIMIT 1`,
      [id]
    );

    if (fileDetailsRef.rowCount > 0) {
      await client.query('ROLLBACK');
      return { blockedBy: 'file_details' };
    }

    await client.query(
      `DELETE FROM public.artiesten_spelling WHERE as_artist_key = $1`,
      [id]
    );

    const deleted = await client.query(
      `DELETE FROM public.artist WHERE ar_artist_key = $1 RETURNING ar_artist_key`,
      [id]
    );

    if (!deleted.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return { deleted: true, ar_artist_key: deleted.rows[0].ar_artist_key };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // ignore rollback failure
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  setFavorite,
  getRelations,
  getMergeHistory,
  findDuplicateCandidates,
  getMergeImpact,
  executeArtistMerge,
  softDelete,
  restore,
  hardDelete,
  normalizeSort,
  normalizeArtistName,
  fuzzyScore,
};
