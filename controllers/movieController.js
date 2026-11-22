const movieModel = require("../models/movieModel");
const path = require("path");
const fs = require("fs");
const statsCache = new Map();
const STATS_CACHE_MS = 5 * 60 * 1000;

function removeThumbnail(filename) {
    if (!filename) return;
    if (filename.startsWith("http://") || filename.startsWith("https://")) return;
    const cleanFilename = path.basename(filename);
    const filePath = path.resolve(__dirname, "..", "..", "front", "public", "img", "movies", cleanFilename);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error("Could not remove old thumbnail:", e.message);
        }

        function hasUsablePoster(movie) {
            const poster = String(movie && (movie.thumbnail || movie.poster || "")).trim();
            return Boolean(poster) &&
                poster !== "/img/placeholder-poster.svg" &&
                !poster.includes("placeholder-poster");
        }
    }
}

const home = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        const searchType = String(req.query.searchType || "all").trim();
        const genre = String(req.query.genre || "").trim();
        const year = req.query.year ? String(req.query.year).trim() : "";
        const cast = String(req.query.cast || "").trim();
        const sortBy = String(req.query.sortBy || "year_desc").trim();
        const alert = req.query.alert || null;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = 24;

        const moviePage = await movieModel.searchPage({
            q,
            searchType,
            genre,
            year,
            cast,
            sortBy,
            page,
            pageSize
        });
        const movies = moviePage.data;
        const paginationQuery = new URLSearchParams({
            q,
            searchType,
            genre,
            year,
            cast,
            sortBy
        }).toString();

        // Dynamic page title
        let pageTitle = "Explore Movies";
        if (q) {
            pageTitle = `Search: "${q}"`;
        } else if (genre && genre.toLowerCase() !== "all") {
            pageTitle = `${genre} Movies`;
        } else if (year) {
            pageTitle = `Movies released in ${year}`;
        } else if (cast) {
            pageTitle = `Movies starring ${cast}`;
        } else if (sortBy === "top_rated" || sortBy === "rating") {
            pageTitle = "Top Rated Movies";
        }

        // Fetch genres and stats
        const cacheKey = "catalog-stats";
        let stats = statsCache.get(cacheKey);
        if (!stats || Date.now() - stats.expiresAt > 0) {
            stats = { value: await movieModel.getStats(), expiresAt: Date.now() + STATS_CACHE_MS };
            statsCache.set(cacheKey, stats);
        }

        const [availableGenres, featuredMovies] = await Promise.all([
            movieModel.getGenres(),
            movieModel.getFeatured(4)
        ]);

        res.render("pages/movies/index", {
            movies,
            query: q,
            searchType,
            genre,
            year,
            cast,
            sortBy,
            pageTitle,
            page,
            pageSize,
            totalMovies: moviePage.total,
            totalPages: Math.max(1, Math.ceil(moviePage.total / pageSize)),
            paginationQuery,
            availableGenres,
            stats: stats.value,
            featuredMovies,
            alert,
            errorMessage: req.flashError || null
        });
    } catch (error) {
        console.error("MovieController Home Error:", error);
        res.status(500).render("pages/movies/index", {
            movies: [],
            query: "",
            searchType: "all",
            genre: "",
            year: "",
            cast: "",
            sortBy: "year_desc",
            pageTitle: "Error Loading Movies",
            page: 1,
            pageSize: 24,
            totalMovies: 0,
            totalPages: 1,
            paginationQuery: "",
            availableGenres: [],
            stats: { totalMovies: 0, totalGenres: 0, topRated: null },
            featuredMovies: [],
            alert: null,
            errorMessage: "Could not connect to the database. Make sure MongoDB is running."
        });
    }
};

const createForm = async (req, res) => {
    try {
        const availableGenres = await movieModel.getGenres();
        res.render("pages/movies/createForm", {
            pageTitle: "Add New Movie",
            availableGenres,
            errorMessage: req.flashError || null
        });
    } catch (error) {
        console.error(error);
        res.render("pages/movies/createForm", {
            pageTitle: "Add New Movie",
            availableGenres: [],
            errorMessage: "Could not load genres."
        });
    }
};

