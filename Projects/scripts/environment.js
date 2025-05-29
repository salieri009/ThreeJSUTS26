import * as THREE from '../build/three.module.js';
import { scene, renderer } from './sceneManager.js';
import { loader, grass, grasses } from './gridModels.js';
// import { GPUComputationRenderer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/misc/GPUComputationRenderer.js';


// let gpuCompute;
// let positionVariable, velocityVariable;
// const AURORA_PARTICLES = 512;
//
// // GPU 컴퓨트 초기화 로직 강화
// const initAuroraCompute = () => {
//     if (!renderer) {
//         console.warn('렌더러가 초기화되지 않았습니다.');
//         return false;
//     }
//
//     try {
//         gpuCompute = new GPUComputationRenderer(AURORA_PARTICLES, AURORA_PARTICLES, renderer);
//
//         const positionTexture = gpuCompute.createTexture();
//         const velocityTexture = gpuCompute.createTexture();
//
//         positionVariable = gpuCompute.addVariable('uPosition', positionShader, positionTexture);
//         velocityVariable = gpuCompute.addVariable('uVelocity', velocityShader, velocityTexture);
//
//         gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
//         gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
//
//         const error = gpuCompute.init();
//         if (error !== null) {
//             console.error('GPU Compute 초기화 실패:', error);
//             return false;
//         }
//
//         return true;
//     } catch (error) {
//         console.error('GPU Compute 초기화 중 예외 발생:', error);
//         return false;
//     }
// };






/**
 * environment.js - Weather and Season Simulation Environment using Three.js
 *
 * This module implements a real-time, interactive simulation of natural environments
 * using Three.js. It supports dynamic weather (sunny, cloudy, rain, snow, storm, fog),
 * seasonal changes (spring, summer, autumn, winter), and day-night cycles.
 * The system responds to user interactions (buttons, hotkeys) and updates
 * the 3D scene accordingly.
 *
 * Key Features:
 * - Dynamic cloud, rain, snow, and wind particle systems
 * - Realistic sun and moon lighting, including transitions for day and night
 * - Puddle (water accumulation) effects during rain using physically-based materials
 * - Modular structure for easy extension and maintenance
 * - Level of Detail (LOD) control for performance optimization
 */
// Main animation is at bottom
let skyMaterial, skyDome, sunLight;
let Supermoon = null;
let auroraMesh = null;

//======================================


/**
 * All major objects (clouds, rain, snow, moon, puddle, etc.) are managed as global variables.
 * Each has corresponding create, update, and remove functions for modular control.
 *
 * This modular structure allows for easy extension (e.g., adding new weather effects)
 * and ensures that memory is properly managed (disposing of geometries and materials
 * when objects are removed).
 */
//================================================
let stormLight = null;
let clouds = [];
let cloudMaterials = [];
let clock = new THREE.Clock();
let lightningTimer = 0;
let lightningLines = [];
let windParticles = null;
let fogMesh = null;
let lodQuality = 1.0; // 1.0 ~ 0.3 (LOD)
// const deltaTime = clock.getDelta(); // deltaTime 계산

//========Season Particles===============
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
/**
 * Weather and season state management.
 * These objects track the current environmental conditions.
 */

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
    winter: false
}

//Grass Colour Object
export const GRASS_COLORS = {
    spring: 0x8be47b,
    summer: 0x3e5c3a,
    autumn: 0xc2b280,
    winter: 0xd3e0ea,
    rainy:  0x4b7f5a,
    snowy:  0xe0e8f3,
    default: 0x3e5c3a
};


/**
 * Changes the color of all grass meshes in the scene.
 * This function is called whenever the season or weather changes,
 * ensuring visual consistency with the current environment.
 *
 * @param {string} key - The season or weather key to determine the color.
 */

export function setGrassColorByKey(key) {
    const color = GRASS_COLORS[key] || GRASS_COLORS.default;
    grasses.forEach(grassMesh => {
        // Materials colne : changes the all the materials accordingly
        grassMesh.material = grassMesh.material.clone();
        grassMesh.material.color.setHex(color);
    });
}

// Random Weathers ===============================

/**
 * Random weather event generator.
 * Uses weighted probabilities to determine the next weather type.
 */
