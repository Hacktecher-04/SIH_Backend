const express = require('express');
const userRouter = require('./routes/user.routes')
const aiRouter = require('./routes/ai.route')
const aiRoadmapRoutes = require('./routes/aiRoadmap.routes')
const http = require('http');
const cors = require('cors');
const socketIO = require('./socket/socket');

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin : 'https://prismaroadmap.netlify.app',
    withCrendentials : true
}));

socketIO(server)

app.use(express.json());

app.use('/api/auth', userRouter)
app.use('/api/ai', aiRouter)
app.use('/api/aiRoadmap', aiRoadmapRoutes)

module.exports = server;
