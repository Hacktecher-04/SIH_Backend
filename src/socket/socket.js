const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const messageService = require('../services/message.service');

function setupSocketIo(server) {
    const io = socketIo(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.headers.authorization;
            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });


    io.on('connection', (socket) => {
        socket.on('message', async(data) => {
            try {

                const { message, chatId } = JSON.parse(data);
                const response = await messageService.createMessage(message, chatId, socket.user._id);
                io.to(socket.id).emit('message', response);
            } catch (error) {
                io.to(socket.id).emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

    return io;
}

module.exports = setupSocketIo;