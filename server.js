const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// The server's memory is now a list
let queue = ['XKWbUJh3Nks']; 

io.on('connection', (socket) => {
    console.log('A friend joined!');

    // Send the current video and the full list to the new person
    socket.emit('sync_video', { videoId: queue[0] });
    socket.emit('update_queue', queue);

    socket.on('video_action', (data) => {
        socket.broadcast.emit('sync_action', data);
    });

    socket.on('add_to_queue', (videoId) => {
        queue.push(videoId);
        io.emit('update_queue', queue);
    });

    socket.on('next_video', () => {
        if (queue.length > 1) {
            queue.shift(); // Remove finished video
            io.emit('sync_video', { videoId: queue[0] });
            io.emit('update_queue', queue);
        }
    });

    socket.on('change_video', (data) => {
        queue = [data.videoId]; // Reset queue to just this new video
        io.emit('sync_video', data);
        io.emit('update_queue', queue);
    });

    socket.on('chat_message', (data) => {
        io.emit('display_message', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});