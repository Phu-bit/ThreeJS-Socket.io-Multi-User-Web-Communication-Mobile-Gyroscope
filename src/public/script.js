import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.162.0/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'https://unpkg.com/three@0.162.0/examples/jsm/controls/TransformControls.js';
import * as dat from 'https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js';
import * as CANNON from 'https://unpkg.com/cannon@0.6.2/build/cannon.js';
import 'https://cdn.socket.io/4.7.2/socket.io.min.js'

console.log(dat);


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
    transControls.showZ = false;
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

    // Check if it's mobile
    if (isMobile()) {
        // Create a button
        const button = document.createElement('button');
        button.innerText = 'Allow Gyroscope Access';

        // Append the button to the body
        document.body.appendChild(button);

        // Add event listener to the button
        button.addEventListener('click', () => {
            // Request permission
            DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response == 'granted') {
                    window.addEventListener('deviceorientation', (event) => {
                        deviceOrientator(event);
                    })
                }
            })
            .catch(console.error);
            button.remove();

        });
    } 

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', (event)=>{
        keyEvents(event);
    }, false);


    //Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0); 
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 3);
    pointLight.position.set(1, 2, 3);
    scene.add(pointLight);
    
}

// Use phone's gyroscope to control the player
function deviceOrientator(event) {
    if (mainPlayer.object) {
        // mainPlayer.object.rotation.x = event.beta / 180 * Math.PI; // x axis
        mainPlayer.object.rotation.y += (event.gamma / 180 * Math.PI) / 10; // y axis
        // console.log('gamma: ' + event.gamma, 'rotation y: ' + mainPlayer.object.rotation.y);
        // mainPlayer.object.rotation.z = event.alpha / 180 * Math.PI; // z axis
        const quaternion = mainPlayer.object.quaternion.toArray();
        console.log(quaternion);
        socket.emit('update', { id: mainPlayer.id, pos: mainPlayer.object.position.toArray(), rot: quaternion });
    }
}

// Socket.IO listeners
function socketListeners() {
    socket.on('connect', () => console.log('Connected to server'));

    // Setup the scene with existing players
    socket.on('setup', (data) => {

        // Add existing players to the scene with their relative positions
        for (let player of data.players) {
            addOrUpdatePlayer(player.id, player.pos); 
        }

        // Create the main player
        mainPlayer = { id: data.id, object: players[data.id] };

        // Attach the transform controls to the 'main player'/your player
        transControls.attach(mainPlayer.object);
    });

    // read updates of the position of the players and update their positions
    socket.on('update', (data) => {
        addOrUpdatePlayer(data.id, data.pos, data.rot);
    });
    
    // if notified of a user disconnecting, remove them from the scene and delete them from the players array
    socket.on('user disconnected', (id) => {
        if (players[id]) {
            scene.remove(players[id]);
            delete players[id];
        }
    });
}

function addOrUpdatePlayer(id, pos, rot) {

    // Add player if they don't exist
    if (!players[id]) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
        players[id] = new THREE.Mesh(geometry, material);
        scene.add(players[id]);
    }

    // Set Player Position
    players[id].position.set(pos[0], pos[1], pos[2]);

    // Set Player Rotation
    if (rot) { 
        players[id].quaternion.set(rot[0], rot[1], rot[2], rot[3]);
    }

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
  

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


// Window
init();
animate();
