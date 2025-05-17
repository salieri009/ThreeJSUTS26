import * as THREE from '../build/three.module.js';
import { GLTFLoader } from '../build/GLTFLoader.js';
import { scene, camera } from './sceneManager.js';

export let highlight, tree, cow, grass, cloud, barn, fence, chicken, hay, rock, carrot, potato, tomato, wheat, soil;
let carrotField;
export let grasses = [];

export let grid = new THREE.GridHelper(10, 5);
const gridSize = 2;
let selectedObject = null;
let isPlacing = false;
let selectedSize = { width: 1, height: 1 };

const textureLoad = new THREE.TextureLoader();

const modelData = {  
    //wdith = x , height = z
    "Cow": { width: 2, height: 1},
    "Pig": { width: 2, height: 1}, //
    "Sheep": { width: 2, height: 1}, //
    "Chicken": { width: 1, height: 1},

    "Barn": { width: 4, height: 6},
    "Fence": { width: 2, height: 1},
    "SRock": { width: 1, height: 1}, 
    "Rock": { width: 2, height: 2}, 

    "Hay": { width: 1, height: 1}, 
    "Carrot": { width: 3, height: 1}, 

    "Tree": { width: 1, height: 1}, 
    "FruitTree": { width: 1, height: 1}, //

    "StonePath": { width: 1, height: 1},
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
        createBox(tree, 200, 2000, 200);
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
        createBox(cow, 8, 10, 4);
    });

    const fenceTexture = textureLoad.load('models/fence/textures/Wood_diffuse.png') 
    loader.load("models/fence/scene.gltf", (gltf) => {
        fence = gltf.scene;
        fence.scale.set(0.8, 0.9, 0.6);
        fence.position.set(0, 7, 0);
        fence.rotation.set(0, Math.PI / 2, 0);
        fence.traverse(node => {
            if (node.isMesh) {
                node.material.map = fenceTexture;
            }
        });
        fence.name = 'Fence';
        createBox(fence, 5.1, 4, 2.9);
    });

    loader.load("models/chicken/scene.gltf", (gltf) => { //animation : chicken-rig idle, pecking, rest, walking, standing up, sitting idle, sitting down
        chicken = gltf.scene;
        chicken.scale.set(0.006, 0.006, 0.006);
        chicken.position.set(0, 6 , 0);
        fence.traverse(node => {
            if (node.isMesh) node.castShadow = true;
        });
        chicken.name = "Chicken";
        createBox(chicken, 100, 100, 100); //temp
        //scene.add(chicken);
    });

    loader.load("models/barn/scene.gltf", (gltf) => {
        barn = gltf.scene;
        barn.scale.set(0.45, 0.45, 0.5);
        barn.position.set(0.5, 8.5, 0);
        barn.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        barn.name = 'Barn';
        createBox(barn, 20, 12, 12);
    });

    const hayTexture = textureLoad.load('models/hay/textures/lambert1_baseColor.jpeg');
    const hayTexture2 = textureLoad.load('models/hay/textures/lambert2_baseColor.png');
    loader.load("models/hay/scene.gltf", (gltf) => {
        hay = gltf.scene;
        hay.scale.set(0.2, 0.2, 0.15);
        hay.position.set(0, 6, 0);
        hay.traverse(node => {
            if (node.isMesh) {
                if (node.name === "pCube1_lambert1_0") {
                    node.material.map = hayTexture;
                } else if (node.name === "pPlane46_lambert2_0" ||node.name === "pPlane47_lambert2_0") {
                    node.material.map = hayTexture2;
                }
            }
        });

        hay.name = 'Hay';
        createBox(hay, 51, 40, 29);
    });

    const rockTexture = textureLoad.load('models/rock/textures/Material.010_baseColor.png');
    loader.load("models/rock/scene.gltf", (gltf) => {
        rock = gltf.scene;
        rock.scale.set(1, 1, 1);
        rock.position.set(0, 6, 0);
        rock.traverse(node => {
            if(node.isMesh) {
                node.material.map = rockTexture;
            }
        });
        rock.name = 'Rock';
        createBox(rock, 5, 5, 5);
    });

    //crops: carrot(Carrot_F3_Carrot_0), potato(Potatoe_F3_Potatoe_0), tomato(Tomatoe_F3_Tomatoe_0), wheat(Wheat_F3_Wheat_0, _1, _2, _3)
    loader.load("models/crops/scene.gltf", (gltf) => {
        carrotField = gltf.scene;

        carrotField.traverse(node => {
            if (node.isMesh) {
                if (node.name === "Soil003_Dirt_0") {
                    soil = node.clone();
                } else if (node.name === "Carrot_F3_Carrot_0") {
                    carrot = node.clone();
                }
            }
        });

        if (soil && carrot) {
            soil.scale.set(1, 1, 1);
            carrot.scale.set(1, 1, 1);

            soil.rotation.set(-Math.PI / 2, 0, 0);
            soil.position.set(0, 6, 0);
            carrot.position.set(0, 0, 0); 

            soil.add(carrot);
            scene.add(soil);
            createBox(soil, 4, 3, 2);

            soil.name = "Carrot"; 
        }
    });

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
}

window.addEventListener('keydown', (event) => {
    if ((event.key === 'r' || event.key === 'R') && selectedObject) { //수정필요
        selectedObject.rotation.y += Math.PI / 2;
        highlight.rotation.z += Math.PI / 2;
    }
});

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

        highlight.position.set(gridX + (selectedSize.width === 2 ? -1 : 0), 6.05, gridZ + (selectedSize.height === 2 ? -1 : 0));//수정필요
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

            let y = 6; 
            if (selectedObject.name === "Fence" || selectedObject.name === "Barn") y = 7; 
            
            selectedObject.position.set(gridX - (selectedSize.width === 2 ? 0.5 : 0), y, gridZ);
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
    const boxMaterial = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    if(model == soil) {
        box.position.set(model.position.x, model.position.y - 6, model.position.z );
    }else{
        box.position.set(model.position.x, model.position.y - 5, model.position.z );
    } 

    box.rotation.copy(model.rotation);
    model.add(box);

    return box;
}

export function setGrid(newGrid) {
    grid = newGrid;
}