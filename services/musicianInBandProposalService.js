const { pool } = require('../config/db');
const Proposal = require('../models/musicianInBandProposalModel');
const Source = require('../models/musicianInBandSourceModel');
const Musician = require('../models/musicianModel');
const Mib = require('../models/musicianInBandModel');
const { fetchBandMembers } = require('./discogsBandMembersProvider');
const Matching = require('./musicianInBandMatchingService');

function appError(message, code, statusCode=400, details) { const e=new Error(message); e.code=code; e.statusCode=statusCode; if(details)e.details=details; return e; }

async function generate(bandArtistKey) {
  const ref = await Proposal.getBandDiscogsReference(bandArtistKey);
  if (!ref) throw appError('De band heeft geen gekoppelde Discogs-artiest.', 'DISCOGS_BAND_NOT_LINKED', 409);
  const data = await fetchBandMembers(ref.external_id);
  const client = await pool.connect();
  const summary = { processed:0, inserted:0, updated:0, new_musician:0, matched_musician:0, matched_relation:0, matched_artist_person:0, artist_type_missing:0, artist_type_conflict:0, ambiguous:0, conflict:0 };
  try {
    await client.query('BEGIN');
    for (const member of data.members) {
      summary.processed += 1;
      const candidate = { ...member, bandArtistKey };
      const classification = await Matching.classify(candidate, client);
      const row = await Proposal.upsert(candidate, classification, client);
      summary[row.inserted ? 'inserted' : 'updated'] += 1;
      summary[classification.matchStatus] = (summary[classification.matchStatus] || 0) + 1;
      if (classification.proposalStatus === 'conflict') summary.conflict += 1;
    }
    await client.query('COMMIT');
    return summary;
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

async function list(bandArtistKey, filters) { return { items: await Proposal.list(bandArtistKey, filters), counts: await Proposal.counts(bandArtistKey) }; }

async function setStatus(id, status, expectedUpdatedAt) {
  if (!['review_later','ignored','new'].includes(status)) {
    throw appError('Ongeldige proposalstatus.', 'INVALID_MIB_PROPOSAL_STATUS');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await Proposal.getById(id, client, { forUpdate: true });
    if (!current) throw appError('Voorstel niet gevonden.', 'MIB_PROPOSAL_NOT_FOUND', 404);

    // PostgreSQL timestamps can contain microseconds, while JSON/JavaScript exposes
    // milliseconds. Compare at JavaScript precision to avoid false stale conflicts.
    if (expectedUpdatedAt) {
      const expectedMs = new Date(expectedUpdatedAt).getTime();
      const currentMs = new Date(current.updated_at).getTime();
      if (!Number.isFinite(expectedMs) || expectedMs !== currentMs) {
        throw appError('Het voorstel is intussen gewijzigd. Laad de queue opnieuw.', 'STALE_MIB_PROPOSAL', 409);
      }
    }

    const row = await Proposal.updateStatus(id, status, client);
    await client.query('COMMIT');
    return row;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function accept(id, body={}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const proposal = await Proposal.getById(id, client, {forUpdate:true});
    if (!proposal) throw appError('Voorstel niet gevonden.', 'MIB_PROPOSAL_NOT_FOUND', 404);
    if (body.expectedUpdatedAt && new Date(body.expectedUpdatedAt).getTime() !== new Date(proposal.updated_at).getTime()) throw appError('Het voorstel is intussen gewijzigd.', 'STALE_MIB_PROPOSAL', 409);
    if (!['new','review_later','conflict'].includes(proposal.proposal_status)) throw appError('Dit voorstel kan niet worden toegepast.', 'INVALID_MIB_PROPOSAL_TRANSITION', 409);

    if (['artist_type_missing','artist_type_conflict','ambiguous'].includes(proposal.match_status)) {
      throw appError('Dit voorstel heeft eerst controle of correctie van de bestaande artist nodig.', 'MIB_ARTIST_MATCH_REVIEW_REQUIRED', 409, { artistKey: proposal.proposed_artist_key, matchStatus: proposal.match_status });
    }
    let musicianKey = Number(body.musicianKey || proposal.proposed_musician_key || 0) || null;
    let relationKey = Number(proposal.proposed_relation_key || 0) || null;
    if (!musicianKey) {
      let artist = null;
      if (proposal.proposed_artist_key) {
        artist = (await client.query(`SELECT ar_artist_key, ar_artist_name, ar_artist_dateofbirth::text, ar_artist_passing::text, ar_website_url, COALESCE(ar_artist_type,'unknown') AS ar_artist_type FROM public.artist WHERE ar_artist_key=$1 FOR UPDATE`, [proposal.proposed_artist_key])).rows[0] || null;
        if (!artist || artist.ar_artist_type !== 'person') throw appError('De gematchte artist is niet als persoon geregistreerd.', 'MIB_ARTIST_TYPE_CORRECTION_REQUIRED', 409, { artistKey: proposal.proposed_artist_key });
      }
      const created = await Musician.create({ artistKey: artist?.ar_artist_key || null, name: artist?.ar_artist_name || proposal.proposed_person_name, dateOfBirth:artist?.ar_artist_dateofbirth || null, passingDate:artist?.ar_artist_passing || null, websiteUrl:artist?.ar_website_url || null, notes:'Aangemaakt vanuit Discogs bandledenvoorstel', allowDuplicate:Boolean(body.allowDuplicate) }, client);
      musicianKey = created.musician_key;
    }
    if (!relationKey) {
      const existing = await Proposal.findExistingRelation(musicianKey, proposal.band_artist_key, client);
      relationKey = existing?.relation_key || null;
    }
    if (!relationKey) {
      const inserted = await client.query(`INSERT INTO public.musician_in_band
        (mb_musician_key,mb_artist_key,mb_role,mb_date_from,mb_date_to,mb_date_from_precision,mb_date_to_precision,mb_source_type,mb_source_reference,mb_source_url,mb_notes)
        VALUES($1,$2,$3,$4,$5,$6,$7,'discogs',$8,$9,$10) RETURNING mb_musician_band_key`, [musicianKey, proposal.band_artist_key,
          body.applyRole === false ? null : proposal.proposed_role, proposal.proposed_date_from, proposal.proposed_date_to,
          proposal.proposed_date_from ? 'day' : 'unknown', proposal.proposed_date_to ? 'day' : 'unknown',
          proposal.source_person_external_id, proposal.source_url, 'Geaccepteerd vanuit Discogs reviewqueue']);
      relationKey = inserted.rows[0].mb_musician_band_key;
    }
    await Source.attach(client, relationKey, proposal);
    const updated = await client.query(`UPDATE public.musician_in_band_proposal SET proposed_musician_key=$2, proposed_relation_key=$3,
      proposal_status='accepted', reviewed_at=now(), updated_at=now() WHERE proposal_key=$1 RETURNING *`, [id, musicianKey, relationKey]);
    await client.query('COMMIT');
    return { proposal:updated.rows[0], musicianKey, relationKey };
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
module.exports = { generate, list, setStatus, accept };
