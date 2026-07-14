const PRECISIONS = new Set(["day", "month", "year", "unknown"]);
const SOURCE_TYPES = new Set(["manual", "book", "website", "liner_notes", "other"]);

function text(value, max = 4000) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > max) throw validationError("VALUE_TOO_LONG", `Waarde mag maximaal ${max} tekens bevatten.`);
  return normalized;
}
function positiveInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw validationError("INVALID_RELATION_REFERENCE", `${field} is verplicht en moet een positief geheel getal zijn.`);
  return parsed;
}
function isoDate(value, field) {
  const normalized = text(value, 10);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw validationError("INVALID_RELATION_PERIOD", `${field} moet het formaat YYYY-MM-DD hebben.`);
  const [year, month, day] = normalized.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    throw validationError("INVALID_RELATION_PERIOD", `${field} bevat geen geldige kalenderdatum.`);
  }
  return normalized;
}
function enumValue(value, allowed, fallback, field) {
  const normalized = text(value, 40) || fallback;
  if (!allowed.has(normalized)) throw validationError("INVALID_RELATION_VALUE", `${field} bevat een niet-toegestane waarde.`);
  return normalized;
}
function validationError(code, message, statusCode = 400) {
  const error = new Error(message); error.code = code; error.statusCode = statusCode; return error;
}
function normalizeMembershipPayload(body = {}, { requireReferences = true, requireMusicianReference = requireReferences, requireBandReference = requireReferences } = {}) {
  const musicianKey = requireMusicianReference ? positiveInteger(body.musicianKey, "musicianKey") : (body.musicianKey ? positiveInteger(body.musicianKey, "musicianKey") : null);
  const bandArtistKey = requireBandReference ? positiveInteger(body.bandArtistKey, "bandArtistKey") : (body.bandArtistKey ? positiveInteger(body.bandArtistKey, "bandArtistKey") : null);
  const dateFrom = isoDate(body.dateFrom, "dateFrom");
  const dateTo = isoDate(body.dateTo, "dateTo");
  if (dateFrom && dateTo && dateTo < dateFrom) throw validationError("INVALID_RELATION_PERIOD", "Einddatum mag niet vóór begindatum liggen.");
  return {
    musicianKey, bandArtistKey,
    role: text(body.role, 500), dateFrom, dateTo,
    dateFromPrecision: enumValue(body.dateFromPrecision, PRECISIONS, dateFrom ? "day" : "unknown", "dateFromPrecision"),
    dateToPrecision: enumValue(body.dateToPrecision, PRECISIONS, dateTo ? "day" : "unknown", "dateToPrecision"),
    sourceType: enumValue(body.sourceType, SOURCE_TYPES, "manual", "sourceType"),
    sourceReference: text(body.sourceReference, 1000), sourceUrl: text(body.sourceUrl, 2000), notes: text(body.notes, 8000),
    expectedUpdatedAt: text(body.expectedUpdatedAt, 80), acknowledgeOverlap: body.acknowledgeOverlap === true,
  };
}
module.exports = { normalizeMembershipPayload, validationError, PRECISIONS, SOURCE_TYPES };
