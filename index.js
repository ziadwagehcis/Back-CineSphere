const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { getDb, closeConnection } = require("./models/mongodbConnection");
const movieModel = require("./models/movieModel");

const app = express();
const frontendUrl = "https://cinecphere1.vercel.app";

function renderApiLandingPage(databaseConnected) {
    const statusClass = databaseConnected ? "status-online" : "status-offline";
    const statusText = databaseConnected ? "Database connected" : "Database unavailable";
    const statusDescription = databaseConnected
        ? "The movie catalog is ready to serve requests."
        : "The API could not connect to MongoDB. Try again in a moment.";

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0b1220">
    <title>CineSphere API</title>
    <style>
        :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: #080d17; color: #eef4ff; }
        * { box-sizing: border-box; }
        body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 28px 18px; background: radial-gradient(ellipse at 50% 0, rgba(38, 91, 158, .28), transparent 58%), #080d17; }
        .card { width: min(100%, 560px); padding: clamp(24px, 6vw, 42px); border: 1px solid rgba(148, 163, 184, .17); border-radius: 22px; background: rgba(15, 23, 42, .88); box-shadow: 0 28px 80px rgba(0, 0, 0, .35); }
        .brand { display: flex; align-items: center; gap: 11px; margin-bottom: 30px; color: #a9bad4; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
        .brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid rgba(96, 165, 250, .4); border-radius: 12px; background: rgba(59, 130, 246, .14); color: #8fc5ff; }
        .eyebrow { margin: 0 0 8px; color: #7fb8ff; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        h1 { margin: 0; font-size: clamp(30px, 7vw, 42px); letter-spacing: -.045em; line-height: 1.1; }
        .description { max-width: 430px; margin: 14px 0 24px; color: #9aaac1; font-size: 15px; line-height: 1.7; }
        .status { display: flex; align-items: flex-start; gap: 11px; margin: 0 0 24px; padding: 13px 15px; border: 1px solid; border-radius: 12px; font-size: 13px; }
        .status-online { border-color: rgba(52, 211, 153, .24); background: rgba(16, 185, 129, .09); color: #a7f3d0; }
        .status-offline { border-color: rgba(248, 113, 113, .3); background: rgba(239, 68, 68, .09); color: #fecaca; }
        .status-dot { flex: 0 0 auto; width: 9px; height: 9px; margin-top: 4px; border-radius: 50%; background: currentColor; box-shadow: 0 0 14px currentColor; }
        .status-copy { display: grid; gap: 3px; }
        .status-copy strong { font-size: 13px; }
        .status-copy span { color: #9aaac1; line-height: 1.5; }
        .links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .link { min-height: 68px; display: grid; align-content: center; gap: 5px; padding: 12px 14px; border: 1px solid rgba(148, 163, 184, .15); border-radius: 12px; background: rgba(30, 41, 59, .58); color: #eef4ff; text-decoration: none; transition: border-color .2s, background-color .2s, transform .2s; }
        .link:hover { transform: translateY(-1px); border-color: rgba(96, 165, 250, .5); background: rgba(37, 58, 89, .7); }
        .link:focus-visible { outline: 2px solid #60a5fa; outline-offset: 3px; }
        .link strong { font-size: 13px; }
        .link span { overflow-wrap: anywhere; color: #91a3bd; font-size: 11px; }
        .footer { margin-top: 25px; color: #70819b; font-size: 11px; }
        @media (max-width: 420px) { .links { grid-template-columns: 1fr; } .card { border-radius: 18px; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
    </style>
</head>
<body>
    <main class="card">
        <div class="brand">
            <span class="brand-mark" aria-hidden="true">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="4" width="18" height="16" rx="3"></rect>
                    <path d="M7 4v4m5-4v4m5-4v4M7 16h.01M12 16h.01M17 16h.01"></path>
                </svg>
            </span>
            <span>CineSphere · Backend</span>
        </div>
        <p class="eyebrow">Movie Catalog Service</p>
        <h1>CineSphere API</h1>
        <p class="description">Backend service for the CineSphere movie catalog, search, recommendations, and data management.</p>
        <div class="status ${statusClass}" role="status" aria-live="polite">
            <span class="status-dot" aria-hidden="true"></span>
            <span class="status-copy"><strong>${statusText}</strong><span>${statusDescription}</span></span>
        </div>
        <nav class="links" aria-label="Service links">
            <a class="link" href="/api/health"><strong>Health check</strong><span>/api/health</span></a>
            <a class="link" href="/api/movies?page=1&amp;pageSize=24"><strong>Browse movies</strong><span>/api/movies</span></a>
            <a class="link" href="/api/genres"><strong>Browse genres</strong><span>/api/genres</span></a>
            <a class="link" href="/api/stats"><strong>Catalog statistics</strong><span>/api/stats</span></a>
            <a class="link" href="${frontendUrl}" target="_blank" rel="noopener noreferrer"><strong>Open CineSphere</strong><span>${frontendUrl}</span></a>
        </nav>
        <footer class="footer">CineSphere API · Express and MongoDB Atlas</footer>
    </main>
</body>
</html>`;
}

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

app.get("/", async (req, res) => {
    let databaseConnected = false;
    try {
        const db = await getDb();
        await db.command({ ping: 1 });
        databaseConnected = true;
    } catch (error) {
        console.error("API landing health check failed:", error.message);
    }

    res.set("Cache-Control", "no-store");
    res.status(databaseConnected ? 200 : 503).type("html").send(renderApiLandingPage(databaseConnected));
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
