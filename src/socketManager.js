import * as THREE from 'three';

export class SocketManager{

    constructor(serverPort){

        this.socket = io('localhost:' + serverPort, {transports: ['websocket']});
        this.socket.on('connect', () => console.log('Connected to server'));

    }

    handleMessage(type, msg){

        this.socket.on(type, (msg) => {
            
        })

        console.log('Message received:', msg);

    }

    sendMessage(type, msg){
        this.socket.emit(type, msg)
    }

}