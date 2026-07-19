const Proposal = require('../models/musicianInBandProposalModel');

async function classify(candidate, client) {
  const musicianMatches = await Proposal.findMusicianMatches(candidate.personName, candidate.sourcePersonExternalId, client);
  if (musicianMatches.length > 1) {
    return { matchStatus:'ambiguous', proposalStatus:'conflict', confidence:50, conflictReason:'Meerdere lokale musicians of gekoppelde artists matchen.', musicianKey:null, artistKey:null, relationKey:null };
  }
  if (musicianMatches.length === 1) {
    const match = musicianMatches[0];
    const relation = await Proposal.findExistingRelation(match.musician_key, candidate.bandArtistKey, client);
    return { matchStatus: relation ? 'matched_relation' : 'matched_musician', proposalStatus:'new', confidence:Number(match.confidence), conflictReason:null, musicianKey:match.musician_key, artistKey:match.artist_key || null, relationKey:relation?.relation_key || null };
  }

  const artistMatches = await Proposal.findArtistMatches(candidate.personName, candidate.sourcePersonExternalId, client);
  if (artistMatches.length > 1) {
    return { matchStatus:'ambiguous', proposalStatus:'conflict', confidence:50, conflictReason:'Meerdere lokale artists matchen met dit Discogs-bandlid.', musicianKey:null, artistKey:null, relationKey:null };
  }
  if (artistMatches.length === 1) {
    const artist = artistMatches[0];
    if (artist.musician_key) {
      const relation = await Proposal.findExistingRelation(artist.musician_key, candidate.bandArtistKey, client);
      return { matchStatus: relation ? 'matched_relation' : 'matched_musician', proposalStatus:'new', confidence:Number(artist.confidence), conflictReason:null, musicianKey:artist.musician_key, artistKey:artist.artist_key, relationKey:relation?.relation_key || null };
    }
    if (artist.artist_type === 'person') {
      return { matchStatus:'matched_artist_person', proposalStatus:'new', confidence:Number(artist.confidence), conflictReason:'Bestaande persoonsartist gevonden zonder musician. Bij acceptatie wordt een musician aangemaakt en gekoppeld.', musicianKey:null, artistKey:artist.artist_key, relationKey:null };
    }
    if (!artist.artist_type || artist.artist_type === 'unknown') {
      return { matchStatus:'artist_type_missing', proposalStatus:'conflict', confidence:Number(artist.confidence), conflictReason:'Bestaande artist gevonden, maar het artisttype ontbreekt of is onbekend. Controleer en corrigeer eerst de artist.', musicianKey:null, artistKey:artist.artist_key, relationKey:null };
    }
    return { matchStatus:'artist_type_conflict', proposalStatus:'new', confidence:Number(artist.confidence), conflictReason:`Naamkandidaat gevonden (${artist.artist_name}) met type ${artist.artist_type}. Deze act is geen persoon en blokkeert het aanmaken van een standalone musician niet.`, musicianKey:null, artistKey:artist.artist_key, relationKey:null };
  }

  return { matchStatus:'new_musician', proposalStatus:'new', confidence:40, conflictReason:null, musicianKey:null, artistKey:null, relationKey:null };
}
module.exports = { classify };
