import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { loader } from './gridModels.js';

//
let skyMaterial, skyDome, sunLight;
let rainParticles = null;
let snowParticles = null;
let stormLight = null;
let clouds = [];
let cloudMaterials = []; // Different materials for each cloud object
let clock = new THREE.Clock();

export const weather = {
    cloudy: false,
    rainy: false,
    snowy: false,
    stormy: false
};

// Setting up the sky
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

//
export function updateSky() {
    if (!skyMaterial) return;

    // Changes the intensity align with the weather

    let newColor = 0x87CEEB, sunIntensity = 1, cloudColor = 0xffffff, cloudIntensity = 1.0;
    if (weather.stormy) {
        newColor = 0x444466;
        sunIntensity = 0.2;
        cloudColor = 0x888899;
        cloudIntensity = 0.45;
    } else if (weather.rainy) {
        newColor = 0x6e7b8b;
        sunIntensity = 0.5;
        cloudColor = 0xbbbbbb;
        cloudIntensity = 0.65;
    } else if (weather.snowy) {
        newColor = 0xe0e8f3;
        sunIntensity = 0.7;
        cloudColor = 0xf7f7f7;
        cloudIntensity = 0.95;
    } else if (weather.cloudy) {
        newColor = 0x778899;
        sunIntensity = 0.5;
        cloudColor = 0xcccccc;
        cloudIntensity = 0.75;
    }

    skyMaterial.color.setHex(newColor);
    if (sunLight) sunLight.intensity = sunIntensity;

    // 구름 색상/강도 일괄 적용 (최초 1회만 clone, 이후 재활용)
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].traverse((node) => {
            if (node.isMesh && node.material && node.material.color) {
                // 최초 1회만 clone
                if (!cloudMaterials[i]) {
                    cloudMaterials[i] = node.material.clone();
                    node.material = cloudMaterials[i];
                }
                node.material.color.setHex(cloudColor);
                // 밝기: emissive가 있으면 사용, 아니면 opacity
                if ('emissive' in node.material) {
                    node.material.emissive.setHex(cloudColor);
                    node.material.emissiveIntensity = cloudIntensity;
                }
                if ('opacity' in node.material) {
                    node.material.opacity = cloudIntensity;
                    node.material.transparent = cloudIntensity < 1.0;
                }
            }
        });
    }
}

// 구름 생성
export function loadClouds() {
    // 기존 구름 제거
    for (let c of clouds) scene.remove(c);
    clouds = [];
    cloudMaterials = [];

    loader.load("models/cloud/scene.gltf", (gltf) => {
        for (let i = 0; i < 11; i++) {
            let cloud = gltf.scene.clone();
            let randomScale = Math.random() * 0.15 + 0.1;
            cloud.scale.set(randomScale, randomScale, randomScale);
            //position changes
            cloud.position.set(
                Math.random() * 100 - 55,
                Math.random() * 10 + 10,
                Math.random() * 50 - 30

            );

            cloud.userData.speed = Math.random() * 1 + 1.4;
            clouds.push(cloud);
            scene.add(cloud);
        }
        updateSky();

    });
}

// 구름 이동
export function cloudMove() {
    requestAnimationFrame(cloudMove);
    const delta = clock.getDelta();
    for (let cloud of clouds) {
        cloud.position.x += delta * cloud.userData.speed;
        if (cloud.position.x > 60) cloud.position.x = -100;
    }
}

// 태양광 생성
export function sun() {
    sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.top = 50;
    sunLight.position.set(50, 30, 0);
    scene.add(sunLight);
}

// ========== Weather Functions ==========

