const Model = require("../models/musicianInBandModel");
const { normalizeMembershipPayload } = require("../validators/musicianInBandValidator");
module.exports = {
 listForArtist: async (artistKey, context) => context === "person" ? Model.listForPersonArtist(artistKey) : Model.listForBand(artistKey),
 get: Model.getById, searchMusicians: Model.searchMusicians,
 create: (body) => Model.create(normalizeMembershipPayload(body)),
 update: (id, body) => Model.update(id, normalizeMembershipPayload(body,{requireReferences:false})),
 remove: (id, body={}) => Model.remove(id, body.expectedUpdatedAt || null),
};
