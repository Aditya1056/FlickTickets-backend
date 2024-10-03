const crypto = require('crypto');

const Razorpay = require('razorpay');
const moment = require('moment');

const Booking = require('../models/booking');
const Show = require('../models/show');
const Movie = require('../models/movie');
const Theatre = require('../models/theatre');
const User = require('../models/user');

const HttpError = require('../util/httpError');

const emailSender = require('../util/emailSender');
const generatePdfBuffer = require('../util/pdfGenerator');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET
});

const getTime = (date) => {

    let hours = date.getHours();
    let minutes = date.getMinutes();

    let formatHours = hours > 12 ? hours % 12 : hours;

    if(formatHours === 0){
        formatHours = 12;
    }

    formatHours = formatHours < 10 ? '0' + formatHours : formatHours;

    let formatMinutes = minutes < 10 ? '0' + minutes : minutes;

    let time = formatHours + ':' + formatMinutes + ' ';

    time = hours >= 12 ? time + 'PM' : time + 'AM';

    return time;
}

const getSeatNumber = (totalSeats, seat) => {

    const rows = Math.ceil(totalSeats / 20);

    const currRow = Math.ceil(seat / 20);

    const col = seat % 20;

    const seatNumber = `${String.fromCharCode(65 + (rows - currRow))}${col}`;

    return seatNumber;
}

exports.getBookingByUser = async (req, res, next) => {

    try{
        const userId = req.userId;
    
        const upcoming = req.query.upcoming;
        const limit = req.query.limit;
    
        const date = new Date();
    
        let matchQuery = {start : { $gt: date }};
    
        if(upcoming === 'false'){
            matchQuery = {start : { $lt : date }};
        }
    
        const bookings = await Booking.find({user: userId, }).
                                        populate({
                                            path: 'show',
                                            match: matchQuery,
                                            populate:[
                                                { path: 'movie', model: Movie },
                                                { path: 'theatre', model: Theatre }
                                            ]
                                        }).
                                        limit(limit);
    
        const filteredBookings = bookings.filter(booking => booking.show !== null);
    
        const sortedBookings = filteredBookings.sort((a, b) => {
    
            if(upcoming === 'false'){
                return (new Date(b.show.start) - new Date(a.show.start));
            }
    
            return (new Date(a.show.start) - new Date(b.show.start));
        });
    
        res.status(200).json({message:"Fetched bookings of user successfully!", data: {bookings: sortedBookings}});
    }
    catch(err){
        return next(err);
    }
}

exports.createOrder = async (req, res, next) => {

    try{

        const amount = req.body.amount;
        const showId = req.body.showId;
        const selectedSeats = req.body.selectedSeats;

        if(!showId || !selectedSeats || selectedSeats.length === 0){
            throw new HttpError('Provided details are invalid', 422);
        }

        const show = await Show.findById(showId);

        if(!show){
            throw new HttpError('Show does not exist', 404);
        }
        
        if(new Date(show.start) < new Date()){
            throw new HttpError('This show has already completed!', 422);
        }

        const bookedSeats = selectedSeats.filter((seat) => {
            return show.bookedSeats.includes(seat);
        });

        if(bookedSeats.length > 0){
            throw new HttpError('Selected seats are already booked! Try others', 422);
        }
    
        const options = {
            amount: amount*100,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };
    
        const order = await razorpay.orders.create(options);
    
        const orderDetails = {
            orderId: order.id,
            amount:order.amount,
        };
    
        res.status(201).json({message:"Payment Initialized", data:{orderDetails}});
    }
    catch(err){
        return next(err);
    }
}

exports.verifyPayment = async (req, res, next) => {

    try{
        const showId = req.body.showId;
        const userId = req.userId;
        const selectedSeats = req.body.selectedSeats;
        const amount = req.body.amount;
        const orderId = req.body.orderId;
        const paymentId = req.body.paymentId;
        const signature = req.body.signature;

        if(!showId || !userId || !selectedSeats || selectedSeats.length === 0 || !amount || amount === 0 || !orderId || !paymentId || !signature){
            throw new HttpError('Provided details are invalid', 422);
        }

        const body = orderId + '|' + paymentId;

        const expectedSignature = crypto.
                                createHmac('sha256', process.env.RAZORPAY_API_SECRET).
                                update(body).
                                digest('hex');

        if(expectedSignature !== signature){
            throw new HttpError('Payment verification failed. Try again!', 400);
        }

        const show = await Show.findById(showId)?.populate(['movie', 'theatre']);

        if(!show){
            throw new HttpError('Show does not exist', 404);
        }
        
        const user = await User.findById(userId);
        
        if(!user){
            throw new HttpError('User does not exist', 404);
        }

        const booking = new Booking({
            show: showId,
            user:userId,
            bookedSeats: selectedSeats,
            amount: amount,
            transactionId: paymentId
        });

        await booking.save();

        const updatedBookedSeats = [...show.bookedSeats, ...selectedSeats];

        show.bookedSeats = updatedBookedSeats;

        await show.save();

        selectedSeats.sort((a, b) => {
            return a - b;
        });

        let seats = '';

        selectedSeats.forEach((seat, index) => {
            seats += getSeatNumber(show.totalSeats, seat);
            if(index !== (selectedSeats.length - 1)){
                seats += ', ';
            }
        });

        const movieDetails = {
            title: show.movie.title,
            theatre: show.theatre.name,
            address: show.theatre.address,
            date: moment(new Date(show.start)).format('Do MMM YYYY'),
            time: getTime(new Date(show.start)),
            seats:seats,
            transactionId: paymentId
        }

        const pdfBuffer = await generatePdfBuffer(movieDetails);

        const attachment = {
            filename: 'booking.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
        }

        const creds = {
            name: user.name,
            title: show.movie.title,
            showTime: moment(new Date(show.start)).format('Do MMM YYYY')
        }

        await emailSender('ticket.html', user.email, creds, 'MOVIE BOOKING DETAILS', attachment);

        res.status(201).json({message:'Payment Successful. Ticket has been sent to your email!', data:{bookingId: booking._id}});
    }
    catch(err){
        return next(err);
    }
}