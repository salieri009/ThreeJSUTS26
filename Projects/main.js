import { setScene, controlCamera, setSceneElementsTemp} from "./scripts/sceneManager.js";
import { UIManager } from './scripts/UIManager.js';


setScene();
controlCamera();
setSceneElementsTemp();

// UIManager 인스턴스 생성
const uiManager = new UIManager({
    onItemDrop: (type, x, y) => {
        // Example: Add to the Three.js scene based on the type
        console.log('Add to scene:', type, x, y);

        let object = null;

        // Example logic for adding different objects based on type
        if (type === 'tree') {
            const geometry = new THREE.CylinderGeometry(0.2, 0.5, 2, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0x228B22 });
            object = new THREE.Mesh(geometry, material);
            object.position.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight * 2 - 1), 0); // Map screen coordinates to 3D space
        } else if (type === 'house') {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
            object = new THREE.Mesh(geometry, material);
            object.position.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight * 2 - 1), 0);
        }

        if (object) {
            scene.add(object); // Add the object to the scene
        }
    }
});