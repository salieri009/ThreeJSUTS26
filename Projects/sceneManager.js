import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { GLTFLoader } from './build/GLTFLoader.js'
//==========Boxes for the scene
let camera, controls, renderer, scene, box;
//==============================Sun==============
let sunlight;
// 태양 각도 (0 = 동쪽, PI = 서쪽)
let sunTheta = 0;
//angle of light ( starting from the east to west
//======================================================

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

    var cameraLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 3);
    cameraLight.position.set(0, 5, 10);
    camera.add(cameraLight);
    scene.add(camera);

    //set lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);


}

//Export a Cow for test
export function setSceneElements(){
    const loader = new GLTFLoader();
    loader.load("models/Cow.gltf", function ( gltf ) {
		scene.add( gltf.scene );
		gltf.scene; 
	});
}

//Camera movement
export function controlCamera(){
    requestAnimationFrame(controlCamera);
    controls.update();
    renderer.render(scene, camera);
}