//===============================================
const WEATHER_PROBABILITY = [
    { type: 'sunny', weight: 30 },
    { type: 'cloudy', weight: 25 },
    { type: 'rainy', weight: 20 },
    { type: 'snowy', weight: 15 },
    { type: 'stormy', weight: 10 }
]

export function getRandomWeather() {
    const total = WEATHER_PROBABILITY.reduce((acc, cur) => acc + cur.weight, 0);
    const random = Math.random() * total;
    let accumulated = 0;

    for (const { type, weight } of WEATHER_PROBABILITY) {
        accumulated += weight;
        if (random <= accumulated) return type;
    }
    return 'sunny';
}

//====================================================

// LOD Setting : allowing adjustment from the outside controller
export function setWeatherLOD(q) {
    lodQuality = Math.max(0.3, Math.min(1.0, q));
}


/**
 * Sky, sun, and moon setup.
 * The sky dome and lighting are updated according to weather and time of day.
 */


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


// Creates moonlight
let moonLight; // 전역으로 선언

// Sunlight
export function sun() {


    // Remove current moonlight
    if (moonLight) {
        scene.remove(moonLight);
        moonLight.dispose?.();
        moonLight = null;
    }
    // sunLight가 없거나, 씬에 없는 경우 새로 생성 및 추가
    if (!sunLight || !scene.children.includes(sunLight)) {
        sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.set(2048, 2048);
        sunLight.shadow.camera.top = 50;
        sunLight.position.set(50, 30, 0);
        scene.add(sunLight);
    }
    sunLight.visible = true;
    sunLight.intensity = 1;
}

// Moonlight Dummy Data : no-longer user
// export function moon() {
//     // 이미 있는 태양빛 제거
//     if (sunLight) {
//         scene.remove(sunLight);
//         sunLight.dispose?.(); // 메모리 해제
//         sunLight = null;
//     }
//
//     // 달빛 생성
//     moonLight = new THREE.DirectionalLight(0xaaaaFF, 0.3);
//     moonLight.castShadow = true;
//     moonLight.shadow.mapSize.set(1024, 1024);
//     moonLight.shadow.camera.top = 30;
//     moonLight.position.set(-30, 20, 10);
//     scene.add(moonLight);
// }



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

const particleBoxes = [];

//===============Debug box : Finding Rain Creation Point ============================================
function createDebugBox(color = 0xff0000) {
    const geometry = new THREE.BoxGeometry(1, 1, 1); // 크기 조정 가능
    const material = new THREE.MeshBasicMaterial({ color, wireframe: true });
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);
    return box;
}

///-============================================================================================

const rainDebugBoxes = [];
const snowDebugBoxes = [];

//Debug Boxes
// for (let i = 0; i < clouds.length; i++) {
//     rainDebugBoxes.push(createDebugBox(0x0000ff)); // 파란색: 비
//     snowDebugBoxes.push(createDebugBox(0xff0000)); // 빨간색: 눈
// }

// cloudAnimation
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
                cloud.position.x ,
                cloud.position.y , // 구름 아래로 약간 내림
                cloud.position.z + 5
            );
            // rainParticles.position.copy(rainPos);
            // rainDebugBoxes[i].position.copy(rainPos); // 박스 위치 동기화
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

//=====Set Day mode
export function setDayMode() {
    isDay = true;
    // 야간 효과 리소스 정리
    if (nightAmbient) {
        scene.remove(nightAmbient);
        nightAmbient.dispose();
        nightAmbient = null;
    }
    // 달 관련 리소스 정리
    if (Supermoon) {
        scene.remove(Supermoon);
        Supermoon = null;
    }
    // 구름 색상 복원
    clouds.forEach(cloud => {
        cloud.traverse(node => {
            if (node.material) {
                node.material.color.setHex(0xffffff);
            }
        });
    });
}

//===================


