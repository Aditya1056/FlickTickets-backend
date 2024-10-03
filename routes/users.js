const express = require('express');

const usersController = require('../controllers/users');

const checkAuth = require('../middleware/checkAuth');
const { upload } = require('../middleware/fileUpload');

const router = express.Router();

router.post('/signup', usersController.signup);

router.post('/login', usersController.login);

router.patch('/forgot-password', usersController.forgotPassword);

router.patch('/change-password', usersController.changePassword);

router.get('/', checkAuth, usersController.getUserProfile);

router.patch('/change-profile', checkAuth, upload.single('image'), usersController.changeProfilePicture);

module.exports = router;