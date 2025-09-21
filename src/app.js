const express = require('express');
const userRouter = require('./routes/user.routes')
const aiRouter = require('./routes/ai.route')
const aiRoadmapRoutes = require('./routes/aiRoadmap.routes')
const http = require('http');
const cors = require('cors');
const socketIO = require('./socket/socket');
const passport = require('passport');
const session = require('express-session');
require('./config/passport'); // Import passport configuration

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin : [process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://prismaroadmap.netlify.app"
    ],
    withCrendentials : true
}));

socketIO(server)

app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', userRouter)
app.use('/api/ai', aiRouter)
app.use('/api/aiRoadmap', aiRoadmapRoutes)

module.exports = server;
