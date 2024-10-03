const express = require("express");

const theatresController = require('../controllers/theatres');

const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

router.get('/', checkAuth, theatresController.getAllTheatres);
router.get('/user/:userId', checkAuth, theatresController.getUserTheatres);
router.get('/theatre/:theatreId', checkAuth, theatresController.getTheatreById);
router.get('/requests', checkAuth, theatresController.getTheatreRequests);
router.post('/', checkAuth, theatresController.createTheatre);
router.patch('/:theatreId', checkAuth, theatresController.updateTheatre);
router.patch('/approve/:theatreId', checkAuth, theatresController.approveTheatre);
router.delete('/:theatreId', checkAuth, theatresController.deleteTheatre);

module.exports = router;

