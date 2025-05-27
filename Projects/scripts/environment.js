import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { loader } from './gridModels.js';
import { level } from './buttonInteract.js'

let skyMaterial, skyDome, sunLight;

let stormLight = null;
let clouds = [];
let cloudMaterials = [];
let clock = new THREE.Clock();
let lightningTimer = 0;
let lightningLines = [];
let windParticles = null;
let fogMesh = null;
let lodQuality = 1.0; // 1.0 ~ 0.3 (LOD)

//Particles===============
let springEffect = null;
// let summerEffect = null;
let autumnEffect = null;
let winterEffect = null;
let currentSeason = null;
let rainParticles = null;
let snowParticles = null;

//This is for the weather area//
let snowAreaRadius , rainAreasRadius, windAreaRadius = 5;
//=============
export const weather = {
    cloudy: false,
    rainy: false,
    snowy: false,
    stormy: false,
    foggy: false
};

export const season = {
    spring: false,
    summer: false,
    autumn: false,
    winter: false,

}
// LOD 품질 조정 (예: 성능에 따라 외부에서 lodQuality 조정 가능)
export function setWeatherLOD(q) {
    lodQuality = Math.max(0.3, Math.min(1.0, q));
}

// 스카이 돔
export function setBackground() {
    skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const skyGeometry = new THREE.SphereGeometry(200, 16, 12);
    skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = "Sky";
    scene.add(skyDome);
}


// 태양광은 위에 이미 선언 되어 있음
let moonLight; // 전역으로 선언

// 태양광
export function sun() {
    // 이미 있는 달빛 제거
    if (moonLight) {
        scene.remove(moonLight);
        moonLight.dispose?.(); // 메모리 해제
        moonLight = null;
    }

    // 태양빛 생성
    sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.top = 50;
    sunLight.position.set(50, 30, 0);
    scene.add(sunLight);
}

// 달빛
export function moon() {
    // 이미 있는 태양빛 제거
    if (sunLight) {
        scene.remove(sunLight);
        sunLight.dispose?.(); // 메모리 해제
        sunLight = null;
    }

    // 달빛 생성
    moonLight = new THREE.DirectionalLight(0xaaaaFF, 0.3);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024, 1024);
    moonLight.shadow.camera.top = 30;
    moonLight.position.set(-30, 20, 10);
    scene.add(moonLight);
}



//==============================clouds=============================

function getCloudCountForWeather(weather) {
    // base는 weather 상태별 기본값, scale은 반경에 따라 증가
    let base = 50; // stormy 기준
    let scale = cloudRange.x / 100; // cloudRange.x가 100일 때 base, 200이면 2*base
    if (weather.stormy) return Math.floor(base * scale);
    if (weather.rainy)  return Math.floor(35 * scale);
    if (weather.snowy)  return Math.floor(25 * scale);
    if (weather.cloudy) return Math.floor(18 * scale);
    if (weather.foggy)  return Math.floor(10 * scale);
    return Math.floor(5 * scale);
}


function getCloudColorForWeather(weather) {
    // weather 객체의 상태값을 참고하여 구름 색상을 반환합니다.
    // 반환값은 THREE.js의 color hex 코드입니다.
    if (weather.stormy) return 0x888899;   // 어두운 회색/보라
    if (weather.rainy)  return 0xbbbbbb;   // 연한 회색
    if (weather.snowy)  return 0xf7f7f7;   // 밝은 흰색
    if (weather.cloudy) return 0xcccccc;   // 중간 회색
    if (weather.foggy)  return 0xdddddd;   // 연한 회백색
    return 0xffffff;                       // 맑음(흰색)
}

function resetCloudScene() {
    // 구름 제거
    for (let c of clouds) scene.remove(c);
    clouds = [];
    cloudMaterials = [];
    // 비, 눈, 기타 이펙트도 필요시 제거
    if (rainParticles) {
        scene.remove(rainParticles);
        rainParticles = null;
    }
    if (snowParticles) {
        scene.remove(snowParticles);
        snowParticles = null;
    }
    // 기타 오브젝트도 필요하면 제거
}


// 구름 생성 (자연스러운 움직임, 투명도 변화)
// 구름 생성 범위 변수 선언
let cloudRange = {
    x: 100,   // -55 ~ +45 (기존)
    y: 10,    // 10 ~ 20
    z: 50     // -30 ~ +20
};

