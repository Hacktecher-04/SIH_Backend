const express = require('express');
const userRouter = require('./routes/user.routes')
const aiRouter = require('./routes/ai.route')
const http = require('http');
const cors = require('cors');
const socketIO = require('./socket/socket');

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin : 'http://localhost:3000',
    withCrendentials : true
}));

socketIO(server)

app.use(express.json());

app.use('/api/auth', userRouter)
app.use('/api/ai', aiRouter)

module.exports = server;