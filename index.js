const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { getDb, closeConnection } = require("./models/mongodbConnection");
const movieModel = require("./models/movieModel");

const app = express();

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.disable("x-powered-by");
app.use(compression());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use((req, res, next) => {
    res.set({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cache-Control": req.path.startsWith("/api") ? "no-store" : "public, max-age=60"
    });
    next();
});

app.get("/", (req, res) => {
    res.json({ success: true, message: "CineSphere API is running." });
});

app.get("/api/health", async (req, res) => {
    try {
        const db = await getDb();
        await db.command({ ping: 1 });
        res.json({ status: "ok", database: "connected" });
    } catch (error) {
        console.error("Health check failed:", error.message);
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});

app.use("/api", require("./route/api"));
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, error: "API endpoint not found." });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found." });
});

app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        error: err.status === 400 ? "Invalid request body." : "An unexpected server error occurred."
    });
});

const port = process.env.PORT || 3001;

// Pre-test DB connection on startup
getDb()
    .then(async () => {
        await movieModel.ensureIndexes();
        console.log(`[CineSphere] MongoDB database connected and catalog indexes verified.`);
    })
    .catch(err => {
        console.warn(`[CineSphere] Initial MongoDB connection warning: ${err.message}. (Server still running)`);
    });

const server = app.listen(port, () => {
    console.log(`[CineSphere API] Running at http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\nShutting down server...");
    server.close();
    await closeConnection();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\nTerminating server...");
    server.close();
    await closeConnection();
    process.exit(0);
});