function getCloudSpawnRange(level) {
    // 블록은 -i*10, -j*10 위치에 생성됨. level*10이 전체 길이.
    // 구름은 전체 맵을 충분히 덮도록 약간 여유를 둠.
    const size = level * 10;
    return {
        x: size + 40, // 여유를 위해 +40
        y: 20,        // y는 고정 또는 계절/날씨별로 조정 가능
        z: size + 40
    };
}

// 구름 생성 함수에서 범위 사용
// 구름 생성 함수에서 사용
export function loadClouds(level = 1) {
    resetCloudScene();
    const cloudCount = getCloudCountForWeather(weather);
    const cloudColor = getCloudColorForWeather(weather);

    // level을 받아서 범위 계산
    cloudRange = getCloudSpawnRange(level);

    loader.load("models/cloud/scene.gltf", (gltf) => {
        for (let i = 0; i < cloudCount; i++) {
            let cloud = gltf.scene.clone();
            let randomScale = Math.random() * 0.15 + 0.1;
            cloud.scale.set(randomScale, randomScale, randomScale);
            cloud.position.set(
                Math.random() * cloudRange.x - cloudRange.x / 2,
                Math.random() * cloudRange.y + 10,
                Math.random() * cloudRange.z - cloudRange.z / 2
            );
            // 이하 동일
            cloud.userData = {
                speed: Math.random() * 1 + 1.4,
                baseY: cloud.position.y,
                opacitySeed: Math.random() * 100
            };
            cloud.traverse((node) => {
                if (node.isMesh && node.material && node.material.color) {
                    node.material = node.material.clone();
                    node.material.color.setHex(cloudColor);
                    node.material.transparent = true;
                }
            });
            clouds.push(cloud);
            scene.add(cloud);
        }
        updateSky();
    });
}

// 버튼 클릭 시 호출: 범위 확장
export function addCloudsRange() {
    cloudRange.x += 100; // x축 범위 확장
    cloudRange.y += 10;  // y축 범위 확장
    cloudRange.z += 50;  // z축 범위 확장
    // 기존 구름은 그대로 두고, 새로 loadClouds() 하면 넓은 범위에 생성됨
}

// 구름 애니메이션
export function cloudMove() {
    const delta = clock.getDelta();
    for (let i = 0; i < clouds.length; i++) {
        const cloud = clouds[i];
        cloud.position.x += delta * cloud.userData.speed;
        // 자연스러운 위아래 움직임
        cloud.position.y = cloud.userData.baseY + Math.sin(clock.elapsedTime * 0.2 + i) * 1.2;
        if (cloud.position.x > 60) cloud.position.x = -100;
        // 투명도 변화 (구름 clone마다)
        cloud.traverse((node) => {
            if (node.isMesh && node.material) {
                if (!cloudMaterials[i]) {
                    cloudMaterials[i] = node.material.clone();
                    node.material = cloudMaterials[i];
                }
                let baseOpacity = 0.45 + Math.sin(clock.elapsedTime * 0.15 + cloud.userData.opacitySeed) * 0.2;
                node.material.opacity = Math.max(0.25, baseOpacity);
                node.material.transparent = true;
            }
        });
    }
}

// 하늘/구름/태양광 상태 동기화
export function updateSky() {
    if (!skyMaterial) return;
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
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].traverse((node) => {
            if (node.isMesh && node.material && node.material.color) {
                if (!cloudMaterials[i]) {
                    cloudMaterials[i] = node.material.clone();
                    node.material = cloudMaterials[i];
                }
                node.material.color.setHex(cloudColor);
                if ('emissive' in node.material) {
                    node.material.emissive.setHex(cloudColor);
                    node.material.emissiveIntensity = cloudIntensity;
                }
            }
        });
    }
}

//===============Day and Night=============================
//Ever since the day is the default value, I only need to add the night
let isDay = true;
let stars = null;

function createStars(){

}

export function createNightEffect(){

}

function removeStars(){

}


//=========================================================
export function createSpringEffect() {
    removeSpringEffect();
    const count = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = Math.random() * 60 - 30;
        positions[i * 3 + 1] = Math.random() * 15 + 8;
        positions[i * 3 + 2] = Math.random() * 30 - 15;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffc1e0,
        size: 1.7,
        transparent: true,
        opacity: 0.85
    });
    springEffect = new THREE.Points(geometry, material);
    scene.add(springEffect);
}

