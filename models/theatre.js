const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const theatreSchema = new Schema({
    name: {
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    isApproved:{
        type:Boolean,
        required:true,
        default:false
    }
},
{timestamps: true});

module.exports = mongoose.model('Theatre', theatreSchema);