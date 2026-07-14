const { pool } = require('../config/db');

const FIELDS = `
  m.mu_musician_key AS musician_key,
  m.ar_artist_key AS artist_key,
  m.mu_musician_name AS musician_name,
  m.mu_musician_dateofbirth::text AS date_of_birth,
  m.mu_musician_passing::text AS passing_date,
  m.mu_website_url AS website_url,
  m.mu_musician_notes AS notes`;

async function getById(key, client = pool) {
  const r = await client.query(`SELECT ${FIELDS} FROM public.musician m WHERE m.mu_musician_key=$1`, [key]);
  return r.rows[0] || null;
}

async function search(query = '', limit = 25, client = pool) {
  const q = String(query || '').trim();
  const r = await client.query(`
    SELECT ${FIELDS}, a.ar_artist_name AS linked_artist_name,
      (SELECT count(*)::int FROM public.musician_in_band mb WHERE mb.mb_musician_key=m.mu_musician_key) AS band_count
    FROM public.musician m
    LEFT JOIN public.artist a ON a.ar_artist_key=m.ar_artist_key
    WHERE ($1='' OR m.mu_musician_name ILIKE '%' || $1 || '%')
    ORDER BY m.mu_musician_name
    LIMIT $2`, [q, limit]);
  return r.rows;
}

async function create(data, client = pool) {
  const r = await client.query(`
    INSERT INTO public.musician
      (ar_artist_key, mu_musician_name, mu_musician_dateofbirth, mu_musician_passing, mu_website_url, mu_musician_notes)
    VALUES ($1,$2,$3::date,$4::date,$5,$6)
    RETURNING mu_musician_key`, [data.artistKey || null, data.name, data.dateOfBirth || null, data.passingDate || null, data.websiteUrl || null, data.notes || null]);
  return getById(r.rows[0].mu_musician_key, client);
}

async function update(key, data, client = pool) {
  const r = await client.query(`UPDATE public.musician SET
    mu_musician_name=$2, mu_musician_dateofbirth=$3::date, mu_musician_passing=$4::date,
    mu_website_url=$5, mu_musician_notes=$6
    WHERE mu_musician_key=$1 RETURNING mu_musician_key`,
    [key,data.name,data.dateOfBirth||null,data.passingDate||null,data.websiteUrl||null,data.notes||null]);
  return r.rowCount ? getById(key, client) : null;
}

async function findForArtist(artistKey, client = pool) {
  const r = await client.query(`SELECT ${FIELDS} FROM public.musician m WHERE m.ar_artist_key=$1`, [artistKey]);
  return r.rows[0] || null;
}

async function duplicateCandidates(data, excludeKey = null, client = pool) {
  const r = await client.query(`SELECT ${FIELDS} FROM public.musician m
    WHERE ($2::bigint IS NULL OR m.mu_musician_key<>$2)
      AND lower(trim(m.mu_musician_name))=lower(trim($1))
    ORDER BY m.mu_musician_key LIMIT 20`, [data.name, excludeKey]);
  return r.rows;
}

async function remove(key, client = pool) {
  const refs = await client.query(`SELECT
    EXISTS(SELECT 1 FROM public.musician WHERE mu_musician_key=$1 AND ar_artist_key IS NOT NULL) AS artist_link,
    EXISTS(SELECT 1 FROM public.musician_in_band WHERE mb_musician_key=$1) AS band_link`, [key]);
  if (refs.rows[0].artist_link || refs.rows[0].band_link) {
    const e = new Error('Musician kan niet worden verwijderd zolang artist- of bandrelaties bestaan.');
    e.code='MUSICIAN_IN_USE'; e.statusCode=409; e.details=refs.rows[0]; throw e;
  }
  return (await client.query('DELETE FROM public.musician WHERE mu_musician_key=$1 RETURNING mu_musician_key',[key])).rowCount>0;
}

module.exports={getById,search,create,update,findForArtist,duplicateCandidates,remove};
