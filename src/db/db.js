const mongoose = require('mongoose');

function connectToDb() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    mongoose.connect(process.env.MONGODB_URI)
    .then(()=> {
        console.log('Connected to MongoDB');
    }).catch((error)=> {
        console.log('Error connecting to MongoDB', error);
    })
}

module.exports = connectToDb;