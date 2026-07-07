// middlewares/errorHandler.js
const { logger } = require("../config/logger");

function friendlyPgError(err) {
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

  const status = mapped?.status || err.status || 500;
  const message = mapped?.message || err.message || "Internal server error";

  logger.error(
    `${req.method} ${req.originalUrl} -> ${status} :: ${message}`
  );

  // Optional: expose validation details
  const payload = {
    error: message
  };

  if (!mapped && err.details) {
    payload.details = err.details;
  }

  res.status(status).json(payload);
};
