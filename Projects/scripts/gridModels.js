import * as THREE from '../build/three.module.js';
import { GLTFLoader } from '../build/GLTFLoader.js';
import { scene, camera } from './sceneManager.js';

export let highlight, tree, cow, grass, cloud, barn, fence, chicken, hay, rock, carrot, potato, tomato, wheat, soil, stonePath, pebble, pSoil, tSoil, wSoil;
let carrotField;
export let grasses = [];

export let grid = new THREE.GridHelper(10, 5);
const gridSize = 2;
export let selectedObject ;
export let isPlacing = false;
export let selectedSize = { width: 1, height: 1 };

const textureLoad = new THREE.TextureLoader();

export const modelData = {  
    //wdith = x , height = z
    "Cow": { width: 2, height: 1},
    "Pig": { width: 2, height: 1}, //
    "Sheep": { width: 2, height: 1}, //
    "Chicken": { width: 1, height: 1},

    "Barn": { width: 5, height: 3},
    "Fence": { width: 2, height: 1},
    "SRock": { width: 1, height: 1}, 
    "Rock": { width: 2, height: 2}, 

    "Hay": { width: 1, height: 1}, 
    "Carrot": { width: 3, height: 1}, 
    "Potato": { width: 3, height: 1},
    "Tomato": { width: 3, height: 1},
    "Wheat": { width: 3, height: 1},

    "Tree": { width: 1, height: 1}, 
    "FruitTree": { width: 1, height: 1}, //

    "StonePath": { width: 1, height: 1},
}

