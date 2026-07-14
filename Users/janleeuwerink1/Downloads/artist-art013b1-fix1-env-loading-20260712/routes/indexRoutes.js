// routes/indexRoutes.js
const express = require("express");
const artistRoutes = require("./artistRoutes");
const musicianInBandRoutes = require("./musicianInBandRoutes");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../config/db");

const router = express.Router();

router.get("/health", (req, res) => res.json({ ok: true }));

// NEW: DB health check
router.get(
  "/health/db",
  asyncHandler(async (req, res) => {
    await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: true });
  })
);

router.use("/artists", artistRoutes);
router.use("/musician-in-band", musicianInBandRoutes);

module.exports = router;