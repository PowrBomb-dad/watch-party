const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// This is the server's "Memory"
let currentVideoId = 'JzS96auqau0'; 

io.on('connection', (socket) => {
    console.log('A friend joined!');

    // Send the current video to the person who just joined
    socket.emit('sync_video', { videoId: currentVideoId });

    socket.on('video_action', (data) => {
        socket.broadcast.emit('sync_action', data);
    });

    socket.on('change_video', (data) => {
        currentVideoId = data.videoId; // Update memory
        io.emit('sync_video', data); // Tell EVERYONE to change
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});