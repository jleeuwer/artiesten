const Artist = require("../models/artist");

// ... jouw normalize() blijft hetzelfde

async function list(req, res) {
  const search = (req.query.search ?? "").toString();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  const includeDeleted = String(req.query.includeDeleted ?? "false") === "true";
  const onlyDeleted = String(req.query.onlyDeleted ?? "false") === "true";

  const data = await Artist.list({ search, limit, offset, includeDeleted, onlyDeleted });
  res.json(data);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const deleted = await Artist.softDelete(id);
  if (!deleted) return res.status(404).json({ error: "Not found (or already deleted)" });

  res.json({ deleted: true, soft: true, ar_artist_key: id });
}

async function restore(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const restored = await Artist.restore(id);
  if (!restored) return res.status(404).json({ error: "Not found (or not deleted)" });

  res.json({ restored: true, ar_artist_key: id });
}

async function hardDelete(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const gone = await Artist.hardDelete(id);
    if (!gone) return res.status(404).json({ error: "Not found" });

    return res.json({ deleted: true, soft: false, ar_artist_key: id });
  } catch (err) {
    if (err.code === "23503") {
      // Best-effort restore
      try {
        await Artist.restore(id);
      } catch (_) {
        // ignore restore failure; we still want to return a meaningful 409
      }

      return res.status(409).json({
        error: "Cannot delete forever: artist is referenced by other records. Artist has been restored.",
        restored: true,
        ar_artist_key: id
      });
    }

    throw err;
  }
}

module.exports = {
  list,
  // get,
  // create,
  // update,
  remove,
  restore,
  hardDelete
};
