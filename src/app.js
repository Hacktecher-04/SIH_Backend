const express = require('express');
const userRouter = require('./routes/user.routes')
const aiRouter = require('./routes/ai.route')

const app = express();

app.use(express.json());

app.use('/api/auth', userRouter)
app.use('/api/ai', aiRouter)

module.exports = app;