// 비
export function createRain() {
    // if (!scene || clouds.length === 0) {
    //     console.warn("scene 또는 clouds가 준비되지 않았습니다.");
    //     return;
    // }
    const rainCountPerCloud = 100;
    removeRain();

    const totalRainCount = clouds.length * rainCountPerCloud;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalRainCount * 3);

    let index = 0;

    // 구름 위치를 카메라 기준 적절히 세팅 (예: 고정 범위 내 랜덤)
    for (const cloud of clouds) {
        cloud.position.set(
            Math.random() * 40 - 20,   // x: -20 ~ +20
            Math.random() * 15 + 35,  // y: 35 ~ 50
            Math.random() * 20 + 10   // z: 10 ~ 30
        );

        for (let i = 0; i < rainCountPerCloud; i++) {
            positions[index * 3] = cloud.position.x + (Math.random() * 10 - 5);
            positions[index * 3 + 1] = cloud.position.y - 2 + Math.random() * 5;
            positions[index * 3 + 2] = cloud.position.z + (Math.random() * 10 - 5);
            index++;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 4.0,
        transparent: true,
    });

    rainParticles = new THREE.Points(geometry, material);
    scene.add(rainParticles);
}

export function updateRain() {
    if (!rainParticles) return;

    const positions = rainParticles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.3;  // Y축 아래로 떨어지는 속도

        // 바닥보다 낮아지면 구름 높이 근처로 위치 재설정
        if (positions[i + 1] < 0) {
            positions[i + 1] = Math.random() * 15 + 35;
        }
    }

    rainParticles.geometry.attributes.position.needsUpdate = true;
}

export function removeRain() {
    if (rainParticles) {
        scene.remove(rainParticles);
        rainParticles.geometry.dispose();
        rainParticles.material.dispose();
        rainParticles = null;
    }
}
//===========================Same logic will be implemented========================================

// Snow
export function createSnow() {
    removeSnow();

    const snowCountPerCloud = 100;
    const totalSnowCount = clouds.length * snowCountPerCloud;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalSnowCount * 3);

    let index = 0;

    // 구름 위치를 카메라 기준 적절히 세팅 (예: 고정 범위 내 랜덤)
    for (const cloud of clouds) {
        cloud.position.set(
            Math.random() * 40 - 20,   // x: -20 ~ +20
            Math.random() * 15 + 35,  // y: 35 ~ 50
            Math.random() * 20 + 10   // z: 10 ~ 30
        );

        for (let i = 0; i < snowCountPerCloud; i++) {
            positions[index * 3] = cloud.position.x + (Math.random() * 10 - 5);
            positions[index * 3 + 1] = cloud.position.y - 2 + Math.random() * 5;
            positions[index * 3 + 2] = cloud.position.z + (Math.random() * 10 - 5);
            index++;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.2,
        transparent: true,
    });

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

// 폭풍 (비+번개)
export function createStorm(scene) {
    removeStorm(scene);
    createRain(scene); // 폭풍은 비 포함
    stormLight = new THREE.PointLight(0xffffff, 2, 500);
    stormLight.position.set(0, 100, 0);
    scene.add(stormLight);
}
export function updateStorm() {
    updateRain();
    if (!stormLight) return;
    stormLight.intensity = Math.random() > 0.98 ? 8 : 2;
}
export function removeStorm(scene) {
    removeRain(scene);
    if (stormLight) {
        scene.remove(stormLight);
        stormLight.dispose();
        stormLight = null;
    }
}

// 날씨 전환 (상태 동기화)
export function setWeather(type, scene) {
    // 모든 상태 false로 초기화
    weather.cloudy = false;
    weather.rainy = false;
    weather.snowy = false;
    weather.stormy = false;

    // 효과 제거
    removeRain(scene);
    removeSnow(scene);
    removeStorm(scene);

    // 해당 날씨만 true
    if (type === 'rainy') weather.rainy = true;
    else if (type === 'snowy') weather.snowy = true;
    else if (type === 'stormy') weather.stormy = true;
    else if (type === 'cloudy') weather.cloudy = true;

    // 효과 생성
    if (weather.rainy) createRain(scene);
    if (weather.snowy) createSnow(scene);
    if (weather.stormy) createStorm(scene);
    // sky, cloud, sun 동기화
    updateSky();
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    updateRain();
    updateSnow();
    updateStorm();
}
animate();
