const socketIo = require('socket.io');

function setupSocketIo(server) {
    const io = socketIo(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            allowedHeaders: ['my-custom-header'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

    return io;
}

module.exports = setupSocketIo;