const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const storage = multer.diskStorage({});

const upload = multer({storage: storage});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {upload, cloudinary};