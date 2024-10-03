const Show = require('../models/show');
const Theatre = require('../models/theatre');
const Movie = require('../models/movie');

const HttpError = require('../util/httpError');

exports.createShow = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const start = req.body.start;
        const end = req.body.end;
        const movie = req.body.movie;
        const theatre = req.body.theatre;
        const showLanguage = req.body.language;
        const ticketPrice = Number(req.body.ticketPrice);
        const totalSeats = Number(req.body.totalSeats);

        if(!start || !end || !movie || !theatre || !ticketPrice || !totalSeats || !showLanguage){
            throw new HttpError('Provided details are invalid', 422);
        }
        
        if(ticketPrice < 0 || totalSeats <= 0){
            throw new HttpError('Provided details are invalid', 422);
        }

        const existingTheatre = await Theatre.findById(theatre);

        if(!existingTheatre){
            throw new HttpError('Theatre not found', 404);
        }

        const existingMovie = await Movie.findById(movie);

        if(!existingMovie){
            throw new HttpError('Movie not found!', 404);
        }

        const languageExists  = existingMovie.languages.findIndex((language) => {
            return language === showLanguage;
        })

        if(languageExists === -1){
            throw new HttpError('Language is not available for this movie', 404);
        }
        
        if(req.userId !== existingTheatre.owner.toString()){
            throw new HttpError('You are authorized to perform this action', 403);
        }

        const overlappingShow = await Show.findOne({
            $or: [ 
                {start : { $gte: start, $lte: end }},
                {end : { $gte: start, $lte: end }}
            ],
            theatre: theatre
        });

        if(overlappingShow){
            throw new HttpError('Overlapping shows in selected start time');
        }

        const show = new Show({
            movie,
            theatre,
            start,
            end,
            language: showLanguage,
            ticketPrice: Math.ceil(ticketPrice),
            totalSeats: Math.floor(totalSeats)
        });

        await show.save();

        res.status(201).json({message: 'Show created successfully!', data: {showId: show._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.updateShow = async (req, res, next) => {
    
    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const showId = req.params.showId;

        const start = req.body.start;
        const end = req.body.end;
        const movie = req.body.movie;
        const showLanguage = req.body.language;
        const theatre = req.body.theatre;
        const ticketPrice = req.body.ticketPrice;
        const totalSeats = req.body.totalSeats;

        if(!start || !end || !movie || !theatre || !ticketPrice || !totalSeats || !showLanguage){
            throw new HttpError('Provided details are invalid', 422);
        }
        
        if(ticketPrice < 0 || totalSeats <= 0){
            throw new HttpError('Provided details are invalid', 422);
        }

        const existingTheatre = await Theatre.findById(theatre);

        if(!existingTheatre){
            throw new HttpError('Theatre not found', 404);
        }

        const existingMovie = await Movie.findById(movie);

        if(!existingMovie){
            throw new HttpError('Movie not found!', 404);
        }

        const languageExists  = existingMovie.languages.findIndex((language) => {
            return language === showLanguage;
        })

        if(languageExists === -1){
            throw new HttpError('Language is not available for this movie', 404);
        }
        
        if(req.userId !== existingTheatre.owner.toString()){
            throw new HttpError('You are authorized to perform this action', 403);
        }
        
        const show = await Show.findById(showId);
        
        if(!show){
            throw new HttpError('Show not found!', 404);
        }

        if(show.bookedSeats.length > 0){
            throw new HttpError('Cannot edit this show as bookings have already started!', 422);
        }

        const overlappingShow = await Show.findOne({
            _id: { $ne: showId},
            $or: [ 
                {start : { $gte: start , $lte: end }},
                {end : { $gte: start, $lte: end }}
            ]
        });

        if(overlappingShow){
            throw new HttpError('Overlapping shows in selected start time');
        }

        show.movie = movie;
        show.theatre = theatre;
        show.language = showLanguage;
        show.start = start;
        show.end = end;
        show.ticketPrice = Math.ceil(ticketPrice);
        show.totalSeats = Math.floor(totalSeats);

        await show.save();

        res.status(200).json({message: 'Show updated successfully!', data: {showId: show._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.deleteShow = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const showId = req.params.showId;
        
        const show = await Show.findById(showId);
        
        if(!show){
            throw new HttpError('Show not found!', 404);
        }
        
        if(new Date(show.start) > new Date() && show.bookedSeats.length > 0){
            throw new HttpError('Cannot delete this upcoming show as bookings have already started!', 422);
        }

        await Show.findByIdAndDelete(showId);

        res.status(200).json({message: 'Show deleted successfully!', data: {}});
    }
    catch(err){
        return next(err);
    }
}

exports.getShowById = async (req, res, next) => {

    try{

        const showId = req.params.showId;

        const show = await Show.findById(showId)?.populate(['movie', 'theatre']);

        if(!show){
            throw new HttpError('Show not found!', 404);
        }

        res.status(200).json({message:'Show fetched successfully!', data:{show}});
    }
    catch(err){
        return next(err);
    }
}

exports.getShowsByTheatreId = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to visit this page', 403);
        }

        const page = req.query.page;
        const perPage = req.query.limit;

        const theatreId = req.params.theatreId;

        const existingTheatre = await Theatre.findById(theatreId);

        if(!existingTheatre){
            throw new HttpError('Theatre not found!', 404);
        }

        const totalShowsCount = await Show.countDocuments({theatre: theatreId});
        
        let totalPages = Math.floor(totalShowsCount / perPage);

        if((totalShowsCount % perPage) !== 0){
            totalPages++;
        }

        const shows = await Show.find({theatre: theatreId}).
                                sort({start : 'ascending'}).
                                skip((page- 1) * perPage).
                                limit(perPage).
                                populate(['movie', 'theatre']);

        const filteredShows = shows.filter((show) => {
            return show.theatre !== null && show.movie !== null;
        });

        res.status(200).json({message: 'Fetched shows successfully!', data:{shows: filteredShows, totalPages}});
    }
    catch(err){
        return next(err);
    }
}

exports.getShowsByQuery = async (req, res, next) => {

    try{

        const movieId = req.params.movieId;
        const date = req.params.date;
        const language = req.params.language;

        const existingMovie = await Movie.findById(movieId);

        if(!existingMovie){
            throw new HttpError('Movie not found!', 404);
        }

        const languageExists  = existingMovie.languages.findIndex((movieLanguage) => {
            return movieLanguage === language;
        });

        if(languageExists === -1){
            throw new HttpError('Language is not available for this movie', 404);
        }

        const startDate = new Date(date);
        const endDate = new Date(date);
        
        startDate.setHours(0, 0, 0);
        endDate.setHours(23, 59, 59);

        if(startDate.getDate() === new Date().getDate()){
            startDate.setHours(new Date().getHours(), new Date().getMinutes());
        }

        const allShows = await Show.find({movie: movieId, start: { $gte: startDate, $lt: endDate}, language: language }).
                                    populate(['theatre', 'movie']).
                                    sort({start:'ascending'});

        const showsMap = {};

        for(let show of allShows){

            const theatreId = show.theatre._id;

            if(!showsMap[theatreId]){
                showsMap[theatreId] = {
                    theatre: show.theatre,
                    showList:[]
                };
            }

            showsMap[theatreId].showList.push(show);
        }

        res.status(200).json({message: 'Fetched shows successfully!', data:{shows: showsMap}});
    }
    catch(err){
        return next(err);
    }
}