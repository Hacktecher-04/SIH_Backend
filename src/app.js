const express = require('express');
const http = require('http');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('./config/passport');

const userRouter = require('./routes/user.routes');
const researchCareerRoutes = require('./routes/researchCareer.routes');
const suggestSkillsRoutes = require('./routes/suggestSkills.routes');
const aiRoadmapRoutes = require('./routes/aiRoadmap.routes');
const chatRoutes = require('./routes/chat.routes');
const socket = require('./socket/socket');


const app = express();
const server = http.createServer(app);

// 0️⃣ Let express know it’s behind a proxy (Render / Heroku / etc.)
app.set('trust proxy', 1);

// 1️⃣ CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000', "https://prismroadmap.netlify.app"],
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

socket(server);

// 4️⃣ Routes
app.use('/api/auth', userRouter);
app.use('/api/researchCareer', researchCareerRoutes)
app.use('/api/suggestSkills', suggestSkillsRoutes)
app.use('/api/aiRoadmap', aiRoadmapRoutes);
app.use('/api/chat', chatRoutes);

module.exports = server;
