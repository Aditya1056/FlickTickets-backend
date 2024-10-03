const express = require('express');

const bookingsController = require('../controllers/bookings');

const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

router.get('/', checkAuth, bookingsController.getBookingByUser);

router.post('/payment', checkAuth, bookingsController.createOrder);

router.post('/verify-payment', checkAuth, bookingsController.verifyPayment);

module.exports = router;