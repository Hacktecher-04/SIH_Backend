const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true 
    },
    chat_title : {
        type : String,
        required : true
    }
})

const chatModel = mongoose.model('Chat', chatSchema);

module.exports = chatModel;
