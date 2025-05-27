import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { loader } from './gridModels.js';
import { level } from './buttonInteract.js'
// import * as dat from 'dat.gui';


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
// let snowAreaRadius , rainAreaRadius, windAreaRadius = 5;
let snowAreaRadius = 10;
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
    let base = 30; // stormy 기준
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
    if (weather.stormy) return 0x6D4A7A;   // 어두운 회색/보라
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
                //Clones
                let baseOpacity = 0.45 + Math.sin(clock.elapsedTime * 0.15 + cloud.userData.opacitySeed) * 0.2;
                node.material.opacity = Math.max(0.25, baseOpacity);
                node.material.transparent = true;
            }
        });

        // === 구름 아래에 비/눈 파티클 위치시키기 ===
        // rainParticles와 snowParticles가 존재할 때만 위치를 동기화
        if (weather.rainy && rainParticles) {
            rainParticles.position.set(
                cloud.position.x + 5 ,
                cloud.position.y - 2, // 구름 아래로 약간 내림
                cloud.position.z
            );
        }
        if (weather.snowy && snowParticles) {
            snowParticles.position.set(
                cloud.position.x,
                cloud.position.y + 2 ,
                cloud.position.z
            );
        }
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
let nightAmbient = null;

// 밤 모드로 전환
export function setNightMode() {
    isDay = false;

    // 하늘색을 밤색(그라데이션 효과 포함)으로 변경
    if (skyMaterial) {
        skyMaterial.color.setHex(0x0b1020); // 진한 남색
        if (skyMaterial.emissive) skyMaterial.emissive.setHex(0x181d30); // 약간의 빛
    }

    // 태양(light) 숨기기
    if (sunLight) sunLight.visible = false;

    // 달(light) 보이기 및 색상 조정
    if (moonLight) {
        moonLight.visible = true;
        moonLight.intensity = 0.6;
        moonLight.color.setHex(0xddeeff);
        moonLight.position.set(0, 100, -80); // 하늘 위쪽에 위치
    }

    // 밤 전용 주변광 추가 (차가운 색)
    if (!nightAmbient) {
        nightAmbient = new THREE.AmbientLight(0x223344, 0.6);
        nightAmbient.name = "NightAmbient";
        scene.add(nightAmbient);
    }

    // 별 생성
    createStars();

    // 구름 색상 밤에 맞게 변경 (회색/푸른빛)
    if (clouds) {
        clouds.forEach(cloud => {
            cloud.traverse(node => {
                if (node.isMesh && node.material) {
                    node.material.color.setHex(0x8a9bbd); // 푸른 회색
                    node.material.opacity = 0.35;
                }
            });
        });
    }

    // 기타 밤 효과
    createNightEffect();
}
//===========================================
// function createMooon(){
//     removeMoon();
//     const MoonCount = 1;
//     const geo
// }
//
// function removeMoon(){
//
// }
//======================================================
// 별 생성 함수
function createStars() {
    removeStars();
    const starCount = 700;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    // 다양한 별 색상 팔레트 (흰색, 노란색, 푸른색, 붉은색 등)
    const palette = [
        new THREE.Color(0xffffff), // pure white
        new THREE.Color(0xfff7cc), // yellowish
        new THREE.Color(0xbfdfff), // blueish
        new THREE.Color(0xffcccc), // reddish
        new THREE.Color(0xe0e0ff), // pale blue
        new THREE.Color(0xffeedd), // warm white
        new THREE.Color(0xf8f7ff)  // cool white
    ];

    for (let i = 0; i < starCount; i++) {
        // 구면 좌표계로 별 위치 배치
        const r = 180 + Math.random() * 15;
        const theta = Math.random() * Math.PI;
        const phi = Math.random() * Math.PI * 2;
        positions[i * 3 + 0] = r * Math.sin(theta) * Math.cos(phi);
        positions[i * 3 + 1] = r * Math.cos(theta);
        positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);

        // 색상 팔레트에서 랜덤 선택
        const baseColor = palette[Math.floor(Math.random() * palette.length)];
        // 밝기(채도) 랜덤 조정
        const brightness = 0.7 + Math.random() * 0.3; // 0.7~1.0
        colors[i * 3 + 0] = baseColor.r * brightness;
        colors[i * 3 + 1] = baseColor.g * brightness;
        colors[i * 3 + 2] = baseColor.b * brightness;

        // 별의 크기(밝기) 랜덤 지정
        sizes[i] = 0.8 + Math.random() * 1.7; // 0.8~2.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // 커스텀 셰이더 사용 시

    // 별 텍스처 사용 (선택)
    // const textureLoader = new THREE.TextureLoader();
    // const starTexture = textureLoader.load('/images/star.png');

    const material = new THREE.PointsMaterial({
        size: 2.0, // 기본값, 셰이더로 개별 크기 조정 가능
        // map: starTexture,
        transparent: true,
        // alphaMap: starTexture,
        depthWrite: false,
        vertexColors: true // 별마다 색상 다르게
    });

    stars = new THREE.Points(geometry, material);
    stars.name = "Stars";
    scene.add(stars);
}

