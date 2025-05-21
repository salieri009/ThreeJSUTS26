import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { loader } from './gridModels.js';

export function setBackground()  {
    const skyGeometry = new THREE.SphereGeometry(200, 8, 6); 
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide,    
    });
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);
    skyDome.name = "Sky";
}

let cloud
let clouds = [] ;
let clock = new THREE.Clock();
export function loadClouds() {
    loader.load("models/cloud/scene.gltf", (gltf) => {
        for (let i = 0; i < 11; i++) {
            cloud = gltf.scene.clone();
            let randomScale = Math.random() * 0.15 + 0.1;
            cloud.scale.set(randomScale, randomScale, randomScale);
            cloud.position.set(Math.random() * 100 - 55, Math.random() * 10 + 10, Math.random() * 50 - 30);
            cloud.userData.speed = Math.random() * 1 + 1.4; 
            clouds.push(cloud);
            scene.add(cloud);
        }
    });
}

export function cloudMove() {
    requestAnimationFrame(cloudMove);
    const delta = clock.getDelta();
    for (cloud of clouds) {
        cloud.position.x += delta * cloud.userData.speed;
        if (cloud.position.x > 60) {
            cloud.position.x = -100;
        }
    }
}

export function sun() {
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.top = 50;

    sunLight.position.set(50, 30, 0); 
    scene.add(sunLight);

    //const helper = new THREE.CameraHelper(sunLight.shadow.camera);
    //scene.add(helper);
}