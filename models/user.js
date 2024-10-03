const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    dateOfBirth:{
        type:Date,
        required:true
    },
    image:{
        id:{
            type:String,
        },
        url:{
            type:String
        }
    },
    role:{
        type:String,
        enum:["user", "admin", "partner"],
        default:"user",
        required:true
    },
    otp:{
        type:Number
    },
    otpExpiry:{
        type:Date
    }
},
{timestamps: true});

module.exports = mongoose.model('User', userSchema);

