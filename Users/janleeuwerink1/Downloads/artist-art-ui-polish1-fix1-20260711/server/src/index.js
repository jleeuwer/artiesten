import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true
  })
);

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const artistSchema = z.object({
  ar_artist_name: z.string().trim().min(1, "Name is required").max(180),
  ar_artist_dateofbirth: z.string().date().nullable().optional(),
  ar_artist_passing: z.string().date().nullable().optional(),
  ar_website_url: z.string().trim().max(500).nullable().optional(),
  ar_artist_notes: z.string().nullable().optional()
});

function normalizeArtistPayload(body) {
  // Convert empty strings from the UI into nulls
  const toNull = (v) => (v === "" || v === undefined ? null : v);

  const candidate = {
    ar_artist_name: body.ar_artist_name ?? "",
    ar_artist_dateofbirth: toNull(body.ar_artist_dateofbirth),
    ar_artist_passing: toNull(body.ar_artist_passing),
    ar_website_url: toNull(body.ar_website_url),
    ar_artist_notes: toNull(body.ar_artist_notes)
  };

  // Validate with Zod
  const parsed = artistSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten() };
  }

  // Extra sanity check: passing >= dob
  const dob = parsed.data.ar_artist_dateofbirth ? new Date(parsed.data.ar_artist_dateofbirth) : null;
  const passing = parsed.data.ar_artist_passing ? new Date(parsed.data.ar_artist_passing) : null;
  if (dob && passing && passing < dob) {
    return {
      ok: false,
      error: { fieldErrors: { ar_artist_passing: ["Passing date must be >= date of birth"] } }
    };
  }

  return { ok: true, data: parsed.data };
}

// LIST (with search + pagination)
app.get("/api/artists", async (req, res) => {
  const search = (req.query.search ?? "").toString().trim();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  try {
    const where = search ? `WHERE ar_artist_name ILIKE $1` : "";
    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];

    const listSql = `
      SELECT ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes
      FROM public.artist
      ${where}
      ORDER BY ar_artist_name
      LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM public.artist
      ${where}
    `;

    const [listResult, countResult] = await Promise.all([
      pool.query(listSql, params),
      pool.query(countSql, search ? [`%${search}%`] : [])
    ]);

    res.json({
      items: listResult.rows,
      total: countResult.rows[0]?.total ?? 0,
      limit,
      offset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list artists" });
  }
});

// READ ONE
app.get("/api/artists/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await pool.query(
      `
      SELECT ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes
      FROM public.artist
      WHERE ar_artist_key = $1
      `,
      [id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read artist" });
  }
});

// CREATE
// CREATE (transaction: artist + artiesten_spelling)
app.post("/api/artists", async (req, res) => {
  const normalized = normalizeArtistPayload(req.body);
  if (!normalized.ok) return res.status(400).json({ error: normalized.error });

  const a = normalized.data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Insert artist and retrieve generated key
    const artistResult = await client.query(
      `
      INSERT INTO public.artist
        (ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes
      `,
      [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes]
    );

    const created = artistResult.rows[0];

    // 2) Insert 1:1 row in artiesten_spelling
    await client.query(
      `
      INSERT INTO public.artiesten_spelling
        (as_alternatieve_spelling, as_artist_key)
      VALUES ($1, $2)
      `,
      [created.ar_artist_name, created.ar_artist_key]
    );

    await client.query("COMMIT");
    return res.status(201).json(created);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    // Unique violation on ar_artist_name
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Artist name already exists" });
    }

    // FK violation (shouldn't happen here, but keep it)
    if (err?.code === "23503") {
      return res.status(409).json({ error: "Constraint error while creating artist/spelling" });
    }

    console.error(err);
    return res.status(500).json({
      error: "Failed to create artist (transaction rolled back). Please investigate logs."
    });
  } finally {
    client.release();
  }
});

// UPDATE
app.put("/api/artists/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const normalized = normalizeArtistPayload(req.body);
  if (!normalized.ok) return res.status(400).json({ error: normalized.error });

  const a = normalized.data;

  try {
    const result = await pool.query(
      `
      UPDATE public.artist
      SET ar_artist_name = $1,
          ar_artist_dateofbirth = $2,
          ar_artist_passing = $3,
          ar_website_url = $4,
          ar_artist_notes = $5
      WHERE ar_artist_key = $6
      RETURNING ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing, ar_website_url, ar_artist_notes
      `,
      [a.ar_artist_name, a.ar_artist_dateofbirth, a.ar_artist_passing, a.ar_website_url, a.ar_artist_notes, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Artist name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update artist" });
  }
});

// DELETE
app.delete("/api/artists/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await pool.query(
      `DELETE FROM public.artist WHERE ar_artist_key = $1 RETURNING ar_artist_key`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true, ar_artist_key: id });
  } catch (err) {
    // FK violation if other tables reference this artist
    if (err?.code === "23503") {
      return res.status(409).json({ error: "Cannot delete: artist is referenced by other records" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete artist" });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
