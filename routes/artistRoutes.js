const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/artistController");

const router = express.Router();

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.get));
router.post("/", asyncHandler(ctrl.create));
router.put("/:id", asyncHandler(ctrl.update));

// Soft delete
router.delete("/:id", asyncHandler(ctrl.remove));

// Restore from trash
router.post("/:id/restore", asyncHandler(ctrl.restore));

// Permanent delete (optional)
router.delete("/:id/hard", asyncHandler(ctrl.hardDelete));

module.exports = router;
