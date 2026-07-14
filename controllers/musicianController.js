const service=require('../services/musicianService');
const links=require('../services/artistMusicianLinkService');
function id(v){const n=Number(v);if(!Number.isInteger(n)||n<=0){const e=new Error('Ongeldige sleutel.');e.statusCode=400;e.code='INVALID_MUSICIAN_KEY';throw e;}return n;}
async function search(req,res){res.json({items:await service.search(req.query.q||'',Math.min(Number(req.query.limit||25),100))});}
async function get(req,res){const item=await service.get(id(req.params.musicianKey));if(!item)return res.status(404).json({error:'Musician niet gevonden.'});res.json(item);}
async function create(req,res){res.status(201).json(await service.create(req.body));}
async function update(req,res){const item=await service.update(id(req.params.musicianKey),req.body);if(!item)return res.status(404).json({error:'Musician niet gevonden.'});res.json(item);}
async function remove(req,res){res.json({deleted:await service.remove(id(req.params.musicianKey))});}
async function promote(req,res){res.status(201).json(await links.promote(id(req.params.musicianKey),req.body||{}));}
module.exports={search,get,create,update,remove,promote};
