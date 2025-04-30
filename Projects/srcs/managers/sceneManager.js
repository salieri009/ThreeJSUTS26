import * as THREE from '../../build/three.module.js';
import { OrbitControls } from '../../build/controls/OrbitControls.js';

let camera, controls, renderer, scene;
let cubeManager; // 큐브 매니저 연결 참조

export function setScene() {
    scene = new THREE.Scene();

    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    camera.position.set(5, 15, 20); // 더 나은 조감도 시점 제공
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    const container = document.getElementById('scene-container') || document.body;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Camera Angle Limits

    // 개선된 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(8, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;  // 그림자 품질 향상
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    // ========================Grid=====================================
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        new THREE.MeshStandardMaterial({
            color: 0xa3d9a5,
            roughness: 0.8,
            metalness: 0.2
        })
    );

    //====================================================================
    ground.rotation.x = -Math.PI / 2; // 수평 평면으로 회전
    ground.position.y = -0.25; // 살짝 내려서 큐브와 겹치지 않게
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(40, 40, 0x555555, 0x999999);
    gridHelper.position.y = -0.24;
    scene.add(gridHelper);

    // 카메라 레이어 전체 활성화
    camera.layers.enableAll();

    window.addEventListener('resize', handleWindowResize);
}

function handleWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// CubeManager 연결 및 초기 큐브 그리드 생성
export function setSceneElements(manager) {
    cubeManager = manager;

    if (cubeManager) {
        // 큐브매니저에서 초기화한 큐브들을 씬에 추가
        cubeManager.cubes.forEach(cube => {
            scene.add(cube.group);
        });
        return Promise.resolve(cubeManager);
    } else {
        console.warn("CubeManager가 연결되지 않았습니다");
        return Promise.resolve(null);
    }
}

export function controlCamera() {
    let prevTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now();
        const delta = (now - prevTime) / 1000;
        prevTime = now;

        // 큐브 매니저가 있으면 업데이트 실행
        if (cubeManager) {
            cubeManager.updateCubes(delta);
        }

        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 레이어 가시성 제어