// 밤 모드로 전환
export function setNightMode() {
    isDay = false;
    if (sunLight) sunLight.visible = false;



    // 하늘색을 밤색(그라데이션 효과 포함)으로 변경
    if (skyMaterial) {
        skyMaterial.color.setHex(0x0b1020); // 진한 남색
        if (skyMaterial.emissive) skyMaterial.emissive.setHex(0x181d30); // 약간의 빛
    }


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
    createMoon();

    if (Supermoon) Supermoon.visible = true;

    if (season.summer){
        createSummerEffect();
    }

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



// === Moon orbital motion using Rodrigues' rotation formula ===
// This function animates the moon's position along an arbitrary 3D orbit (not just a flat circle).
// It uses Rodrigues' formula to rotate the moon's position vector around the orbit's normal vector.


let moonOrbitAngle = 0;
const moonCenter = new THREE.Vector3(0, 5, 0); // 중앙 grass 좌표
let orbitVec = new THREE.Vector3(-80, 30, 12); // 초기 위치에서 중심까지의 벡터
const orbitRadius = orbitVec.length(); // 공전 반지름 계산
const orbitNormal = new THREE.Vector3().crossVectors(orbitVec, new THREE.Vector3(0, 1, 0)).normalize(); // 궤도 평면 법선

export function createMoon() {
    if (Supermoon) return Supermoon;
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        metalness: 0.05,  // 금속성 감소 (암석 표면)
        roughness: 0.4,   // 거칠기 증가 (크레이터 효과)
        emissive: 0xFFF5E6,  // 부드러운 노란색
        emissiveIntensity: 0.4, // 발광 세기 감소
        displacementScale: 0.05 // 변위 강도
    });
    Supermoon = new THREE.Mesh(geometry, material); // 전역 변수에 할당
    Supermoon.position.set(-170, 30, 20); // 초기 위치 설정
    scene.add(Supermoon);
    return Supermoon;
}

// rodrigues rotation formula
function rotateVector(vec, axis, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return vec.clone().multiplyScalar(cos)
        .add(axis.clone().cross(vec).multiplyScalar(sin))
        .add(axis.clone().multiplyScalar(axis.dot(vec) * (1 - cos)));
}

export function updateMoon(deltaTime) {
    if (!Supermoon || auroraMesh) return;
    moonOrbitAngle += deltaTime * 5; // 회전 속도

    // 현재 벡터를 회전
    const rotatedVec = rotateVector(orbitVec, orbitNormal, moonOrbitAngle);

    // 중심점에 회전된 벡터를 더해 위치 업데이트
    Supermoon.position.copy(moonCenter.clone().add(rotatedVec));

    // 달 자전 처리 (원본 유지)
    Supermoon.rotation.y += deltaTime * 10.0;





}

//
// function removeMoon() 구현 예시
function removeMoon() {
    if (Supermoon) {
        // 씬에서 달 제거
        scene.remove(Supermoon);

        // 달에 붙어있는 광원 등도 같이 제거 (예: moonLight)
        if (moonLight) {
            scene.remove(moonLight);
            moonLight = null;
        }

        // 메모리 해제 (geometry, material)
        if (Supermoon.geometry) Supermoon.geometry.dispose();
        if (Supermoon.material) Supermoon.material.dispose();

        // Supermoon 참조 해제
        Supermoon = null;
    }
}

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
    removeMoon();
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
    const count = 15; // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3); //

    // Cherry Blossom particles
    const pinkPalette = [
        new THREE.Color(0xFFB3D9),
        new THREE.Color(0xFF99C8),
        new THREE.Color(0xFF80B7),
        new THREE.Color(0xFF66A6)
    ];

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 80; // -40 ~ +40
        positions[i * 3 + 1] = Math.random() * 25 + 15;    // 15 ~ 40
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60; // -30 ~ +30

        sizes[i] = 2.5 + Math.random() * 1.5; // 2.5 ~ 4.0

        //Random colours
        const color = pinkPalette[Math.floor(Math.random() * pinkPalette.length)];
        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));




    const material = new THREE.PointsMaterial({
        size: 3.5,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    springEffect = new THREE.Points(geometry, material);
    scene.add(springEffect);
}

export function updateSpringEffect() {
    if (!springEffect) return;

    const positions = springEffect.geometry.attributes.position.array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positions.length / 3; i++) {
        const index = i * 3;

        // 자연스러운 낙하 궤적 (포물선 운동)
        positions[index + 1] -= 0.08 + Math.sin(time + i) * 0.02;

        // 바람 효과 (X/Z 축 이동)
        positions[index + 0] += Math.sin(time * 0.5 + i) * 0.03;
        positions[index + 2] += Math.cos(time * 0.6 + i) * 0.02;

        // 회전 효과
        const angle = time * 0.5 + i;
        positions[index + 0] += Math.sin(angle) * 0.02;
        positions[index + 2] += Math.cos(angle) * 0.02;

        // 리셋 로직
        if (positions[index + 1] < -5) {
            positions[index + 0] = (Math.random() - 0.5) * 80;
            positions[index + 1] = Math.random() * 25 + 25;
            positions[index + 2] = (Math.random() - 0.5) * 60;
        }
    }

    springEffect.geometry.attributes.position.needsUpdate = true;

    // 크기 동적 변화 (살짝 떨리는 효과)
    springEffect.material.size = 3.2 + Math.sin(time * 3) * 0.3;
}

