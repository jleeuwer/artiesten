const { pool } = require("../config/db");
const SELECT_FIELDS = `
  mb.mb_musician_band_key AS relation_key,
  mb.mb_musician_key AS musician_key,
  mb.mb_artist_key AS band_artist_key,
  m.mu_musician_name AS musician_name,
  m.ar_artist_key AS musician_artist_key,
  a.ar_artist_name AS band_name,
  mb.mb_role AS role,
  mb.mb_date_from AS date_from,
  mb.mb_date_to AS date_to,
  mb.mb_date_from_precision AS date_from_precision,
  mb.mb_date_to_precision AS date_to_precision,
  mb.mb_source_type AS source_type,
  mb.mb_source_reference AS source_reference,
  mb.mb_source_url AS source_url,
  mb.mb_notes AS notes,
  mb.mb_created_at AS created_at,
  mb.mb_updated_at AS updated_at,
  CASE WHEN mb.mb_date_to IS NULL THEN 'current'
       WHEN mb.mb_date_to < CURRENT_DATE THEN 'former'
       ELSE 'current' END AS membership_status`;
const JOINS = ` FROM public.musician_in_band mb
  JOIN public.musician m ON m.mu_musician_key=mb.mb_musician_key
  JOIN public.artist a ON a.ar_artist_key=mb.mb_artist_key`;

