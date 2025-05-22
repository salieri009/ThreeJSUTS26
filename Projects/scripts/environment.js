import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { loader } from './gridModels.js';

let skyMaterial, skyDome, sunLight;

export const weather = {
    cloudy: false,
};

export function setBackground() {
    skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const skyGeometry = new THREE.SphereGeometry(200, 8, 6);
    skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = "Sky";
    scene.add(skyDome);
}

export function updateSky() {
    if (!skyMaterial) return;
    const newColor = weather.cloudy ? 0x778899 : 0x87CEEB;
    sunLight.intensity = weather.cloudy ? 0.5 : 1;
    skyMaterial.color.setHex(newColor);
}

let clouds = [];
let clock = new THREE.Clock();
let spawnTimer = 0;
const SPAWN_INTERVAL = 5; 

export function loadClouds() {
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * 300 - 200;
        spawnNewCloud(startX);
    }
}

export function cloudMove() {
    requestAnimationFrame(cloudMove);
    const delta = clock.getDelta();
    spawnTimer += delta;

    for (let cloud of clouds) {
        cloud.position.x += delta * cloud.userData.speed;
    }

    for (let i = clouds.length - 1; i >= 0; i--) {
        if (clouds[i].position.x > 500) {
            scene.remove(clouds[i]);
            clouds.splice(i, 1);
        }
    }

    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        spawnNewCloud(-200);
    }
}

function spawnNewCloud(startX) {
    loader.load("models/cloud/scene.gltf", (gltf) => {
        const cloud = gltf.scene.clone();
        const randomScale = Math.random() * 0.15 + 0.1;

        cloud.scale.set(randomScale, randomScale, randomScale);
        cloud.position.set(startX, Math.random() * 10 + 10, Math.random() * 80 - 40);
        cloud.rotation.y = Math.random() * Math.PI * 2;
        cloud.userData.speed = Math.random() * 0.5 + 0.5;

        cloud.frustumCulled = false;
        cloud.traverse((node) => {
            if (node.isMesh) {
                node.frustumCulled = false;
                node.castShadow = false;
                node.receiveShadow = false;
            }
        });

        clouds.push(cloud);
        scene.add(cloud);
    });
}

export function sun() {
    sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.top = 50;
    sunLight.position.set(50, 30, 0);
    scene.add(sunLight);
}