export function removeSpringEffect() {
    if (springEffect) {
        scene.remove(springEffect);
        springEffect.geometry.dispose();
        springEffect.material.dispose();
        springEffect = null;
    }
}

// === SUMMER: Fireflies ================
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
// === AUTUMN: 낙엽 파티클 (개선 버전) ===
export function createAutumnEffect() {
    removeAutumnEffect();
    const count = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const rotations = new Float32Array(count); // 낙엽 회전용

    // 가을 낙엽 색상 팔레트 (단풍색 계열)
    const leafColors = [
        new THREE.Color(0xffa94d), // 오렌지
        new THREE.Color(0xff7f50), // 연한 주황
        new THREE.Color(0xff6347), // 토마토
        new THREE.Color(0x8b4513), // 갈색
        new THREE.Color(0xffd700)  // 금색
    ];

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = Math.random() * 60 - 30;  // X: -30~30
        positions[i * 3 + 1] = Math.random() * 14 + 8;   // Y: 8~22 (낙엽 높이)
        positions[i * 3 + 2] = Math.random() * 30 - 15;  // Z: -15~15

        sizes[i] = 1.5 + Math.random() * 1.5; // 크기 1.5~3.0

        // 랜덤 색상 선택
        const color = leafColors[Math.floor(Math.random() * leafColors.length)];
        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // 낙엽 회전 각도 초기화
        rotations[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));


    const material = new THREE.PointsMaterial({
        size: 5,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.NormalBlending
    });

    autumnEffect = new THREE.Points(geometry, material);
    scene.add(autumnEffect);
}

export function updateAutumnEffect() {
    if (!autumnEffect) return;
    const positions = autumnEffect.geometry.attributes.position.array;
    const rotations = autumnEffect.geometry.attributes.rotation.array;
    const time = performance.now() * 0.001;

    for (let i = 0; i < positions.length / 3; i++) {
        const idx = i * 3;
        const rot = rotations[i];

        // 낙엽은 아래로 떨어지면서 회전하는 자연스러움
        positions[idx + 1] -= 0.02 + Math.random() * 0.01; // 낙하 속도

        // 바람에 흔들리는 효과 (X, Z 축)
        positions[idx + 0] += Math.sin(time * 0.8 + rot) * 0.02;
        positions[idx + 2] += Math.cos(time * 0.9 + rot) * 0.02;

        // 낙엽 회전 (간단한 회전 효과)
        rotations[i] += 0.01 + Math.random() * 0.02;

        // 바닥에 닿거나 낮아지면 재생성
        if (positions[idx + 1] < 0) {
            positions[idx + 0] = Math.random() * 60 - 30;
            positions[idx + 1] = Math.random() * 10 + 8; // 다시 높이
            positions[idx + 2] = Math.random() * 30 - 15;
            rotations[i] = Math.random() * Math.PI * 2;
        }
    }
    autumnEffect.geometry.attributes.position.needsUpdate = true;
    autumnEffect.geometry.attributes.rotation.needsUpdate = true;
}

export function removeAutumnEffect() {
    if (autumnEffect) {
        scene.remove(autumnEffect);
        autumnEffect.geometry.dispose();
        autumnEffect.material.dispose();
        autumnEffect = null;
    }
}


// === WINTER: Create Aurora === //

// === 오로라 효과 생성 모듈 ===

let auroraLayers = [];
let auroraClock = new THREE.Clock();

