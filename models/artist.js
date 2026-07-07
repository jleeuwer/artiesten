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
      a.ar_artist_dateofbirth::text AS ar_artist_dateofbirth,
      a.ar_artist_passing::text AS ar_artist_passing,
      a.ar_website_url,
      a.ar_artist_notes,
      COALESCE(a.ar_artist_type, 'unknown') AS ar_artist_type,
      a.ar_is_deleted,
      a.ar_deleted_at,
      COALESCE(a.ar_is_favorite, false) AS ar_is_favorite,
      COALESCE(discogs_link.has_discogs_link, false) AS has_discogs_link,
      discogs_link.external_id AS discogs_external_id,
      discogs_link.external_name AS discogs_external_name,
      discogs_link.external_url AS discogs_external_url,
      discogs_link.synced_at AS discogs_synced_at,
      primary_image.image_id AS primary_image_id,
      primary_image.external_image_url AS primary_image_url,
      primary_image.external_resource_url AS primary_image_resource_url,
      primary_image.image_type AS primary_image_type,
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
    LEFT JOIN LATERAL (
      SELECT
        true AS has_discogs_link,
        aer.external_id,
        aer.external_name,
        aer.external_url,
        aer.synced_at
      FROM public.artist_external_reference aer
      WHERE aer.artist_key = a.ar_artist_key
        AND lower(aer.source) = 'discogs'
        AND aer.status = 'linked'
      ORDER BY aer.updated_at DESC NULLS LAST, aer.reference_id DESC
      LIMIT 1
    ) discogs_link ON true
    LEFT JOIN LATERAL (
      SELECT
        img.image_id,
        img.external_image_url,
        img.external_resource_url,
        img.image_type
      FROM public.artist_external_image img
      WHERE img.artist_key = a.ar_artist_key
        AND lower(img.source) = 'discogs'
        AND img.is_primary = true
      ORDER BY img.updated_at DESC NULLS LAST, img.image_id DESC
      LIMIT 1
    ) primary_image ON true
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
      (ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes, ar_artist_type)
    VALUES ($1, $2::date, $3::date, $4, $5, $6)
    RETURNING
      ar_artist_key, ar_artist_name,
      ar_artist_dateofbirth::text AS ar_artist_dateofbirth,
      ar_artist_passing::text AS ar_artist_passing,
      ar_website_url, ar_artist_notes, COALESCE(ar_artist_type, 'unknown') AS ar_artist_type,
      ar_is_deleted, ar_deleted_at,
      COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes, a.ar_artist_type || 'unknown']
  );
  return r.rows[0];
}