const store = async (req, res) => {
    try {
        let thumbnail = "";
        if (req.file) {
            thumbnail = req.file.filename;
        } else if (req.body.thumbnailUrl && req.body.thumbnailUrl.trim()) {
            thumbnail = req.body.thumbnailUrl.trim();
        }

        const movieData = {
            ...req.body,
            thumbnail
        };
        const validationError = validateMovieInput(movieData);
        if (validationError) {
            if (req.file) removeThumbnail(req.file.filename);
            return res.status(400).render("pages/movies/createForm", {
                pageTitle: "Add New Movie",
                availableGenres: [],
                errorMessage: validationError
            });
        }

        const result = await movieModel.store(movieData);

        const newId = result && result.insertedId ? result.insertedId.toString() : "";
        if (newId) {
            res.redirect(`/movies/show/${newId}?alert=created`);
        } else {
            res.redirect("/?alert=created");
        }
    } catch (error) {
        console.error("Movie Store Error:", error);
        if (req.file) removeThumbnail(req.file.filename);
        res.status(500).render("pages/movies/createForm", {
            pageTitle: "Add New Movie",
            availableGenres: [],
            errorMessage: "Could not create movie. Check the details and try again."
        });
    }
};

const show = async (req, res) => {
    try {
        const movie = await movieModel.show(req.params.id);
        const currentMovie = movie && movie[0] ? movie[0] : null;

        if (!currentMovie) {
            return res.status(404).render("pages/movies/show", {
                movie: null,
                relatedMovies: [],
                pageTitle: "Movie Not Found",
                alert: null
            });
        }

        const relatedMovies = await movieModel.getRelated(currentMovie, 4);

        res.render("pages/movies/show", {
            movie: currentMovie,
            relatedMovies,
            pageTitle: `${currentMovie.title} (${currentMovie.year})`,
            alert: req.query.alert || null
        });
    } catch (error) {
        console.error("Movie Show Error:", error);
        res.status(500).render("pages/movies/show", {
            movie: null,
            relatedMovies: [],
            pageTitle: "Error",
            alert: null
        });
    }
};

const updateForm = async (req, res) => {
    try {
        const movie = await movieModel.show(req.params.id || (req.body && req.body.id));
        if (!movie || !movie.length) {
            return res.status(404).render("pages/movies/show", {
                movie: null,
                relatedMovies: [],
                pageTitle: "Movie Not Found",
                alert: null
            });
        }

        const availableGenres = await movieModel.getGenres();

        res.render("pages/movies/updateForm", {
            movie: movie[0],
            availableGenres,
            pageTitle: `Edit: ${movie[0].title}`,
            errorMessage: req.flashError || null
        });
    } catch (error) {
        console.error("Movie UpdateForm Error:", error);
        res.status(500).send("Database error");
    }
};

const update = async (req, res) => {
    try {
        const oldMovie = await movieModel.show(req.body.id);
        if (!oldMovie || !oldMovie.length) {
            return res.status(404).send("Movie not found");
        }

        let newThumbnail = oldMovie[0].thumbnail || "";
        if (req.file) {
            newThumbnail = req.file.filename;
        } else if (req.body.thumbnailUrl && req.body.thumbnailUrl.trim()) {
            newThumbnail = req.body.thumbnailUrl.trim();
        }

        const movieData = { ...req.body, thumbnail: newThumbnail };
        const validationError = validateMovieInput(movieData);
        if (validationError) {
            if (req.file) removeThumbnail(req.file.filename);
            return res.status(400).render("pages/movies/updateForm", {
                movie: oldMovie[0],
                availableGenres: [],
                pageTitle: `Edit: ${oldMovie[0].title}`,
                errorMessage: validationError
            });
        }

        await movieModel.update({
            ...movieData
        });

        if (oldMovie[0].thumbnail && oldMovie[0].thumbnail !== newThumbnail) {
            removeThumbnail(oldMovie[0].thumbnail);
        }

        res.redirect(`/movies/show/${req.body.id}?alert=updated`);
    } catch (error) {
        console.error("Movie Update Error:", error);
        if (req.file) removeThumbnail(req.file.filename);
        res.status(500).send("Could not update movie. Check the details and try again.");
    }
};

const destroy = async (req, res) => {
    try {
        const movie = await movieModel.show(req.params.id);
        if (!movie || !movie.length) {
            return res.status(404).send("Movie not found");
        }

        await movieModel.destroy(req.params.id);
        removeThumbnail(movie[0].thumbnail);

        res.redirect("/?alert=deleted");
    } catch (error) {
        console.error("Movie Destroy Error:", error);
        res.status(500).send("Could not delete movie");
    }
};

const apiMovies = async (req, res) => {
    try {
        const result = await movieModel.searchPage(req.query);
        res.json({
            success: true,
            count: result.data.length,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            data: result.data
        });
    } catch (error) {
        console.error("Movie API Search Error:", error);
        res.status(500).json({ success: false, error: "Could not load movies." });
    }
};

