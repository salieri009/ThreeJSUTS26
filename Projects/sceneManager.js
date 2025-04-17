import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/controls/OrbitControls.js';

let camera, controls, renderer, scene, box;
export function setScene(){
    scene = new THREE.Scene();
    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);

    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 1);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    var cameraLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 0.5);
    cameraLight.position.set(0, 5, 10);
    camera.add(cameraLight);
    scene.add(camera);
}

//Export a Cow for test
export function setSceneElements(){
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 1, 1),
        wireframe: true
    });
    
    box = new THREE.Mesh(geometry, material);
    scene.add(box);
}

//Camera movement
export function controlCamera(){
    requestAnimationFrame(controlCamera);
    controls.update();
    //box.rotation.x += 0.01;
    renderer.render(scene, camera);
}

