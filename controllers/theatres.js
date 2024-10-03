const Theatre = require('../models/theatre');
const User = require('../models/user');
const Show = require('../models/show');

const HttpError = require('../util/httpError');

exports.getAllTheatres = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin'){
            throw new HttpError('You are not authorized to visit this page', 403);
        }

        const page = Number(req.query.page);
        const perPage = Number(req.query.limit);


        const totalTheatresCount = await Theatre.countDocuments();

        const theatres = await Theatre.find({isApproved: true}).
                            sort({ createdAt: -1 }).
                            skip((page-1) * perPage).
                            limit(perPage).
                            populate('owner', '-password');
        
        let totalPages = Math.floor(totalTheatresCount / perPage);

        if((totalTheatresCount % perPage) !== 0){
            totalPages++;
        }

        res.status(200).json({message: "Theatres fetched successfully!", data: {totalPages, theatres}});
    }
    catch(err){
        return next(err);
    }
}

exports.getUserTheatres = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
        }
        
        const userId = req.params.userId;
        
        if(userId !== req.userId){
            throw new HttpError('You are not authorized to visit this page', 403);
        }

        const theatres = await Theatre.find({owner: userId}).
                                populate('owner', '-password').
                                sort({createdAt: -1});

        res.status(200).json({message:"Theatres fetched successfully", data:{theatres}});

    }
    catch(err){
        return next(err);
    }
}

exports.getTheatreById = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to visit this page', 403);
        }

        const theatreId = req.params.theatreId;

        const theatre = await Theatre.findById(theatreId)?.populate('owner', '-password');

        if(!theatre){
            throw new HttpError('Theatre not found!', 404);
        }

        res.status(200).json({message:'Theatre fetched successfully!', data:{theatre}});
    }
    catch(err){
        return next(err);
    }
}

exports.getTheatreRequests = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin'){
            throw new HttpError('You are not authorized to visit this page', 403);
        }
        
        const theatres = await Theatre.find({isApproved: false})?.populate('owner', '-password');

        res.status(200).json({message:'Fetched theatre requests', data:{theatres}});
    }
    catch(err){
        return next(err);
    }
}

exports.createTheatre = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const name = req.body.name?.trim();
        const address = req.body.address?.trim();
        const phone = req.body.phone;

        if(!name || name.length === 0 || !address || address.length === 0 || !phone || phone.length !== 10){
            throw new HttpError('Provided details are invalid', 422);
        }
        
        const user = await User.findById(req.userId);
        
        if(!user || user.role === 'user'){
            throw new HttpError('Invalid user', 422);
        }

        const theatre = new Theatre({
            name,
            address,
            phone,
            owner:req.userId,
        });

        await theatre.save();

        res.status(201).json({message:'Theatre Created successfully!', data:{theatre}});
    }
    catch(err){
        return next(err);
    }
}

exports.updateTheatre = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }
        
        const theatreId = req.params.theatreId;
        
        const theatre = await Theatre.findById(theatreId);
        
        if(!theatre){
            throw new HttpError('Theatre not found!', 404);
        }
        
        if(theatre.owner.toString() !== req.userId.toString()){
            throw new HttpError('You are not authorized to perform this action', 403);
        }

        const name = req.body.name?.trim();
        const address = req.body.address?.trim();
        const phone = req.body.phone;

        if(!name || name.length === 0 || !address || address.length === 0 || !phone){
            throw new HttpError('Provided details are invalid', 422);
        }

        theatre.name = name;
        theatre.address = address;
        theatre.phone = phone;

        await theatre.save();

        res.status(200).json({message:'Theatre updated successfully!', data:{theatreId: theatre._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.approveTheatre = async (req, res, next) => {

    try{

        const theatreId = req.params.theatreId;

        if(req.userRole !== 'admin'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }
        
        const theatre =  await Theatre.findById(theatreId);
        
        if(!theatre){
            throw new HttpError('Theatre not found', 404);
        }

        theatre.isApproved = true;

        await theatre.save();

        res.status(200).json({message:"Theatre approved successfully", data:{theatreId: theatre._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.deleteTheatre = async (req, res, next) => {

    try{

        if(req.userRole !== 'admin' && req.userRole !== 'partner'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }
        
        const theatreId = req.params.theatreId;
        
        const theatre = await Theatre.findById(theatreId);
        
        if(!theatre){
            throw new HttpError('Theatre not found', 404);
        }

        if(theatre.owner.toString() !== req.userId.toString() && req.userRole !== 'admin'){
            throw new HttpError('You are not authorized to perform this action', 403);
        }
        
        const show = await Show.findOne({theatre: theatre._id, start: {$gt : new Date()}});
        
        if(show){
            throw new HttpError('Cannot delete this theatre as there are some upcoming shows!', 422);
        }

        const relatedShows = await Show.find({theatre: theatre._id}).select('_id');

        await Show.deleteMany({ _id : { $in : relatedShows} });

        await Theatre.findByIdAndDelete(theatreId);

        res.status(200).json({message:'Theatre deleted/declined successfully!', data:{}});
    }
    catch(err){
        return next(err);
    }
}