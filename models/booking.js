const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    show:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Show',
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    bookedSeats:{
        type:Array,
        required:true
    },
    transactionId:{
        type:String,
        required:true
    }
},
{timestamps: true});

module.exports = mongoose.model('Booking', bookingSchema);
