const express = require('express');

const router = express.Router();

const showsController = require('../controllers/shows');

const checkAuth = require('../middleware/checkAuth');

router.get('/movie/:movieId/:date/:language', checkAuth, showsController.getShowsByQuery);

router.get('/:theatreId', checkAuth, showsController.getShowsByTheatreId);

router.get('/show/:showId', checkAuth, showsController.getShowById);

router.post('/', checkAuth, showsController.createShow);

router.patch('/:showId', checkAuth, showsController.updateShow);

router.delete('/:showId', checkAuth, showsController.deleteShow);

module.exports = router;