async function update(id, a) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_artist_name = $1,
        ar_artist_dateofbirth = $2::date,
        ar_artist_passing = $3::date,
        ar_website_url = $4,
        ar_artist_notes = $5,
        ar_artist_type = $6
    WHERE ar_artist_key = $7
    RETURNING
      ar_artist_key, ar_artist_name,
      ar_artist_dateofbirth::text AS ar_artist_dateofbirth,
      ar_artist_passing::text AS ar_artist_passing,
      ar_website_url, ar_artist_notes, COALESCE(ar_artist_type, 'unknown') AS ar_artist_type,
      ar_is_deleted, ar_deleted_at,
      COALESCE(ar_is_favorite, false) AS ar_is_favorite
    `,
    [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes, a.ar_artist_type || 'unknown', id]
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

  const discogsReferencesSql = `
    SELECT
      reference_id,
      artist_key,
      source,
      external_id,
      external_url,
      external_name,
      confidence_score,
      status,
      synced_at,
      created_at,
      updated_at
    FROM public.artist_external_reference
    WHERE artist_key = $1
      AND lower(source) = 'discogs'
    ORDER BY CASE status WHEN 'linked' THEN 0 WHEN 'candidate' THEN 1 ELSE 2 END, updated_at DESC, reference_id DESC
    LIMIT 25
  `;

  const discogsImagesSql = `
    SELECT
      image_id,
      artist_key,
      source,
      external_reference_id,
      external_image_url,
      external_resource_url,
      image_type,
      width,
      height,
      is_primary,
      cache_status,
      local_cache_path,
      cached_at,
      cache_error,
      created_at,
      updated_at
    FROM public.artist_external_image
    WHERE artist_key = $1
      AND lower(source) = 'discogs'
    ORDER BY is_primary DESC, CASE WHEN lower(coalesce(image_type, '')) = 'primary' THEN 0 ELSE 1 END, image_id ASC
    LIMIT 50
  `;

  const externalProfilesSql = `
    SELECT
      external_profile_id,
      artist_key,
      source,
      source_external_id,
      source_reference_id,
      profile_text,
      profile_url,
      is_primary,
      status,
      fetched_at,
      stored_at
    FROM public.artist_external_profile
    WHERE artist_key = $1
      AND lower(source) = 'discogs'
      AND status = 'active'
    ORDER BY is_primary DESC, stored_at DESC, external_profile_id DESC
    LIMIT 10
  `;

  const [fileDetailsRes, spellingsRes, hitlijstenRes, mergeHistoryRes, discogsReferencesRes, discogsImagesRes, externalProfilesRes] = await Promise.all([
    pool.query(fileDetailsSql, [id]),
    pool.query(spellingsSql, [id]),
    pool.query(hitlijstenSql, [id]),
    pool.query(mergeHistorySql, [id]).catch((err) => {
      // Older installations before ART-015C migration should still show relations.
      if (err.code === "42P01") return { rows: [] };
      throw err;
    }),
    pool.query(discogsReferencesSql, [id]).catch((err) => {
      // Older installations before ART-012B migration should still show relations.
      if (err.code === "42P01") return { rows: [] };
      throw err;
    }),
    pool.query(discogsImagesSql, [id]).catch((err) => {
      // Older installations before ART-012B migration should still show relations.
      if (err.code === "42P01" || err.code === "42703") return { rows: [] };
      throw err;
    }),
    pool.query(externalProfilesSql, [id]).catch((err) => {
      // ART-012E-4 introduced external profiles; older databases should still load relations.
      if (err.code === "42P01" || err.code === "42703") return { rows: [] };
      throw err;
    }),
  ]);

  return {
    artist,
    fileDetails: fileDetailsRes.rows,
    spellings: spellingsRes.rows,
    hitlijsten: hitlijstenRes.rows,
    mergeHistory: mergeHistoryRes.rows,
    discogsReferences: discogsReferencesRes.rows,
    discogsImages: discogsImagesRes.rows,
    primaryDiscogsImage: discogsImagesRes.rows.find((row) => row.is_primary) || null,
    externalProfiles: externalProfilesRes.rows,
    primaryExternalProfile: externalProfilesRes.rows.find((row) => row.is_primary) || externalProfilesRes.rows[0] || null,
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
    pool.query(countSql, params.slice(0, params.length - 3)),
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

async function executeArtistMerge({ redundantArtistKey, replacementArtistKey, reason = "", performedBy = "artist-app", duplicateCandidateId = null }) {
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

    if (duplicateCandidateId !== null && duplicateCandidateId !== undefined && String(duplicateCandidateId) !== "") {
      currentStep = "update_duplicate_candidate_status";
      await client.query(
        `
        UPDATE public.artist_duplicate_candidates
        SET status = 'merged',
            review_decision = 'merged',
            review_note = $3::text,
            reviewed_at = now(),
            reviewed_by = $4::text,
            merge_id = $2::bigint
        WHERE candidate_id = $1::bigint
          AND artist_key_low = least($5::integer, $6::integer)
          AND artist_key_high = greatest($5::integer, $6::integer)
        `,
        [Number(duplicateCandidateId), mergeHistory.merge_id, cleanReason, performedBy, redundantId, replacementId]
      );
    }

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


const REVIEW_CANDIDATE_OPEN_STATUSES = ["new", "reviewing", "merge_planned", "error"];
const REVIEW_CANDIDATE_FINAL_STATUSES = ["not_duplicate", "ignored", "merged"];
const REVIEW_CANDIDATE_ALLOWED_STATUSES = [...REVIEW_CANDIDATE_OPEN_STATUSES, ...REVIEW_CANDIDATE_FINAL_STATUSES];

function normalizeCandidateStatusFilter(status = "open") {
  const value = String(status || "open").trim().toLowerCase();
  if (value === "open") return { mode: "open", statuses: REVIEW_CANDIDATE_OPEN_STATUSES };
  if (value === "all") return { mode: "all", statuses: [] };
  if (REVIEW_CANDIDATE_ALLOWED_STATUSES.includes(value)) return { mode: "single", statuses: [value] };
  return { mode: "open", statuses: REVIEW_CANDIDATE_OPEN_STATUSES };
}

function getDuplicateStaleReviewDays() {
  const raw = Number(process.env.ARTIST_DUPLICATE_STALE_REVIEW_DAYS || 14);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 14;
}

async function listDuplicateReviewCandidates({ status = "open", search = "", minScore = null, scanRunId = null, limit = 50, offset = 0 } = {}) {
  const params = [];
  const clauses = [];
  const statusFilter = normalizeCandidateStatusFilter(status);
  if (statusFilter.statuses.length) {
    params.push(statusFilter.statuses);
    clauses.push(`c.status = ANY($${params.length}::text[])`);
  }

  const cleanedSearch = String(search || "").trim();
  if (cleanedSearch) {
    params.push(`%${cleanedSearch}%`);
    clauses.push(`(c.artist_name_a ILIKE $${params.length} OR c.artist_name_b ILIKE $${params.length})`);
  }

  if (minScore !== null && minScore !== undefined && String(minScore) !== "") {
    params.push(Number(minScore));
    clauses.push(`c.match_score >= $${params.length}::numeric`);
  }

  if (scanRunId !== null && scanRunId !== undefined && String(scanRunId) !== "") {
    params.push(Number(scanRunId));
    clauses.push(`c.last_seen_scan_run_id = $${params.length}::bigint`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(Math.max(1, Math.min(Number(limit) || 50, 200)));
  const limitIdx = params.length;
  params.push(Math.max(0, Number(offset) || 0));
  const offsetIdx = params.length;

  const staleReviewDays = getDuplicateStaleReviewDays();
  params.push(staleReviewDays);
  const staleIdx = params.length;

  const sql = `
    SELECT
      c.candidate_id,
      c.scan_run_id,
      c.artist_key_a,
      c.artist_name_a,
      c.artist_key_b,
      c.artist_name_b,
      c.artist_key_low,
      c.artist_key_high,
      c.match_score,
      c.match_method,
      c.match_reason,
      c.match_details,
      c.status,
      c.review_decision,
      c.review_note,
      c.reviewed_at,
      c.reviewed_by,
      c.merge_id,
      c.created_at,
      c.first_seen_at,
      c.last_seen_at,
      c.first_seen_scan_run_id,
      c.last_seen_scan_run_id,
      c.times_seen,
      $${staleIdx}::integer AS stale_review_days,
      greatest(0, floor(extract(epoch from (now() - coalesce(c.first_seen_at, c.created_at))) / 86400))::int AS review_age_days,
      (
        c.status in ('new', 'reviewing', 'merge_planned', 'error')
        and coalesce(c.first_seen_at, c.created_at) <= now() - ($${staleIdx}::integer * interval '1 day')
      ) AS is_stale_review_candidate,
      a.ar_artist_name AS current_artist_name_a,
      b.ar_artist_name AS current_artist_name_b,
      a.ar_is_deleted AS artist_a_is_deleted,
      b.ar_is_deleted AS artist_b_is_deleted,
      a.ar_merged_into_artist_key AS artist_a_merged_into_artist_key,
      b.ar_merged_into_artist_key AS artist_b_merged_into_artist_key,
      COALESCE(weight_a.artist_weight, 0)::int AS artist_weight_a,
      COALESCE(weight_b.artist_weight, 0)::int AS artist_weight_b
    FROM public.artist_duplicate_candidates c
    LEFT JOIN public.artist a ON a.ar_artist_key = c.artist_key_a
    LEFT JOIN public.artist b ON b.ar_artist_key = c.artist_key_b
    LEFT JOIN (
      SELECT fd_artist_key, COUNT(DISTINCT lower(trim(fd_tag_title))) FILTER (
        WHERE fd_tag_title IS NOT NULL AND trim(fd_tag_title) <> '' AND (fd_action IS NULL OR lower(fd_action) <> 'delete')
      ) AS artist_weight
      FROM public.file_details
      GROUP BY fd_artist_key
    ) weight_a ON weight_a.fd_artist_key = c.artist_key_a
    LEFT JOIN (
      SELECT fd_artist_key, COUNT(DISTINCT lower(trim(fd_tag_title))) FILTER (
        WHERE fd_tag_title IS NOT NULL AND trim(fd_tag_title) <> '' AND (fd_action IS NULL OR lower(fd_action) <> 'delete')
      ) AS artist_weight
      FROM public.file_details
      GROUP BY fd_artist_key
    ) weight_b ON weight_b.fd_artist_key = c.artist_key_b
    ${where}
    ORDER BY
      CASE c.status WHEN 'new' THEN 0 WHEN 'reviewing' THEN 1 WHEN 'merge_planned' THEN 2 WHEN 'error' THEN 3 ELSE 4 END,
      c.match_score DESC,
      c.last_seen_at DESC NULLS LAST,
      c.candidate_id DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.artist_duplicate_candidates c
    ${where}
  `;

  const [rowsRes, countRes] = await Promise.all([
    pool.query(sql, params),
    pool.query(countSql, params.slice(0, params.length - 3)),
  ]);

  return {
    items: rowsRes.rows,
    total: countRes.rows[0]?.total ?? 0,
    limit: params[limitIdx - 1],
    offset: params[offsetIdx - 1],
    status: statusFilter.mode === "single" ? statusFilter.statuses[0] : statusFilter.mode,
  };
}

async function updateDuplicateCandidateStatus(candidateId, { status, note = "", reviewedBy = "artist-app" } = {}) {
  const id = Number(candidateId);
  const nextStatus = String(status || "").trim().toLowerCase();
  if (!Number.isFinite(id)) {
    throw Object.assign(new Error("Invalid candidate id"), { statusCode: 400 });
  }
  if (!REVIEW_CANDIDATE_ALLOWED_STATUSES.includes(nextStatus)) {
    throw Object.assign(new Error("Invalid candidate status"), { statusCode: 400 });
  }

  const isReviewed = ["not_duplicate", "ignored", "merged"].includes(nextStatus);
  const reviewDecision = isReviewed ? nextStatus : (nextStatus === "merge_planned" ? "merge_planned" : null);
  const r = await pool.query(
    `
    UPDATE public.artist_duplicate_candidates
    SET status = $2::text,
        review_decision = $3::text,
        review_note = $4::text,
        reviewed_at = CASE WHEN $5::boolean THEN now() ELSE reviewed_at END,
        reviewed_by = CASE WHEN $5::boolean THEN $6::text ELSE reviewed_by END
    WHERE candidate_id = $1::bigint
    RETURNING *
    `,
    [id, nextStatus, reviewDecision, String(note || "").trim() || null, isReviewed, reviewedBy]
  );
  return r.rows[0] || null;
}



function uniqueNonEmptyStrings(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = normalizeArtistName(text) || text.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function extractDiscogsNameProposalValues(normalized = {}) {
  const values = [];
  if (normalized.discogs_name) values.push({ value: normalized.discogs_name, source: "discogs_name", label: "Discogs naam" });
  if (normalized.real_name) values.push({ value: normalized.real_name, source: "real_name", label: "Real name" });
  for (const alias of normalized.aliases || []) {
    const name = typeof alias === "string" ? alias : alias?.name;
    if (name) values.push({ value: name, source: "alias", label: "Alias" });
  }
  for (const variation of normalized.namevariations || normalized.name_variations || []) {
    const name = typeof variation === "string" ? variation : variation?.name;
    if (name) values.push({ value: name, source: "namevariation", label: "Name variation" });
  }

  const seen = new Set();
  const result = [];
  for (const item of values) {
    const value = String(item.value || "").trim();
    if (!value) continue;
    const normalizedValue = normalizeArtistName(value);
    if (!normalizedValue || seen.has(normalizedValue)) continue;
    seen.add(normalizedValue);
    result.push({ ...item, value, normalizedValue });
  }
  return result;
}

function classifyDiscogsSpellingProposal({ proposal, artist, existingOwnSpellings, spellingOwnerByNormalized }) {
  const canonicalNormalized = normalizeArtistName(artist.ar_artist_name);
  const existingOwn = existingOwnSpellings.get(proposal.normalizedValue);
  const owner = spellingOwnerByNormalized.get(proposal.normalizedValue);

  if (proposal.normalizedValue === canonicalNormalized) {
    return {
      action: "already_canonical",
      status: "info",
      canAddAlternativeSpelling: false,
      canProposeCanonicalRename: false,
      reason: "Deze Discogs-naam komt overeen met de lokale canonical artist name.",
    };
  }

  if (existingOwn) {
    return {
      action: "already_alternative_spelling",
      status: "info",
      canAddAlternativeSpelling: false,
      canProposeCanonicalRename: proposal.source === "discogs_name",
      reason: "Deze naam bestaat al als alternatieve spelling voor deze artiest.",
    };
  }

  if (owner && Number(owner.as_artist_key) !== Number(artist.ar_artist_key)) {
    return {
      action: "conflict_other_artist",
      status: "conflict",
      canAddAlternativeSpelling: false,
      canProposeCanonicalRename: false,
      conflictingArtistKey: owner.as_artist_key,
      conflictingArtistName: owner.ar_artist_name,
      reason: `Deze spelling is al gekoppeld aan artist_key ${owner.as_artist_key} (${owner.ar_artist_name}).`,
    };
  }

  return {
    action: proposal.source === "discogs_name" ? "available_discogs_name" : "available_alternative_spelling",
    status: "available",
    canAddAlternativeSpelling: true,
    canProposeCanonicalRename: proposal.source === "discogs_name",
    reason: proposal.source === "discogs_name"
      ? "Discogs-naam is beschikbaar als voorstel voor alternatieve spelling of toekomstige canonical rename."
      : "Naam is beschikbaar als voorstel voor alternatieve spelling.",
  };
}


function formatLocalDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return text.slice(0, 10);
}

function proposalStatusForLocalValue(localValue, proposedNormalized) {
  const localText = localValue === undefined || localValue === null ? "" : String(localValue).trim();
  const proposedText = proposedNormalized === undefined || proposedNormalized === null ? "" : String(proposedNormalized).trim();
  if (!proposedText) return "not_applicable";
  if (!localText) return "available";
  return localText === proposedText ? "existing" : "conflict";
}

const MONTHS = {
  january: "01", jan: "01",
  february: "02", feb: "02",
  march: "03", mar: "03",
  april: "04", apr: "04",
  may: "05",
  june: "06", jun: "06",
  july: "07", jul: "07",
  august: "08", aug: "08",
  september: "09", sep: "09", sept: "09",
  october: "10", oct: "10",
  november: "11", nov: "11",
  december: "12", dec: "12",
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function normalizeExtractedDate(text = "") {
  const value = String(text || "").trim().replace(/[,.;]+$/g, "");
  let match = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (match) return { normalized: `${match[1]}-${match[2]}-${match[3]}`, precision: "exact" };

  match = value.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (match) {
    const month = MONTHS[match[2].toLowerCase()];
    if (month) return { normalized: `${match[3]}-${month}-${pad2(match[1])}`, precision: "exact" };
  }

  match = value.match(/\b([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    if (month) return { normalized: `${match[3]}-${month}-${pad2(match[2])}`, precision: "exact" };
  }

  match = value.match(/\b([A-Za-z]+)\s+(\d{4})\b/);
  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    if (month) return { normalized: `${match[2]}-${month}`, precision: "month" };
  }

  match = value.match(/\b(\d{4})\b/);
  if (match) return { normalized: match[1], precision: "year" };

  return { normalized: null, precision: "unknown" };
}

function compactContext(text = "", index = 0, length = 80) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  const start = Math.max(0, Number(index || 0) - 40);
  const end = Math.min(source.length, Number(index || 0) + length + 40);
  return source.slice(start, end).trim();
}

function extractDateProposalFromProfile({ profile = "", targetField, label, localValue }) {
  const text = String(profile || "");
  if (!text.trim()) return null;
  const words = targetField === "ar_artist_dateofbirth"
    ? "born|birth|geboren"
    : "died|death|overleden|passed away|passing";
  const re = new RegExp(`(?:${words})[^\\n.;:]*[:\\s-]+([^\\n.;]+)`, "i");
  const match = text.match(re);
  if (!match) return null;
  const extracted = normalizeExtractedDate(match[1]);
  if (!extracted.normalized) return null;
  const isExact = extracted.precision === "exact";
  return {
    proposal_type: targetField === "ar_artist_dateofbirth" ? "birth_date" : "death_date",
    target_table: "artist",
    target_field: targetField,
    local_value: formatLocalDateValue(localValue),
    proposed_value: match[1].trim(),
    proposed_value_normalized: extracted.normalized,
    proposed_value_json: { precision: extracted.precision, label },
    extraction_method: isExact ? "profile_text_regex" : "profile_text_heuristic",
    extraction_confidence: isExact ? "high" : "medium",
    extraction_context: compactContext(text, match.index, match[0].length),
    status: isExact ? proposalStatusForLocalValue(formatLocalDateValue(localValue), extracted.normalized) : "not_applicable",
    conflict_type: isExact && formatLocalDateValue(localValue) && formatLocalDateValue(localValue) !== extracted.normalized ? "local_value_differs" : null,
    notes: isExact ? "Volledige datum uit Discogs-profieltekst als voorstel." : "Onvolledige datum uit Discogs-profieltekst; alleen tonen, niet toepassen op date-velden.",
  };
}

function inferArtistTypeFromDiscogs(normalized = {}) {
  const profile = String(normalized.profile || "").toLowerCase();
  const members = Array.isArray(normalized.members) ? normalized.members : [];
  const groups = Array.isArray(normalized.groups) ? normalized.groups : [];
  if (/\bduo\b/.test(profile) || members.length === 2) return { type: "duo", confidence: members.length === 2 ? "high" : "medium", context: members.length === 2 ? "Discogs members bevat 2 leden." : "Discogs profile bevat 'duo'." };
  if (/\btrio\b/.test(profile) || members.length === 3) return { type: "trio", confidence: members.length === 3 ? "high" : "medium", context: members.length === 3 ? "Discogs members bevat 3 leden." : "Discogs profile bevat 'trio'." };
  if (/\bband\b|\bgroup\b/.test(profile) || members.length > 3) return { type: "band", confidence: members.length > 3 ? "high" : "medium", context: members.length > 3 ? "Discogs members bevat meer dan 3 leden." : "Discogs profile bevat band/groep-indicatie." };
  if (/\bsinger\b|\bmusician\b|\bvocalist\b|\bborn\b/.test(profile) && !members.length) return { type: "person", confidence: "medium", context: "Discogs profile bevat persoonsindicatie zoals singer/musician/born." };
  if (groups.length && !members.length) return { type: "person", confidence: "low", context: "Discogs groups aanwezig zonder members; mogelijk persoon, gebruiker moet beoordelen." };
  return null;
}

function extractDiscogsEnrichmentProposalValues({ artist, reference, normalized = {} }) {
  const proposals = [];
  const sourceExternalId = reference?.external_id || normalized.discogs_artist_id || null;

  const structuredBirth = normalizeOptionalIsoDate(normalized.birth_date || normalized.date_of_birth || normalized.born);
  if (structuredBirth) {
    proposals.push({
      proposal_type: "birth_date",
      target_table: "artist",
      target_field: "ar_artist_dateofbirth",
      local_value: formatLocalDateValue(artist.ar_artist_dateofbirth),
      proposed_value: structuredBirth,
      proposed_value_normalized: structuredBirth,
      proposed_value_json: { precision: "exact", sourceField: "birth_date" },
      extraction_method: "structured",
      extraction_confidence: "high",
      extraction_context: "Discogs normalized birth_date",
      status: proposalStatusForLocalValue(formatLocalDateValue(artist.ar_artist_dateofbirth), structuredBirth),
      conflict_type: formatLocalDateValue(artist.ar_artist_dateofbirth) && formatLocalDateValue(artist.ar_artist_dateofbirth) !== structuredBirth ? "local_value_differs" : null,
      notes: "Gestructureerde Discogs geboortedatum.",
    });
  }

  const structuredDeath = normalizeOptionalIsoDate(normalized.death_date || normalized.date_of_death || normalized.died || normalized.passing_date);
  if (structuredDeath) {
    proposals.push({
      proposal_type: "death_date",
      target_table: "artist",
      target_field: "ar_artist_passing",
      local_value: formatLocalDateValue(artist.ar_artist_passing),
      proposed_value: structuredDeath,
      proposed_value_normalized: structuredDeath,
      proposed_value_json: { precision: "exact", sourceField: "death_date" },
      extraction_method: "structured",
      extraction_confidence: "high",
      extraction_context: "Discogs normalized death_date",
      status: proposalStatusForLocalValue(formatLocalDateValue(artist.ar_artist_passing), structuredDeath),
      conflict_type: formatLocalDateValue(artist.ar_artist_passing) && formatLocalDateValue(artist.ar_artist_passing) !== structuredDeath ? "local_value_differs" : null,
      notes: "Gestructureerde Discogs overlijdensdatum.",
    });
  }

  const profile = String(normalized.profile || "").trim();
  const birthFromProfile = extractDateProposalFromProfile({ profile, targetField: "ar_artist_dateofbirth", label: "Geboortedatum", localValue: artist.ar_artist_dateofbirth });
  if (birthFromProfile) proposals.push(birthFromProfile);
  const deathFromProfile = extractDateProposalFromProfile({ profile, targetField: "ar_artist_passing", label: "Overlijdensdatum", localValue: artist.ar_artist_passing });
  if (deathFromProfile) proposals.push(deathFromProfile);

  if (profile) {
    proposals.push({
      proposal_type: "profile_text",
      target_table: "artist_external_profile",
      target_field: "profile_text",
      local_value: null,
      proposed_value: profile.length > 800 ? `${profile.slice(0, 800)}…` : profile,
      proposed_value_normalized: profile.slice(0, 800),
      proposed_value_json: { length: profile.length },
      extraction_method: "discogs_cache",
      extraction_confidence: "high",
      extraction_context: "Discogs profile",
      status: "available",
      conflict_type: null,
      notes: "Discogs profieltekst wordt later eventueel als externe profieltekst opgeslagen, niet in ar_artist_notes.",
    });
  }

  const typeSuggestion = inferArtistTypeFromDiscogs(normalized);
  if (typeSuggestion) {
    proposals.push({
      proposal_type: "artist_type",
      target_table: "artist",
      target_field: "ar_artist_type",
      local_value: artist.ar_artist_type || "unknown",
      proposed_value: typeSuggestion.type,
      proposed_value_normalized: typeSuggestion.type,
      proposed_value_json: { allowedValues: ["unknown", "person", "duo", "trio", "group", "band", "alias", "project"] },
      extraction_method: "profile_text_heuristic",
      extraction_confidence: typeSuggestion.confidence,
      extraction_context: typeSuggestion.context,
      status: proposalStatusForLocalValue(artist.ar_artist_type === "unknown" ? null : artist.ar_artist_type, typeSuggestion.type),
      conflict_type: artist.ar_artist_type && artist.ar_artist_type !== "unknown" && artist.ar_artist_type !== typeSuggestion.type ? "local_value_differs" : null,
      notes: "Artist type uit Discogs is alleen voorstel en wordt niet automatisch toegepast.",
    });
  }

  const images = Array.isArray(normalized.images) ? normalized.images : [];
  if (images.length) {
    const primary = images.find((img) => String(img.type || "").toLowerCase() === "primary") || images[0];
    const imageUrl = primary.uri || primary.uri150 || primary.resource_url || "";
    if (imageUrl) {
      proposals.push({
        proposal_type: "primary_image",
        target_table: "artist_external_image",
        target_field: "is_primary",
        local_value: artist.primary_image_url || null,
        proposed_value: imageUrl,
        proposed_value_normalized: imageUrl,
        proposed_value_json: { imageType: primary.type || null, width: primary.width || null, height: primary.height || null },
        extraction_method: "image_metadata",
        extraction_confidence: String(primary.type || "").toLowerCase() === "primary" ? "high" : "medium",
        extraction_context: "Discogs images metadata",
        status: artist.primary_image_url === imageUrl ? "existing" : "available",
        conflict_type: artist.primary_image_url && artist.primary_image_url !== imageUrl ? "local_value_differs" : null,
        notes: "ART-012E-2 kiest profielfoto via image-grid; dit voorstel is read-only samenvatting.",
      });
    }
  }

  const seen = new Set();
  return proposals
    .filter((proposal) => proposal.proposed_value_normalized || proposal.proposed_value)
    .map((proposal) => ({
      source: "discogs",
      source_external_id: sourceExternalId ? String(sourceExternalId) : null,
      source_reference_id: reference?.reference_id || null,
      ...proposal,
    }))
    .filter((proposal) => {
      const key = [proposal.proposal_type, proposal.target_table, proposal.target_field, proposal.proposed_value_normalized || proposal.proposed_value].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function getLinkedDiscogsReferenceForArtist(id) {
  const referenceRes = await pool.query(
    `
    SELECT reference_id, artist_key, source, external_id, external_name, external_url, status, synced_at, updated_at, raw_data_json
    FROM public.artist_external_reference
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
      AND status = 'linked'
    ORDER BY synced_at DESC NULLS LAST, updated_at DESC, reference_id DESC
    LIMIT 1
    `,
    [id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });
  return referenceRes.rows[0] || null;
}

async function getDiscogsEnrichmentCacheForReference(id, reference) {
  if (!reference) return null;
  const cacheRes = await pool.query(
    `
    SELECT cache_id, artist_key, source, external_id, raw_data_json, normalized_data_json, cache_status, fetched_at, expires_at
    FROM public.artist_enrichment_cache
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
      AND external_id = $2::text
    ORDER BY fetched_at DESC, cache_id DESC
    LIMIT 1
    `,
    [id, reference.external_id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });
  return cacheRes.rows[0] || null;
}

function summarizeEnrichmentProposals(rows = []) {
  return rows.reduce((acc, row) => {
    acc.total += 1;
    if (row.status === "available") acc.available += 1;
    else if (row.status === "conflict") acc.conflicts += 1;
    else if (row.status === "existing") acc.existing += 1;
    else if (row.status === "not_applicable") acc.notApplicable += 1;
    else if (row.status === "applied") acc.applied += 1;
    else if (row.status === "ignored") acc.ignored += 1;
    else if (row.status === "review_later") acc.reviewLater += 1;
    else acc.other += 1;
    return acc;
  }, { total: 0, available: 0, conflicts: 0, existing: 0, notApplicable: 0, applied: 0, ignored: 0, reviewLater: 0, other: 0 });
}

async function listDiscogsEnrichmentProposals(artistKey) {
  const id = Number(artistKey);
  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }
  const artist = await getById(id);
  if (!artist) return null;
  const reference = await getLinkedDiscogsReferenceForArtist(id);
  const cache = await getDiscogsEnrichmentCacheForReference(id, reference);

  const proposalsRes = await pool.query(
    `
    SELECT
      proposal_id,
      artist_key,
      source,
      source_external_id,
      source_reference_id,
      proposal_type,
      target_table,
      target_field,
      local_value,
      proposed_value,
      proposed_value_normalized,
      proposed_value_json,
      extraction_method,
      extraction_confidence,
      extraction_context,
      status,
      conflict_type,
      generated_at,
      updated_at,
      notes
    FROM public.artist_enrichment_proposals
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
    ORDER BY
      CASE status WHEN 'conflict' THEN 0 WHEN 'available' THEN 1 WHEN 'not_applicable' THEN 2 WHEN 'existing' THEN 3 ELSE 4 END,
      CASE extraction_confidence WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      proposal_type ASC,
      proposal_id ASC
    `,
    [id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });

  return {
    artist,
    reference,
    cache: cache ? { cache_id: cache.cache_id, fetched_at: cache.fetched_at, expires_at: cache.expires_at, cache_status: cache.cache_status } : null,
    proposals: proposalsRes.rows,
    summary: summarizeEnrichmentProposals(proposalsRes.rows),
    note: reference
      ? "ART-012E-3 toont read-only verrijkingsvoorstellen. Er worden geen lokale artist-velden aangepast."
      : "Geen gekoppelde Discogs artist gevonden. Koppel eerst een Discogs artist als externe bron.",
  };
}

async function generateDiscogsEnrichmentProposals(artistKey) {
  const id = Number(artistKey);
  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }

  const artist = await getById(id);
  if (!artist) return null;
  const reference = await getLinkedDiscogsReferenceForArtist(id);
  if (!reference) {
    return {
      artist,
      reference: null,
      cache: null,
      generated: 0,
      proposals: [],
      summary: summarizeEnrichmentProposals([]),
      note: "Geen gekoppelde Discogs artist gevonden. Koppel eerst een Discogs artist als externe bron.",
    };
  }
  const cache = await getDiscogsEnrichmentCacheForReference(id, reference);
  const normalized = cache?.normalized_data_json || reference.raw_data_json || {};
  const extracted = extractDiscogsEnrichmentProposalValues({ artist, reference, normalized });

  for (const proposal of extracted) {
    await pool.query(
      `
      INSERT INTO public.artist_enrichment_proposals (
        artist_key, source, source_external_id, source_reference_id,
        proposal_type, target_table, target_field,
        local_value, proposed_value, proposed_value_normalized, proposed_value_json,
        extraction_method, extraction_confidence, extraction_context,
        status, conflict_type, notes, generated_at, updated_at
      ) VALUES (
        $1::integer, $2::text, $3::text, $4::bigint,
        $5::text, $6::text, $7::text,
        $8::text, $9::text, $10::text, $11::jsonb,
        $12::text, $13::text, $14::text,
        $15::text, $16::text, $17::text, now(), now()
      )
      ON CONFLICT (artist_key, (lower(source)), (COALESCE(source_external_id, '')), proposal_type, target_table, target_field, (COALESCE(proposed_value_normalized, proposed_value, '')))
      DO UPDATE SET
        source_reference_id = EXCLUDED.source_reference_id,
        local_value = EXCLUDED.local_value,
        proposed_value = EXCLUDED.proposed_value,
        proposed_value_json = EXCLUDED.proposed_value_json,
        extraction_method = EXCLUDED.extraction_method,
        extraction_confidence = EXCLUDED.extraction_confidence,
        extraction_context = EXCLUDED.extraction_context,
        status = CASE
          WHEN public.artist_enrichment_proposals.status IN ('ignored', 'review_later', 'applied') THEN public.artist_enrichment_proposals.status
          ELSE EXCLUDED.status
        END,
        conflict_type = EXCLUDED.conflict_type,
        notes = EXCLUDED.notes,
        updated_at = now()
      `,
      [
        id,
        proposal.source,
        proposal.source_external_id,
        proposal.source_reference_id,
        proposal.proposal_type,
        proposal.target_table,
        proposal.target_field,
        proposal.local_value,
        proposal.proposed_value,
        proposal.proposed_value_normalized,
        JSON.stringify(proposal.proposed_value_json || {}),
        proposal.extraction_method,
        proposal.extraction_confidence,
        proposal.extraction_context,
        proposal.status,
        proposal.conflict_type,
        proposal.notes,
      ]
    );
  }

  const listed = await listDiscogsEnrichmentProposals(id);
  return {
    ...listed,
    generated: extracted.length,
    note: "ART-012E-3 heeft Discogs verrijkingsvoorstellen gegenereerd als read-only preview. Er zijn geen lokale artist-velden aangepast.",
  };
}


function normalizeProposalReviewStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (["ignored", "review_later"].includes(value)) return value;
  throw Object.assign(new Error("Invalid enrichment proposal status"), { statusCode: 400 });
}

function isExactDateProposal(proposal) {
  return ["ar_artist_dateofbirth", "ar_artist_passing"].includes(proposal?.target_field)
    && /^\d{4}-\d{2}-\d{2}$/.test(String(proposal?.proposed_value_normalized || ""));
}

function assertProposalApplicable(proposal) {
  if (!proposal) throw Object.assign(new Error("Enrichment proposal not found"), { statusCode: 404 });
  if (["applied", "ignored"].includes(String(proposal.status || ""))) {
    throw Object.assign(new Error("Enrichment proposal is already closed"), { statusCode: 409 });
  }
  if (proposal.status === "not_applicable") {
    throw Object.assign(new Error("Enrichment proposal is not applicable and cannot be applied"), { statusCode: 409 });
  }
}

async function getEnrichmentProposalForUpdate(client, { artistKey, proposalId }) {
  const res = await client.query(
    `
    SELECT
      proposal_id,
      artist_key,
      source,
      source_external_id,
      source_reference_id,
      proposal_type,
      target_table,
      target_field,
      local_value,
      proposed_value,
      proposed_value_normalized,
      proposed_value_json,
      extraction_method,
      extraction_confidence,
      extraction_context,
      status,
      conflict_type,
      generated_at,
      updated_at,
      reviewed_at,
      notes
    FROM public.artist_enrichment_proposals
    WHERE artist_key = $1::integer
      AND proposal_id = $2::bigint
      AND lower(source) = 'discogs'
    FOR UPDATE
    `,
    [artistKey, proposalId]
  );
  return res.rows[0] || null;
}

async function writeOptionalEnrichmentAudit(client, { artistKey, action, payload, performedBy }) {
  await client.query("SAVEPOINT artist_enrichment_proposal_optional_audit");
  try {
    await client.query(
      `
      INSERT INTO public.admin_audit_log (entity_type, entity_id, action, payload, performed_by, performed_at)
      VALUES ('artist', $1::text, $2::text, $3::jsonb, $4::text, now())
      `,
      [String(artistKey), action, JSON.stringify(payload || {}), performedBy || "artist-app"]
    );
    await client.query("RELEASE SAVEPOINT artist_enrichment_proposal_optional_audit");
  } catch (err) {
    await client.query("ROLLBACK TO SAVEPOINT artist_enrichment_proposal_optional_audit");
    await client.query("RELEASE SAVEPOINT artist_enrichment_proposal_optional_audit");
    if (err.code !== "42P01" && err.code !== "42703") throw err;
  }
}

async function updateDiscogsEnrichmentProposalStatus({ artistKey, proposalId, status, note = "", performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const propId = Number(proposalId);
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(propId) || propId <= 0) {
    throw Object.assign(new Error("Invalid artist key or proposal id"), { statusCode: 400 });
  }
  const nextStatus = normalizeProposalReviewStatus(status);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const proposal = await getEnrichmentProposalForUpdate(client, { artistKey: id, proposalId: propId });
    if (!proposal) throw Object.assign(new Error("Enrichment proposal not found"), { statusCode: 404 });
    if (proposal.status === "applied") {
      throw Object.assign(new Error("Applied enrichment proposals cannot be changed to review status"), { statusCode: 409 });
    }

    const updated = await client.query(
      `
      UPDATE public.artist_enrichment_proposals
      SET status = $3::text,
          reviewed_at = now(),
          reviewed_by = $4::text,
          ignored_at = CASE WHEN $3::text = 'ignored' THEN now() ELSE ignored_at END,
          ignored_by = CASE WHEN $3::text = 'ignored' THEN $4::text ELSE ignored_by END,
          notes = NULLIF($5::text, ''),
          updated_at = now()
      WHERE artist_key = $1::integer
        AND proposal_id = $2::bigint
      RETURNING *
      `,
      [id, propId, nextStatus, performedBy, note || ""]
    );

    await writeOptionalEnrichmentAudit(client, {
      artistKey: id,
      action: `discogs_enrichment_proposal_${nextStatus}`,
      payload: { proposalId: propId, previousStatus: proposal.status, status: nextStatus, note },
      performedBy,
    });

    await client.query("COMMIT");
    return { proposal: updated.rows[0], proposals: (await listDiscogsEnrichmentProposals(id)).proposals };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

async function applyDiscogsEnrichmentProposal({ artistKey, proposalId, confirmOverwrite = false, performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const propId = Number(proposalId);
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(propId) || propId <= 0) {
    throw Object.assign(new Error("Invalid artist key or proposal id"), { statusCode: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const proposal = await getEnrichmentProposalForUpdate(client, { artistKey: id, proposalId: propId });
    assertProposalApplicable(proposal);

    const localText = String(proposal.local_value || "").trim();
    const proposedText = String(proposal.proposed_value_normalized || proposal.proposed_value || "").trim();
    if (!proposedText) {
      throw Object.assign(new Error("Enrichment proposal has no proposed value"), { statusCode: 409 });
    }
    if (proposal.status === "conflict" && !confirmOverwrite) {
      throw Object.assign(new Error("Local value differs; explicit overwrite confirmation is required"), {
        statusCode: 409,
        code: "CONFIRM_OVERWRITE_REQUIRED",
        proposalId: propId,
        targetField: proposal.target_field,
      });
    }

    let applyResult = null;
    if (proposal.target_table === "artist" && ["ar_artist_dateofbirth", "ar_artist_passing"].includes(proposal.target_field)) {
      if (!isExactDateProposal(proposal)) {
        throw Object.assign(new Error("Only exact dates can be applied to artist date fields"), { statusCode: 409 });
      }

      const sqlField = proposal.target_field;
      const currentRes = await client.query(
        `
        SELECT
          ar_artist_key,
          ar_artist_name,
          ar_artist_dateofbirth::text AS ar_artist_dateofbirth_text,
          ar_artist_passing::text AS ar_artist_passing_text
        FROM public.artist
        WHERE ar_artist_key = $1::integer
        FOR UPDATE
        `,
        [id]
      );
      const currentArtist = currentRes.rows[0];
      if (!currentArtist) throw Object.assign(new Error("Artist not found"), { statusCode: 404 });

      const currentValue = currentArtist[`${sqlField}_text`] || null;
      const valueDiffers = currentValue && currentValue !== proposedText;
      if (valueDiffers && !confirmOverwrite) {
        throw Object.assign(new Error("Local date already has a value; confirm overwrite to replace it"), {
          statusCode: 409,
          code: "CONFIRM_OVERWRITE_REQUIRED",
          proposalId: propId,
          targetField: proposal.target_field,
        });
      }

      const updateRes = await client.query(
        `
        UPDATE public.artist
        SET ${sqlField} = $2::date
        WHERE ar_artist_key = $1::integer
        RETURNING
          ar_artist_key,
          ar_artist_name,
          ${sqlField}::text AS applied_date,
          ar_artist_dateofbirth::text AS ar_artist_dateofbirth,
          ar_artist_passing::text AS ar_artist_passing
        `,
        [id, proposedText]
      );
      const row = updateRes.rows[0];

      const verifyRes = await client.query(
        `
        SELECT ${sqlField}::text AS persisted_date
        FROM public.artist
        WHERE ar_artist_key = $1::integer
        `,
        [id]
      );
      const appliedValue = verifyRes.rows[0]?.persisted_date || row?.applied_date || null;
      if (appliedValue !== proposedText) {
        throw Object.assign(new Error(`Artist date was not persisted after apply: expected ${proposedText}, got ${appliedValue || "<empty>"}`), {
          statusCode: 500,
          code: "ARTIST_DATE_APPLY_NOT_PERSISTED",
          proposalId: propId,
          targetField: proposal.target_field,
          expectedValue: proposedText,
          actualValue: appliedValue || null,
        });
      }
      applyResult = { target: proposal.target_field, value: proposedText, previousValue: currentValue || null, artist: row };
    } else if (proposal.target_table === "artist" && proposal.target_field === "ar_artist_type") {
      const allowed = new Set(["unknown", "person", "duo", "trio", "group", "band", "alias", "project"]);
      if (!allowed.has(proposedText)) {
        throw Object.assign(new Error("Invalid artist type proposal"), { statusCode: 409 });
      }
      const updateRes = await client.query(
        `
        UPDATE public.artist
        SET ar_artist_type = CASE
              WHEN ar_artist_type IS NULL OR ar_artist_type = 'unknown' OR $3::boolean = true THEN $2::text
              ELSE ar_artist_type
            END
        WHERE ar_artist_key = $1::integer
        RETURNING ar_artist_key, ar_artist_name, ar_artist_type
        `,
        [id, proposedText, Boolean(confirmOverwrite)]
      );
      const row = updateRes.rows[0];
      if (row?.ar_artist_type !== proposedText) {
        throw Object.assign(new Error("Artist type already has a value; confirm overwrite to replace it"), {
          statusCode: 409,
          code: "CONFIRM_OVERWRITE_REQUIRED",
          proposalId: propId,
          targetField: proposal.target_field,
        });
      }
      applyResult = { target: proposal.target_field, value: proposedText, artist: row };
    } else if (proposal.target_table === "artist" && proposal.target_field === "ar_website_url") {
      const updateRes = await client.query(
        `
        UPDATE public.artist
        SET ar_website_url = CASE
              WHEN ar_website_url IS NULL OR trim(ar_website_url) = '' OR $3::boolean = true THEN $2::text
              ELSE ar_website_url
            END
        WHERE ar_artist_key = $1::integer
        RETURNING ar_artist_key, ar_artist_name, ar_website_url
        `,
        [id, proposedText, Boolean(confirmOverwrite)]
      );
      const row = updateRes.rows[0];
      if (row?.ar_website_url !== proposedText) {
        throw Object.assign(new Error("Website already has a value; confirm overwrite to replace it"), {
          statusCode: 409,
          code: "CONFIRM_OVERWRITE_REQUIRED",
          proposalId: propId,
          targetField: proposal.target_field,
        });
      }
      applyResult = { target: proposal.target_field, value: proposedText, artist: row };
    } else if (proposal.target_table === "artist_external_profile" && proposal.target_field === "profile_text") {
      const profileText = String(proposal.proposed_value || proposal.proposed_value_normalized || "").trim();
      if (!profileText) throw Object.assign(new Error("Profile text proposal is empty"), { statusCode: 409 });
      const reference = await getLinkedDiscogsReferenceForArtist(id);
      const profileRes = await client.query(
        `
        INSERT INTO public.artist_external_profile (
          artist_key, source, source_external_id, source_reference_id, profile_text, profile_url, is_primary, status, fetched_at, stored_at, raw_data_json
        ) VALUES (
          $1::integer, 'discogs', $2::text, $3::bigint, $4::text, $5::text, true, 'active', now(), now(), $6::jsonb
        )
        ON CONFLICT (artist_key, lower(source), COALESCE(source_external_id, ''))
        DO UPDATE SET
          source_reference_id = EXCLUDED.source_reference_id,
          profile_text = EXCLUDED.profile_text,
          profile_url = EXCLUDED.profile_url,
          status = 'active',
          stored_at = now(),
          raw_data_json = EXCLUDED.raw_data_json
        RETURNING *
        `,
        [id, proposal.source_external_id, reference?.reference_id || proposal.source_reference_id || null, profileText, reference?.external_url || null, JSON.stringify({ proposalId: propId, extractionContext: proposal.extraction_context })]
      );
      applyResult = { target: proposal.target_field, value: "artist_external_profile", externalProfile: profileRes.rows[0] };
    } else {
      throw Object.assign(new Error("This enrichment proposal type cannot be applied in ART-012E-4"), { statusCode: 409 });
    }

    const updatedProposalRes = await client.query(
      `
      UPDATE public.artist_enrichment_proposals
      SET status = 'applied',
          reviewed_at = now(),
          reviewed_by = $3::text,
          applied_at = now(),
          applied_by = $3::text,
          notes = COALESCE(notes, '') || CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE E'\n' END || 'Toegepast via ART-012E-4.',
          updated_at = now()
      WHERE artist_key = $1::integer
        AND proposal_id = $2::bigint
      RETURNING *
      `,
      [id, propId, performedBy]
    );

    await writeOptionalEnrichmentAudit(client, {
      artistKey: id,
      action: "discogs_enrichment_proposal_applied",
      payload: { proposalId: propId, targetTable: proposal.target_table, targetField: proposal.target_field, result: applyResult },
      performedBy,
    });

    await client.query("COMMIT");
    return { proposal: updatedProposalRes.rows[0], result: applyResult, enrichment: await listDiscogsEnrichmentProposals(id), artist: await getById(id) };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}


function nameProposalStatusFromClassification(classification = {}) {
  if (classification.status === "conflict") return "conflict";
  if (classification.action === "already_canonical" || classification.action === "already_alternative_spelling") return "existing";
  return "new";
}

async function getLinkedDiscogsReferenceAndCache(id) {
  const artist = await getById(id);
  if (!artist) return null;

  const referenceRes = await pool.query(
    `
    SELECT reference_id, artist_key, source, external_id, external_name, external_url, status, synced_at, updated_at
    FROM public.artist_external_reference
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
      AND status = 'linked'
    ORDER BY synced_at DESC NULLS LAST, updated_at DESC, reference_id DESC
    LIMIT 1
    `,
    [id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });

  const reference = referenceRes.rows[0] || null;
  if (!reference) return { artist, reference: null, cache: null, normalized: {} };

  const cacheRes = await pool.query(
    `
    SELECT cache_id, artist_key, source, external_id, normalized_data_json, fetched_at
    FROM public.artist_enrichment_cache
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
      AND external_id = $2::text
    ORDER BY fetched_at DESC, cache_id DESC
    LIMIT 1
    `,
    [id, reference.external_id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });

  const cache = cacheRes.rows[0] || null;
  return { artist, reference, cache, normalized: cache?.normalized_data_json || {} };
}

async function classifyDiscogsNameProposalRows({ artist, rawProposals }) {
  const ownSpellingsRes = await pool.query(
    `
    SELECT as_alternatieve_spelling, as_artist_key
    FROM public.artiesten_spelling
    WHERE as_artist_key = $1::integer
    ORDER BY as_alternatieve_spelling ASC
    `,
    [artist.ar_artist_key]
  );
  const existingOwnSpellings = new Map();
  for (const row of ownSpellingsRes.rows) {
    existingOwnSpellings.set(normalizeArtistName(row.as_alternatieve_spelling), row);
  }

  const normalizedValues = rawProposals.map((proposal) => proposal.normalizedValue).filter(Boolean);
  const spellingOwnerByNormalized = new Map();
  if (normalizedValues.length) {
    const ownersRes = await pool.query(
      `
      SELECT s.as_alternatieve_spelling, s.as_artist_key, a.ar_artist_name
      FROM public.artiesten_spelling s
      JOIN public.artist a ON a.ar_artist_key = s.as_artist_key
      `
    );
    for (const row of ownersRes.rows) {
      const key = normalizeArtistName(row.as_alternatieve_spelling);
      if (normalizedValues.includes(key) && !spellingOwnerByNormalized.has(key)) {
        spellingOwnerByNormalized.set(key, row);
      }
    }
  }

  return rawProposals.map((proposal) => ({
    ...proposal,
    classification: classifyDiscogsSpellingProposal({ proposal, artist, existingOwnSpellings, spellingOwnerByNormalized }),
  }));
}


function normalizeNameProposalStatus(status = "") {
  const value = String(status || "").trim().toLowerCase();
  return value || "new";
}

async function detectNameProposalConflict({ artistKey, proposalName, client = pool } = {}) {
  const id = Number(artistKey);
  const text = String(proposalName || "").trim();
  const normalized = normalizeArtistName(text);
  if (!Number.isFinite(id) || !text || !normalized) {
    return {
      status: "invalid",
      conflictType: "invalid_name",
      conflictArtistKey: null,
      conflictArtistName: null,
      reason: "Naamvoorstel is leeg of ongeldig.",
      canApply: false,
      normalizedName: normalized,
    };
  }

  const canonicalRes = await client.query(
    `
    SELECT ar_artist_key, ar_artist_name
    FROM public.artist
    WHERE ar_artist_key = $1::integer
    LIMIT 1
    `,
    [id]
  );
  const artist = canonicalRes.rows[0] || null;
  if (artist && normalizeArtistName(artist.ar_artist_name) === normalized) {
    return {
      status: "existing",
      conflictType: "already_canonical",
      conflictArtistKey: id,
      conflictArtistName: artist.ar_artist_name,
      reason: "Deze naam is al de lokale canonical artist name.",
      canApply: false,
      normalizedName: normalized,
    };
  }

  const spellingRes = await client.query(
    `
    SELECT s.as_alternatieve_spelling, s.as_artist_key, a.ar_artist_name
    FROM public.artiesten_spelling s
    JOIN public.artist a ON a.ar_artist_key = s.as_artist_key
    WHERE lower(trim(s.as_alternatieve_spelling::text)) = lower(trim($1::text))
    LIMIT 1
    `,
    [text]
  );
  const owner = spellingRes.rows[0] || null;
  if (!owner) {
    return {
      status: "new",
      conflictType: null,
      conflictArtistKey: null,
      conflictArtistName: null,
      reason: "Naamvoorstel is beschikbaar als alternatieve spelling.",
      canApply: true,
      normalizedName: normalized,
    };
  }

  if (Number(owner.as_artist_key) === id) {
    return {
      status: "existing",
      conflictType: "already_own_spelling",
      conflictArtistKey: id,
      conflictArtistName: owner.ar_artist_name,
      reason: "Deze naam bestaat al als alternatieve spelling voor deze artiest.",
      canApply: false,
      normalizedName: normalized,
    };
  }

  return {
    status: "conflict",
    conflictType: "spelling_owned_by_other_artist",
    conflictArtistKey: owner.as_artist_key,
    conflictArtistName: owner.ar_artist_name,
    reason: `Deze spelling is al gekoppeld aan artist_key ${owner.as_artist_key} (${owner.ar_artist_name}).`,
    canApply: false,
    normalizedName: normalized,
  };
}

function summarizeNameProposalRows(rows = []) {
  return rows.reduce((acc, row) => {
    acc.total += 1;
    const status = normalizeNameProposalStatus(row.status);
    if (status === "new") acc.new += 1;
    else if (status === "added") acc.added += 1;
    else if (status === "ignored") acc.ignored += 1;
    else if (status === "conflict") acc.conflict += 1;
    else if (status === "review_later") acc.review_later += 1;
    else if (status === "existing") acc.existing += 1;
    else if (status === "invalid") acc.invalid += 1;
    return acc;
  }, { total: 0, new: 0, added: 0, ignored: 0, conflict: 0, review_later: 0, existing: 0, invalid: 0 });
}

async function listDiscogsNameProposals(id, filters = {}) {
  const linked = await getLinkedDiscogsReferenceAndCache(id);
  if (!linked) return null;
  const { artist, reference } = linked;
  if (!reference) {
    return {
      artist,
      reference: null,
      proposals: [],
      summary: summarizeNameProposalRows([]),
      note: "Geen gekoppelde Discogs artist gevonden. Koppel eerst een Discogs artist als externe bron.",
    };
  }

  const params = [id];
  const where = ["artist_key = $1::integer", "lower(source) = 'discogs'"];
  const status = String(filters.status || "").trim().toLowerCase();
  if (status && status !== "all") {
    params.push(status);
    where.push(`status = $${params.length}::text`);
  }
  const proposalType = String(filters.type || "").trim().toLowerCase();
  if (proposalType && proposalType !== "all") {
    params.push(proposalType);
    where.push(`proposal_type = $${params.length}::text`);
  }
  const q = String(filters.q || "").trim();
  if (q) {
    params.push(`%${q}%`);
    where.push(`(proposal_name::text ILIKE $${params.length} OR coalesce(reason, '') ILIKE $${params.length} OR coalesce(conflict_artist_name::text, '') ILIKE $${params.length})`);
  }

  const res = await pool.query(
    `
    SELECT proposal_id, artist_key, source, source_external_id, source_reference_id,
           proposal_name, normalized_name, proposal_type, source_label, status,
           conflict_type, conflict_artist_key, conflict_artist_name, reason,
           generated_at, updated_at, reviewed_at, reviewed_by, applied_at, applied_by,
           ignored_at, ignored_by, notes
    FROM public.artist_name_proposals
    WHERE ${where.join(" AND ")}
    ORDER BY
      CASE status WHEN 'new' THEN 0 WHEN 'conflict' THEN 1 WHEN 'review_later' THEN 2 WHEN 'existing' THEN 3 WHEN 'invalid' THEN 4 WHEN 'added' THEN 5 WHEN 'ignored' THEN 6 ELSE 7 END,
      source_label ASC,
      proposal_name ASC
    `,
    params
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });

  const summaryRes = await pool.query(
    `
    SELECT status, count(*)::integer AS count
    FROM public.artist_name_proposals
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
    GROUP BY status
    `,
    [id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });
  const allSummaryRows = [];
  for (const row of summaryRes.rows) {
    for (let i = 0; i < Number(row.count || 0); i += 1) allSummaryRows.push({ status: row.status });
  }

  return {
    artist,
    reference,
    proposals: res.rows,
    summary: summarizeNameProposalRows(allSummaryRows),
    filteredSummary: summarizeNameProposalRows(res.rows),
    filters: { status: status || "all", type: proposalType || "all", q },
    note: "ART-012D-4 beheert Discogs aliases/name variations persistent als reviewqueue.",
  };
}

async function generateDiscogsNameProposals(id) {
  const linked = await getLinkedDiscogsReferenceAndCache(id);
  if (!linked) return null;
  const { artist, reference, cache, normalized } = linked;
  if (!reference) return { artist, reference: null, proposals: [], generated: 0, summary: summarizeNameProposalRows([]) };

  const rawProposals = extractDiscogsNameProposalValues(normalized);
  const classified = await classifyDiscogsNameProposalRows({ artist, rawProposals });
  let generated = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const proposal of classified) {
      const c = proposal.classification;
      const status = nameProposalStatusFromClassification(c);
      const res = await client.query(
        `
        INSERT INTO public.artist_name_proposals (
          artist_key, source, source_external_id, source_reference_id,
          proposal_name, normalized_name, proposal_type, source_label, status,
          conflict_type, conflict_artist_key, conflict_artist_name, reason, notes
        ) VALUES (
          $1::integer, 'discogs', $2::text, $3::bigint,
          $4::citext, $5::text, $6::text, $7::text, $8::text,
          $9::text, $10::integer, $11::text, $12::text, $13::text
        )
        ON CONFLICT (artist_key, source, source_external_id, proposal_type, normalized_name)
        DO UPDATE SET
          proposal_name = EXCLUDED.proposal_name,
          source_label = EXCLUDED.source_label,
          conflict_type = EXCLUDED.conflict_type,
          conflict_artist_key = EXCLUDED.conflict_artist_key,
          conflict_artist_name = EXCLUDED.conflict_artist_name,
          reason = EXCLUDED.reason,
          notes = EXCLUDED.notes,
          status = CASE
            WHEN public.artist_name_proposals.status IN ('added', 'ignored') THEN public.artist_name_proposals.status
            ELSE EXCLUDED.status
          END,
          updated_at = now()
        RETURNING proposal_id
        `,
        [
          artist.ar_artist_key,
          String(reference.external_id || ""),
          reference.reference_id || null,
          proposal.value,
          proposal.normalizedValue,
          proposal.source,
          proposal.label,
          status,
          c.status === "conflict" ? c.action : null,
          c.conflictingArtistKey || null,
          c.conflictingArtistName || null,
          c.reason || null,
          cache?.cache_id ? `Generated from artist_enrichment_cache.cache_id=${cache.cache_id}` : "Generated from Discogs cache",
        ]
      );
      if (res.rows[0]) generated += 1;
    }
    await client.query("COMMIT");
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }

  const queue = await listDiscogsNameProposals(id);
  return { ...queue, generated };
}

async function updateDiscogsNameProposalStatus({ artistKey, proposalId, status, note = "", performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const pid = Number(proposalId);
  const nextStatus = String(status || "").trim().toLowerCase();
  const allowed = ["new", "ignored", "conflict", "review_later"];
  if (!Number.isFinite(id) || !Number.isFinite(pid)) {
    throw Object.assign(new Error("Invalid artist key or proposal id"), { statusCode: 400 });
  }
  if (!allowed.includes(nextStatus)) {
    throw Object.assign(new Error("Invalid name proposal status"), { statusCode: 400 });
  }

  let conflict = null;
  if (nextStatus === "new") {
    const proposalRes = await pool.query(
      `SELECT proposal_name FROM public.artist_name_proposals WHERE artist_key = $1::integer AND proposal_id = $2::bigint`,
      [id, pid]
    );
    const proposal = proposalRes.rows[0];
    if (!proposal) return { proposal: null, queue: await listDiscogsNameProposals(id) };
    conflict = await detectNameProposalConflict({ artistKey: id, proposalName: proposal.proposal_name });
  }

  const effectiveStatus = nextStatus === "new" && conflict ? conflict.status : nextStatus;
  const res = await pool.query(
    `
    UPDATE public.artist_name_proposals
    SET status = $3::text,
        conflict_type = CASE WHEN $3::text IN ('conflict', 'existing', 'invalid') THEN $5::text ELSE CASE WHEN $3::text = 'new' THEN NULL ELSE conflict_type END END,
        conflict_artist_key = CASE WHEN $3::text IN ('conflict', 'existing') THEN $6::integer ELSE CASE WHEN $3::text = 'new' THEN NULL ELSE conflict_artist_key END END,
        conflict_artist_name = CASE WHEN $3::text IN ('conflict', 'existing') THEN $7::citext ELSE CASE WHEN $3::text = 'new' THEN NULL ELSE conflict_artist_name END END,
        reason = CASE
          WHEN $5::text IS NOT NULL THEN $8::text
          WHEN $3::text = 'review_later' THEN 'Later beoordelen.'
          WHEN $3::text = 'ignored' THEN 'Genegeerd door gebruiker.'
          ELSE reason
        END,
        reviewed_at = now(),
        reviewed_by = $9::text,
        ignored_at = CASE WHEN $3::text = 'ignored' THEN now() ELSE ignored_at END,
        ignored_by = CASE WHEN $3::text = 'ignored' THEN $9::text ELSE ignored_by END,
        notes = NULLIF(trim(coalesce($4::text, '')), ''),
        updated_at = now()
    WHERE artist_key = $1::integer
      AND proposal_id = $2::bigint
    RETURNING *
    `,
    [
      id,
      pid,
      effectiveStatus,
      note || "",
      conflict?.conflictType || null,
      conflict?.conflictArtistKey || null,
      conflict?.conflictArtistName || null,
      conflict?.reason || null,
      performedBy,
    ]
  );
  return { proposal: res.rows[0] || null, queue: await listDiscogsNameProposals(id) };
}

async function applyDiscogsNameProposalAsSpelling({ artistKey, proposalId, performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const pid = Number(proposalId);
  if (!Number.isFinite(id) || !Number.isFinite(pid)) {
    throw Object.assign(new Error("Invalid artist key or proposal id"), { statusCode: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const proposalRes = await client.query(
      `
      SELECT *
      FROM public.artist_name_proposals
      WHERE artist_key = $1::integer
        AND proposal_id = $2::bigint
        AND lower(source) = 'discogs'
      FOR UPDATE
      `,
      [id, pid]
    );
    const proposal = proposalRes.rows[0];
    if (!proposal) {
      await client.query("ROLLBACK");
      return null;
    }
    if (!["new", "review_later"].includes(proposal.status)) {
      throw Object.assign(new Error("Alleen nieuwe/later te beoordelen naamvoorstellen kunnen als spelling worden toegevoegd."), { statusCode: 409, code: "INVALID_PROPOSAL_STATUS" });
    }

    const conflict = await detectNameProposalConflict({ artistKey: id, proposalName: proposal.proposal_name, client });
    if (conflict.status === "existing") {
      const updated = await client.query(
        `
        UPDATE public.artist_name_proposals
        SET status = 'existing', conflict_type = $3::text, conflict_artist_key = $4::integer,
            conflict_artist_name = $5::citext, reason = $6::text,
            reviewed_at = now(), reviewed_by = $7::text, updated_at = now()
        WHERE artist_key = $1::integer AND proposal_id = $2::bigint
        RETURNING *
        `,
        [id, pid, conflict.conflictType, conflict.conflictArtistKey, conflict.conflictArtistName, conflict.reason, performedBy]
      );
      await client.query("COMMIT");
      return { proposal: updated.rows[0], spelling: null, queue: await listDiscogsNameProposals(id) };
    }
    if (conflict.status !== "new") {
      await client.query(
        `
        UPDATE public.artist_name_proposals
        SET status = $3::text, conflict_type = $4::text, conflict_artist_key = $5::integer,
            conflict_artist_name = $6::citext, reason = $7::text,
            reviewed_at = now(), reviewed_by = $8::text, updated_at = now()
        WHERE artist_key = $1::integer AND proposal_id = $2::bigint
        `,
        [id, pid, conflict.status, conflict.conflictType, conflict.conflictArtistKey, conflict.conflictArtistName, conflict.reason, performedBy]
      );
      throw Object.assign(new Error(conflict.reason || "Naamvoorstel kan niet als spelling worden toegevoegd."), { statusCode: 409, code: "NAME_PROPOSAL_CONFLICT" });
    }

    const insertRes = await client.query(
      `
      INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
      VALUES ($1::citext, $2::integer)
      ON CONFLICT (as_alternatieve_spelling) DO NOTHING
      RETURNING as_alternatieve_spelling, as_artist_key
      `,
      [proposal.proposal_name, id]
    );
    if (!insertRes.rows[0]) {
      const lateConflict = await detectNameProposalConflict({ artistKey: id, proposalName: proposal.proposal_name, client });
      await client.query(
        `
        UPDATE public.artist_name_proposals
        SET status = $3::text, conflict_type = $4::text, conflict_artist_key = $5::integer,
            conflict_artist_name = $6::citext, reason = $7::text,
            reviewed_at = now(), reviewed_by = $8::text, updated_at = now()
        WHERE artist_key = $1::integer AND proposal_id = $2::bigint
        `,
        [id, pid, lateConflict.status, lateConflict.conflictType, lateConflict.conflictArtistKey, lateConflict.conflictArtistName, lateConflict.reason, performedBy]
      );
      throw Object.assign(new Error(lateConflict.reason || "Alternatieve spelling kon niet worden toegevoegd."), { statusCode: 409, code: "SPELLING_INSERT_CONFLICT" });
    }

    const updatedRes = await client.query(
      `
      UPDATE public.artist_name_proposals
      SET status = 'added', applied_at = now(), applied_by = $3::text,
          reviewed_at = now(), reviewed_by = $3::text, updated_at = now(),
          conflict_type = NULL, conflict_artist_key = NULL, conflict_artist_name = NULL,
          reason = 'Toegevoegd als alternatieve spelling.'
      WHERE artist_key = $1::integer AND proposal_id = $2::bigint
      RETURNING *
      `,
      [id, pid, performedBy]
    );
    await client.query("COMMIT");
    return { proposal: updatedRes.rows[0], spelling: insertRes.rows[0], queue: await listDiscogsNameProposals(id), relations: await getRelations(id) };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}


async function getDiscogsSpellingProposals(id) {
  const artist = await getById(id);
  if (!artist) return null;

  const referenceRes = await pool.query(
    `
    SELECT reference_id, artist_key, source, external_id, external_name, external_url, status, synced_at, updated_at
    FROM public.artist_external_reference
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
      AND status = 'linked'
    ORDER BY synced_at DESC NULLS LAST, updated_at DESC, reference_id DESC
    LIMIT 1
    `,
    [id]
  ).catch((err) => {
    if (err.code === "42P01") return { rows: [] };
    throw err;
  });

  const reference = referenceRes.rows[0] || null;
  if (!reference) {
    return {
      artist,
      reference: null,
      proposals: [],
      summary: { total: 0, available: 0, conflicts: 0, existing: 0 },
      note: "Geen gekoppelde Discogs artist gevonden. Koppel eerst een Discogs artist als externe bron.",
    };
  }

  const cacheRes = await pool.query(
    `
    SELECT cache_id, artist_key, source, external_id, normalized_data_json, fetched_at
    FROM public.artist_enrichment_cache
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
      AND external_id = $2::text
    ORDER BY fetched_at DESC, cache_id DESC
    LIMIT 1
    `,
    [id, reference.external_id]
  );

  const normalized = cacheRes.rows[0]?.normalized_data_json || reference.raw_data_json || {};
  const rawProposals = extractDiscogsNameProposalValues(normalized);

  const ownSpellingsRes = await pool.query(
    `
    SELECT as_alternatieve_spelling, as_artist_key
    FROM public.artiesten_spelling
    WHERE as_artist_key = $1::integer
    ORDER BY as_alternatieve_spelling ASC
    `,
    [id]
  );
  const existingOwnSpellings = new Map();
  for (const row of ownSpellingsRes.rows) {
    existingOwnSpellings.set(normalizeArtistName(row.as_alternatieve_spelling), row);
  }

  const normalizedValues = rawProposals.map((proposal) => proposal.normalizedValue).filter(Boolean);
  const spellingOwnerByNormalized = new Map();
  if (normalizedValues.length) {
    // ART-012D-1 intentionally uses app-side normalization here so conflict checks
    // match the same rules as duplicate detection and do not depend on PostgreSQL extensions.
    const ownersRes = await pool.query(
      `
      SELECT s.as_alternatieve_spelling, s.as_artist_key, a.ar_artist_name
      FROM public.artiesten_spelling s
      JOIN public.artist a ON a.ar_artist_key = s.as_artist_key
      `
    );
    for (const row of ownersRes.rows) {
      const key = normalizeArtistName(row.as_alternatieve_spelling);
      if (normalizedValues.includes(key) && !spellingOwnerByNormalized.has(key)) {
        spellingOwnerByNormalized.set(key, row);
      }
    }
  }

  const proposals = rawProposals.map((proposal) => {
    const classification = classifyDiscogsSpellingProposal({ proposal, artist, existingOwnSpellings, spellingOwnerByNormalized });
    return {
      proposed_name: proposal.value,
      normalized_name: proposal.normalizedValue,
      source: proposal.source,
      source_label: proposal.label,
      ...classification,
    };
  });

  const summary = proposals.reduce((acc, proposal) => {
    acc.total += 1;
    if (proposal.status === "available") acc.available += 1;
    else if (proposal.status === "conflict") acc.conflicts += 1;
    else acc.existing += 1;
    return acc;
  }, { total: 0, available: 0, conflicts: 0, existing: 0 });

  return {
    artist,
    reference,
    cache: cacheRes.rows[0] ? { cache_id: cacheRes.rows[0].cache_id, fetched_at: cacheRes.rows[0].fetched_at } : null,
    proposals,
    summary,
    note: "ART-012D-1 toont alleen voorstellen. Er worden geen wijzigingen in artist of artiesten_spelling uitgevoerd.",
  };
}



async function getDiscogsCanonicalRenamePreview({ artistKey, proposedName } = {}) {
  const id = Number(artistKey);
  const newCanonicalName = String(proposedName || "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }
  if (!newCanonicalName) {
    throw Object.assign(new Error("Geen canonical naamvoorstel opgegeven."), { statusCode: 400 });
  }

  const artistRes = await pool.query(
    `
    SELECT ar_artist_key, ar_artist_name
    FROM public.artist
    WHERE ar_artist_key = $1::integer
    `,
    [id]
  );
  const artist = artistRes.rows[0];
  if (!artist) return null;

  const normalizedNewCanonical = normalizeArtistName(newCanonicalName);
  const normalizedCurrentCanonical = normalizeArtistName(artist.ar_artist_name);
  if (!normalizedNewCanonical) {
    throw Object.assign(new Error("Ongeldige canonical naam."), { statusCode: 400 });
  }

  const blocks = [];
  const warnings = [];

  if (normalizedNewCanonical === normalizedCurrentCanonical) {
    blocks.push({
      code: "ALREADY_CANONICAL",
      message: "Discogs-naam is al de lokale canonical artist name.",
    });
  }

  const artistNameConflictRes = await pool.query(
    `
    SELECT ar_artist_key, ar_artist_name
    FROM public.artist
    WHERE lower(trim(ar_artist_name::text)) = lower(trim($1::text))
      AND ar_artist_key <> $2::integer
    LIMIT 1
    `,
    [newCanonicalName, id]
  );
  if (artistNameConflictRes.rows[0]) {
    blocks.push({
      code: "CANONICAL_NAME_CONFLICT",
      message: `Er bestaat al een andere artist met deze canonical naam: artist_key ${artistNameConflictRes.rows[0].ar_artist_key} (${artistNameConflictRes.rows[0].ar_artist_name}).`,
      conflictingArtistKey: artistNameConflictRes.rows[0].ar_artist_key,
      conflictingArtistName: artistNameConflictRes.rows[0].ar_artist_name,
    });
  }

  const spellingsRes = await pool.query(
    `
    SELECT s.as_alternatieve_spelling, s.as_artist_key, a.ar_artist_name
    FROM public.artiesten_spelling s
    JOIN public.artist a ON a.ar_artist_key = s.as_artist_key
    `
  );

  let newNameOwnSpelling = null;
  let newNameOtherSpelling = null;
  let currentNameOwnSpelling = null;
  for (const row of spellingsRes.rows) {
    const normalized = normalizeArtistName(row.as_alternatieve_spelling);
    if (normalized === normalizedNewCanonical) {
      if (Number(row.as_artist_key) === id) newNameOwnSpelling = row;
      else if (!newNameOtherSpelling) newNameOtherSpelling = row;
    }
    if (normalized === normalizedCurrentCanonical && Number(row.as_artist_key) === id) {
      currentNameOwnSpelling = row;
    }
  }

  if (newNameOtherSpelling) {
    blocks.push({
      code: "SPELLING_CONFLICT_OTHER_ARTIST",
      message: `De voorgestelde canonical naam bestaat al als spelling bij artist_key ${newNameOtherSpelling.as_artist_key} (${newNameOtherSpelling.ar_artist_name}).`,
      conflictingArtistKey: newNameOtherSpelling.as_artist_key,
      conflictingArtistName: newNameOtherSpelling.ar_artist_name,
    });
  }

  if (!currentNameOwnSpelling) {
    warnings.push({
      code: "CURRENT_CANONICAL_NOT_IN_SPELLINGS",
      message: "De huidige canonical naam staat nog niet als alternatieve spelling geregistreerd; de toekomstige rename-flow moet deze eerst borgen.",
    });
  }

  const canExecuteLater = blocks.length === 0;
  return {
    preview_only: true,
    no_mutations: true,
    artist: {
      ar_artist_key: artist.ar_artist_key,
      ar_artist_name: artist.ar_artist_name,
    },
    current_canonical_name: artist.ar_artist_name,
    proposed_canonical_name: newCanonicalName,
    normalized_proposed_canonical_name: normalizedNewCanonical,
    can_execute_later: canExecuteLater,
    blocked: !canExecuteLater,
    blocks,
    warnings,
    spelling_plan: {
      preserve_old_canonical_as_spelling: true,
      old_canonical_spelling_exists: Boolean(currentNameOwnSpelling),
      ensure_new_canonical_in_spelling: true,
      new_canonical_spelling_exists_for_artist: Boolean(newNameOwnSpelling),
      new_canonical_conflicts_with_other_artist: Boolean(newNameOtherSpelling),
    },
    transaction_plan: [
      "lock artist record FOR UPDATE",
      "revalidate artist.ar_artist_name uniqueness/conflicts",
      "revalidate artiesten_spelling.as_alternatieve_spelling conflicts",
      "preserve old canonical name as alternative spelling if needed",
      "update artist.ar_artist_name to proposed canonical name",
      "ensure proposed canonical name exists in artiesten_spelling for the artist",
      "write admin audit/history entry",
      "commit or rollback as one transaction",
    ],
    note: "ART-012D-3A is alleen een preview. Er worden geen wijzigingen in artist of artiesten_spelling uitgevoerd.",
  };
}

async function addDiscogsAlternativeSpelling({ artistKey, proposedName, performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const spelling = String(proposedName || "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }
  if (!spelling) {
    throw Object.assign(new Error("Geen spellingvoorstel opgegeven."), { statusCode: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const artistRes = await client.query(
      `
      SELECT ar_artist_key, ar_artist_name
      FROM public.artist
      WHERE ar_artist_key = $1::integer
      FOR UPDATE
      `,
      [id]
    );
    const artist = artistRes.rows[0];
    if (!artist) {
      await client.query("ROLLBACK");
      return null;
    }

    const normalizedSpelling = normalizeArtistName(spelling);
    const normalizedCanonical = normalizeArtistName(artist.ar_artist_name);
    if (!normalizedSpelling) {
      throw Object.assign(new Error("Ongeldige spelling."), { statusCode: 400 });
    }
    if (normalizedSpelling === normalizedCanonical) {
      throw Object.assign(new Error("Discogs-naam is al de lokale canonical artist name."), {
        statusCode: 409,
        code: "ALREADY_CANONICAL",
      });
    }

    const allSpellingsRes = await client.query(
      `
      SELECT s.as_alternatieve_spelling, s.as_artist_key, a.ar_artist_name
      FROM public.artiesten_spelling s
      JOIN public.artist a ON a.ar_artist_key = s.as_artist_key
      `
    );

    for (const row of allSpellingsRes.rows) {
      if (normalizeArtistName(row.as_alternatieve_spelling) !== normalizedSpelling) continue;
      if (Number(row.as_artist_key) === id) {
        throw Object.assign(new Error("Deze naam bestaat al als alternatieve spelling voor deze artiest."), {
          statusCode: 409,
          code: "ALREADY_ALTERNATIVE_SPELLING",
        });
      }
      throw Object.assign(new Error(`Deze spelling is al gekoppeld aan artist_key ${row.as_artist_key} (${row.ar_artist_name}).`), {
        statusCode: 409,
        code: "SPELLING_CONFLICT_OTHER_ARTIST",
        conflictingArtistKey: row.as_artist_key,
        conflictingArtistName: row.ar_artist_name,
      });
    }

    const insertedRes = await client.query(
      `
      INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
      VALUES ($1::public.citext, $2::integer)
      RETURNING as_alternatieve_spelling, as_artist_key
      `,
      [spelling, id]
    );
    const inserted = insertedRes.rows[0];

    await client.query("SAVEPOINT artist_discogs_spelling_optional_audit");
    try {
      await client.query(
        `
        INSERT INTO public.admin_audit_log (entity_type, entity_id, action, payload, performed_by, performed_at)
        VALUES ('artist', $1::text, 'discogs_artist_spelling_added', $2::jsonb, $3::text, now())
        `,
        [String(id), JSON.stringify({ artistKey: id, artistName: artist.ar_artist_name, spelling, source: "discogs" }), performedBy]
      );
      await client.query("RELEASE SAVEPOINT artist_discogs_spelling_optional_audit");
    } catch (err) {
      await client.query("ROLLBACK TO SAVEPOINT artist_discogs_spelling_optional_audit");
      await client.query("RELEASE SAVEPOINT artist_discogs_spelling_optional_audit");
      if (err.code !== "42P01" && err.code !== "42703") throw err;
    }

    await client.query("COMMIT");
    return {
      added: true,
      artist,
      spelling: inserted,
      note: "Discogs-naam is toegevoegd als alternatieve spelling. De lokale canonical artist name is niet gewijzigd.",
    };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    if (err.code === "23505") {
      throw Object.assign(new Error("Deze alternatieve spelling bestaat al."), { statusCode: 409, code: "SPELLING_UNIQUE_CONFLICT" });
    }
    throw err;
  } finally {
    client.release();
  }
}


async function executeDiscogsCanonicalRename({ artistKey, proposedName, performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const newCanonicalName = String(proposedName || "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }
  if (!newCanonicalName) {
    throw Object.assign(new Error("Geen canonical naamvoorstel opgegeven."), { statusCode: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const artistRes = await client.query(
      `
      SELECT ar_artist_key, ar_artist_name
      FROM public.artist
      WHERE ar_artist_key = $1::integer
      FOR UPDATE
      `,
      [id]
    );
    const artist = artistRes.rows[0];
    if (!artist) {
      await client.query("ROLLBACK");
      return null;
    }

    const oldCanonicalName = String(artist.ar_artist_name || "").trim();
    const normalizedNewCanonical = normalizeArtistName(newCanonicalName);
    const normalizedOldCanonical = normalizeArtistName(oldCanonicalName);

    if (!normalizedNewCanonical) {
      throw Object.assign(new Error("Ongeldige canonical naam."), { statusCode: 400 });
    }
    if (normalizedNewCanonical === normalizedOldCanonical) {
      throw Object.assign(new Error("Discogs-naam is al de lokale canonical artist name."), {
        statusCode: 409,
        code: "ALREADY_CANONICAL",
      });
    }

    const artistNameConflictRes = await client.query(
      `
      SELECT ar_artist_key, ar_artist_name
      FROM public.artist
      WHERE lower(trim(ar_artist_name::text)) = lower(trim($1::text))
        AND ar_artist_key <> $2::integer
      LIMIT 1
      `,
      [newCanonicalName, id]
    );
    if (artistNameConflictRes.rows[0]) {
      throw Object.assign(new Error(`Er bestaat al een andere artist met deze canonical naam: artist_key ${artistNameConflictRes.rows[0].ar_artist_key} (${artistNameConflictRes.rows[0].ar_artist_name}).`), {
        statusCode: 409,
        code: "CANONICAL_NAME_CONFLICT",
        conflictingArtistKey: artistNameConflictRes.rows[0].ar_artist_key,
        conflictingArtistName: artistNameConflictRes.rows[0].ar_artist_name,
      });
    }

    const spellingsRes = await client.query(
      `
      SELECT s.as_alternatieve_spelling, s.as_artist_key, a.ar_artist_name
      FROM public.artiesten_spelling s
      JOIN public.artist a ON a.ar_artist_key = s.as_artist_key
      `
    );

    let oldCanonicalOwnSpelling = null;
    let oldCanonicalOtherSpelling = null;
    let newCanonicalOwnSpelling = null;
    let newCanonicalOtherSpelling = null;

    for (const row of spellingsRes.rows) {
      const normalized = normalizeArtistName(row.as_alternatieve_spelling);
      const ownerId = Number(row.as_artist_key);
      if (normalized === normalizedOldCanonical) {
        if (ownerId === id) oldCanonicalOwnSpelling = row;
        else if (!oldCanonicalOtherSpelling) oldCanonicalOtherSpelling = row;
      }
      if (normalized === normalizedNewCanonical) {
        if (ownerId === id) newCanonicalOwnSpelling = row;
        else if (!newCanonicalOtherSpelling) newCanonicalOtherSpelling = row;
      }
    }

    if (oldCanonicalOtherSpelling && !oldCanonicalOwnSpelling) {
      throw Object.assign(new Error(`De oude canonical naam bestaat als spelling bij een andere artist: artist_key ${oldCanonicalOtherSpelling.as_artist_key} (${oldCanonicalOtherSpelling.ar_artist_name}).`), {
        statusCode: 409,
        code: "OLD_CANONICAL_SPELLING_CONFLICT_OTHER_ARTIST",
        conflictingArtistKey: oldCanonicalOtherSpelling.as_artist_key,
        conflictingArtistName: oldCanonicalOtherSpelling.ar_artist_name,
      });
    }

    if (newCanonicalOtherSpelling) {
      throw Object.assign(new Error(`De voorgestelde canonical naam bestaat al als spelling bij artist_key ${newCanonicalOtherSpelling.as_artist_key} (${newCanonicalOtherSpelling.ar_artist_name}).`), {
        statusCode: 409,
        code: "SPELLING_CONFLICT_OTHER_ARTIST",
        conflictingArtistKey: newCanonicalOtherSpelling.as_artist_key,
        conflictingArtistName: newCanonicalOtherSpelling.ar_artist_name,
      });
    }

    let oldCanonicalSpellingInserted = false;
    if (!oldCanonicalOwnSpelling && oldCanonicalName) {
      await client.query(
        `
        INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
        VALUES ($1::public.citext, $2::integer)
        `,
        [oldCanonicalName, id]
      );
      oldCanonicalSpellingInserted = true;
    }

    let newCanonicalSpellingInserted = false;
    if (!newCanonicalOwnSpelling) {
      await client.query(
        `
        INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
        VALUES ($1::public.citext, $2::integer)
        `,
        [newCanonicalName, id]
      );
      newCanonicalSpellingInserted = true;
    }

    const updateRes = await client.query(
      `
      UPDATE public.artist
      SET ar_artist_name = $2::public.citext,
          ar_updated_at = now()
      WHERE ar_artist_key = $1::integer
      RETURNING ar_artist_key, ar_artist_name
      `,
      [id, newCanonicalName]
    );
    const updatedArtist = updateRes.rows[0];

    await client.query("SAVEPOINT artist_discogs_canonical_rename_optional_audit");
    try {
      await client.query(
        `
        INSERT INTO public.admin_audit_log (entity_type, entity_id, action, payload, performed_by, performed_at)
        VALUES ('artist', $1::text, 'discogs_canonical_rename', $2::jsonb, $3::text, now())
        `,
        [String(id), JSON.stringify({
          artistKey: id,
          oldCanonicalName,
          newCanonicalName,
          oldCanonicalSpellingInserted,
          newCanonicalSpellingInserted,
          source: "discogs",
        }), performedBy]
      );
      await client.query("RELEASE SAVEPOINT artist_discogs_canonical_rename_optional_audit");
    } catch (err) {
      await client.query("ROLLBACK TO SAVEPOINT artist_discogs_canonical_rename_optional_audit");
      await client.query("RELEASE SAVEPOINT artist_discogs_canonical_rename_optional_audit");
      // Older/local schemas may not have admin_audit_log yet; canonical rename must remain usable.
      if (err.code !== "42P01" && err.code !== "42703") throw err;
    }

    await client.query("COMMIT");
    return {
      renamed: true,
      artist: updatedArtist,
      old_canonical_name: oldCanonicalName,
      new_canonical_name: newCanonicalName,
      old_canonical_spelling_inserted: oldCanonicalSpellingInserted,
      new_canonical_spelling_inserted: newCanonicalSpellingInserted,
      note: "Canonical artist name is spelling-aware aangepast. De oude canonical naam is behouden als alternatieve spelling en de nieuwe canonical naam is geborgd in artiesten_spelling.",
    };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    if (err.code === "23505") {
      throw Object.assign(new Error("Canonical rename veroorzaakt een unieke constraint-conflict op artist of artiesten_spelling."), {
        statusCode: 409,
        code: "UNIQUE_CONFLICT",
      });
    }
    throw err;
  } finally {
    client.release();
  }
}

function normalizeOptionalIsoDate(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  return null;
}

async function linkDiscogsArtist({ artistKey, discogsDetail, performedBy = "artist-app", cacheTtlSeconds = 21600 } = {}) {
  const id = Number(artistKey);
  const discogsArtistId = Number(discogsDetail?.discogs_artist_id ?? discogsDetail?.discogs_id);
  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }
  if (!Number.isFinite(discogsArtistId) || discogsArtistId <= 0) {
    throw Object.assign(new Error("Invalid Discogs artist id"), { statusCode: 400 });
  }

  const source = "discogs";
  const externalId = String(discogsArtistId);
  const externalUrl = discogsDetail.discogs_url || `https://www.discogs.com/artist/${externalId}`;
  const externalName = discogsDetail.discogs_name || "";
  const birthDate = normalizeOptionalIsoDate(discogsDetail.birth_date || discogsDetail.date_of_birth || discogsDetail.born);
  const deathDate = normalizeOptionalIsoDate(discogsDetail.death_date || discogsDetail.date_of_death || discogsDetail.died || discogsDetail.passing_date);
  const ttlSeconds = Math.max(0, Number(cacheTtlSeconds) || 21600);
  const rawData = discogsDetail.raw || discogsDetail;
  const normalizedData = {
    discogs_artist_id: discogsArtistId,
    discogs_name: externalName,
    discogs_url: externalUrl,
    real_name: discogsDetail.real_name || "",
    profile: discogsDetail.profile || "",
    birth_date: birthDate,
    death_date: deathDate,
    aliases: discogsDetail.aliases || [],
    namevariations: discogsDetail.namevariations || [],
    groups: discogsDetail.groups || [],
    members: discogsDetail.members || [],
    images: discogsDetail.images || [],
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const artistRes = await client.query(
      `SELECT ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing FROM public.artist WHERE ar_artist_key = $1::integer FOR UPDATE`,
      [id]
    );
    if (!artistRes.rows[0]) {
      throw Object.assign(new Error("Artist not found"), { statusCode: 404 });
    }

    const artistBefore = artistRes.rows[0];
    const dateUpdateRes = await client.query(
      `
      UPDATE public.artist
      SET ar_artist_dateofbirth = CASE
            WHEN ar_artist_dateofbirth IS NULL AND $2::date IS NOT NULL THEN $2::date
            ELSE ar_artist_dateofbirth
          END,
          ar_artist_passing = CASE
            WHEN ar_artist_passing IS NULL AND $3::date IS NOT NULL THEN $3::date
            ELSE ar_artist_passing
          END
      WHERE ar_artist_key = $1::integer
      RETURNING ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing
      `,
      [id, birthDate, deathDate]
    );
    const artistAfter = dateUpdateRes.rows[0] || artistBefore;
    const appliedArtistFields = {
      ar_artist_dateofbirth: !artistBefore.ar_artist_dateofbirth && Boolean(birthDate) && Boolean(artistAfter.ar_artist_dateofbirth),
      ar_artist_passing: !artistBefore.ar_artist_passing && Boolean(deathDate) && Boolean(artistAfter.ar_artist_passing),
    };

    await client.query(
      `
      UPDATE public.artist_external_reference
      SET status = 'stale', updated_at = now()
      WHERE artist_key = $1::integer
        AND lower(source) = $2::text
        AND status = 'linked'
        AND external_id <> $3::text
      `,
      [id, source, externalId]
    );

    const referenceRes = await client.query(
      `
      INSERT INTO public.artist_external_reference (
        artist_key, source, external_id, external_url, external_name, confidence_score, status, synced_at, raw_data_json
      )
      VALUES ($1::integer, $2::text, $3::text, $4::text, $5::text, $6::numeric, 'linked', now(), $7::jsonb)
      ON CONFLICT (artist_key, lower(source), external_id)
      DO UPDATE SET
        external_url = EXCLUDED.external_url,
        external_name = EXCLUDED.external_name,
        confidence_score = EXCLUDED.confidence_score,
        status = 'linked',
        synced_at = now(),
        updated_at = now(),
        raw_data_json = EXCLUDED.raw_data_json
      RETURNING *
      `,
      [id, source, externalId, externalUrl, externalName, 100, JSON.stringify(rawData || {})]
    );
    const reference = referenceRes.rows[0];

    await client.query(
      `DELETE FROM public.artist_enrichment_cache WHERE artist_key = $1::integer AND lower(source) = $2::text AND external_id = $3::text`,
      [id, source, externalId]
    );
    const cacheRes = await client.query(
      `
      INSERT INTO public.artist_enrichment_cache (
        artist_key, source, external_id, raw_data_json, normalized_data_json, cache_status, fetched_at, expires_at
      )
      VALUES (
        $1::integer, $2::text, $3::text, $4::jsonb, $5::jsonb, 'fetched', now(),
        CASE WHEN $6::integer > 0 THEN now() + make_interval(secs => $6::integer) ELSE NULL END
      )
      RETURNING cache_id, artist_key, source, external_id, cache_status, fetched_at, expires_at
      `,
      [id, source, externalId, JSON.stringify(rawData || {}), JSON.stringify(normalizedData), ttlSeconds]
    );

    await client.query(
      `DELETE FROM public.artist_external_image WHERE artist_key = $1::integer AND lower(source) = $2::text AND external_reference_id = $3::bigint`,
      [id, source, reference.reference_id]
    );

    let imageCount = 0;
    for (const image of discogsDetail.images || []) {
      const externalImageUrl = image.uri || image.uri150;
      if (!externalImageUrl) continue;
      await client.query(
        `
        INSERT INTO public.artist_external_image (
          artist_key, source, external_reference_id, external_image_url, external_resource_url,
          image_type, width, height, is_primary, cache_status, local_cache_path, raw_data_json
        )
        VALUES (
          $1::integer, $2::text, $3::bigint, $4::text, $5::text,
          $6::text, $7::integer, $8::integer, $9::boolean, 'remote_only', NULL, $10::jsonb
        )
        `,
        [
          id,
          source,
          reference.reference_id,
          externalImageUrl,
          image.resource_url || image.uri150 || null,
          image.type || null,
          image.width ?? null,
          image.height ?? null,
          false,
          JSON.stringify(image.raw || image),
        ]
      );
      imageCount += 1;
    }

    await client.query("SAVEPOINT artist_discogs_link_optional_audit");
    try {
      await client.query(
        `
        INSERT INTO public.admin_audit_log (entity_type, entity_id, action, payload, performed_by, performed_at)
        VALUES ('artist', $1::text, 'discogs_artist_linked', $2::jsonb, $3::text, now())
        `,
        [String(id), JSON.stringify({ artistKey: id, source, externalId, externalName, referenceId: reference.reference_id, imageCount, appliedArtistFields }), performedBy]
      );
      await client.query("RELEASE SAVEPOINT artist_discogs_link_optional_audit");
    } catch (err) {
      await client.query("ROLLBACK TO SAVEPOINT artist_discogs_link_optional_audit");
      await client.query("RELEASE SAVEPOINT artist_discogs_link_optional_audit");
      // Older/local schemas may not have admin_audit_log yet; linking must remain usable.
      if (err.code !== "42P01" && err.code !== "42703") throw err;
    }

    await client.query("COMMIT");
    return {
      linked: true,
      artist: artistAfter,
      appliedArtistFields,
      reference,
      cache: cacheRes.rows[0],
      imageCount,
    };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

async function listDiscogsImages(artistKey) {
  const id = Number(artistKey);
  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error("Invalid artist key"), { statusCode: 400 });
  }

  const artist = await getById(id);
  if (!artist) return null;

  const imagesRes = await pool.query(
    `
    SELECT
      image_id,
      artist_key,
      source,
      external_reference_id,
      external_image_url,
      external_resource_url,
      image_type,
      width,
      height,
      is_primary,
      cache_status,
      local_cache_path,
      cached_at,
      cache_error,
      created_at,
      updated_at
    FROM public.artist_external_image
    WHERE artist_key = $1::integer
      AND lower(source) = 'discogs'
    ORDER BY is_primary DESC, CASE WHEN lower(coalesce(image_type, '')) = 'primary' THEN 0 ELSE 1 END, image_id ASC
    LIMIT 50
    `,
    [id]
  );

  return {
    artist,
    images: imagesRes.rows,
    primaryImage: imagesRes.rows.find((row) => row.is_primary) || null,
  };
}