// 밤에만 나타나는 특수 효과 (예: 희미한 안개, 달빛 반사 등)
export function createNightEffect() {
    // 예시: 밤에만 보이는 얕은 안개 추가
    if (scene.fog) {
        scene.fog.color.setHex(0x10131a);
        scene.fog.density = 0.012;
    }
    // 달빛 반사, 반딧불 등 추가 가능
}

// 별 제거
function removeStars() {
    if (stars) {
        scene.remove(stars);
        stars.geometry.dispose();
        stars.material.dispose();
        stars = null;
    }
}

// 밤 효과 제거 (낮으로 돌아갈 때)
function removeNightEffect() {
    // 밤 전용 주변광 제거
    if (nightAmbient) {
        scene.remove(nightAmbient);
        nightAmbient = null;
    }
    // 별 제거
    removeStars();
    // 구름 색상 원래대로 복원
    if (clouds) {
        clouds.forEach(cloud => {
            cloud.traverse(node => {
                if (node.isMesh && node.material) {
                    node.material.color.setHex(0xffffff);
                    node.material.opacity = 0.45;
                }
            });
        });
    }
    // 안개 색상 복원
    if (scene.fog) {
        scene.fog.color.setHex(0x87ceeb);
        scene.fog.density = 0.008;
    }
}


//=============================Spring =========================
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
        size: 4.0,
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

let rainAreaRadius = 10;

