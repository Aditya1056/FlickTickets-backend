const fs = require('fs');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const HttpError = require('./util/httpError');

const { cloudinary } = require('./middleware/fileUpload');

const userRoutes = require('./routes/users');
const movieRoutes = require('./routes/movies');
const theatreRoutes = require('./routes/theatres');
const showRoutes = require('./routes/shows');
const bookingRoutes = require('./routes/bookings');

const app = express();

const port = process.env.PORT || 8080;

const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ucmm.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', [process.env.FRONTEND_URL]);
    res.setHeader(
        'Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res, next) => {
    return next(new HttpError("Page not found", 404));
});

app.use((error, req, res, next) => {
    if(req.image_id){
        cloudinary.uploader.destroy(req.image_id);
    }
    res.status(error.statusCode || 500).json({message:error.message || "Something went wrong. Try again later!", data:{}});
});

mongoose.connect(MONGODB_URI).
then((result) => {
    app.listen(port);
    console.log('Database connected!');
}).
catch((err) => {
    console.log(err);
});
