const express=require("express");const asyncHandler=require("../utils/asyncHandler");const ctrl=require("../controllers/musicianInBandController");const router=express.Router();
router.get("/musicians/search",asyncHandler(ctrl.searchMusicians));
router.get("/artists/:artistKey",asyncHandler(ctrl.listForArtist));
router.get("/:relationKey",asyncHandler(ctrl.get));
router.post("/",asyncHandler(ctrl.create));
router.put("/:relationKey",asyncHandler(ctrl.update));
router.delete("/:relationKey",asyncHandler(ctrl.remove));
module.exports=router;
