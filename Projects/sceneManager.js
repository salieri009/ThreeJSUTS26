import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { GLTFLoader } from './build/GLTFLoader.js';

let camera, controls, renderer, scene;

export function setScene() {
    scene = new THREE.Scene();

    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    camera.position.set(0, 10, 25);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    // #scene-container에 추가 (CSS가 적용되어 있다고 가정)
    const container = document.getElementById('scene-container') || document.body;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 기본 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(8, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 바닥(그리드) 예시
    const ground = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.5, 10), // BoxGeometry로 변경 (15x15 크기, 두께 0.5)
        new THREE.MeshStandardMaterial({ color: 0xb7e1cd }) // 동일한 재질
    );
    ground.position.y = 0; // 두께의 절반만큼 올려서 바닥이 씹히지 않도록
    ground.receiveShadow = true;
    scene.add(ground);

    // 리사이즈 대응
    window.addEventListener('resize', handleWindowResize);
}

function handleWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function setSceneElements() {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            "models/Cow.gltf",
            (gltf) => {
                gltf.scene.traverse(child => {
                    if (child.isMesh) child.castShadow = true;
                });
                scene.add(gltf.scene);
                resolve(gltf.scene);
            },
            undefined,
            (error) => {
                console.error("Cow.gltf load error", error);
                alert("Failed to load Cow model.");
                reject(error);
            }
        );
    });
}

export function controlCamera() {
    let prevTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now();
        const delta = (now - prevTime) / 1000;
        prevTime = now;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 필요한 전역 access용 getter (권장)
export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
