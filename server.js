// server.js (root)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const apiRoutes = require("./routes/indexRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { logger } = require("./config/logger");

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());

// For Vite dev server; in production you can omit or keep permissive CORS if needed
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
} else {
  app.use(cors());
}

app.use("/api", apiRoutes);

// If you build React into /public/app, serve it here
const appDir = path.join(process.cwd(), "public", "app");
app.use(express.static(appDir));

// SPA fallback (avoid intercepting /api)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(appDir, "index.html"), (err) => (err ? next() : null));
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});
