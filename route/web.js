const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const movieController = require("../controllers/movieController");

const webRouter = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "..", "front", "public", "img", "movies");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `movie-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif|avif/;
        const extMatch = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeMatch = allowed.test(file.mimetype);
        if (extMatch && mimeMatch) {
            return cb(null, true);
        }
        cb(new Error("Only image files (.jpg, .png, .webp, .gif, .avif) are allowed."));
    }
});

// Home and Catalog
webRouter.get("/", movieController.home);
webRouter.get("/movies", (req, res) => res.redirect("/"));

// Movie CRUD
webRouter.get("/movies/create", movieController.createForm);
webRouter.post("/movies", (req, res, next) => {
    upload.single("thumbnail")(req, res, err => {
        if (err) {
            return res.status(400).render("pages/movies/createForm", {
                pageTitle: "Add New Movie",
                availableGenres: [],
                errorMessage: err.message
            });
        }
        movieController.store(req, res, next);
    });
});

webRouter.get("/movies/show/:id", movieController.show);
webRouter.get("/movies/edit/:id", movieController.updateForm);

webRouter.post("/movies/update", (req, res, next) => {
    upload.single("thumbnail")(req, res, err => {
        if (err) {
            req.flashError = err.message;
            req.params.id = req.body.id;
            return movieController.updateForm(req, res, next);
        }
        movieController.update(req, res, next);
    });
});

webRouter.post("/movies/delete/:id", movieController.destroy);

module.exports = webRouter;
