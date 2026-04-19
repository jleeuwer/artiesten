const { pool } = require("../config/db");

function buildWhere({ search, includeDeleted, onlyDeleted }, params) {
  const clauses = [];

  const s = (search || "").trim();
  if (s) {
    params.push(`%${s}%`);
    clauses.push(`ar_artist_name ILIKE $${params.length}`);
  }

  if (onlyDeleted) {
    clauses.push(`ar_is_deleted = true`);
  } else if (!includeDeleted) {
    clauses.push(`ar_is_deleted = false`);
  }

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

async function list({ search = "", limit = 50, offset = 0, includeDeleted = false, onlyDeleted = false }) {
  const params = [];
  const where = buildWhere({ search, includeDeleted, onlyDeleted }, params);

  // limit + offset
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const listSql = `
    SELECT
      ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing,
      ar_website_url, ar_artist_notes,
      ar_is_deleted, ar_deleted_at
    FROM public.artist
    ${where}
    ORDER BY ar_artist_name
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  // count query uses same where but without limit/offset params
  const countParams = [];
  const countWhere = buildWhere({ search, includeDeleted, onlyDeleted }, countParams);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.artist
    ${countWhere}
  `;

  const [rowsRes, countRes] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, countParams)
  ]);

  return { items: rowsRes.rows, total: countRes.rows[0]?.total ?? 0, limit, offset };
}

async function getById(id) {
  const r = await pool.query(
    `
    SELECT
      ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing,
      ar_website_url, ar_artist_notes,
      ar_is_deleted, ar_deleted_at
    FROM public.artist
    WHERE ar_artist_key = $1
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
      ar_website_url, ar_artist_notes,
      ar_is_deleted, ar_deleted_at
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
      ar_website_url, ar_artist_notes,
      ar_is_deleted, ar_deleted_at
    `,
    [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes, id]
  );
  return r.rows[0] || null;
}

// SOFT DELETE -> move to trash
async function softDelete(id) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_is_deleted = true,
        ar_deleted_at = now()
    WHERE ar_artist_key = $1 AND ar_is_deleted = false
    RETURNING ar_artist_key, ar_artist_name, ar_is_deleted, ar_deleted_at
    `,
    [id]
  );
  return r.rows[0] || null;
}

// RESTORE from trash
async function restore(id) {
  const r = await pool.query(
    `
    UPDATE public.artist
    SET ar_is_deleted = false,
        ar_deleted_at = NULL
    WHERE ar_artist_key = $1 AND ar_is_deleted = true
    RETURNING ar_artist_key, ar_artist_name, ar_is_deleted, ar_deleted_at
    `,
    [id]
  );
  return r.rows[0] || null;
}

// HARD DELETE (optional, permanent)
async function hardDelete(id) {
  const r = await pool.query(
    `DELETE FROM public.artist WHERE ar_artist_key = $1 RETURNING ar_artist_key`,
    [id]
  );
  return r.rows[0] || null;
}

module.exports = { list, getById, create, update, softDelete, restore, hardDelete };