export function createAurora() {
    removeAuroraEffect(); // 기존 오로라 제거

    const layerSettings = [
        { amplitude: 3.0, frequency: 0.02, speed: 0.5, color1: 0x00ff88, color2: 0x4488ff, yPos: 25 },
        { amplitude: 4.5, frequency: 0.03, speed: 0.8, color1: 0x4488ff, color2: 0x00ff88, yPos: 30 },
        { amplitude: 6.0, frequency: 0.04, speed: 1.1, color1: 0x8800ff, color2: 0xff0088, yPos: 35 }
    ];

    layerSettings.forEach((settings, index) => {
        const layer = createAuroraLayer(settings, index);
        auroraLayers.push(layer);
        scene.add(layer);
    });
}

function createAuroraLayer(settings, layerIndex) {
    const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            amplitude: { value: settings.amplitude },
            baseAmplitude: { value: settings.amplitude },

            frequency: { value: settings.frequency },
            speed: { value: settings.speed },
            baseColor: { value: new THREE.Color(settings.color1) },
            accentColor: { value: new THREE.Color(settings.color2) },
            opacity: { value: 0.7 - layerIndex * 0.2 },
            noiseScale: { value: 2.0 + layerIndex * 0.5 },
            seasonFactor: { value: 1.0 }
        },
        vertexShader: auroraVertexShader,
        fragmentShader: auroraFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.y = -Math.PI / 2;
    mesh.rotation.z = -Math.PI;


    mesh.position.set(5, settings.yPos, -layerIndex * 15);
    mesh.userData.layerIndex = layerIndex; // ← 추가
    return mesh;
}

export function updateAurora() {
    const elapsedTime = auroraClock.getElapsedTime();

    auroraLayers.forEach((layer) => {
        const mat = layer.material;

        // 1. 시간 업데이트
        mat.uniforms.time.value = elapsedTime;

        // 2. 동적 진폭 계산 (기본값 + 변동)
        const baseAmp = mat.uniforms.baseAmplitude.value;
        mat.uniforms.amplitude.value = baseAmp + Math.sin(elapsedTime * 0.8) * (baseAmp * 0.3);

        // 3. 계절별 색상 전환 // 추가 될 수 있음
        const isWinter = season.winter;
        mat.uniforms.baseColor.value.lerp(
            new THREE.Color(isWinter ? 0x00ff88 : 0xff4488),
            0.1
        );
        mat.uniforms.accentColor.value.lerp(
            new THREE.Color(isWinter ? 0x4488ff : 0x88ff44),
            0.1
        );

        //
        const targetOpacity = isDay
            ? 0.3 - layer.userData.layerIndex * 0.1
            : 0.9 - layer.userData.layerIndex * 0.2;
        mat.uniforms.opacity.value += (targetOpacity - mat.uniforms.opacity.value) * 0.1;
    });
}


export function removeAuroraEffect() {
    auroraLayers.forEach(layer => {
        layer.geometry.dispose();
        layer.material.dispose();
        scene.remove(layer);
    });
    auroraLayers = [];
}

// ===== 셰이더 코드 =====
const auroraVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying float vWave;

uniform float time;
uniform float amplitude;
uniform float frequency;
uniform float speed;
uniform float noiseScale;

