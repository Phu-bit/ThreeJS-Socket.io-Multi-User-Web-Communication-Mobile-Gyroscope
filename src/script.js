import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as dat from "lil-gui";
import 'https://cdn.socket.io/4.7.2/socket.io.min.js'

let canvas,camera,controls,transControls,clock,scene,socket,renderer;
let gui = new dat.GUI();
let players = {};
let mainPlayer = {id: null, object: null};
let ipAddress = '10.201.38.152';


function init() {
    canvas = document.querySelector('canvas.webgl');
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 3;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    transControls = new TransformControls(camera, renderer.domElement);
    scene.add(transControls);
    transControls.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
    });

    // Listen for transform control changes to send updates
    transControls.addEventListener('change', () => {
        if (mainPlayer.object) {
            const position = mainPlayer.object.position.toArray();
            const quaternion = mainPlayer.object.quaternion.toArray();
            socket.emit('update', { id: mainPlayer.id, pos: position, rot: quaternion });
        }
    });

    fetch('https://'+ ipAddress + ':3000')
    
    // Setup Socket.IO connection
    socket = io(ipAddress + ':3000', { transports: ['websocket']});
      
    socketListeners();

    if (isMobile()) {
        DeviceOrientationEvent.requestPermission()
        window.addEventListener('deviceorientation', (event) => {
            if (mainPlayer.object) {
                mainPlayer.object.rotation.x = event.beta / 180 * Math.PI; // z axis
                mainPlayer.object.rotation.y = event.gamma / 180 * Math.PI; // x axis
                mainPlayer.object.rotation.z = event.alpha / 180 * Math.PI; // y axis
                const quaternion = mainPlayer.object.quaternion.toArray();
                console.log(quaternion);
                socket.emit('update', { id: mainPlayer.id, pos: mainPlayer.object.position.toArray(), rot: quaternion });
            }
        })

    }
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', (event)=>{
        keyEvents(event);
    }, false);
}

function socketListeners() {
    socket.on('connect', () => console.log('Connected to server'));
    socket.on('setup', (data) => {
        for (let player of data.players) {
            addOrUpdatePlayer(player.id, player.pos);
        }
        mainPlayer = { id: data.id, object: players[data.id] };
        transControls.attach(mainPlayer.object);
    });

    socket.on('update', (data) => {
        addOrUpdatePlayer(data.id, data.pos, data.rot);
    });
    
    socket.on('user disconnected', (id) => {
        if (players[id]) {
            scene.remove(players[id]);
            delete players[id];
        }
    });
}

function addOrUpdatePlayer(id, pos, rot) {
    if (!players[id]) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
        players[id] = new THREE.Mesh(geometry, material);
        scene.add(players[id]);
    }
    players[id].position.set(pos[0], pos[1], pos[2]);
    if (rot) { // Make sure rotation data exists before setting it
        players[id].quaternion.set(rot[0], rot[1], rot[2], rot[3]);
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function keyEvents(event){

        switch ( event.keyCode ) {

            case 87: // W
                transControls.setMode( 'translate' );
                break;

            case 69: // E
                transControls.setMode( 'rotate' );
                break;

            case 82: // R
                transControls.setMode( 'scale' );
                break;
    } 

}

function isMobile() {
    const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
  }
  

// Window
init();
animate();
