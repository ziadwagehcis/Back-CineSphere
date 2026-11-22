const express = require("express");
const movieController = require("../controllers/movieController");

const apiRouter = express.Router();

apiRouter.get("/movies", movieController.apiMovies);
apiRouter.get("/movies/:id/recommendations", movieController.apiRecommendations);
apiRouter.get("/movies/:id", movieController.apiMovie);
apiRouter.post("/movies", movieController.apiCreateMovie);
apiRouter.put("/movies/:id", movieController.apiUpdateMovie);
apiRouter.delete("/movies/:id", movieController.apiDeleteMovie);
apiRouter.get("/genres", movieController.apiGenres);
apiRouter.get("/stats", movieController.apiStats);

module.exports = apiRouter;