async function setPrimaryDiscogsImage({ artistKey, imageId, performedBy = "artist-app" } = {}) {
  const id = Number(artistKey);
  const imgId = Number(imageId);
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(imgId) || imgId <= 0) {
    throw Object.assign(new Error("Invalid artist key or image id"), { statusCode: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const imageRes = await client.query(
      `
      SELECT image_id, artist_key, source, external_image_url, external_resource_url, image_type
      FROM public.artist_external_image
      WHERE image_id = $1::bigint
        AND artist_key = $2::integer
        AND lower(source) = 'discogs'
      FOR UPDATE
      `,
      [imgId, id]
    );
    const image = imageRes.rows[0];
    if (!image) {
      throw Object.assign(new Error("Discogs image not found for this artist"), { statusCode: 404 });
    }

    await client.query(
      `
      UPDATE public.artist_external_image
      SET is_primary = false,
          updated_at = now()
      WHERE artist_key = $1::integer
        AND lower(source) = 'discogs'
        AND is_primary = true
      `,
      [id]
    );

    const primaryRes = await client.query(
      `
      UPDATE public.artist_external_image
      SET is_primary = true,
          updated_at = now()
      WHERE image_id = $1::bigint
        AND artist_key = $2::integer
        AND lower(source) = 'discogs'
      RETURNING
        image_id,
        artist_key,
        source,
        external_reference_id,
        external_image_url,
        external_resource_url,
        image_type,
        width,
        height,
        is_primary,
        cache_status,
        local_cache_path,
        cached_at,
        cache_error,
        created_at,
        updated_at
      `,
      [imgId, id]
    );

    await client.query("SAVEPOINT artist_discogs_primary_image_optional_audit");
    try {
      await client.query(
        `
        INSERT INTO public.admin_audit_log (entity_type, entity_id, action, payload, performed_by, performed_at)
        VALUES ('artist', $1::text, 'discogs_primary_image_selected', $2::jsonb, $3::text, now())
        `,
        [String(id), JSON.stringify({ artistKey: id, imageId: imgId, imageUrl: image.external_image_url }), performedBy]
      );
      await client.query("RELEASE SAVEPOINT artist_discogs_primary_image_optional_audit");
    } catch (err) {
      await client.query("ROLLBACK TO SAVEPOINT artist_discogs_primary_image_optional_audit");
      await client.query("RELEASE SAVEPOINT artist_discogs_primary_image_optional_audit");
      if (err.code !== "42P01" && err.code !== "42703") throw err;
    }

    await client.query("COMMIT");

    const refreshed = await listDiscogsImages(id);
    return {
      selected: primaryRes.rows[0],
      images: refreshed?.images || [],
      primaryImage: refreshed?.primaryImage || primaryRes.rows[0],
    };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
    throw err;
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
  listDuplicateReviewCandidates,
  updateDuplicateCandidateStatus,
  linkDiscogsArtist,
  listDiscogsImages,
  setPrimaryDiscogsImage,
  listDiscogsEnrichmentProposals,
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
  softDelete,
  restore,
  hardDelete,
  normalizeSort,
  normalizeArtistName,
  fuzzyScore,
};
