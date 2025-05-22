import * as THREE from '../build/three.module.js';
import { OrbitControls } from '../build/controls/OrbitControls.js';

export let camera, controls, renderer, scene;

export function setScene() {
    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    let ortho = 50; // Increased view volume

    camera = new THREE.OrthographicCamera(
        -ortho * aspect, ortho * aspect,
        ortho, -ortho,
        0.1, 2000 // Increased far plane for cloud visibility
    );

    camera.position.set(100, 100, 100); // Move camera further back
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = document.getElementById('scene-container');
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = false; 
    controls.enableZoom = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
}

export function controlCamera() {
    requestAnimationFrame(controlCamera);
    controls.update();
    renderer.render(scene, camera);
}

