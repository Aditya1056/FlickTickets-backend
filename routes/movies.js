const express = require("express");

const moviesController = require('../controllers/movies');

const checkAuth = require('../middleware/checkAuth');

const { upload } = require('../middleware/fileUpload');

const router = express.Router();

router.get('/', checkAuth, moviesController.getAllMovies);

router.get('/search', checkAuth, moviesController.getMoviesByQuery);

router.get('/:movieId', checkAuth, moviesController.getMovieById);

router.post('/', checkAuth, upload.single('poster'), moviesController.createMovie);

router.patch('/:movieId', checkAuth, upload.single('poster'), moviesController.updateMovie);

router.delete('/:movieId', checkAuth, moviesController.deleteMovie);

module.exports = router;