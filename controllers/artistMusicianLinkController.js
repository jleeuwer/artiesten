const links=require('../services/artistMusicianLinkService');
function id(v){const n=Number(v);if(!Number.isInteger(n)||n<=0){const e=new Error('Ongeldige sleutel.');e.statusCode=400;throw e;}return n;}
async function link(req,res){res.json(await links.link(id(req.params.artistKey),id(req.body.musicianKey)));}
async function unlink(req,res){res.json({unlinked:await links.unlink(id(req.params.artistKey))});}
module.exports={link,unlink};
