const { pool } = require('../config/db');

const SELECT = `SELECT p.proposal_key, p.band_artist_key, a.ar_artist_name AS band_name,
 p.proposed_musician_key, m.mu_musician_name AS matched_musician_name,
 p.proposed_artist_key, ma.ar_artist_name AS matched_artist_name, COALESCE(ma.ar_artist_type,'unknown') AS matched_artist_type,
 p.proposed_relation_key, p.source_type, p.source_band_external_id, p.source_person_external_id,
 p.source_relationship_id, p.proposed_person_name, p.proposed_role, p.proposed_date_from,
 p.proposed_date_to, p.match_status, p.proposal_status, p.confidence_score, p.conflict_reason,
 p.source_url, p.raw_payload, p.created_at, p.updated_at, p.reviewed_at
 FROM public.musician_in_band_proposal p
 JOIN public.artist a ON a.ar_artist_key=p.band_artist_key
 LEFT JOIN public.musician m ON m.mu_musician_key=p.proposed_musician_key
 LEFT JOIN public.artist ma ON ma.ar_artist_key=p.proposed_artist_key`;

async function getBandDiscogsReference(bandArtistKey, client = pool) {
  return (await client.query(`SELECT reference_id, external_id, external_url, external_name
    FROM public.artist_external_reference
    WHERE artist_key=$1 AND lower(source)='discogs' AND status='linked'
    ORDER BY updated_at DESC, reference_id DESC LIMIT 1`, [bandArtistKey])).rows[0] || null;
}

