const Model = require("../models/musicianInBandModel");
const { normalizeMembershipPayload } = require("../validators/musicianInBandValidator");
const { normalizeMusicianPayload } = require("../validators/musicianValidator");
const Musician = require("../models/musicianModel");
const { pool } = require("../config/db");
module.exports = {
 listForArtist: async (artistKey, context) => context === "person" ? Model.listForPersonArtist(artistKey) : Model.listForBand(artistKey),
 get: Model.getById, searchMusicians: Model.searchMusicians,
 create: (body) => Model.create(normalizeMembershipPayload(body)),
 update: (id, body) => Model.update(id, normalizeMembershipPayload(body,{requireReferences:false})),
 remove: (id, body={}) => Model.remove(id, body.expectedUpdatedAt || null),
 createMemberFromArtist: async (body) => {
   const membership = normalizeMembershipPayload(body.membership || body, { requireMusicianReference: false, requireBandReference: true });
   const artistKey = Number(body.artistKey || 0);
   if (!Number.isInteger(artistKey) || artistKey <= 0) { const e=new Error("artistKey is verplicht."); e.code="INVALID_ARTIST_KEY"; e.statusCode=400; throw e; }
   const client = await pool.connect();
   try {
     await client.query("BEGIN");
     const artist=(await client.query(`SELECT ar_artist_key,ar_artist_name,ar_artist_type,ar_artist_dateofbirth::text,ar_artist_passing::text,ar_website_url FROM public.artist WHERE ar_artist_key=$1 FOR UPDATE`,[artistKey])).rows[0];
     if(!artist){const e=new Error("Artist niet gevonden.");e.code="ARTIST_NOT_FOUND";e.statusCode=404;throw e;}
     if(artist.ar_artist_type!=="person"){const e=new Error(`Deze artist staat geregistreerd als ${artist.ar_artist_type || "unknown"}. Corrigeer eerst het artist type naar Persoon.`);e.code="ARTIST_TYPE_CORRECTION_REQUIRED";e.statusCode=409;e.details={artistKey,artistType:artist.ar_artist_type||"unknown"};throw e;}
     let musician=await Musician.findForArtist(artistKey,client);
     if(!musician){musician=await Musician.create({artistKey,name:artist.ar_artist_name,dateOfBirth:artist.ar_artist_dateofbirth,passingDate:artist.ar_artist_passing,websiteUrl:artist.ar_website_url,notes:null},client);}
     membership.musicianKey=musician.musician_key;
     const refs=await Model.assertReferences(membership,client);
     if(!refs.band_exists){const e=new Error("Bandartist niet gevonden of ongeldig type.");e.code="BAND_ARTIST_NOT_FOUND";e.statusCode=404;throw e;}
     const result=await client.query(`INSERT INTO public.musician_in_band (mb_musician_key,mb_artist_key,mb_role,mb_date_from,mb_date_to,mb_date_from_precision,mb_date_to_precision,mb_source_type,mb_source_reference,mb_source_url,mb_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING mb_musician_band_key`,[membership.musicianKey,membership.bandArtistKey,membership.role,membership.dateFrom,membership.dateTo,membership.dateFromPrecision,membership.dateToPrecision,membership.sourceType,membership.sourceReference,membership.sourceUrl,membership.notes]);
     await client.query("COMMIT");
     return {musician,membership:await Model.getById(result.rows[0].mb_musician_band_key)};
   } catch(e){await client.query("ROLLBACK");throw e;} finally{client.release();}
 },
 createMember: async (body) => {
   const membership = normalizeMembershipPayload(body.membership || body, { requireMusicianReference: false, requireBandReference: true });
   const musician = normalizeMusicianPayload(body.musician || {});
   const client = await pool.connect();
   try {
     await client.query("BEGIN");
     const candidates = await Musician.duplicateCandidates(musician, null, client);
     if (candidates.length && !musician.allowDuplicate) { const e=new Error("Mogelijk bestaat deze musician al."); e.code="MUSICIAN_DUPLICATE_CANDIDATES"; e.statusCode=409; e.details={candidates}; throw e; }
     const createdMusician = await Musician.create(musician, client);
     membership.musicianKey = createdMusician.musician_key;
     const refs = await Model.assertReferences(membership, client);
     if (!refs.band_exists) { const e=new Error("Bandartist niet gevonden of ongeldig type."); e.code="BAND_ARTIST_NOT_FOUND"; e.statusCode=404; throw e; }
     const result = await client.query(`INSERT INTO public.musician_in_band (mb_musician_key,mb_artist_key,mb_role,mb_date_from,mb_date_to,mb_date_from_precision,mb_date_to_precision,mb_source_type,mb_source_reference,mb_source_url,mb_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING mb_musician_band_key`,[membership.musicianKey,membership.bandArtistKey,membership.role,membership.dateFrom,membership.dateTo,membership.dateFromPrecision,membership.dateToPrecision,membership.sourceType,membership.sourceReference,membership.sourceUrl,membership.notes]);
     await client.query("COMMIT");
     return { musician: createdMusician, membership: await Model.getById(result.rows[0].mb_musician_band_key) };
   } catch(e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
 },
};
