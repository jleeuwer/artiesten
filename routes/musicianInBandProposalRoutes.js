const express=require('express');const asyncHandler=require('../utils/asyncHandler');const ctrl=require('../controllers/musicianInBandProposalController');const router=express.Router();
router.post('/bands/:artistKey/generate',asyncHandler(ctrl.generate));
router.get('/bands/:artistKey',asyncHandler(ctrl.list));
router.post('/:proposalKey/status',asyncHandler(ctrl.status));
router.post('/:proposalKey/accept',asyncHandler(ctrl.accept));
module.exports=router;
