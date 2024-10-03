const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const movieSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true,
    },
    genres:[{
        type:String,
        required:true
    }],
    languages:[{
        type:String,
        required:true
    }],
    releaseDate:{
        type:Date,
        required:true
    },
    certificate:{
        type:String,
        required:true
    },
    poster:{
        id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    rating:{
        type:Number,
        default:0
    }
}, {timestamps: true});

module.exports = mongoose.model('Movie', movieSchema);