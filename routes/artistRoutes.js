const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/artistController");

const router = express.Router();

router.get("/", asyncHandler(ctrl.list));

// Specific routes before /:id
router.get("/:id/relations", asyncHandler(ctrl.getRelations));
router.patch("/:id/favorite", asyncHandler(ctrl.setFavorite));
router.post("/:id/restore", asyncHandler(ctrl.restore));
router.delete("/:id/hard", asyncHandler(ctrl.hardDelete));

router.get("/:id", asyncHandler(ctrl.get));
router.post("/", asyncHandler(ctrl.create));
router.put("/:id", asyncHandler(ctrl.update));

// Soft delete last so it does not swallow /:id/hard
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
