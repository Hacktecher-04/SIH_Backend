const mongoose = require('mongoose');

const aiSchema = mongoose.Schema({
    prompt : {
        type : String,
        required : true
    },
    response : {
        type : String,
        required : true
    }
},{timestamps : true})

const aiModel = mongoose.model('Ai', aiSchema)

module.exports = aiModel;