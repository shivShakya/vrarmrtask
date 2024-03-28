import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

let hand; 
let mixer;
const animationActions = [];

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas }); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); 
renderer.setClearColor('#000000');


//Enivroment setup using hdri
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'back.hdr',
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    },
    undefined,
    function (error) {
        console.error('Error loading HDR image:', error);
    }
);


//imp lights in the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(hemisphereLight);








// Creating a loading manager
const loadingBar = document.getElementById('loading-bar');

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = itemsLoaded / itemsTotal;
    updateLoadingBar(progress);
};

loadingManager.onLoad = function () {
    document.getElementById('loading-bar-container').style.display = 'none';
    document.getElementById('canvas').style.display = 'block';
};

function updateLoadingBar(progress) {
    loadingBar.style.width = progress * 100 + '%';
}


//DracoLoader for Zombiee
const loader = new GLTFLoader(loadingManager);
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);
// Load the zombiee
loader.load(
    'model3.glb', 
    function (gltf) {
        const model = gltf.scene;
        model.scale.setScalar(10);
        model.position.set(0, 0 ,0);
        model.rotation.y = Math.PI/2;
        scene.add(model);
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            animationActions.push(action);
            animationActions[0].play();
        });
        camera.lookAt(model.position);
    },
    undefined,
    function (error) {
        console.error('Error loading 3D model:', error);
    }
);



//hidding boxes for raycsting and different animations
const boxGeometry = new THREE.BoxGeometry(5, 8, 5); 
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000  , opacity : 0 , transparent : true});

const lower = new THREE.Mesh(boxGeometry, boxMaterial);
lower.name = 'lower';
lower.position.set(0, 3, 0);
scene.add(lower);

const middle = new THREE.Mesh(boxGeometry, boxMaterial);
middle.name = 'middle';
middle.position.set(0, 10, 0); 
scene.add(middle);

const upper = new THREE.Mesh(boxGeometry, boxMaterial);
upper.name = 'upper';
upper.position.set(0, 16, 0)
scene.add(upper);





//rayscting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([upper, middle, lower], true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject === upper && animationActions.length >= 3) {
            animationActions[2].play(); 
            setTimeout(() => {
                animationActions[2].stop(); 
            }, 4000);
        } else if (clickedObject === middle && animationActions.length >= 2) {
            animationActions[1].play(); 
            setTimeout(() => {
                animationActions[1].stop(); 
            }, 4000);
        } else if (clickedObject === lower && animationActions.length >= 1) {
            animationActions[0].play(); 
            setTimeout(() => {
                animationActions[0].stop(); 
            }, 7000);
        }
    }
}

document.addEventListener('click', onMouseClick, false);




// setting env road model
const loader2 = new GLTFLoader(loadingManager);
loader2.load(
    'road.glb', 
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        model.scale.setScalar(10);
    },
    undefined,
    function (error) {
        console.error('Error loading 3D model:', error);
    }
);


// Create OrbitControls and set camera position
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableRotate = true;
controls.enableZoom = true;
camera.position.set(20, 20, -20);
controls.minDistance = 10; 
controls.maxDistance = 50; 
controls.minPolarAngle = Math.PI / 4; 
controls.maxPolarAngle = Math.PI / 2; 


//Hand Movement and controls
loader2.load('hand.glb',(gltf)=>{
      hand = gltf.scene;
      hand.scale.setScalar(10);
      scene.add(hand);
})

function onMouseMove(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = 17;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    if(hand){
        hand.position.copy(pos);
    }
}

document.addEventListener('mousemove', onMouseMove, false);


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);



//animate function
function animate() {
    requestAnimationFrame(animate);
    if(mixer){
        mixer.update(0.016);
    }
    controls.update(); 
    renderer.render(scene, camera);
}
animate();
