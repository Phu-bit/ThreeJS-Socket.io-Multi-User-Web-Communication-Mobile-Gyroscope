import { instrument } from '@socket.io/admin-ui';
import { fileURLToPath } from 'url';
import {dirname} from 'path';
import express from 'express';
import https from 'https';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

/**  
 **@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 ** @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 ** Boilerplate code for the server below 
 */


const certPath = '../install+7.pem';
const keyPath = '../install+7-key.pem';

const options = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
};

const app = express();

const server = https.createServer(options, app);
const io = new Server(server, { 
    cors: {
        origin: ['https://192.168.0.108:5173/','https://localhost:5173','https://admin.socket.io','localhost', 'https://10.201.38.152:3000'],
    },

});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static('public'))
app.get('/', (req, res) => {res.sendFile(__dirname + '/index2.html');});

/** Boilerplate code for the server above 
 **@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 ** @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 ** Server functionality code below 
 */


// store users in an array
const USERS = [];

server.on('secureConnection', (socket) => {
    console.log(`Secure connection established: ${socket.remoteAddress}`);
});


// on connection, log the user's ID and add them to the array
io.on('connection', (socket) => {
    console.log(`a user connected ID: ${socket.id}`);
    
    // Assign a random position for the new user
    const newUser = {
        id: socket.id,
        pos: [Math.random(), Math.random(), Math.random()],
        rot: [0, 0, 0, 1] // Default quaternion for no rotation
    };
    
    USERS.push(newUser);
    
    // Send existing players and the new user's ID to the new user
    socket.emit('setup', { players: USERS, id: socket.id });
    
    // Notify others of the new user
    socket.broadcast.emit('pos', newUser);

    socket.on('update', (data) => {
        const user = USERS.find(u => u.id === data.id);
        if (user) {
            user.pos = data.pos;
            user.rot = data.rot; // Save rotation data
            socket.broadcast.emit('update', data); // Broadcast updated position and rotation
        }
    });

    //debug
    socket.on('message', (msg) => {
        console.log(msg);
    })
    
    // on disconnect, remove the user from the array and notify others so they can remove the user from their scene
    socket.on('disconnect', () => {
        const index = USERS.findIndex(user => user.id === socket.id); // AI code to remove user from array
        if (index !== -1) {
            USERS.splice(index, 1);
            io.emit('user disconnected', socket.id);
        }
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(3000, () => console.log('Server is running on *:3000'));

instrument(io, { auth: false });