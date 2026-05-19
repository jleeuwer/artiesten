const { pool } = require("../config/db");

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

function buildWhere({ search, includeDeleted, onlyDeleted, favoriteOnly }, params) {
  const clauses = [];

  const s = (search || "").trim();
  if (s) {
    params.push(`%${s}%`);
    clauses.push(`a.ar_artist_name ILIKE $${params.length}`);
  }

  if (onlyDeleted) {
    clauses.push(`a.ar_is_deleted = true`);
  } else if (!includeDeleted) {
    clauses.push(`a.ar_is_deleted = false`);
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
      COALESCE(fd_stats.artist_weight, 0)::int AS artist_weight,
      COALESCE(fd_stats.version_count, 0)::int AS version_count,
      COALESCE(fd_stats.hitlijst_count, 0)::int AS hitlijst_count,
      COALESCE(spelling_stats.spelling_count, 0)::int AS spelling_count
    FROM public.artist a
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
}) {
  const params = [];
  const where = buildWhere({ search, includeDeleted, onlyDeleted, favoriteOnly }, params);
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
  const countWhere = buildWhere({ search, includeDeleted, onlyDeleted, favoriteOnly }, countParams);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.artist a
    ${countWhere}
  `;

  const [rowsRes, countRes] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, countParams)
  ]);

  return { items: rowsRes.rows, total: countRes.rows[0]?.total ?? 0, limit, offset, sort: normalizeSort(sort), favoriteOnly };
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

  const [fileDetailsRes, spellingsRes, hitlijstenRes] = await Promise.all([
    pool.query(fileDetailsSql, [id]),
    pool.query(spellingsSql, [id]),
    pool.query(hitlijstenSql, [id]),
  ]);

  return {
    artist,
    fileDetails: fileDetailsRes.rows,
    spellings: spellingsRes.rows,
    hitlijsten: hitlijstenRes.rows,
    albums: {
      status: "future",
      message: "Albums worden in ART-014 functioneel uitgewerkt en zijn bewust nog niet geïmplementeerd in Sprint 6.",
    },
  };
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
  softDelete,
  restore,
  hardDelete,
  normalizeSort,
};
