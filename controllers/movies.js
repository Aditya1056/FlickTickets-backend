const Movie = require('../models/movie');
const Show = require('../models/show');

const HttpError = require('../util/httpError');

const { cloudinary } = require('../middleware/fileUpload');

exports.getAllMovies = async (req, res, next) => {

    try{
        
        const page = Number(req.query.page) ? Number(req.query.page) : 1;
        const perPage = Number(req.query.limit) ? Number(req.query.limit) : undefined;
        
        const totalMoviesCount = await Movie.countDocuments();

        const movies = await Movie.find().
                            sort({ releaseDate: -1, updatedAt: -1 }).
                            skip((page-1) * perPage).
                            limit(perPage);
        
        let totalPages = Math.floor(totalMoviesCount / perPage);

        if((totalMoviesCount % perPage) !== 0){
            totalPages++;
        }

        res.status(200).json({message: "Movies fetched successfully!", data: {totalPages, movies}});
    }
    catch(err){
        return next(err);
    }
}

exports.getMoviesByQuery = async (req, res, next) => {

    try{
        
        const searchTerm = req.query.searchTerm?.trim()?.toLowerCase();
    
        const movies = await Movie.find().
                            sort({ releaseDate: -1, updatedAt: -1 });
        
        
        const filteredMovies = movies.filter((movie) => {
            return movie.title.toLowerCase().includes(searchTerm);
        })
    
        res.status(200).json({message: "Movies fetched successfully!", data: {movies: filteredMovies}});
    }
    catch(err){
        return next(err);
    }
}

exports.getMovieById = async (req, res, next) => {

    try{

        const movieId = req.params.movieId;

        const movie = await Movie.findById(movieId);

        if(!movie){
            throw new HttpError('Movie does not exist!', 404);
        }

        res.status(200).json({message: "Movie fetched successfully!", data:{movie}});
    }
    catch(err){
        return next(err);
    }
}

exports.createMovie = async (req, res, next) => {

    try{

        if(req.userRole !== "admin"){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const title = req.body.title?.trim();
        const description = req.body.description?.trim();
        const duration = req.body.duration;
        const releaseDate = req.body.releaseDate;
        const certificate = req.body.certificate;
        let genres = req.body.genres;
        let languages = req.body.languages;
        
        const poster = req.file;

        if(!title && !description && !duration && !genres && !languages && !releaseDate && !certificate && !poster){
            throw new HttpError('Provided details are invalid', 422);
        }

        genres = JSON.parse(genres);
        languages = JSON.parse(languages);

        if(title.length === 0 && description.length === 0 && duration === 0 && genres.length === 0 && languages.length === 0 && certificate.length === 0){
            throw new HttpError('Provided details are invalid', 422);
        }

        const result = await cloudinary.uploader.upload(poster.path, {
            folder:'flickTickets/posters'
        });

        req.image_id = result.public_id;

        const movie = new Movie({
            title,
            description,
            duration,
            genres,
            languages,
            releaseDate,
            certificate,
            poster:{
                id: result.public_id,
                url:result.secure_url
            }
        });

        await movie.save();

        res.status(201).json({message: `${title} movie created successfully!`, data: {userId : movie._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.updateMovie = async (req, res, next) => {

    try{

        if(req.userRole !== "admin"){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const movieId = req.params.movieId;

        const title = req.body.title?.trim();
        const description = req.body.description?.trim();
        const duration = req.body.duration;
        const releaseDate = req.body.releaseDate;
        const certificate = req.body.certificate;
        let genres = req.body.genres;
        let languages = req.body.languages;

        const poster = req.file;

        if(!title && !description && !duration && !genres && !languages && !releaseDate && !certificate){
            throw new HttpError('Provided details are invalid', 422);
        }

        genres = JSON.parse(genres);
        languages = JSON.parse(languages);

        if(title.length === 0 && description.length === 0 && duration === 0 && genres.length === 0 && languages.length === 0 && certificate.length === 0){
            throw new HttpError('Provided details are invalid', 422);
        }

        const movie = await Movie.findById(movieId);

        if(!movie){
            throw new HttpError('Movie does not exist', 404);
        }

        const shows = await Show.findOne({movie: movie._id});
        
        if(shows){

            if(new Date(movie.releaseDate).getTime() !== new Date(releaseDate).getTime()){
                throw new HttpError('Cannot change release date as shows have been already added in theatres!', 422);
            }
            
            const removedLangs = movie.languages.filter((language) => {
                return (!languages.includes(language));
            });
            
            if(removedLangs.length > 0){
                throw new HttpError('Cannot remove existing languages as shows have been already added in theatres!', 422);
            }
        }

        let result = {
            public_id: movie.poster.id,
            secure_url: movie.poster.url
        }

        if(poster){
            await cloudinary.uploader.destroy(movie.poster.id);
            result = await cloudinary.uploader.upload(poster.path, {
                folder:'flickTickets/posters'
            });
            req.image_id = result.public_id;
        }

        movie.title = title;
        movie.description = description;
        movie.duration = duration;
        movie.genres = genres;
        movie.languages = languages;
        movie.releaseDate = releaseDate;
        movie.certificate = certificate;
        movie.poster = {
            id: result.public_id,
            url: result.secure_url
        };

        await movie.save();

        res.status(201).json({message: `${title} movie updated successfully!`, data: {userId : movie._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.deleteMovie = async (req, res, next) => {

    try{

        if(req.userRole !== "admin"){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const movieId = req.params.movieId;

        const movie = await Movie.findById(movieId);

        if(!movie){
            throw new HttpError('Movie does not exist!', 404);
        }

        const show = await Show.findOne({movie: movie._id, start: { $gt : new Date()}});
        
        if(show){
            throw new HttpError('Cannot delete this movie as there are upcoming shows in theatres!');
        }

        const shows = await Show.find({movie : movie._id}).select('_id');

        await Show.deleteMany({_id : { $in : shows}});

        await cloudinary.uploader.destroy(movie.poster.id);

        await movie.deleteOne();

        res.status(200).json({message: "Movie deleted successfully", data:{}});
    }
    catch(err){
        return next(err);
    }
}