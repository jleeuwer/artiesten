// middlewares/errorHandler.js
const { logger } = require("../config/logger");

function friendlyPgError(err) {

  // ART-013B-2 migration missing
  if (err.code === "42P01" && /musician_in_band_(proposal|source)/i.test(String(err.message || ""))) {
    return {
      status: 503,
      message: "De database-uitbreiding voor Discogs-bandledenvoorstellen ontbreekt. Voer eerst npm run db:migrate:art013b2 uit.",
      code: "ART013B2_MIGRATION_REQUIRED"
    };
  }

  // Unique violation
  if (err.code === "23505") {
    // If you want to be very specific:
    if (err.constraint === "artist_ar_artist_name_key") {
      return { status: 409, message: "Artist name already exists" };
    }
    return { status: 409, message: "Duplicate value (unique constraint)" };
  }

  // Foreign key violation
  if (err.code === "23503") {
    // err.detail often contains helpful info like the referencing table
    return {
      status: 409,
      message: "Cannot delete/update: artist is referenced by other records"
    };
  }

  return null;
}

module.exports = (err, req, res, next) => {
  const mapped = friendlyPgError(err);

  const status = mapped?.status || err.statusCode || err.status || 500;
  const message = mapped?.message || err.message || "Internal server error";

  logger.error(
    `${req.method} ${req.originalUrl} -> ${status} :: ${message}`
  );

  // Optional: expose validation details
  const payload = {
    error: message
  };

  if (mapped?.code) payload.code = mapped.code;

  if (!mapped && err.code && !/^23\d{3}$/.test(String(err.code))) {
    payload.code = err.code;
  }

  if (!mapped && err.details) {
    payload.details = err.details;
  }

  res.status(status).json(payload);
};
