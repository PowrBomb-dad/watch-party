const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let queue = ['XKWbUJh3Nks']; 

io.on('connection', (socket) => {
    // Send the queue list immediately so they see what's coming up
    socket.emit('update_queue', queue);

    const activeSockets = Array.from(io.sockets.sockets.values());

    // FIX: Instead of always sending 'sync_video' (which triggers a refresh),
    // we only do it if they are the FIRST person. 
    // If others are already there, we ask the Host for the time instead.
    if (activeSockets.length > 1) {
        // Request time from Host; the return_time logic below will handle the rest
        activeSockets[0].emit('get_time', socket.id);
    } else {
        // First person joins? Load the default video
        socket.emit('sync_video', { videoId: queue[0] });
    }

    socket.on('return_time', (data) => {
        // When the host returns time, we also include the current videoId
        // to ensure the newcomer is on the exact same page
        io.to(data.to).emit('sync_video', { videoId: queue[0] });
        io.to(data.to).emit('sync_action', { status: 1, time: data.time });
    });

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