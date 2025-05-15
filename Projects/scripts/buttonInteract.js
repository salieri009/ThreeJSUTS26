import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { grasses, grid , setGrid, cow } from './gridModels.js';

let level = 1;

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

document.querySelector('[data-category="terrain expansion"]').addEventListener('click', () => { if(level < 10) addBlock(); });