const apiStats = async (req, res) => {
    try {
        const stats = await movieModel.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("Movie API Stats Error:", error);
        res.status(500).json({ success: false, error: "Could not load catalog statistics." });
    }
};

function validateMovieInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return "A movie object is required.";
    }

    const title = String(data.title || "").trim();
    const year = Number(data.year);
    const rating = Number(data.rating);
    if (!title) return "Title is required.";
    if (title.length > 150) return "Title must be 150 characters or fewer.";
    if (!Number.isInteger(year) || year < 1888 || year > new Date().getFullYear() + 5) {
        return "Enter a valid release year.";
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
        return "Rating must be between 0 and 10.";
    }
    if (String(data.description || "").length > 5000) {
        return "Synopsis must be 5,000 characters or fewer.";
    }
    if (String(data.thumbnail || data.thumbnailUrl || "").length > 2048) {
        return "Poster URL must be 2,048 characters or fewer.";
    }
    return null;
}

const apiGenres = async (req, res) => {
    try {
        res.json({ success: true, data: await movieModel.getGenres() });
    } catch (error) {
        console.error("Movie API Genres Error:", error);
        res.status(500).json({ success: false, error: "Could not load genres." });
    }
};

const apiMovie = async (req, res) => {
    try {
        const movies = await movieModel.show(req.params.id);
        if (!movies.length) {
            return res.status(404).json({ success: false, error: "Movie not found." });
        }
        res.json({ success: true, data: movies[0] });
    } catch (error) {
        console.error("Movie API Detail Error:", error);
        res.status(500).json({ success: false, error: "Could not load movie details." });
    }
};

const apiRecommendations = async (req, res) => {
    try {
        const movies = await movieModel.show(req.params.id);
        if (!movies.length) {
            return res.status(404).json({ success: false, error: "Movie not found." });
        }
        const recommendations = await movieModel.getRelated(movies[0], 6);
        res.json({ success: true, data: recommendations });
    } catch (error) {
        console.error("Movie API Recommendations Error:", error);
        res.status(500).json({ success: false, error: "Could not load recommendations." });
    }
};

const apiCreateMovie = async (req, res) => {
    const validationError = validateMovieInput(req.body);
    if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
    }

    try {
        const result = await movieModel.store(req.body);
        const movies = await movieModel.show(result.insertedId.toString());
        res.status(201).json({ success: true, data: movies[0] });
    } catch (error) {
        console.error("Movie API Create Error:", error);
        res.status(500).json({ success: false, error: "Could not create movie." });
    }
};

const apiUpdateMovie = async (req, res) => {
    const validationError = validateMovieInput(req.body);
    if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
    }

    try {
        const existingMovies = await movieModel.show(req.params.id);
        if (!existingMovies.length) {
            return res.status(404).json({ success: false, error: "Movie not found." });
        }

        const result = await movieModel.update({ ...req.body, id: req.params.id });
        if (!result || !result.matchedCount) {
            return res.status(404).json({ success: false, error: "Movie not found." });
        }
        const hasThumbnailUpdate =
            Object.prototype.hasOwnProperty.call(req.body, "thumbnail") ||
            Object.prototype.hasOwnProperty.call(req.body, "thumbnailUrl");
        const newThumbnail = String(req.body.thumbnail || req.body.thumbnailUrl || "").trim();
        if (hasThumbnailUpdate &&
            existingMovies[0].thumbnail &&
            existingMovies[0].thumbnail !== newThumbnail) {
            removeThumbnail(existingMovies[0].thumbnail);
        }
        const movies = await movieModel.show(req.params.id);
        res.json({ success: true, data: movies[0] });
    } catch (error) {
        console.error("Movie API Update Error:", error);
        res.status(500).json({ success: false, error: "Could not update movie." });
    }
};

const apiDeleteMovie = async (req, res) => {
    try {
        const movies = await movieModel.show(req.params.id);
        if (!movies.length) {
            return res.status(404).json({ success: false, error: "Movie not found." });
        }

        const result = await movieModel.destroy(req.params.id);
        if (!result || !result.deletedCount) {
            return res.status(404).json({ success: false, error: "Movie not found." });
        }
        removeThumbnail(movies[0].thumbnail);
        res.json({ success: true, message: "Movie deleted." });
    } catch (error) {
        console.error("Movie API Delete Error:", error);
        res.status(500).json({ success: false, error: "Could not delete movie." });
    }
};

module.exports = {
    home,
    createForm,
    store,
    show,
    updateForm,
    update,
    destroy,
    apiMovies,
    apiStats,
    apiGenres,
    apiMovie,
    apiRecommendations,
    apiCreateMovie,
    apiUpdateMovie,
    apiDeleteMovie
};