async function list(bandArtistKey, filters = {}) {
  const params = [bandArtistKey];
  const where = ['p.band_artist_key=$1'];
  if (filters.status) { params.push(filters.status); where.push(`p.proposal_status=$${params.length}`); }
  if (filters.matchStatus) { params.push(filters.matchStatus); where.push(`p.match_status=$${params.length}`); }
  if (filters.q) { params.push(`%${String(filters.q).trim()}%`); where.push(`(p.proposed_person_name ILIKE $${params.length} OR COALESCE(m.mu_musician_name,'') ILIKE $${params.length})`); }
  return (await pool.query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY p.updated_at DESC, p.proposed_person_name`, params)).rows;
}

async function counts(bandArtistKey) {
  return (await pool.query(`SELECT proposal_status, count(*)::int AS count FROM public.musician_in_band_proposal WHERE band_artist_key=$1 GROUP BY proposal_status`, [bandArtistKey])).rows;
}

async function getById(id, client = pool, { forUpdate = false } = {}) {
  return (await client.query(`${SELECT} WHERE p.proposal_key=$1 ${forUpdate ? 'FOR UPDATE OF p' : ''}`, [id])).rows[0] || null;
}

async function findMusicianMatches(personName, sourcePersonId, client = pool) {
  return (await client.query(`SELECT DISTINCT m.mu_musician_key AS musician_key, m.mu_musician_name AS musician_name, m.ar_artist_key AS artist_key,
      CASE WHEN aer.external_id=$2 THEN 100 WHEN lower(trim(a.ar_artist_name))=lower(trim($1)) THEN 90 ELSE 80 END AS confidence
    FROM public.musician m
    LEFT JOIN public.artist a ON a.ar_artist_key=m.ar_artist_key
    LEFT JOIN public.artist_external_reference aer ON aer.artist_key=m.ar_artist_key AND lower(aer.source)='discogs' AND aer.status='linked'
    LEFT JOIN public.artiesten_spelling asp ON asp.as_artist_key=a.ar_artist_key
    WHERE lower(trim(m.mu_musician_name))=lower(trim($1))
       OR lower(trim(COALESCE(a.ar_artist_name,'')))=lower(trim($1))
       OR lower(trim(COALESCE(asp.as_alternatieve_spelling,'')))=lower(trim($1))
       OR aer.external_id=$2
    ORDER BY confidence DESC, musician_name`, [personName, sourcePersonId])).rows;
}

async function findArtistMatches(personName, sourcePersonId, client = pool) {
  return (await client.query(`SELECT DISTINCT a.ar_artist_key AS artist_key, a.ar_artist_name AS artist_name,
      COALESCE(a.ar_artist_type,'unknown') AS artist_type,
      m.mu_musician_key AS musician_key,
      CASE WHEN aer.external_id=$2 THEN 100 WHEN lower(trim(a.ar_artist_name))=lower(trim($1)) THEN 90 ELSE 80 END AS confidence
    FROM public.artist a
    LEFT JOIN public.musician m ON m.ar_artist_key=a.ar_artist_key
    LEFT JOIN public.artist_external_reference aer ON aer.artist_key=a.ar_artist_key AND lower(aer.source)='discogs' AND aer.status='linked'
    LEFT JOIN public.artiesten_spelling asp ON asp.as_artist_key=a.ar_artist_key
    WHERE lower(trim(a.ar_artist_name))=lower(trim($1))
       OR lower(trim(COALESCE(asp.as_alternatieve_spelling,'')))=lower(trim($1))
       OR aer.external_id=$2
    ORDER BY confidence DESC, a.ar_artist_name`, [personName, sourcePersonId])).rows;
}

async function findExistingRelation(musicianKey, bandArtistKey, client = pool) {
  return (await client.query(`SELECT mb_musician_band_key AS relation_key FROM public.musician_in_band WHERE mb_musician_key=$1 AND mb_artist_key=$2 ORDER BY mb_musician_band_key LIMIT 1`, [musicianKey, bandArtistKey])).rows[0] || null;
}

async function upsert(candidate, classification, client = pool) {
  const values = [candidate.bandArtistKey, classification.musicianKey, classification.artistKey, classification.relationKey, candidate.sourceType,
    candidate.sourceBandExternalId, candidate.sourcePersonExternalId, candidate.sourceRelationshipId, candidate.personName,
    candidate.role, candidate.dateFrom, candidate.dateTo, classification.matchStatus, classification.proposalStatus,
    classification.confidence, classification.conflictReason, candidate.sourceUrl, JSON.stringify(candidate.rawPayload || {})];
  return (await client.query(`INSERT INTO public.musician_in_band_proposal
    (band_artist_key,proposed_musician_key,proposed_artist_key,proposed_relation_key,source_type,source_band_external_id,source_person_external_id,
     source_relationship_id,proposed_person_name,proposed_role,proposed_date_from,proposed_date_to,match_status,proposal_status,
     confidence_score,conflict_reason,source_url,raw_payload)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb)
    ON CONFLICT (band_artist_key, lower(source_type), source_band_external_id, source_person_external_id)
    DO UPDATE SET proposed_musician_key=EXCLUDED.proposed_musician_key, proposed_artist_key=EXCLUDED.proposed_artist_key, proposed_relation_key=EXCLUDED.proposed_relation_key,
      proposed_person_name=EXCLUDED.proposed_person_name, proposed_role=EXCLUDED.proposed_role,
      proposed_date_from=EXCLUDED.proposed_date_from, proposed_date_to=EXCLUDED.proposed_date_to,
      match_status=EXCLUDED.match_status, confidence_score=EXCLUDED.confidence_score,
      conflict_reason=EXCLUDED.conflict_reason, source_url=EXCLUDED.source_url, raw_payload=EXCLUDED.raw_payload,
      proposal_status=CASE WHEN musician_in_band_proposal.proposal_status IN ('accepted','ignored','review_later')
                           THEN musician_in_band_proposal.proposal_status ELSE EXCLUDED.proposal_status END,
      updated_at=now()
    RETURNING proposal_key, (xmax=0) AS inserted`, values)).rows[0];
}

async function listForRematch(bandArtistKey, client = pool) {
  return (await client.query(`SELECT proposal_key, band_artist_key, source_type, source_band_external_id, source_person_external_id,
      source_relationship_id, proposed_person_name, proposed_role, proposed_date_from, proposed_date_to, source_url, raw_payload,
      proposal_status, updated_at
    FROM public.musician_in_band_proposal
    WHERE band_artist_key=$1 AND proposal_status <> 'accepted'
    ORDER BY proposal_key`, [bandArtistKey])).rows;
}

async function updateClassification(id, classification, client = pool) {
  return (await client.query(`UPDATE public.musician_in_band_proposal
    SET proposed_musician_key=$2, proposed_artist_key=$3, proposed_relation_key=$4,
        match_status=$5, confidence_score=$6, conflict_reason=$7,
        proposal_status=CASE
          WHEN proposal_status IN ('ignored','review_later') THEN proposal_status
          ELSE $8
        END,
        updated_at=now()
    WHERE proposal_key=$1
    RETURNING *`, [id, classification.musicianKey, classification.artistKey, classification.relationKey,
      classification.matchStatus, classification.confidence, classification.conflictReason, classification.proposalStatus])).rows[0] || null;
}

async function updateStatus(id, status, client = pool) {
  const result = await client.query(`UPDATE public.musician_in_band_proposal
    SET proposal_status=$2, reviewed_at=now(), updated_at=now()
    WHERE proposal_key=$1
    RETURNING *`, [id, status]);
  return result.rows[0] || null;
}

module.exports = { getBandDiscogsReference, list, counts, getById, findMusicianMatches, findArtistMatches, findExistingRelation, upsert, listForRematch, updateClassification, updateStatus };
