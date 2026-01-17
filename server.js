const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let queue = ['XKWbUJh3Nks']; 

io.on('connection', (socket) => {
    // Sync new user with current state
    socket.emit('sync_video', { videoId: queue[0] });
    socket.emit('update_queue', queue);

    socket.on('chat_message', (data) => {
        io.emit('display_message', data); 
    });

    socket.on('add_to_queue', (videoId) => {
        queue.push(videoId);
        io.emit('update_queue', queue);
    });

    socket.on('next_video', () => {
        if (queue.length > 1) {
            queue.shift();
            io.emit('sync_video', { videoId: queue[0] });
            io.emit('update_queue', queue);
        }
    });

    socket.on('change_video', (data) => {
        queue = [data.videoId];
        io.emit('sync_video', data);
        io.emit('update_queue', queue);
    });

    socket.on('video_action', (data) => {
        socket.broadcast.emit('sync_action', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server running on port ' + PORT));