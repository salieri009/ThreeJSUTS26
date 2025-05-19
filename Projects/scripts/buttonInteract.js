import * as THREE from '../build/three.module.js';
import { scene, camera } from './sceneManager.js';
import { grasses, grid , setGrid, modelData, setModel, cow, hay, soil} from './gridModels.js';

let level = 1;
let isRemoving = false;

export function addBlock() {
    if (grid) scene.remove(grid);

    let size = level * 10;
    const newGrid = new THREE.GridHelper(size, size / 2);
    newGrid.position.set(-size / 2 + 5, 6, -size / 2 + 5);
    scene.add(newGrid);
    setGrid(newGrid);

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
                new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
            );
            highlight.rotation.x = -Math.PI / 2;
            highlight.position.set(-i * 10, 5.05, -j * 10);
            scene.add(highlight);
        }
    }
    level++;
}

export function deleteModel() {
    isRemoving = true;
    window.addEventListener("mousedown", (event) => {
        if (!camera || !scene) return;

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let root = intersects[0].object;
            while (root.parent && root.parent.type !== "Scene")  root = root.parent;
            if (isRemoving) {
                if(root.name !== "Sky" ) {
                    scene.remove(root);
                    isRemoving = false;
                }
            }
        }
    });
}

document.querySelector('[data-category="terrain expansion"]').addEventListener('click', () => { if(level < 10) addBlock(); });
document.querySelector('[data-category="remove"]').addEventListener('click', () => { deleteModel(); });


document.querySelector('[data-category="animals"] .draggable-item:nth-child(1)').addEventListener('click', () => {
    scene.add(cow);
    setModel(cow, { width: modelData["Cow"].width, height: modelData["Cow"].height }, true);
});

//props
document.querySelector('[data-category="props"] .draggable-item:nth-child(1)').addEventListener('click', () => { 
    scene.add(hay);
    setModel(hay, { width: modelData["Hay"].width, height: modelData["Hay"].height}, true);
});

document.querySelector('[data-category="props"] .draggable-item:nth-child(2)').addEventListener('click', () => { 
    scene.add(soil);
    setModel(soil, { width: modelData["Carrot"].width, height: modelData["Carrot"].height}, true);
});