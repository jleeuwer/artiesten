import { api as coreApi } from "../../api.js";
export const musicianInBandApi={
 list:(artistKey,context)=>coreApi.listMusicianInBand(artistKey,context), searchMusicians:(q)=>coreApi.searchMusicians(q),
 create:(payload)=>coreApi.createMusicianInBand(payload), update:(id,payload)=>coreApi.updateMusicianInBand(id,payload), remove:(id,expectedUpdatedAt)=>coreApi.deleteMusicianInBand(id,expectedUpdatedAt),
};
