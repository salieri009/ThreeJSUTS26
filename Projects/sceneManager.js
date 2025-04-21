import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { GLTFLoader } from './build/GLTFLoader.js';

let camera, scene, renderer, controls;

export function setScene() {
    // Scene and Camera Initialization
    scene = new THREE.Scene();
    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // Renderer Initialization
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // OrbitControls for Camera Interaction
    controls = new OrbitControls(camera, renderer.domElement);

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const cameraLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 3);
    cameraLight.position.set(0, 5, 10);
    camera.add(cameraLight);
    scene.add(camera);
}

export function setSceneElements() {
    // GLTF Model Loader
    const loader = new GLTFLoader();
    loader.load(
        "models/Cow.gltf",
        function (gltf) {
            scene.add(gltf.scene);
            console.log("Model loaded successfully:", gltf.scene);
        },
        undefined,
        function (error) {
            console.error("Error loading model:", error);
        }
    );
}

export function controlCamera() {
    // Animation Loop
    requestAnimationFrame(controlCamera);
    controls.update();
    renderer.render(scene, camera);
}

