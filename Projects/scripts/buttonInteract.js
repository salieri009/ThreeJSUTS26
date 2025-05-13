import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';
import { grasses, grid , setGrid } from './gridModels.js';

let level = 1;

export function addBlock() { // can add block by keyboard input "a" for now, this part will be removed/changed
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

}

window.addEventListener('keydown', (event) => {
    if (event.key === 'a' && level < 10) { // 이 이상하면 렉걸림림
        addBlock();
        level++;
    }
});