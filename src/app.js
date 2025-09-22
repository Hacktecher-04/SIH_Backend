const express = require('express');
const http = require('http');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('./config/passport');

const userRouter = require('./routes/user.routes');
const aiRouter = require('./routes/ai.route');
const aiRoadmapRoutes = require('./routes/aiRoadmap.routes');

const app = express();
const server = http.createServer(app);

// 0️⃣ Let express know it’s behind a proxy (Render / Heroku / etc.)
app.set('trust proxy', 1);

// 1️⃣ CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// 2️⃣ Session (MUST have secure + sameSite in production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true on Render
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 3️⃣ Passport
app.use(passport.initialize());
app.use(passport.session());

// 4️⃣ Routes
app.use('/api/auth', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/aiRoadmap', aiRoadmapRoutes);

module.exports = server;