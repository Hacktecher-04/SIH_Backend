const express = require('express');
const http = require('http');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('./config/passport'); // has serialize/deserialize + strategy

const userRouter = require('./routes/user.routes');
const aiRouter = require('./routes/ai.route');
const aiRoadmapRoutes = require('./routes/aiRoadmap.routes');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [process.env.FRONTEND_URL ||'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// 1️⃣ session middleware FIRST
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false
}));

// 2️⃣ then passport
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use('/api/auth', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/aiRoadmap', aiRoadmapRoutes);

module.exports = server;