async function listForBand(artistKey) { return (await pool.query(`SELECT ${SELECT_FIELDS} ${JOINS} WHERE mb.mb_artist_key=$1 ORDER BY mb.mb_date_to NULLS FIRST, m.mu_musician_name, mb.mb_date_from`, [artistKey])).rows; }
async function listForPersonArtist(artistKey) { return (await pool.query(`SELECT ${SELECT_FIELDS} ${JOINS} WHERE m.ar_artist_key=$1 ORDER BY mb.mb_date_to NULLS FIRST, a.ar_artist_name, mb.mb_date_from`, [artistKey])).rows; }
async function getById(id, client=pool) { return (await client.query(`SELECT ${SELECT_FIELDS} ${JOINS} WHERE mb.mb_musician_band_key=$1`, [id])).rows[0] || null; }
async function searchMusicians(q, limit=25) {
 const term=String(q||'').trim();
 return (await pool.query(`
   WITH musician_matches AS (
     SELECT m.mu_musician_key AS musician_key, m.mu_musician_name AS musician_name,
       a.ar_artist_key AS artist_key, a.ar_artist_name AS linked_artist_name,
       COALESCE(a.ar_artist_type,'') AS artist_type,
       CASE WHEN a.ar_artist_key IS NULL THEN 'standalone_musician' ELSE 'linked_musician' END AS result_type,
       true AS can_select, NULL::text AS required_action
     FROM public.musician m
     LEFT JOIN public.artist a ON a.ar_artist_key=m.ar_artist_key
     WHERE ($1='' OR m.mu_musician_name ILIKE '%'||$1||'%' OR COALESCE(a.ar_artist_name,'') ILIKE '%'||$1||'%')
   ), artist_only AS (
     SELECT NULL::bigint AS musician_key, a.ar_artist_name AS musician_name,
       a.ar_artist_key AS artist_key, a.ar_artist_name AS linked_artist_name,
       COALESCE(a.ar_artist_type,'unknown') AS artist_type,
       CASE WHEN COALESCE(a.ar_artist_type,'unknown')='person' THEN 'artist_without_musician' ELSE 'artist_wrong_type' END AS result_type,
       false AS can_select,
       CASE WHEN COALESCE(a.ar_artist_type,'unknown')='person' THEN 'create_and_link_musician' ELSE 'correct_artist_type' END AS required_action
     FROM public.artist a
     WHERE ($1='' OR a.ar_artist_name ILIKE '%'||$1||'%')
       AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
   )
   SELECT * FROM (SELECT * FROM musician_matches UNION ALL SELECT * FROM artist_only) x
   ORDER BY lower(musician_name), result_type
   LIMIT $2`, [term,limit])).rows;
}
async function assertReferences(data, client) {
 const result=await client.query(`SELECT EXISTS(SELECT 1 FROM public.musician WHERE mu_musician_key=$1) musician_exists, EXISTS(SELECT 1 FROM public.artist WHERE ar_artist_key=$2 AND COALESCE(ar_artist_type,'unknown') IN ('band','group','duo','trio')) band_exists`, [data.musicianKey,data.bandArtistKey]);
 return result.rows[0];
}
async function findDuplicateOrOverlap(data, excludeId=null, client=pool) {
 const params=[data.musicianKey,data.bandArtistKey,data.dateFrom,data.dateTo,data.role];
 let exclude=''; if(excludeId){params.push(excludeId); exclude=` AND mb_musician_band_key<>$${params.length}`;}
 const rows=(await client.query(`SELECT mb_musician_band_key relation_key, mb_date_from date_from, mb_date_to date_to, mb_role role,
   (COALESCE(mb_date_from,DATE '-infinity')=COALESCE($3::date,DATE '-infinity') AND COALESCE(mb_date_to,DATE 'infinity')=COALESCE($4::date,DATE 'infinity') AND COALESCE(lower(mb_role),'')=COALESCE(lower($5),'')) exact_duplicate
 FROM public.musician_in_band WHERE mb_musician_key=$1 AND mb_artist_key=$2 ${exclude}
 AND daterange(COALESCE(mb_date_from,DATE '-infinity'), COALESCE(mb_date_to,DATE 'infinity'),'[]') && daterange(COALESCE($3::date,DATE '-infinity'),COALESCE($4::date,DATE 'infinity'),'[]')`,params)).rows;
 return { duplicate: rows.find(r=>r.exact_duplicate)||null, overlaps: rows.filter(r=>!r.exact_duplicate) };
}
async function create(data) { const client=await pool.connect(); try { await client.query('BEGIN'); const refs=await assertReferences(data,client); if(!refs.musician_exists){let e=new Error('Musician niet gevonden.');e.code='MUSICIAN_NOT_FOUND';e.statusCode=404;throw e;} if(!refs.band_exists){let e=new Error('Bandartist niet gevonden of ongeldig type.');e.code='BAND_ARTIST_NOT_FOUND';e.statusCode=404;throw e;} const conflicts=await findDuplicateOrOverlap(data,null,client); if(conflicts.duplicate){let e=new Error('Deze bandlidmaatschapsrelatie bestaat al.');e.code='MUSICIAN_IN_BAND_DUPLICATE';e.statusCode=409;throw e;} if(conflicts.overlaps.length && !data.acknowledgeOverlap){let e=new Error('De periode overlapt met een bestaande relatie.');e.code='MUSICIAN_IN_BAND_OVERLAP';e.statusCode=409;e.details={overlaps:conflicts.overlaps};throw e;} const result=await client.query(`INSERT INTO public.musician_in_band (mb_musician_key,mb_artist_key,mb_role,mb_date_from,mb_date_to,mb_date_from_precision,mb_date_to_precision,mb_source_type,mb_source_reference,mb_source_url,mb_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING mb_musician_band_key`,[data.musicianKey,data.bandArtistKey,data.role,data.dateFrom,data.dateTo,data.dateFromPrecision,data.dateToPrecision,data.sourceType,data.sourceReference,data.sourceUrl,data.notes]); await client.query('COMMIT'); return getById(result.rows[0].mb_musician_band_key); } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();} }
async function update(id,data){ const client=await pool.connect(); try{await client.query('BEGIN');const current=await getById(id,client);if(!current){let e=new Error('Relatie niet gevonden.');e.code='MUSICIAN_IN_BAND_NOT_FOUND';e.statusCode=404;throw e;}if(data.expectedUpdatedAt && new Date(data.expectedUpdatedAt).getTime()!==new Date(current.updated_at).getTime()){let e=new Error('De relatie is intussen gewijzigd. Laad opnieuw.');e.code='STALE_MUSICIAN_IN_BAND';e.statusCode=409;throw e;}data.musicianKey=current.musician_key;data.bandArtistKey=current.band_artist_key;const conflicts=await findDuplicateOrOverlap(data,id,client);if(conflicts.duplicate){let e=new Error('Deze bandlidmaatschapsrelatie bestaat al.');e.code='MUSICIAN_IN_BAND_DUPLICATE';e.statusCode=409;throw e;}if(conflicts.overlaps.length&&!data.acknowledgeOverlap){let e=new Error('De periode overlapt met een bestaande relatie.');e.code='MUSICIAN_IN_BAND_OVERLAP';e.statusCode=409;e.details={overlaps:conflicts.overlaps};throw e;}await client.query(`UPDATE public.musician_in_band SET mb_role=$2,mb_date_from=$3,mb_date_to=$4,mb_date_from_precision=$5,mb_date_to_precision=$6,mb_source_type=$7,mb_source_reference=$8,mb_source_url=$9,mb_notes=$10,mb_updated_at=now() WHERE mb_musician_band_key=$1`,[id,data.role,data.dateFrom,data.dateTo,data.dateFromPrecision,data.dateToPrecision,data.sourceType,data.sourceReference,data.sourceUrl,data.notes]);await client.query('COMMIT');return getById(id);}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
async function remove(id,expectedUpdatedAt){const client=await pool.connect();try{await client.query('BEGIN');const current=await getById(id,client);if(!current){let e=new Error('Relatie niet gevonden.');e.code='MUSICIAN_IN_BAND_NOT_FOUND';e.statusCode=404;throw e;}if(expectedUpdatedAt&&new Date(expectedUpdatedAt).getTime()!==new Date(current.updated_at).getTime()){let e=new Error('De relatie is intussen gewijzigd. Laad opnieuw.');e.code='STALE_MUSICIAN_IN_BAND';e.statusCode=409;throw e;}await client.query('DELETE FROM public.musician_in_band WHERE mb_musician_band_key=$1',[id]);await client.query('COMMIT');return current;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
module.exports={listForBand,listForPersonArtist,getById,searchMusicians,create,update,remove,findDuplicateOrOverlap,assertReferences};
