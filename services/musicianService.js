const { pool }=require('../config/db');
const Model=require('../models/musicianModel');
const {normalizeMusicianPayload}=require('../validators/musicianValidator');
async function create(body){const data=normalizeMusicianPayload(body);const candidates=await Model.duplicateCandidates(data);if(candidates.length&&!data.allowDuplicate){const e=new Error('Mogelijk bestaat deze musician al.');e.statusCode=409;e.code='MUSICIAN_DUPLICATE_CANDIDATES';e.details={candidates};throw e;}return Model.create(data);}
async function update(key,body){const data=normalizeMusicianPayload(body);const candidates=await Model.duplicateCandidates(data,key);if(candidates.length&&!data.allowDuplicate){const e=new Error('Mogelijk bestaat deze musician al.');e.statusCode=409;e.code='MUSICIAN_DUPLICATE_CANDIDATES';e.details={candidates};throw e;}return Model.update(key,data);}
module.exports={search:Model.search,get:Model.getById,create,update,remove:Model.remove};
