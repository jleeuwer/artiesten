const winston = require("winston");
const path = require("path");
const fs = require("fs");

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logsDir, "info.log") })
  ]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console());
}

module.exports = { logger };
