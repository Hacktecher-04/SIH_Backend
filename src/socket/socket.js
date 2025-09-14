const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

function setupSocketIo(server) {
    const io = socketIo(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            allowedHeaders: ['my-custom-header'],
            credentials: true
        }
    });

    // io.on(('connection'), (socket, next) => {
    //     const token = socket.headers;
    //     if (!token) {
    //         return next(new Error('Authentication error'));
    //     }
    //     console.log(token)

    //     jwt.verify(token, 'your_secret_key', (err, decoded) => {
    //         if (err) {
    //             return next(new Error('Authentication error'));
    //         }

    //         socket.decoded = decoded;
    //         next();
    //     });
    //     next();
    // })

    io.on('connection', (socket) => {
        socket.on('message', async(message) => {
            console.log(message);
            const response = await aiService();
            console.log(response);
            io.emit('message', response);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

    return io;
}

module.exports = setupSocketIo;