export function updateSpringEffect() {
    if (!springEffect) return;
    const positions = springEffect.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.037 + Math.random() * 0.012;
        positions[i * 3 + 0] += Math.sin(Date.now() * 0.0007 + i) * 0.018;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = Math.random() * 10 + 10;
    }
    springEffect.geometry.attributes.position.needsUpdate = true;
}

export function removeSpringEffect() {
    if (springEffect) {
        scene.remove(springEffect);
        springEffect.geometry.dispose();
        springEffect.material.dispose();
        springEffect = null;
    }
}

// === SUMMER: 반딧불이 파티클 ================
let summerEffect, summerOrigins, summerOffsets, summerSpeeds;

//=========================================
export function createSummerEffect() {
    removeSummerEffect();

    const count = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    // 각 반딧불이의 '중심 위치' (origin)
    summerOrigins = [];
    summerOffsets = [];
    summerSpeeds = [];

    for (let i = 0; i < count; i++) {
        const x = Math.random() * 90 - 30;
        const y = Math.random() * 50 + 6;
        const z = Math.random() * 90 - 15;

        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        summerOrigins.push({ x, y, z });
        summerOffsets.push({
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 2,
        });
        summerSpeeds.push({
            x: 0.5 + Math.random() * 0.5,
            y: 0.5 + Math.random() * 0.5,
            z: 0.5 + Math.random() * 0.5,
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffcc,
        size: 4.5,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    summerEffect = new THREE.Points(geometry, material);
    scene.add(summerEffect);

}

export function updateSummerEffect(delta) {
    if (!summerEffect) return;

    const positions = summerEffect.geometry.attributes.position.array;
    const time = performance.now() * 0.001;

    for (let i = 0; i < summerOrigins.length; i++) {
        const index = i * 3;
        const origin = summerOrigins[i];
        const offset = summerOffsets[i];
        const speed = summerSpeeds[i];

        // 구형 영역 안에서 부드럽게 랜덤 이동
        const radius = 3; // 비행 반경

        positions[index + 0] = origin.x + Math.sin(time * speed.x + offset.x) * radius;
        positions[index + 1] = origin.y + Math.sin(time * speed.y + offset.y) * radius;
        positions[index + 2] = origin.z + Math.cos(time * speed.z + offset.z) * radius;
    }

    summerEffect.geometry.attributes.position.needsUpdate = true;

    // 깜빡이는 느낌
    summerEffect.material.opacity = 0.6 + Math.sin(time * 3) * 0.3;
}

export function removeSummerEffect() {
    if (summerEffect) {
        scene.remove(summerEffect);
        summerEffect.geometry.dispose();
        summerEffect.material.dispose();
        summerEffect = null;
    }
}


// === AUTUMN: 낙엽 파티클 ===
export function createAutumnEffect() {
    removeAutumnEffect();
    const count = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = Math.random() * 60 - 30;
        positions[i * 3 + 1] = Math.random() * 14 + 8;
        positions[i * 3 + 2] = Math.random() * 30 - 15;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffa94d,
        size: 2.1,
        transparent: true,
        opacity: 0.8
    });
    autumnEffect = new THREE.Points(geometry, material);
    scene.add(autumnEffect);
}

export function updateAutumnEffect() {
    if (!autumnEffect) return;
    const positions = autumnEffect.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.034 + Math.random() * 0.012;
        positions[i * 3 + 0] += Math.sin(Date.now() * 0.0008 + i) * 0.017;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = Math.random() * 10 + 10;
    }
    autumnEffect.geometry.attributes.position.needsUpdate = true;
}

export function removeAutumnEffect() {
    if (autumnEffect) {
        scene.remove(autumnEffect);
        autumnEffect.geometry.dispose();
        autumnEffect.material.dispose();
        autumnEffect = null;
    }
}

// === WINTER: 눈 파티클 ===
export function createWinterEffect() {
    removeWinterEffect();
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = Math.random() * 60 - 30;
        positions[i * 3 + 1] = Math.random() * 16 + 10;
        positions[i * 3 + 2] = Math.random() * 30 - 15;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.3,
        transparent: true,
        opacity: 0.85
    });
    winterEffect = new THREE.Points(geometry, material);
    scene.add(winterEffect);
}