// 3D Simplex Noise 함수
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i); 
    vec4 p = permute(permute(permute( 
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    vUv = uv;
    vec3 pos = position;
    
    float t = time * speed;
    vec3 noiseCoord = pos * frequency + vec3(0.0, t, 0.0);
    
    float noise = snoise(noiseCoord * noiseScale) * amplitude;
    noise += snoise(noiseCoord * 2.0 + t) * amplitude * 0.5;
    noise *= smoothstep(0.3, 0.8, length(uv - 0.5));
    
    pos.z += noise;
    vWave = noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const auroraFragmentShader = `
varying vec2 vUv;
varying float vWave;
uniform vec3 baseColor;
uniform vec3 accentColor;
uniform float opacity;

void main() {
    float gradient = smoothstep(0.2, 0.8, vUv.x);
    vec3 color = mix(baseColor, accentColor, gradient);
    
    float waveIntensity = smoothstep(-1.0, 1.0, vWave);
    float alpha = waveIntensity * opacity * (1.0 - smoothstep(0.4, 0.9, length(vUv - 0.5)));
    
    gl_FragColor = vec4(color * 1.5, alpha);
}
`;


//===========================================================
//
// Rainning area around the clouds.
let rainAreaRadius = 2;
//
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

// === Particle system for rain with wind and turbulence ===
// This section updates the position of each rain particle, applying gravity, wind, turbulence, and boundary recycling.
// It ensures realistic rain movement and continuous rainfall without spawning new particles every frame.
export function updateRain() {
    if (!rainParticles || !rainParticles.geometry) return;

    const positions = rainParticles.geometry.attributes.position.array;
    const speeds = rainParticles.geometry.attributes.speed.array;
    const sizes = rainParticles.geometry.attributes.size.array;
    const time = performance.now() * 0.001;
    const delta = clock.getDelta();

    // Boundary
    const BOUNDARY_X = 75;
    const BOUNDARY_Z = 120;
    const RESET_HEIGHT = 0.4;

    // Wind Parameter input
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

        // // 5. 동적 크기 조절 (낙하 가속도 효과)
        // Remove for debugging
        // const fallProgress = 1 - (positions[index + 1] / RESET_HEIGHT);
        // sizes[i] = 1.2 +
        //     Math.sin(fallProgress * Math.PI) * 2.5 +
        //     Math.random() * 0.3;
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
            removeMoon();
            break;
        case 'stormy':
            setWindStrength(2.5);
            setWindDirection(0.8, 0, 0.6);
            setWindTurbulence(1.5);
            removeMoon();
            break;
        case 'snowy':
            setWindStrength(0.8);
            setWindDirection(0.7, 0, 0.7);
            setWindTurbulence(0.4);
            removeMoon();
            break;
        case 'cloudy':
            setWindStrength(0.6);
            setWindDirection(1, 0, 0);
            setWindTurbulence(0.3);
            removeMoon();
            break;
        default: // clear
            setWindStrength(0.3);
            setWindDirection(1, 0, 0);
            setWindTurbulence(0.2);
            removeMoon();
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
    // Fog paramter adjustment
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

// Puddles
/**
 * Puddle (water accumulation) effect.
 * When it rains, a reflective, semi-transparent puddle mesh is created on the ground.
 * Uses MeshPhysicalMaterial for realistic water appearance.
 */
//
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
    }else if (type === "sunny"){
        sun();
        removeNightEffect(); // 야간 효과 완전 제거
        setDayMode(); // 주간 모드 강제 활성화
    }

    updateSky();
}

//계절 변환//
export function setSeason(type) {
    // 모든 계절 이펙트 비활성화 및 제거
    removeAuroraEffect();
    season.spring = season.summer = season.autumn = season.winter = false;

    removeSpringEffect();
    removeSummerEffect();
    removeAutumnEffect();
    removeAuroraEffect(); //Was winter effect previously/

    switch(type) {
        case 'spring':
            season.spring = true;
            setWeather('rainy'); // 봄: 비
            createSpringEffect();
            setGrassColorByKey('spring');
            removeMoon();
            break;
        case 'summer':
            season.summer = true;
            setWeather('sunny'); // 여름: 맑음
            createSummerEffect();
            setGrassColorByKey('summer');
            removeMoon();
            break;
        case 'autumn':
            season.autumn = true;
            setWeather('cloudy'); // 가을: 흐림
            createAutumnEffect();
            setGrassColorByKey('autumn');
            removeMoon();
            break;
        case 'winter':
            season.winter = true;
            createMoon();
            setWeather('snowy'); // 겨울: 눈
            createAurora();
            setGrassColorByKey('winter');
            removeMoon();
            break;
    }
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

/**
 * Main animation loop.
 * Updates all dynamic elements in the scene each frame.
 */
function animate() {
    requestAnimationFrame(animate);
    cloudMove();
    const deltaTime = clock.getDelta();

    updateMoon(deltaTime);
    updateAurora();



    updateRain();
    updateSnow();
    updateStorm();
    updateWind();
    updateFog();
    updateSummerEffect();
    updateAutumnEffect();
    updateSpringEffect();


    //It was "Winter Effect" previously//"
    updateGustSystem();


}
animate();
