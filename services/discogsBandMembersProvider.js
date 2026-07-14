const { getArtistDetail, buildDiscogsWebUrl } = require('./discogsClient');

function normalizeMember(member = {}, bandDiscogsId) {
  const id = member.id ?? null;
  const name = String(member.name || member.title || '').trim();
  return {
    sourceType: 'discogs',
    sourceBandExternalId: String(bandDiscogsId),
    sourcePersonExternalId: id == null ? `name:${name.toLowerCase()}` : String(id),
    sourceRelationshipId: null,
    personName: name,
    role: null,
    dateFrom: null,
    dateTo: null,
    sourceUrl: id ? buildDiscogsWebUrl(`/artist/${id}`) : null,
    active: member.active !== false,
    rawPayload: member,
  };
}

async function fetchBandMembers(discogsBandId, options = {}) {
  const detail = await getArtistDetail(discogsBandId, options);
  return {
    band: detail,
    members: (detail.members || []).map((member) => normalizeMember(member, discogsBandId)).filter((member) => member.personName),
  };
}

module.exports = { fetchBandMembers, normalizeMember };