export function updateWinterEffect() {
    if (!winterEffect) return;
    const positions = winterEffect.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.022 + Math.random() * 0.011;
        positions[i * 3 + 0] += Math.sin(Date.now() * 0.0005 + i) * 0.013;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = Math.random() * 10 + 10;
    }
    winterEffect.geometry.attributes.position.needsUpdate = true;
}

export function removeWinterEffect() {
    if (winterEffect) {
        scene.remove(winterEffect);
        winterEffect.geometry.dispose();
        winterEffect.material.dispose();
        winterEffect = null;
    }
}

//===========================================================
// 비 (입자 크기/속도 다양화)
export function createRain() {
    const minCloudCount = 20;

    if (clouds.length < minCloudCount) {
        addCloudsRange(minCloudCount - clouds.length);
    }


    removeRain();
    const rainCountPerCloud = Math.floor(100 * lodQuality);
    const totalRainCount = clouds.length * rainCountPerCloud;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalRainCount * 3);
    const sizes = new Float32Array(totalRainCount);
    const speeds = new Float32Array(totalRainCount);

    let index = 0;
    for (const cloud of clouds) {
        cloud.position.set(
            Math.random() * 40 - 20,
            Math.random() * 15 + 35,
            Math.random() * 20 + 10
        );
        for (let i = 0; i < rainCountPerCloud; i++) {
            positions[index * 3] = cloud.position.x + (Math.random() * 10 - 5);
            positions[index * 3 + 1] = cloud.position.y - 2 + Math.random() * 5;
            positions[index * 3 + 2] = cloud.position.z + (Math.random() * 10 - 5);
            sizes[index] = Math.random() * 3 + 1.5;
            speeds[index] = Math.random() * 0.4 + 0.25;
            index++;
        }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    const material = new THREE.PointsMaterial({
        color: 0x88bbff,
        size: 3.0,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
    });
    rainParticles = new THREE.Points(geometry, material);
    scene.add(rainParticles);
}

export function updateRain() {
    if (!rainParticles) return;
    const positions = rainParticles.geometry.attributes.position.array;
    const speeds = rainParticles.geometry.attributes.speed.array;
    const sizes = rainParticles.geometry.attributes.size.array;
    for (let i = 0; i < speeds.length; i++) {
        positions[i * 3 + 1] -= speeds[i] * 2.5;
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = Math.random() * 15 + 35;
        }
        // 입자 크기 변화 (떨어질수록 커짐)
        sizes[i] = 1.5 + (positions[i * 3 + 1] < 10 ? 2.5 : Math.random() * 2);
    }
    rainParticles.geometry.attributes.position.needsUpdate = true;
    rainParticles.geometry.attributes.size.needsUpdate = true;
}

export function removeRain() {
    if (rainParticles) {
        scene.remove(rainParticles);
        rainParticles.geometry.dispose();
        rainParticles.material.dispose();
        rainParticles = null;
    }
}

// 눈 (입자 크기/속도, 바람 영향)
export function createSnow() {
    removeSnow();
    const snowCountPerCloud = Math.floor(100 * lodQuality);
    const totalSnowCount = clouds.length * snowCountPerCloud;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalSnowCount * 3);
    const sizes = new Float32Array(totalSnowCount);
    const speeds = new Float32Array(totalSnowCount);
    let index = 0;
    for (const cloud of clouds) {
        // 구름의 중심 위치는 그대로 사용 (cloud.position)
        for (let i = 0; i < snowCountPerCloud; i++) {
            // 구름 아래에서 눈 입자를 퍼뜨릴 반경을 snowAreaRadius로 조절
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * snowAreaRadius;
            positions[index * 3]     = cloud.position.x + Math.cos(angle) * radius;
            positions[index * 3 + 1] = cloud.position.y - 2 + Math.random() * 5;
            positions[index * 3 + 2] = cloud.position.z + Math.sin(angle) * radius;
            sizes[index] = Math.random() * 2 + 1.2;
            speeds[index] = Math.random() * 0.13 + 0.07;
            index++;
        }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 5,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });
    snowParticles = new THREE.Points(geometry, material);
    scene.add(snowParticles);
}

