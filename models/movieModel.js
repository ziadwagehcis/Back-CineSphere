const { ObjectId, getDb } = require("./mongodbConnection");

async function withCollection(callback) {
    const db = await getDb();
    return await callback(db.collection("movies"));
}

function toObjectId(id) {
    if (!id) return null;
    return ObjectId.isValid(String(id)) ? new ObjectId(String(id)) : null;
}

function normalizeMovie(data) {
    const genres = (Array.isArray(data.genres) ? data.genres : [data.genres || ""])
        .flatMap(x => String(x).split(","))
        .map(x => x.trim())
        .filter(Boolean);

    const cast = (Array.isArray(data.cast) ? data.cast : [data.cast || ""])
        .flatMap(x => String(x).split(","))
        .map(x => x.trim())
        .filter(Boolean);

    const yearVal = parseInt(data.year, 10);
    const parsedRating = parseFloat(data.rating);
    const rating = !Number.isNaN(parsedRating)
        ? Math.round(Math.min(10, Math.max(0, parsedRating)) * 10) / 10
        : 7.5;

    return {
        title: String(data.title || "").trim(),
        year: !Number.isNaN(yearVal) ? yearVal : new Date().getFullYear(),
        rating,
        director: String(data.director || "").trim() || "Unknown Director",
        duration: String(data.duration || data.runtime || "").trim() || "120 min",
        description: String(data.description || data.storyline || data.plot || "").trim(),
        genres: genres.length > 0 ? genres : ["Drama"],
        cast: cast.length > 0 ? cast : [],
        thumbnail: String(data.thumbnail || data.thumbnailUrl || data.poster || "").trim(),
        featured: data.featured === true || data.featured === "true" || data.featured === "on" || data.featured === 1,
        updatedAt: new Date()
    };
}

function buildSort(sortBy) {
    switch (sortBy) {
        case "top_rated":
        case "rating":
            return { rating: -1, year: -1, _id: -1 };
        case "year_asc":
        case "oldest":
            return { year: 1, _id: 1 };
        case "title_asc":
        case "title":
            return { title: 1, _id: 1 };
        case "year_desc":
        case "newest":
        default:
            return { year: -1, _id: -1 };
    }
}

async function recent(limit = 24, sortBy = "year_desc") {
    const sort = buildSort(sortBy);
    return withCollection(collection =>
        collection.find({}).sort(sort).limit(Number(limit)).toArray()
    );
}