export function loadScene() {
    const dirt = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 10),
        new THREE.MeshPhongMaterial({ color: 0x964B00 })
    );
    scene.add(dirt);

    grass = new THREE.Mesh(
        new THREE.BoxGeometry(10, 2, 10),
        new THREE.MeshPhongMaterial({ color: 0x3E5C3A })
    );
    grass.receiveShadow  = true;
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
                node.castShadow = true;
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
                node.castShadow = true;
                if (node.name === "pCube1_lambert1_0") {
                    node.material.map = hayTexture;
                } else if (node.name === "pPlane46_lambert2_0" ||node.name === "pPlane47_lambert2_0") {
                    node.material.map = hayTexture2;
                }
            }
        });
        //scene.add(hay);
        hay.name = 'Hay';
        createBox(hay, 20, 20, 20);
    });

    const rockTexture = textureLoad.load('models/rock/textures/Material.010_baseColor.png');
    loader.load("models/rock/scene.gltf", (gltf) => {
        rock = gltf.scene;
        rock.scale.set(1, 1, 1);
        rock.position.set(0, 6, 0);
        rock.traverse(node => {
            if(node.isMesh) {
                node.material.map = rockTexture;
                 node.castShadow = true;
            }
        });
        rock.name = 'Rock';
        createBox(rock, 5, 5, 5);
    });

    loader.load("models/pebbles/scene.gltf", (gltf) => {
        pebble = gltf.scene;
        pebble.scale.set(100, 100, 100);
        pebble.position.set(0, 6, 0);
        pebble.traverse(node => {
            if(node.isMesh) {
                node.castShadow = true;
            }
        });
        pebble.name = "SRock"
        createBox(pebble, 1, 2, 1)
        //scene.add(pebble);
    });

    const stonePathTexture = textureLoad.load('models/stonePath/textures');
    loader.load("models/stonePath/scene.gltf", (gltf) => { //수정필요
        stonePath = gltf.scene;
        stonePath.scale.set(2, 2, 2);
        stonePath.position.set(0, 5, 0);
        stonePath.traverse(node => {
            if(node.isMesh)  {
                node.material.map = stonePathTexture;
            }
        });
        stonePath.name = 'StonePath';
        createBox(stonePath, 1, 1, 1);
        //scene.add(stonePath);
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        carrotField = gltf.scene;

        carrotField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "Soil003_Dirt_0") {
                    soil = node.clone();
                } else if (node.name === "Carrot_F3_Carrot_0") {
                    carrot = node.clone();
                }
            }
        });

        if (soil && carrot) {
            soil.scale.set(1, 1, 1);
            soil.rotation.set(-Math.PI / 2, 0, 0);
            soil.position.set(0, 6, 0);

            carrot.scale.set(1, 1, 1);
            carrot.position.set(0, 0, 0);
            soil.add(carrot);

            const leftCarrot = carrot.clone();
            leftCarrot.position.set(-2, 0, 0);
            soil.add(leftCarrot);

            const rightCarrot = carrot.clone();
            rightCarrot.position.set(2, 0, 0);
            soil.add(rightCarrot);

            createBox(soil, 4, 3, 2);

            soil.name = "Carrot"; 
        }
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        let potatoField = gltf.scene;

        potatoField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "Soil003_Dirt_0") {
                    pSoil = node.clone();
                } else if (node.name === "Potatoe_F3_Potatoe_0") {
                    potato = node.clone();
                }
            }
        });

        if (pSoil && potato) {
            pSoil.scale.set(1, 1, 1);
            pSoil.rotation.set(-Math.PI / 2, 0, 0);
            pSoil.position.set(0, 6, 0);

            potato.scale.set(1, 1, 1);
            potato.position.set(0, 0, 0);
            pSoil.add(potato);

            const left = potato.clone();
            left.position.set(-2, 0, 0);
            pSoil.add(left);

            const right = potato.clone();
            right.position.set(2, 0, 0);
            pSoil.add(right);

            createBox(pSoil, 4, 3, 2);

            pSoil.name = "Potato"; 
        }
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        let tomatoField = gltf.scene;

        tomatoField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "Soil003_Dirt_0") {
                    tSoil = node.clone();
                } else if (node.name === "Tomatoe_F3_Tomatoe_0") {
                    tomato = node.clone();
                }
            }
        });

        if (tSoil && tomato) {
            tSoil.scale.set(1, 1, 1);
            tSoil.rotation.set(-Math.PI / 2, 0, 0);
            tSoil.position.set(0, 6, 0);

            tomato.scale.set(1, 1, 1);
            tomato.position.set(0, 0, 0);
            tSoil.add(tomato);

            const left = tomato.clone();
            left.position.set(-2, 0, 0);
            tSoil.add(left);

            const right = tomato.clone();
            right.position.set(2, 0, 0);
            tSoil.add(right);

            createBox(tSoil, 4, 3, 2);

            tSoil.name = "Tomato"; 
        }
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        let wheatField = gltf.scene;

        let wheat1 = null;
        let wheat2 = null;

        wheatField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;

                if (node.name === "Soil003_Dirt_0") {
                    wSoil = node.clone();
                } else if (node.name === "Wheat_F3_Wheat_0") {
                    wheat1 = node.clone();
                } else if (node.name === "Wheat_F3_Wheat_0_1") {
                    wheat2 = node.clone();
                }
            }
        });

        if (wSoil && wheat1 && wheat2) {
            wSoil.scale.set(1, 1, 1);
            wSoil.rotation.set(-Math.PI / 2, 0, 0);
            wSoil.position.set(0, 6, 0);

            wheat1.scale.set(1, 1, 1);
            wheat1.position.set(0, 0, 0);

            wheat2.scale.set(1, 1, 1);
            wheat2.position.set(0, 0, 0); 

            wSoil.add(wheat1);
            wSoil.add(wheat2);

            const left1 = wheat1.clone();
            left1.position.set(-2, 0, 0);

            const left2 = wheat2.clone();
            left2.position.set(-2, 0, 0);

            const right1 = wheat1.clone();
            right1.position.set(2, 0, 0);

            const right2 = wheat2.clone();
            right2.position.set(2, 0, 0);

            wSoil.add(left1, left2, right1, right2);

            createBox(wSoil, 4, 3, 2);

            wSoil.name = "Wheat";
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
    if ((event.key === 'r' || event.key === 'R') && selectedObject) {
        if(selectedObject.name === "Carrot"){
            selectedObject.rotation.z += Math.PI / 2;
        }else{
            selectedObject.rotation.y += Math.PI / 2;
        }
        highlight.rotation.z += Math.PI / 2;

        let temp = selectedSize.width;
        selectedSize.width = selectedSize.height;
        selectedSize.height = temp;

        selectedObject.position.x = Math.round(selectedObject.position.x / gridSize) * gridSize;
        selectedObject.position.z = Math.round(selectedObject.position.z / gridSize) * gridSize;
        highlight.position.x = selectedObject.position.x;
        highlight.position.z = selectedObject.position.z;

        if (selectedSize.width % 2 === 0) {
            selectedObject.position.x = Math.round(selectedObject.position.x / gridSize) * gridSize;
        } else {
            selectedObject.position.x = Math.round(selectedObject.position.x / gridSize) * gridSize ;
        }

        if (selectedSize.height % 2 === 0) {
            selectedObject.position.z = Math.round(selectedObject.position.z / gridSize) * gridSize;
        } else {
            selectedObject.position.z = Math.round(selectedObject.position.z / gridSize) * gridSize;
        }
        highlight.position.x = selectedObject.position.x;
        highlight.position.z = selectedObject.position.z;   
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

        highlight.position.set(gridX + (selectedSize.width % 2 == 0 ? -1 : 0), 6.05, gridZ + (selectedSize.height % 2 == 0 ? -1 : 0) );
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
            let root = intersects[0].object;
            while (root.parent && root.parent.type !== "Scene") root = root.parent;
            if (modelData[root.name]) {
                selectedObject = root;
                selectedSize = { 
                    width: modelData[root.name].width, 
                    height: modelData[root.name].height 
                };
                isPlacing = true;
                highlight.geometry.dispose();
                highlight.geometry = new THREE.PlaneGeometry(selectedSize.width * gridSize, selectedSize.height * gridSize);
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
            selectedObject.visible = true;
            isPlacing = false;
            selectedObject = null;
        }
    }
});

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

export function setModel(object, size, placing = true) {
    selectedObject = object;
    selectedSize = size;
    isPlacing = placing;
    object.visible = false;

    highlight.geometry.dispose();
    highlight.geometry = new THREE.PlaneGeometry(selectedSize.width * 2, selectedSize.height * 2);
}