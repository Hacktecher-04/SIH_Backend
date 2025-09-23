const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    chatId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Chat',
        required : true
    },
    role : {
        type : String,
        enum : ['user','ai'],
        default : 'user'
    },
    content : {
        type : String,
        required : true
    }
},{timestamps : true})

const messageModel = mongoose.model('Message', messageSchema)

module.exports = messageModel;