function buildSearchFilter(params) {
    const {
        q = "",
        searchType = "all",
        genre = "",
        year,
        cast = "",
        sortBy = "year_desc",
        limit = 30
    } = params || {};

    const filter = {};
    const conditions = [];

    const queryTerm = String(q || "").trim();
    if (queryTerm) {
        const regex = new RegExp(queryTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        if (searchType === "title") {
            conditions.push({ title: regex });
        } else if (searchType === "cast") {
            conditions.push({ cast: regex });
        } else if (searchType === "director") {
            conditions.push({ director: regex });
        } else {
            conditions.push({
                $or: [
                    { title: regex },
                    { cast: regex },
                    { director: regex },
                    { genres: regex }
                ]
            });
        }
    }

    const genreTerm = String(genre || "").trim();
    if (genreTerm && genreTerm.toLowerCase() !== "all") {
        const genreRegex = new RegExp(`^${genreTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        conditions.push({ genres: genreRegex });
    }

    const castTerm = String(cast || "").trim();
    if (castTerm) {
        const castRegex = new RegExp(castTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        conditions.push({ cast: castRegex });
    }

    if (year !== undefined && year !== null && String(year).trim() !== "") {
        const parsedYear = parseInt(year, 10);
        if (!Number.isNaN(parsedYear)) {
            conditions.push({ year: parsedYear });
        }
    }

    if (conditions.length === 1) {
        Object.assign(filter, conditions[0]);
    } else if (conditions.length > 1) {
        filter.$and = conditions;
    }

    return filter;
}

function normalizeGenreNames(genres) {
    const uniqueGenres = new Map();
    for (const genre of genres || []) {
        const name = String(genre || "").trim();
        const key = name.toLowerCase();
        if (name && !uniqueGenres.has(key)) {
            uniqueGenres.set(key, name);
        }
    }
    return [...uniqueGenres.values()].sort((a, b) => a.localeCompare(b));
}

async function search(params) {
    if (typeof params === "string") {
        params = { q: params };
    }

    const { sortBy = "year_desc", limit = 30, skip = 0 } = params || {};
    const filter = buildSearchFilter(params);
    const sort = buildSort(sortBy);

    return withCollection(collection =>
        collection.find(filter).sort(sort).skip(Number(skip) || 0).limit(Number(limit)).toArray()
    );
}

async function searchPage(params = {}) {
    const requestedPage = parseInt(params.page, 10);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;
    const pageSize = Math.min(48, Math.max(1, parseInt(params.pageSize, 10) || 12));
    const filter = buildSearchFilter(params);
    const sort = buildSort(params.sortBy || "year_desc");

    return withCollection(async collection => {
        const [data, total] = await Promise.all([
            collection.find(filter, { allowDiskUse: true })
                .sort(sort)
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .toArray(),
            collection.countDocuments(filter)
        ]);
        return { data, total, page, pageSize };
    });
}

async function ensureIndexes() {
    return withCollection(async collection => {
        await Promise.all([
            collection.createIndex({ title: 1 }),
            collection.createIndex({ title: 1, _id: 1 }),
            collection.createIndex({ year: -1 }),
            collection.createIndex({ year: -1, _id: -1 }),
            collection.createIndex({ rating: -1 }),
            collection.createIndex({ rating: -1, year: -1, _id: -1 }),
            collection.createIndex({ genres: 1 }),
            collection.createIndex({ cast: 1 }),
            collection.createIndex({ director: 1 }),
            collection.createIndex({ featured: 1, rating: -1 }),
            collection.createIndex({ year: -1, rating: -1, _id: -1 })
        ]);
    });
}

async function byGenre(genre, sortBy = "year_desc", limit = 30) {
    return search({ genre, sortBy, limit });
}

async function byYear(year, sortBy = "year_desc", limit = 30) {
    return search({ year, sortBy, limit });
}

async function byCast(castName, sortBy = "year_desc", limit = 30) {
    return search({ cast: castName, sortBy, limit });
}

async function show(id) {
    const objectId = toObjectId(id);
    if (!objectId) return [];
    return withCollection(collection =>
        collection.find({ _id: objectId }).toArray()
    );
}

async function store(data) {
    const movie = normalizeMovie(data);
    movie.createdAt = new Date();
    return withCollection(collection => collection.insertOne(movie));
}

async function update(data) {
    const objectId = toObjectId(data.id);
    if (!objectId) return null;

    const movie = normalizeMovie(data);
    if (!Object.prototype.hasOwnProperty.call(data, "thumbnail") &&
        !Object.prototype.hasOwnProperty.call(data, "thumbnailUrl")) {
        delete movie.thumbnail;
    }

    return withCollection(collection =>
        collection.updateOne({ _id: objectId }, { $set: movie })
    );
}

async function destroy(id) {
    const objectId = toObjectId(id);
    if (!objectId) return null;

    return withCollection(collection =>
        collection.deleteOne({ _id: objectId })
    );
}

async function getGenres() {
    return withCollection(async collection => {
        const genres = await collection.distinct("genres");
        return normalizeGenreNames(genres);
    });
}

async function getStats() {
    return withCollection(async collection => {
        const [totalMovies, genres, topRated] = await Promise.all([
            collection.countDocuments(),
            collection.distinct("genres"),
            collection.find({}).sort({ rating: -1 }).limit(1).toArray()
        ]);
        return {
            totalMovies,
            totalGenres: normalizeGenreNames(genres).length,
            topRated: topRated[0] || null
        };
    });
}

async function getFeatured(limit = 4) {
    return withCollection(collection =>
        collection.find({
            $or: [
                { featured: true },
                { rating: { $gte: 8.5 } }
            ]
        }).sort({ rating: -1, year: -1 }).limit(Number(limit)).toArray()
    );
}

async function getRelated(movie, limit = 4) {
    const objectId = toObjectId(movie && movie._id);
    const excludeCurrent = objectId ? { _id: { $ne: objectId } } : {};
    const genres = Array.isArray(movie && movie.genres) ? movie.genres : [];
    const cast = Array.isArray(movie && movie.cast) ? movie.cast : [];
    const director = String((movie && movie.director) || "").trim();
    const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactMatches = values => values
        .map(value => String(value).trim())
        .filter(Boolean)
        .map(value => new RegExp(`^${escapeRegex(value)}$`, "i"));
    const conditions = [];

    if (genres.length) {
        conditions.push({ genres: { $in: exactMatches(genres) } });
    }
    if (cast.length) {
        conditions.push({ cast: { $in: exactMatches(cast) } });
    }
    if (director && director.toLowerCase() !== "unknown director") {
        conditions.push({ director: new RegExp(`^${escapeRegex(director)}$`, "i") });
    }

    return withCollection(async collection => {
        const findTopRated = async () => {
            const topRated = await collection.find(excludeCurrent)
                .sort({ rating: -1, year: -1 })
                .limit(Number(limit))
                .toArray();
            return topRated.map(candidate => ({
                ...candidate,
                recommendationReason: "Top rated pick"
            }));
        };

        if (!conditions.length) {
            return findTopRated();
        }

        const candidates = await collection.find({
            ...excludeCurrent,
            $or: conditions
        }).toArray();

        if (!candidates.length) {
            return findTopRated();
        }

        const normalize = value => String(value || "").trim().toLowerCase();
        const sourceGenres = new Set(genres.map(normalize));
        const sourceCast = new Set(cast.map(normalize));

        return candidates.map(candidate => {
            const sharedGenres = (Array.isArray(candidate.genres) ? candidate.genres : [])
                .filter(genre => sourceGenres.has(normalize(genre)));
            const sharedCast = (Array.isArray(candidate.cast) ? candidate.cast : [])
                .filter(actor => sourceCast.has(normalize(actor)));
            const sameDirector = director &&
                director.toLowerCase() !== "unknown director" &&
                normalize(candidate.director) === normalize(director);
            const recommendationScore =
                sharedGenres.length * 3 +
                sharedCast.length * 2 +
                (sameDirector ? 2 : 0);
            const recommendationReason = sharedGenres.length
                ? `Shared genre: ${sharedGenres[0]}`
                : sharedCast.length
                    ? `Shared cast: ${sharedCast[0]}`
                    : `Same director: ${candidate.director}`;

            return { ...candidate, recommendationScore, recommendationReason };
        })
            .sort((a, b) =>
                b.recommendationScore - a.recommendationScore ||
                (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
                (Number(b.year) || 0) - (Number(a.year) || 0)
            )
            .slice(0, Number(limit));
    });
}

module.exports = {
    recent,
    search,
    searchPage,
    byGenre,
    byYear,
    byCast,
    show,
    store,
    update,
    destroy,
    getGenres,
    getStats,
    getFeatured,
    getRelated,
    ensureIndexes,
    normalizeMovie
};
