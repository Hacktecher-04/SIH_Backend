require('dotenv').config();
const server = require('./src/app');
const connectToDb = require('./src/db/db')

connectToDb();
const Port = process.env.PORT || 3000;

server.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
})