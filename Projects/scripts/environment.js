import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { loader } from './gridModels.js';

let skyMaterial, skyDome, sunLight;

//Added weather//==
let rainParticles = null;
let snowParticles = null;
let stormParticles = null;
let stormLight = null;
//==============================


export const weather = {
    cloudy: false,

}

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
    sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.top = 50;

    sunLight.position.set(50, 30, 0); 
    scene.add(sunLight);

    //const helper = new THREE.CameraHelper(sunLight.shadow.camera);
    //scene.add(helper);
}
/*
    cloud.traverse((node) => {
        if (node.isMesh && node.material && node.material.color) {
            node.material = node.material.clone();
            let cloudColour = weather.cloudy ? 0xAAAAAA : 0xffffff;
            node.material.color.set(cloudColour); 
        }
    });
*/



export function createRain(scene) {
    removeRain(scene); //remove the rain scene before it rain
    const rainCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
        positions[i * 3] = Math.random() * 200 - 100;
        positions[i * 3 + 1] = Math.random() * 100 + 50;
        positions[i * 3 + 2] = Math.random() * 200 - 100;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true });

    rainParticles = new THREE.Points(geometry, material);
    scene.add(rainParticles);
}

export function updateRain() {
    if (!rainParticles) return;
    const positions = rainParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.5;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = Math.random() * 100 + 50;
    }
    rainParticles.geometry.attributes.position.needsUpdate = true;
}

export function removeRain(scene) {
    if (rainParticles) {
        scene.remove(rainParticles);
        rainParticles.geometry.dispose();
        rainParticles.material.dispose();
        rainParticles = null;
    }
}


export function createSnow(scene) {
    removeSnow(scene);
    const snowCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
        positions[i * 3] = Math.random() * 200 - 100;
        positions[i * 3 + 1] = Math.random() * 100 + 50;
        positions[i * 3 + 2] = Math.random() * 200 - 100;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true });
    snowParticles = new THREE.Points(geometry, material);
    scene.add(snowParticles);
}

export function updateSnow() {
    if (!snowParticles) return;
    const positions = snowParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.15;
        positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = Math.random() * 100 + 50;
    }
    snowParticles.geometry.attributes.position.needsUpdate = true;
}

export function removeSnow(scene) {
    if (snowParticles) {
        scene.remove(snowParticles);
        snowParticles.geometry.dispose();
        snowParticles.material.dispose();
        snowParticles = null;
    }
}


export function createStorm(scene) {
    removeStorm(scene);
    createRain(scene); // 폭풍은 비도 포함
    stormLight = new THREE.PointLight(0xffffff, 2, 500);
    stormLight.position.set(0, 100, 0);
    scene.add(stormLight);
}

export function updateStorm() {
    updateRain();
    if (!stormLight) return;
    if (Math.random() > 0.98) {
        stormLight.intensity = 8;
    } else {
        stormLight.intensity = 2;
    }
}

export function removeStorm(scene) {
    removeRain(scene);
    if (stormLight) {
        scene.remove(stormLight);
        stormLight.dispose();
        stormLight = null;
    }
}

export function setWeather(type, scene) {
    removeRain(scene);
    removeSnow(scene);
    removeStorm(scene);

    if (type === 'rainy') createRain(scene);
    if (type === 'snowy') createSnow(scene);
    if (type === 'stormy') createStorm(scene);
}


function animate() {
    requestAnimationFrame(animate);
    updateRain();
    updateSnow();
    updateStorm();
}
animate();
