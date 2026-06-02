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
  getMergeHistory: ({ artistKey = "", limit = 100, offset = 0 } = {}) => request(`/api/artists/merge/history?artistKey=${encodeURIComponent(artistKey ?? "")}&limit=${limit}&offset=${offset}`),
  findDuplicateCandidates: (id, { limit = 20, minScore = 0.72 } = {}) => request(`/api/artists/${id}/duplicate-candidates?limit=${limit}&minScore=${minScore}`),
  getMergeImpact: ({ redundantArtistKey, replacementArtistKey }) => request(`/api/artists/merge/impact?redundantArtistKey=${redundantArtistKey}&replacementArtistKey=${replacementArtistKey}`),
  executeArtistMerge: ({ redundantArtistKey, replacementArtistKey, reason }) => request(`/api/artists/merge/execute`, {
    method: "POST",
    body: JSON.stringify({ redundantArtistKey, replacementArtistKey, reason })
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
