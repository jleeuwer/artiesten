const service = require('../services/musicianInBandProposalService');
function id(v){const n=Number(v);if(!Number.isInteger(n)||n<=0){const e=new Error('Ongeldige sleutel.');e.statusCode=400;e.code='INVALID_RELATION_REFERENCE';throw e;}return n;}
async function generate(req,res){res.json({summary:await service.generate(id(req.params.artistKey))});}
async function list(req,res){res.json(await service.list(id(req.params.artistKey),{status:req.query.status||'',matchStatus:req.query.matchStatus||'',q:req.query.q||''}));}
async function status(req,res){res.json(await service.setStatus(id(req.params.proposalKey),req.body.status,req.body.expectedUpdatedAt));}
async function accept(req,res){res.json(await service.accept(id(req.params.proposalKey),req.body||{}));}
module.exports={generate,list,status,accept};
