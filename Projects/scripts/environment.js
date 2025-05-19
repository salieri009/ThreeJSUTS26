import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';

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

function cloudMove() { 
    requestAnimationFrame(cloudMove);
    
    loader.load("models/cloud/scene.gltf", (gltf) => {
        cloud = gltf.scene;
        cloud.scale.set(0.25, 0.25, 0.25);
        cloud.position.set(-5, 20, 0);
        cloud.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
            } 
        });
        scene.add(cloud);
    });
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