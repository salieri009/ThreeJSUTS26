
import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { setSceneElementsTemp } from "./scripts/gridModels.js";
import { addBlock } from "./scripts/buttonInteract.js";
import { setBackground } from "./scripts/environment.js";

import { setScene, controlCamera, setSceneElementsTemp} from "./scripts/sceneManager.js";
import { UIManager } from './scripts/UIManager.js';

setScene();
controlCamera();

setSceneElementsTemp();

addBlock();

setBackground();
const uiManager = new UIManager({
    onItemDrop: (type, x, y) => {
        console.log('드롭된 타입:', type, '위치:', x, y);
    }
});

