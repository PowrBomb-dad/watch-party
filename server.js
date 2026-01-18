const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let queue = ['VeblVdUKIcw']; 

io.on('connection', (socket) => {
    // Send the queue ONLY to the person who just joined
    socket.emit('update_queue', queue);

    const activeSockets = Array.from(io.sockets.sockets.values());

    // If there is already someone watching, ask them for the time
    if (activeSockets.length > 1) {
        // Find the "Host" (the person who has been here longest)
        // Request time from them, telling them exactly who needs it (socket.id)
        activeSockets[0].emit('get_time', socket.id);
    } else {
        // If they are the first person in the room, just load the video normally
        socket.emit('sync_video', { videoId: queue[0] });
    }

    // FIX: This listener now handles the response from the Host
    socket.on('return_time', (data) => {
        // We use io.to(data.to) to send the video data ONLY to the newcomer.
        // This prevents the video from restarting for the people already watching.
        io.to(data.to).emit('sync_video', { 
            videoId: queue[0], 
            time: data.time, 
            forceSync: true 
        });
        
        // Also send the 'play' status only to the newcomer
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
            // This IS a broadcast because we WANT everyone to move to the next video
            io.emit('sync_video', { videoId: queue[0] });
            io.emit('update_queue', queue);
        }
    });

    socket.on('change_video', (data) => {
        queue = [data.videoId];
        // This IS a broadcast because we WANT everyone to switch videos immediately
        io.emit('sync_video', data);
        io.emit('update_queue', queue);
    });

    socket.on('video_action', (data) => {
        // Use broadcast.emit so the person who paused/played doesn't get their own event back
        socket.broadcast.emit('sync_action', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server running on port ' + PORT));