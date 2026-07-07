async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error
      ? typeof data.error === "string" ? data.error : "Validation error"
      : "Request failed";
    const err = new Error(msg);
    err.payload = data;
    throw err;
  }
  return data;
}

export const api = {
  listArtists: ({
    search = "",
    limit = 25,
    offset = 0,
    includeDeleted = false,
    onlyDeleted = false,
    favoriteOnly = false,
    sort = "favorite_first",
    mergeStatus = "active",
  } = {}) =>
    request(`/api/artists?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}&includeDeleted=${includeDeleted}&onlyDeleted=${onlyDeleted}&favoriteOnly=${favoriteOnly}&sort=${encodeURIComponent(sort)}&mergeStatus=${encodeURIComponent(mergeStatus)}`),

  getArtist: (id) => request(`/api/artists/${id}`),
  getArtistRelations: (id) => request(`/api/artists/${id}/relations`),

  getDiscogsConfig: () => request(`/api/artists/discogs/config`),
  searchArtistDiscogs: (id, { q = "", limit = 10 } = {}) => request(`/api/artists/${id}/discogs/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getDiscogsArtistDetail: (discogsArtistId) => request(`/api/artists/discogs/${discogsArtistId}`),
  linkArtistDiscogs: (id, { discogsArtistId }) => request(`/api/artists/${id}/discogs/link`, {
    method: "POST",
    body: JSON.stringify({ discogsArtistId })
  }),
  getDiscogsImages: (id) => request(`/api/artists/${id}/discogs/images`),
  setPrimaryDiscogsImage: (id, imageId) => request(`/api/artists/${id}/discogs/images/${imageId}/primary`, {
    method: "POST",
    body: JSON.stringify({})
  }),
  getDiscogsEnrichmentProposals: (id) => request(`/api/artists/${id}/discogs/enrichment-proposals`),
  generateDiscogsEnrichmentProposals: (id) => request(`/api/artists/${id}/discogs/enrichment-proposals/generate`, {
    method: "POST",
    body: JSON.stringify({})
  }),
  updateDiscogsEnrichmentProposalStatus: (id, proposalId, { status, note = "" } = {}) => request(`/api/artists/${id}/discogs/enrichment-proposals/${proposalId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note })
  }),
  applyDiscogsEnrichmentProposal: (id, proposalId, { confirmOverwrite = false } = {}) => request(`/api/artists/${id}/discogs/enrichment-proposals/${proposalId}/apply`, {
    method: "POST",
    body: JSON.stringify({ confirmOverwrite })
  }),
  listDiscogsNameProposals: (id, { status = "all", type = "all", q = "" } = {}) => request(`/api/artists/${id}/discogs/name-proposals?status=${encodeURIComponent(status)}&type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}`),
  generateDiscogsNameProposals: (id) => request(`/api/artists/${id}/discogs/name-proposals/generate`, {
    method: "POST",
    body: JSON.stringify({})
  }),
  updateDiscogsNameProposalStatus: (id, proposalId, { status, note = "" } = {}) => request(`/api/artists/${id}/discogs/name-proposals/${proposalId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note })
  }),
  applyDiscogsNameProposalAsSpelling: (id, proposalId) => request(`/api/artists/${id}/discogs/name-proposals/${proposalId}/apply-spelling`, {
    method: "POST",
    body: JSON.stringify({})
  }),
  getDiscogsSpellingProposals: (id) => request(`/api/artists/${id}/discogs/spelling-proposals`),
  addDiscogsAlternativeSpelling: (id, { proposedName }) => request(`/api/artists/${id}/discogs/spelling-proposals/alternative`, {
    method: "POST",
    body: JSON.stringify({ proposedName })
  }),
  previewDiscogsCanonicalRename: (id, { proposedName }) => request(`/api/artists/${id}/discogs/spelling-proposals/canonical-preview`, {
    method: "POST",
    body: JSON.stringify({ proposedName })
  }),
  executeDiscogsCanonicalRename: (id, { proposedName }) => request(`/api/artists/${id}/discogs/spelling-proposals/canonical`, {
    method: "POST",
    body: JSON.stringify({ proposedName })
  }),
  getMergeHistory: ({ artistKey = "", limit = 100, offset = 0 } = {}) => request(`/api/artists/merge/history?artistKey=${encodeURIComponent(artistKey ?? "")}&limit=${limit}&offset=${offset}`),
  findDuplicateCandidates: (id, { limit = 20, minScore = 0.72 } = {}) => request(`/api/artists/${id}/duplicate-candidates?limit=${limit}&minScore=${minScore}`),
  getMergeImpact: ({ redundantArtistKey, replacementArtistKey }) => request(`/api/artists/merge/impact?redundantArtistKey=${redundantArtistKey}&replacementArtistKey=${replacementArtistKey}`),
  executeArtistMerge: ({ redundantArtistKey, replacementArtistKey, reason, duplicateCandidateId = null }) => request(`/api/artists/merge/execute`, {
    method: "POST",
    body: JSON.stringify({ redundantArtistKey, replacementArtistKey, reason, duplicateCandidateId })
  }),
  listDuplicateReviewCandidates: ({ status = "open", search = "", minScore = "", scanRunId = "", limit = 50, offset = 0 } = {}) => request(`/api/artists/duplicate-candidates?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&minScore=${encodeURIComponent(minScore ?? "")}&scanRunId=${encodeURIComponent(scanRunId ?? "")}&limit=${limit}&offset=${offset}`),
  updateDuplicateCandidateStatus: (candidateId, { status, note = "" } = {}) => request(`/api/artists/duplicate-candidates/${candidateId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note })
  }),
  setArtistFavorite: (id, favorite) => request(`/api/artists/${id}/favorite`, { method: "PATCH", body: JSON.stringify({ favorite }) }),

  createArtist: (artist) => request(`/api/artists`, { method: "POST", body: JSON.stringify(artist) }),
  updateArtist: (id, artist) => request(`/api/artists/${id}`, { method: "PUT", body: JSON.stringify(artist) }),

  // soft delete
  deleteArtist: (id) => request(`/api/artists/${id}`, { method: "DELETE" }),

  // restore
  restoreArtist: (id) => request(`/api/artists/${id}/restore`, { method: "POST" }),

  // permanent delete (optional)
  hardDeleteArtist: (id) => request(`/api/artists/${id}/hard`, { method: "DELETE" })
};
