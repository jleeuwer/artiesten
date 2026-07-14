import { api } from '../../api.js';
export const musicianInBandProposalApi = {
  generate: (artistKey) => api.generateMusicianInBandProposals(artistKey),
  list: (artistKey, filters={}) => api.listMusicianInBandProposals(artistKey, filters),
  setStatus: (proposalKey, status, expectedUpdatedAt) => api.updateMusicianInBandProposalStatus(proposalKey, { status, expectedUpdatedAt }),
  accept: (proposalKey, payload={}) => api.acceptMusicianInBandProposal(proposalKey, payload),
};
