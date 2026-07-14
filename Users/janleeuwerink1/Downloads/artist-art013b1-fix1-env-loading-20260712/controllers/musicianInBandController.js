const service=require("../services/musicianInBandService");
function id(v){const n=Number(v);if(!Number.isInteger(n)||n<=0){const e=new Error("Ongeldige sleutel.");e.statusCode=400;e.code="INVALID_RELATION_REFERENCE";throw e;}return n;}
async function listForArtist(req,res){res.json({items:await service.listForArtist(id(req.params.artistKey),String(req.query.context||"band"))});}
async function get(req,res){const item=await service.get(id(req.params.relationKey));if(!item)return res.status(404).json({error:"Relatie niet gevonden.",code:"MUSICIAN_IN_BAND_NOT_FOUND"});res.json(item);}
async function searchMusicians(req,res){res.json({items:await service.searchMusicians(req.query.q||"",Math.min(Number(req.query.limit||25),100))});}
async function create(req,res){res.status(201).json(await service.create(req.body));}
async function update(req,res){res.json(await service.update(id(req.params.relationKey),req.body));}
async function remove(req,res){res.json({deleted:await service.remove(id(req.params.relationKey),req.body)});}
module.exports={listForArtist,get,searchMusicians,create,update,remove};
