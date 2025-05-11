import * as THREE from '../build/three.module.js';
import { OrbitControls } from '../build/controls/OrbitControls.js';
import { GLTFLoader } from '../build/GLTFLoader.js';

let camera, controls, renderer, scene;
let tree, cow, grass;
let grasses = [];
let grid = new THREE.GridHelper(10, 5);
let level = 1;

export function setScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 15, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);
}

export function setSceneElementsTemp() {
    const dirt = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 10),
        new THREE.MeshPhongMaterial({ color: 0x964B00 })
    );
    scene.add(dirt);

    grass = new THREE.Mesh(
        new THREE.BoxGeometry(10, 2, 10),
        new THREE.MeshLambertMaterial({ color: 0x3E5C3A })
    );
    grass.position.set(0, 5, 0);
    scene.add(grass);
    grasses.push(grass);

    loadModels();
    setupGridInteractions();
}

function loadModels() {
    const loader = new GLTFLoader();

    loader.load("models/tree/scene.gltf", (gltf) => {
        tree = gltf.scene;
        tree.scale.set(0.01, 0.01, 0.01);
        tree.position.set(-3, 6, 0);
        tree.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        tree.name = 'Tree';
        scene.add(tree);
    });

    loader.load("models/cow/Cow.gltf", (gltf) => {
        cow = gltf.scene;
        cow.scale.set(0.4, 0.4, 0.4);
        cow.position.set(0.5, 6, 0);
        cow.rotation.set(0, Math.PI / 2, 0);
        cow.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        cow.name = 'Cow';
        scene.add(cow);
    });
    //나중에 수정함함
    const treeBox = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
    treeBox.name = "treeBox"; 
    scene.add(treeBox);
}

export function controlCamera() {
    requestAnimationFrame(controlCamera);
    controls.update();
    renderer.render(scene, camera);
}

function setupGridInteractions() {
    const highlight = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.set(0, 6.05, 0);
    scene.add(highlight);

    grid.position.set(0, 6, 0);
    scene.add(grid);

    const gridSize = 2;
    let selectedObject = null;
    let isPlacing = false;
    let selectedSize = { width: 1, height: 1 };

    window.addEventListener("mousemove", (event) => {
        if (!camera || !grass || !highlight) return;

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(grasses);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const gridX = Math.round(point.x / gridSize) * gridSize;
            const gridZ = Math.round(point.z / gridSize) * gridSize;

            highlight.position.set(
                gridX + (selectedSize.width === 2 ? -1 : 0),
                6.05,
                gridZ + (selectedSize.height === 2 ? -1 : 0)
            );
        }
    });

    window.addEventListener("mousedown", (event) => {
        if (!camera || !scene || !grasses || !highlight) return;

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        if (!isPlacing) {
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const root = findModelRoot(intersects[0].object);
                if (root.name.includes("Tree") || root.name.includes("Cow")) {
                    selectedObject = root;
                    selectedSize = root.name.includes("Tree") ? { width: 1, height: 1 } : { width: 2, height: 1 }; //나중에 수정
                    isPlacing = true;
                    highlight.scale.set(selectedSize.width, 1, selectedSize.height);
                }
            }
        } else {
            const intersects = raycaster.intersectObjects(grasses);
            if (intersects.length > 0 && selectedObject) {
                const point = intersects[0].point;
                const gridX = Math.round(point.x / gridSize) * gridSize;
                const gridZ = Math.round(point.z / gridSize) * gridSize;

                selectedObject.position.set(gridX - (selectedSize.width === 2 ? 0.5 : 0), 6.0, gridZ);

                isPlacing = false;
                selectedObject = null;
            }
        }
    });

    window.addEventListener('keydown', (event) => {
        if ((event.key === 'r' || event.key === 'R') && selectedObject) { //수정필요
            selectedObject.rotation.y += Math.PI / 2;
            highlight.rotation.z += Math.PI / 2;
        }

        if (event.key === 'a' && level < 13) {
            addBlock();
            level++;
        }
    });
}

function findModelRoot(object) {
    while (object.parent && object.parent.type !== "Scene") {
        object = object.parent;
    }
    return object;
}

function addBlock() {
    if (grid) scene.remove(grid);

    let size = level * 10;
    grid = new THREE.GridHelper(size, size / 2);
    grid.position.set(-size / 2 + 5, 6, -size / 2 + 5);
    scene.add(grid);

    for (let i = 0; i < level; i++) {
        for (let j = 0; j < level; j++) {
            let dirt = new THREE.Mesh(
                new THREE.BoxGeometry(10, 8, 10),
                new THREE.MeshPhongMaterial({ color: 0x964B00 })
            );
            dirt.position.set(-i * 10, 0, -j * 10);
            scene.add(dirt);

            let newGrass = new THREE.Mesh(
                new THREE.BoxGeometry(10, 2, 10),
                new THREE.MeshLambertMaterial({ color: 0x3E5C3A })
            );
            newGrass.position.set(-i * 10, 5, -j * 10);
            scene.add(newGrass);
            grasses.push(newGrass);

            let highlight = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
            );
            highlight.rotation.x = -Math.PI / 2;
            highlight.position.set(-i * 10, 5.05, -j * 10);
            scene.add(highlight);
        }
    }
}