export function updateSnow() {
    if (!snowParticles) return;
    const positions = snowParticles.geometry.attributes.position.array;
    const speeds = snowParticles.geometry.attributes.speed.array;
    for (let i = 0; i < speeds.length; i++) {
        positions[i * 3 + 1] -= speeds[i];
        positions[i * 3] += Math.sin(Date.now() * 0.0009 + i) * 0.04; // 바람 영향
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = Math.random() * 15 + 35;
        }
    }
    snowParticles.geometry.attributes.position.needsUpdate = true;
}

export function removeSnow() {
    if (snowParticles) {
        scene.remove(snowParticles);
        snowParticles.geometry.dispose();
        snowParticles.material.dispose();
        snowParticles = null;
    }
}

// 번개 (깜빡임 + 라인)
function createLightningLine() {
    // 번개 경로 생성
    const points = [];
    let x = Math.random() * 80 - 40;
    let y = 80 + Math.random() * 40;
    let z = Math.random() * 60 - 30;
    points.push(new THREE.Vector3(x, y, z));
    for (let i = 0; i < 10; i++) {
        x += (Math.random() - 0.5) * 5;
        y -= Math.random() * 10;
        z += (Math.random() - 0.5) * 5;
        points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 3,
        transparent: true,
        opacity: 1
    });
    const line = new THREE.Line(geometry, material);
    line.userData.birth = clock.elapsedTime;
    scene.add(line);
    lightningLines.push(line);
}

export function createStorm() {
    removeStorm();
    createRain();
    stormLight = new THREE.PointLight(0xffffff, 2, 500);
    stormLight.position.set(0, 100, 0);
    scene.add(stormLight);
}

export function updateStorm() {
    updateRain();
    if (!stormLight) return;
    if (Math.random() > 0.98 && lightningTimer <= 0) {
        stormLight.intensity = 8;
        stormLight.position.set(
            Math.random() * 80 - 40,
            80 + Math.random() * 40,
            Math.random() * 60 - 30
        );
        createLightningLine();
        lightningTimer = 0.1 + Math.random() * 0.1;
    } else if (lightningTimer > 0) {
        lightningTimer -= 1 / 60;
        if (lightningTimer <= 0) {
            stormLight.intensity = 2;
        }
    }
    // 번개 라인 fade out
    for (let i = lightningLines.length - 1; i >= 0; i--) {
        const line = lightningLines[i];
        const age = clock.elapsedTime - line.userData.birth;
        if (age > 0.2) {
            scene.remove(line);
            lightningLines.splice(i, 1);
        } else {
            line.material.opacity = 1 - (age / 0.2);
        }
    }
}

export function removeStorm() {
    removeRain();
    if (stormLight) {
        scene.remove(stormLight);
        stormLight.dispose();
        stormLight = null;
    }
    for (let line of lightningLines) scene.remove(line);
    lightningLines = [];
}

// 바람 효과 (입자)
export function createWind() {
    removeWind();
    const windCount = Math.floor(400 * lodQuality);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(windCount * 3);
    for (let i = 0; i < windCount; i++) {
        positions[i * 3] = Math.random() * 100 - 50;
        positions[i * 3 + 1] = Math.random() * 30 + 10;
        positions[i * 3 + 2] = Math.random() * 80 - 40;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xeeeeee,
        size: 0.8,
        transparent: true,
        opacity: 0.12
    });
    windParticles = new THREE.Points(geometry, material);
    scene.add(windParticles);
}
export function updateWind() {
    if (!windParticles) return;
    const positions = windParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += 0.18 + Math.sin(i * 0.1) * 0.03;
        if (positions[i * 3] > 60) positions[i * 3] = -60;
    }
    windParticles.geometry.attributes.position.needsUpdate = true;
}
export function removeWind() {
    if (windParticles) {
        scene.remove(windParticles);
        windParticles.geometry.dispose();
        windParticles.material.dispose();
        windParticles = null;
    }
}

