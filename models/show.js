const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const showSchema = new Schema({

    movie:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Movie',
        required:true
    },
    theatre:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Theatre',
        required:true
    },
    language:{
        type:String,
        required:true
    },
    start:{
        type:Date,
        required:true
    },
    end:{
        type:Date,
        required:true
    },
    ticketPrice:{
        type:Number,
        required:true
    },
    totalSeats:{
        type:Number,
        required:true
    },
    bookedSeats:{
        type:Array,
        default:[],
        required:false
    }
},
{timestamps: true});

module.exports = mongoose.model('Show', showSchema);