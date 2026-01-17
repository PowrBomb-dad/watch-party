const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Serve your HTML file to your friends
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('A friend joined the party!');

    // When someone hits play/pause, send it to everyone else
    socket.on('video_action', (data) => {
        socket.broadcast.emit('sync_action', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});