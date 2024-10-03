const ms = require('ms');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Theatre = require('../models/theatre');

const HttpError = require('../util/httpError');
const emailSender = require('../util/emailSender');

const { cloudinary } = require('../middleware/fileUpload');

const generateRandomOtp= (minVal, maxVal) => {

    const min = Math.ceil(minVal);
    const max = Math.floor(maxVal);

    const val = Math.floor((Math.random() * (max - min + 1)) + min);

    return val;
}

exports.signup = async (req, res, next) => {

    try{
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password?.trim();
        const dateOfBirth = req.body.dateOfBirth;
        const role = req.body.role

        if(name.length === 0 || email.length < 5 || !email.includes('@') || password.length < 6 || !dateOfBirth || (role !== "user" && role !== "partner")){
            throw new HttpError("Provided credentials are invalid", 422);
        }

        const existingUser = await User.findOne({email});

        if(existingUser){
            throw new HttpError("User with this email already exists!", 403);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            image: null,
            role:role
        });

        await user.save();

        res.status(201).json({message:"Signed up successfully!", data:{userId: user._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.login = async (req, res, next) => {

    try{

        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password?.trim();

        const user = await User.findOne({email});

        if(!user){
            throw new HttpError("Invalid Email", 422);
        }

        const passwordMatched = await bcrypt.compare(password, user.password);

        if(!passwordMatched){
            throw new HttpError("Invalid Password", 422);
        }

        const pendingTheatreRequests = await Theatre.find({isApproved : false})?.countDocuments();

        const expires = '24h';

        const token = jwt.sign(
            {userId: user._id, userRole: user.role},
            process.env.JWT_KEY,
            {expiresIn: expires}
        );

        res.status(200).json({
            message: "Logged in successfully!", 
            data: {
                userId: user._id, 
                userEmail: user.email, 
                userName:user.name,
                userDob: user.dateOfBirth,
                userRole: user.role,
                userImage: user.image ? user.image.url : null,
                pendingTheatreRequests,
                token,
                expires:ms(expires)
            }
        });
    }
    catch(err){
        return next(err);
    }
}

exports.forgotPassword = async (req, res, next) => {

    try{

        const email = req.body?.email?.trim()?.toLowerCase();

        const user = await User.findOne({email: email});

        if(!user){
            throw new HttpError('No user found with the given email!', 404);
        }

        const otp = generateRandomOtp(1_00_000, 9_99_999);

        const otpExpiry = Date.now() + 15*60*1000;

        const creds = {
            name: user.name,
            otp:otp
        }

        await emailSender('otp.html', user.email, creds, 'RESET PASSWORD OTP VERIFICATION');

        user.otp = otp;
        user.otpExpiry = new Date(otpExpiry);

        await user.save();

        res.status(200).json({message: 'OTP has been sent to your email!', data:{}});
    }
    catch(err){
        return next(err);
    }
}

exports.changePassword = async (req, res, next) => {

    try{

        const email = req.body?.email?.trim()?.toLowerCase();

        const password = req.body?.password?.trim();

        const otp = Number(req.body.otp);

        if(!email || !password || !otp || password.length < 6){
            throw new HttpError('Provided details are invalid', 422);
        }

        const user = await User.findOne({email: email});

        if(!user){
            throw new HttpError('No user found with the given email!', 404);
        }
        
        if(!user.otp || !user.otpExpiry || new Date() > new Date(user.otpExpiry)){
            throw new HttpError('Otp has been expired!', 422);
        }

        if(user.otp !== otp){
            throw new HttpError('Incorrect otp!', 422);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();

        res.status(200).json({message: 'Password has changed successfully!', data:{userId : user._id}});
    }
    catch(err){
        return next(err);
    }
}

exports.getUserProfile = async (req, res, next) => {

    try{

        const userId = req.userId;

        const user = await User.findById(userId).select('-password');

        if(!user){
            throw new HttpError('User not found!', 404);
        }

        res.status(200).json({message:'Profile fetched successfully!', data:user});
    }
    catch(err){
        return next(err);
    }
}

exports.changeProfilePicture = async (req, res, next) => {

    try{

        const userId = req.userId;

        const image = req.file;

        if(!image){
            throw new HttpError('Provided files are invalid', 422);
        }

        const user = await User.findById(userId);

        if(!user){
            throw new HttpError('User not found!', 404);
        }

        if(user.image && user.image.id){
            await cloudinary.uploader.destroy(user.image.id);
        }

        const result = await cloudinary.uploader.upload(image.path, {
            folder:"flickTickets/profiles"
        });

        user.image = {
            id: result.public_id,
            url: result.secure_url
        };

        await user.save();

        res.status(200).json({message:'Profile picture updated successfully!', data:{userId: user._id}});
    }
    catch(err){
        return next(err);
    }
}