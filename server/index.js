const path = require('path');
const http = require('http');

const express = require('express');
const { Server, Socket } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {  
    res.sendFile( path.join(__dirname, 'public', 'index.html' ) );
});
app.get('/joy.js', (req, res) => {  
    res.sendFile( path.join(__dirname, 'public', 'joy.js' ) );
});

const cameras = [];
let cameraCount = 0;

io.on('connection', (socket) => {      
    const cameraIndex = cameraCount;
    cameraCount++;
    console.log( 'Camera connected:', cameraIndex );
    socket.emit('message', 'hello camera');   
    cameras[ cameraIndex ] = {
        index: cameraIndex,
        connected: true,
        socket: socket,
        controllerSocket: false,        
    };
    socket.on('disconnect', function(){
       cameras[cameraIndex].connected = false;
    });

});

const getNextFreeCameraIndex = function(){
    for( let i = 0; i < cameras.length; i++ ){
        if( cameras[i].controllerSocket === false ){
            return i;
        }
    }
    return -1;
}

io.of('/controller').on('connection', (socket) => {  
    const cameraIndex = getNextFreeCameraIndex();
    console.log( 'controller connection' );
    console.log('cameraIndex? ', cameraIndex );
    if( cameraIndex > -1 ){
        cameras[cameraIndex].controllerSocket = socket;
        socket.emit('message', 'Connected to camera' + cameraIndex );    
        socket.on('control', function( data ){
            console.log('control: ', data );
            cameras[cameraIndex].socket.emit('control', data );
        });
        socket.on('disconnect', function(){
            cameras[cameraIndex].controllerSocket = false;
        });
    } else {
        socket.emit( 'message', 'No free cameras; ' );
    }   
});

server.listen(3000, () => {  
    console.log('listening on *:3000');
});