export function createRain() {
    const minCloudCount = 20;
    if (clouds.length < minCloudCount) {
        addCloudsRange(minCloudCount - clouds.length);
    }

    removeRain();

    const rainCountPerCloud = Math.floor(100 * lodQuality);
    const totalRainCount = clouds.length * rainCountPerCloud;
    if (clouds.length === 0 || rainCountPerCloud === 0 || totalRainCount === 0) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalRainCount * 3);
    const sizes = new Float32Array(totalRainCount);
    const speeds = new Float32Array(totalRainCount);
    //Finding NaN erros
    let index = 0;
    for (const cloud of clouds) {
        if (!cloud.position ||
            isNaN(cloud.position.x) ||
            isNaN(cloud.position.y) ||
            isNaN(cloud.position.z)) {
            console.error('cloud.position is invalid', cloud.position);
            continue;
        }
        for (let i = 0; i < rainCountPerCloud; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * rainAreaRadius;
            if (isNaN(angle) || isNaN(radius)) {
                console.error('angle or radius is NaN', angle, radius);
                continue;
            }
            const x = cloud.position.x + Math.cos(angle) * radius;
            const y = cloud.position.y - 2 + Math.random() * 5;
            const z = cloud.position.z + Math.sin(angle) * radius;
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.error('Computed position is NaN', x, y, z);
                continue;
            }
            positions[index * 3]     = x;
            positions[index * 3 + 1] = y;
            positions[index * 3 + 2] = z;
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
    if (!rainParticles || !rainParticles.geometry) return;

    const positions = rainParticles.geometry.attributes.position.array;
    const speeds = rainParticles.geometry.attributes.speed.array;
    const sizes = rainParticles.geometry.attributes.size.array;
    const time = performance.now() * 0.001;
    const delta = clock.getDelta(); // 프레임 간 시간 차이

    // 경계값 상수 정의
    const BOUNDARY_X = 75;
    const BOUNDARY_Z = 75;
    const RESET_HEIGHT = 45;

    // 바람 파라미터 유효성 검사
    const safeWindX = windDirection.x || 0;
    const safeWindZ = windDirection.z || 0;
    const safeWindStrength = Math.max(windStrength || 0, 0);

    for (let i = 0; i < speeds.length; i++) {
        const index = i * 3;
        const baseSpeed = Math.max(speeds[i] || 1.2, 0.5);

        // 1. 물리 기반 낙하 계산
        positions[index + 1] -= baseSpeed * 3.8 * delta; // 델타 타임 적용

        // 2. 바람 효과 (방향 벡터 정규화)
        const windFactor = safeWindStrength * 0.35 * (0.7 + Math.random() * 0.3);
        const turbulence = Math.cos(time * 1.8 + i) * windTurbulence * 0.15;

        positions[index] += (safeWindX * windFactor + turbulence) * 1.1;
        positions[index + 2] += (safeWindZ * windFactor + turbulence * 0.6) * 1.1;

        // 3. 돌풍 효과 (방향 일관성 유지)
        if (isGusty) {
            const gustPhase = Math.sin(time * 4.2 + i * 0.05) * 0.45;
            positions[index] += safeWindX * gustPhase;
            positions[index + 2] += safeWindZ * gustPhase;
        }

        // 4. 3D 경계 박스 재활용 시스템
        const shouldReset =
            positions[index + 1] < -15 ||
            Math.abs(positions[index]) > BOUNDARY_X ||
            Math.abs(positions[index + 2]) > BOUNDARY_Z;

        if (shouldReset) {
            positions[index] = (Math.random() - 0.5) * BOUNDARY_X * 1.8;
            positions[index + 1] = Math.random() * 20 + RESET_HEIGHT;
            positions[index + 2] = (Math.random() - 0.5) * BOUNDARY_Z * 1.8;
        }

        // 5. 동적 크기 조절 (낙하 가속도 효과)
        const fallProgress = 1 - (positions[index + 1] / RESET_HEIGHT);
        sizes[i] = 1.2 +
            Math.sin(fallProgress * Math.PI) * 2.5 +
            Math.random() * 0.3;
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
            //Snows
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
    if (!snowParticles || !snowParticles.geometry) return;

    const positions = snowParticles.geometry.attributes.position.array;
    const speeds = snowParticles.geometry.attributes.speed.array;
    const time = performance.now() * 0.001;
    const baseWindX = windDirection.x || 0; // NaN 방지
    const baseWindZ = windDirection.z || 0;

    // 화면 경계값 설정
    const horizontalBoundary = 50;
    const verticalStart = 35;

    for (let i = 0; i < speeds.length; i++) {
        const index = i * 3;
        const currentSpeed = Math.max(speeds[i] || 0.5, 0.1); // 최소 속도 보장

        // 1. 위치 업데이트
        positions[index + 1] -= currentSpeed * 0.8; // 프레임 독립적 속도

        // 2. 바람 효과 (유효성 검사 추가)
        const windEffect = (windStrength || 0) * (0.6 + Math.random() * 0.4);
        const turbulence = Math.sin(time * 2 + i * 0.1) * (windTurbulence || 0) * 0.1;

        positions[index] += (baseWindX * windEffect + turbulence) * 0.05;
        positions[index + 2] += (baseWindZ * windEffect + turbulence * 0.7) * 0.05;

        // 3. 돌풍 효과 (활성화 시에만)
        if (isGusty) {
            const gustFactor = Math.sin(time * 4.5 + i * 0.05) * 0.18;
            positions[index] += baseWindX * gustFactor;
            positions[index + 2] += baseWindZ * gustFactor;
        }

        // 4. 자연스러운 흔들림 (주기 조정)
        positions[index] += Math.cos(time * 0.3 + i) * 0.015;
        positions[index + 2] += Math.sin(time * 0.35 + i) * 0.015;

        // 5. 파티클 재활용 시스템
        if (
            positions[index + 1] < -10 ||
            Math.abs(positions[index]) > horizontalBoundary ||
            Math.abs(positions[index + 2]) > horizontalBoundary
        ) {
            positions[index] = (Math.random() - 0.5) * horizontalBoundary * 2;
            positions[index + 1] = Math.random() * 15 + verticalStart;
            positions[index + 2] = (Math.random() - 0.5) * horizontalBoundary * 2;
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
///=============Wind===================

// 예시: wind = { x: 1.2, y: 0, z: 0 } (x축으로 1.2의 속도)
let windStrength = 0.5; // 바람 강도 (0.0 ~ 3.0)
let windTurbulence = 0.5; // 바람 난류 정도
let windGustTimer = 0; // 돌풍 타이머
let isGusty = false; // 돌풍 상태

let windDirection = { x: 1, y: 0, z: 0.3 };
setWindDirection(1, 0, 0.3); // Set wind

// 외부에서 wind 값을 업데이트할 수 있도록 함수 제공
export function setWind(vec3) {
    wind.x = vec3.x;
    wind.y = vec3.y;
    wind.z = vec3.z;
}

export function setWindStrength(strength) {
    windStrength = Math.max(0, Math.min(3, strength));
}

export function setWindDirection(x, y, z) {
    const length = Math.sqrt(x*x + y*y + z*z);
    if (length > 0) {
        windDirection = {
            x: x/length,
            y: y/length,
            z: z/length
        };
    }
}

export function setWindTurbulence(turbulence) {
    windTurbulence = Math.max(0, Math.min(2, turbulence));
}

// For the test run,
// export function updateWinterEffect() {
//     if (!winterEffect) return;
//     const positions = winterEffect.geometry.attributes.position.array;
//     for (let i = 0; i < positions.length / 3; i++) {
//         positions[i * 3 + 1] -= 0.022 + Math.random() * 0.011; // 아래로 낙하
//         positions[i * 3 + 0] += wind.x * 0.06; // 바람의 x축 영향
//         positions[i * 3 + 2] += wind.z * 0.06; // 바람의 z축 영향
//         // 자연스러운 흔들림 추가
//         positions[i * 3 + 0] += Math.sin(Date.now() * 0.0005 + i) * 0.013;
//         // 바닥에 닿으면 다시 위로
//         if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = Math.random() * 10 + 10;
//     }
//     winterEffect.geometry.attributes.position.needsUpdate = true;
// }


// 바람 효과 (입자)
export function createWind() {
    removeWind();

    const windCount = Math.floor(600 * lodQuality);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(windCount * 3);
    const velocities = new Float32Array(windCount * 3);

    for (let i = 0; i < windCount; i++) {
        const index = i * 3;
        positions[index] = Math.random() * 100 - 50;
        positions[index + 1] = Math.random() * 30 + 5;
        positions[index + 2] = Math.random() * 80 - 40;

        // 각 파티클의 초기 속도
        velocities[index] = (Math.random() - 0.5) * 0.1;
        velocities[index + 1] = (Math.random() - 0.5) * 0.05;
        velocities[index + 2] = (Math.random() - 0.5) * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        color: 0xeeeeee,
        size: 1.2,
        transparent: true,
        opacity: 0.15,
        sizeAttenuation: true
    });

    windParticles = new THREE.Points(geometry, material);
    scene.add(windParticles);
}

export function updateWind() {
    if (!windParticles) return;

    const positions = windParticles.geometry.attributes.position.array;
    const velocities = windParticles.geometry.attributes.velocity.array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positions.length / 3; i++) {
        const index = i * 3;

        // 바람 방향과 강도 적용
        const windForce = windStrength * 0.2;
        const turbulence = Math.sin(time * 2 + i * 0.1) * windTurbulence * 0.05;

        positions[index] += (windDirection.x * windForce + velocities[index] + turbulence);
        positions[index + 1] += (windDirection.y * windForce * 0.3 + velocities[index + 1]);
        positions[index + 2] += (windDirection.z * windForce + velocities[index + 2] + turbulence);

        // 돌풍 효과
        if (isGusty) {
            const gustEffect = Math.sin(time * 4 + i * 0.05) * 0.1;
            positions[index] += windDirection.x * gustEffect;
            positions[index + 2] += windDirection.z * gustEffect;
        }

        // 경계 처리
        if (positions[index] > 60) positions[index] = -60;
        if (positions[index] < -60) positions[index] = 60;
        if (positions[index + 2] > 40) positions[index + 2] = -40;
        if (positions[index + 2] < -40) positions[index + 2] = 40;
        if (positions[index + 1] > 35) positions[index + 1] = 5;
        if (positions[index + 1] < 5) positions[index + 1] = 35;
    }

    windParticles.geometry.attributes.position.needsUpdate = true;
}

export function updateGustSystem() {
    windGustTimer += 1/60; // 60fps 기준

    // 랜덤하게 돌풍 발생 (10-30초 간격)
    if (!isGusty && windGustTimer > 10 + Math.random() * 20) {
        isGusty = true;
        windGustTimer = 0;

        // 돌풍 시 바람 강도 일시적 증가
        const originalStrength = windStrength;
        windStrength *= 1.5 + Math.random() * 0.5;

        // 2-5초 후 돌풍 종료
        setTimeout(() => {
            isGusty = false;
            windStrength = originalStrength;
        }, (2 + Math.random() * 3) * 1000);
    }
}

export function setWeatherWind(weatherType) {
    switch(weatherType) {
        case 'rainy':
            setWindStrength(1.2);
            setWindDirection(1, 0, 0.3);
            setWindTurbulence(0.8);
            break;
        case 'stormy':
            setWindStrength(2.5);
            setWindDirection(0.8, 0, 0.6);
            setWindTurbulence(1.5);
            break;
        case 'snowy':
            setWindStrength(0.8);
            setWindDirection(0.7, 0, 0.7);
            setWindTurbulence(0.4);
            break;
        case 'cloudy':
            setWindStrength(0.6);
            setWindDirection(1, 0, 0);
            setWindTurbulence(0.3);
            break;
        default: // clear
            setWindStrength(0.3);
            setWindDirection(1, 0, 0);
            setWindTurbulence(0.2);
    }
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

    const fogGeometry = new THREE.BoxGeometry(140, 140, 140, 30, 30, 30);
    const fogMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 1.1
    });

    fogMesh = new THREE.Mesh(fogGeometry, fogMaterial);
    fogMesh.rotation.x = -Math.PI / 2;
    fogMesh.position.y = 2.5;
    scene.add(fogMesh);
    scene.fog = new THREE.Fog(0xcccccc, 15, 50); // 색상, 시작, 끝
}
export function updateFog() {
    // Mesh 안개 애니메이션
    if (fogMesh) {
        fogMesh.material.opacity = 0.12 + Math.abs(Math.sin(clock.elapsedTime * 0.1)) * 0.05;
    }
    // Three.js Fog 파라미터 변화(선택)
    //
    // if (scene.fog instanceof THREE.Fog) {
    //     const t = clock.getElapsedTime();
    //     scene.fog.near = 10 + Math.sin(t * 0.2) * 5;
    //     scene.fog.far = 120 + Math.sin(t * 0.15) * 10;
    // }
}
export function removeFog() {
    // Mesh 안개 제거
    if (fogMesh) {
        scene.remove(fogMesh);
        fogMesh.geometry.dispose();
        fogMesh.material.dispose();
        fogMesh = null;
    }
    // Three.js Fog 제거
    scene.fog = null;
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

    // 날씨별 바람 설정
    setWeatherWind(type);

    if (type === 'rainy') {
        weather.rainy = true;
        createRain();
        createWind();
        createPuddle();
    } else if (type === 'snowy') {
        weather.snowy = true;
        createSnow();
        createWind();
    } else if (type === 'stormy') {
        weather.stormy = true;
        createStorm();
        createWind();
        createFog();
        createPuddle();
    } else if (type === 'cloudy') {
        weather.cloudy = true;
        createWind();
    } else if (type === 'foggy') {
        weather.foggy = true;
        createFog();
        createWind();
    }

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
    updateGustSystem();
}
animate();
