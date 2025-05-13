import * as THREE from '../build/three.module.js';
import { GLTFLoader } from '../build/GLTFLoader.js';
import { scene, camera } from './sceneManager.js';

export let highlight, tree, cow, grass, cloud, barn;
export let grasses = [];
export let grid = new THREE.GridHelper(10, 5);

const gridSize = 2;
let selectedObject = null;
let isPlacing = false;
let selectedSize = { width: 1, height: 1 };

const modelData = {     
    "Tree": { width: 1, height: 1 },
    "Cow": { width: 2, height: 1 },
    "Barn": { width: 4, height: 6 },
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
    
    const skyGeometry = new THREE.SphereGeometry(200, 8, 6); 
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide, 
        //flatShading: true      
    });
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);

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
        createBox(tree, 200, 2000, 200);
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
        createBox(cow, 8, 8, 4);
        scene.add(cow);
    });

    loader.load("models/cloud/scene.gltf", (gltf) => {
        cloud = gltf.scene;
        cloud.scale.set(0.25, 0.25, 0.25);
        cloud.position.set(-5, 20, 0);
        cloud.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
            } 
        });
        scene.add(cloud);
    });
    /*
    loader.load("models/Cloud.glb", (gltf) => { //rainy cloud?
        const glb = gltf.scene;
        glb.scale.set(1, 1, 1);
        glb.position.set(0, 30, 0);
        glb.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;

                if (node.material) {
                    node.material.metalness = 0;
                    node.material.roughness = 1;
                    node.material.needsUpdate = true;
                }
            }
        });
        scene.add(glb);
    });*/
    /*
    loader.load("models/barn/scene.gltf", (gltf) => {
        barn = gltf.scene;
        barn.scale.set(0.45, 0.45, 0.5);
        barn.position.set(0.5, 8.5, 0);
        barn.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        barn.name = 'Barn';
        createBox(barn, 20, 12, 12);
        scene.add(barn);
    });*/
}


function setupGridInteractions() {
    highlight = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.set(0, 6.05, 0);
    scene.add(highlight);

    grid.position.set(0, 6, 0);
    scene.add(grid);

    window.addEventListener('keydown', (event) => {
        if ((event.key === 'r' || event.key === 'R') && selectedObject) { //수정필요
            selectedObject.rotation.y += Math.PI / 2;
            highlight.rotation.z += Math.PI / 2;
        }
    });
}

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
            if ( modelData[root.name]) {
                selectedObject = root;
                selectedSize = { width:  modelData[root.name].width, height:  modelData[root.name].height };
                isPlacing = true;
                highlight.scale.set( modelData[root.name].width, 1,  modelData[root.name].height);
            }
        }
    } else {
        const intersects = raycaster.intersectObjects(grasses);
        if (intersects.length > 0 && selectedObject) {
            const point = intersects[0].point;
            const gridX = Math.round(point.x / gridSize) * gridSize;
            const gridZ = Math.round(point.z / gridSize) * gridSize;

            selectedObject.position.set(
                gridX - (selectedSize.width === 2 ? 0.5 : 0),
                6.0,
                gridZ
            );
            isPlacing = false;
            selectedObject = null;
        }
    }
});

function findModelRoot(object) {
    while (object.parent && object.parent.type !== "Scene") object = object.parent;
    return object;
}

function createBox(model, width, height, depth) {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const boxMaterial = new THREE.MeshBasicMaterial({ wireframe: true });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    box.position.set(model.position.x, model.position.y - 5, model.position.z);

    box.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z);
    model.add(box);

    return box;
}

export function setGrid(newGrid) {
    grid = newGrid;
}