// 안개 효과 (셰이더 기반)
export function createFog() {
    removeFog();

    const fogGeometry = new THREE.BoxGeometry(150, 150, 100, 5, 5, 5);
    const fogMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.18
    });
    fogMesh = new THREE.Mesh(fogGeometry, fogMaterial);
    fogMesh.rotation.x = -Math.PI / 2;
    fogMesh.position.y = 2.5;
    scene.add(fogMesh);

    scene.fog = new THREE.Fog(0xcccccc, 10, 120); // 색상, 시작, 끝
    scene.background = new THREE.Color(0xcccccc);
}
export function updateFog() {
    if (fogMesh) {
        fogMesh.material.opacity = 0.12 + Math.abs(Math.sin(clock.elapsedTime * 0.1)) * 0.09;
    }
}
export function removeFog() {
    if (fogMesh) {
        scene.remove(fogMesh);
        fogMesh.geometry.dispose();
        fogMesh.material.dispose();
        fogMesh = null;
    }
}



let puddleMesh = null;
let puddleSize = 15; // 초기 크기

// 기존 퍼들을 제거
export function removePuddle() {
    if (puddleMesh) {
        scene.remove(puddleMesh);
        puddleMesh.geometry.dispose();
        puddleMesh.material.dispose();
        puddleMesh = null;
    }
}

// 퍼들 하나 생성 (현재 크기 사용)
export function createPuddle() {
    removePuddle(); // 기존 퍼들 제거

    const geo = new THREE.CircleGeometry(puddleSize, 64);
    const mat = new THREE.MeshPhysicalMaterial({
        color: 0x336699,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 0.45,
        reflectivity: 0.9,
        clearcoat: 1
    });

    puddleMesh = new THREE.Mesh(geo, mat);
    puddleMesh.rotation.x = -Math.PI / 2;
    puddleMesh.position.set(0, 0.11, 0);
    scene.add(puddleMesh);
}

// 버튼 누를 때마다 퍼들을 키움
export function addPuddle() {
    puddleSize += 5; // 반지름 증가
    createPuddle();  // 새로운 크기로 퍼들 생성
}


// 날씨 전환
export function setWeather(type) {
    weather.cloudy = weather.rainy = weather.snowy = weather.stormy = weather.foggy = false;
    removeRain(); removeSnow(); removeStorm(); removeWind(); removeFog(); removePuddle();
    if (type === 'rainy') {
        weather.rainy = true;
        createRain();
        createWind();
        createPuddle(); }
    else if (type === 'snowy') {
        weather.snowy = true;
        createSnow();
        createWind(); }
    else if (type === 'stormy') {
        weather.stormy = true;
        createStorm();
        createWind();
        createFog();
        createPuddle(); }
    else if (type === 'cloudy') { weather.cloudy = true; }
    else if (type === 'foggy') { weather.foggy = true; createFog(); }
    updateSky();
}

//계절 변환//
export function setSeason(type) {
    // 모든 계절 이펙트 비활성화 및 제거
    season.spring = season.summer = season.autumn = season.winter = false;
    removeSpringEffect();
    removeSummerEffect();
    removeAutumnEffect();
    removeWinterEffect();

    // 선택된 계절 이펙트 적용
    if (type === 'spring') {
        season.spring = true
        createSpringEffect();
    } else if (type === 'summer') {
        season.summer = true;
        createSummerEffect();
    } else if (type === 'autumn') {
        season.autumn = true;
        createAutumnEffect();
    } else if (type === 'winter') {
        season.winter = true;
        createWinterEffect();
    }
    // skybox, 조명 등 계절별 추가 효과가 있다면 여기에 추가
    updateSkyForSeason(type);
}

// 계절별 하늘 업데이트 함수
function updateSkyForSeason(type) {
    if (!skyMaterial || !sunLight) return;

    let seasonColor = 0x87CEEB;
    let sunIntensity = 1.0;

    switch(type) {
        case 'spring':
            seasonColor = 0x87CEEB;
            sunIntensity = 1.0;
            break;
        case 'summer':
            seasonColor = 0x6FB7FF;
            sunIntensity = 1.2;
            break;
        case 'autumn':
            seasonColor = 0xA0522D;
            sunIntensity = 0.8;
            break;
        case 'winter':
            seasonColor = 0xE0E8F3;
            sunIntensity = 0.7;
            break;
    }

    skyMaterial.color.setHex(seasonColor);
    sunLight.intensity = sunIntensity;
}

// 메인 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    cloudMove();
    updateRain();
    updateSnow();
    updateStorm();
    updateWind();
    updateFog();
    updateSummerEffect();
    updateAutumnEffect();
    updateSpringEffect();
    updateWinterEffect();
}
animate();
