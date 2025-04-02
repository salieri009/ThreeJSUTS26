import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/controls/OrbitControls.js';

let scene;

export function setScene(){
    scene = new THREE.Scene();
    const ratio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    scene.background = new THREE.Color(0x87CEEB);

    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 1);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
}

export function setSceneElements(){
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
    });
    
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);
}

/*

class SceneManager {
    constructor(containerId) {
        // 1. 기본 씬 설정
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // 2. 카메라 설정
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);  // 장면 중심을 바라봄

        // 3. 렌더러 설정
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById(containerId).appendChild(this.renderer.domElement);

        // 4. 컨트롤 설정
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;

        // 5. 조명 시스템 초기화
        this._initLightingSystem();

        // 6. 테스트 객체 추가
        this._addDebugObjects();

        // 7. 창 크기 변경 핸들러
        window.addEventListener('resize', this._handleResize.bind(this));
    }

    _initLightingSystem() {
        // 환경 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambientLight);

        // 주 조명
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    _addDebugObjects() {
        // 테스트 큐브
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            metalness: 0.3,
            roughness: 0.2
        });
        this.testCube = new THREE.Mesh(geometry, material);
        this.testCube.castShadow = true;
        this.testCube.receiveShadow = true;
        this.scene.add(this.testCube);

        // 바닥 평면
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            side: THREE.DoubleSide
        });
        this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);

        // 좌표계 도우미
        this.scene.add(new THREE.AxesHelper(5));
    }

    _handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// 초기화 및 애니메이션 루프
const sceneManager = new SceneManager('scene-container');

function animate() {
    requestAnimationFrame(animate);

    // 테스트 큐브 회전
    sceneManager.testCube.rotation.x += 0.01;
    sceneManager.testCube.rotation.y += 0.01;

    sceneManager.render();
}

// 초기 렌더링 강제 실행
setTimeout(() => {
    sceneManager.render();
}, 100);

animate();
*/