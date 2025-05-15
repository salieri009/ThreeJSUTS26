import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { setSceneElementsTemp } from "./scripts/gridModels.js";
import { addBlock } from "./scripts/buttonInteract.js";
import { setBackground } from "./scripts/environment.js";

setScene();
controlCamera();

setSceneElementsTemp();

addBlock();

setBackground();