import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { loadScene } from "./scripts/gridModels.js";
import {  cloudMove, loadClouds, setBackground, sun } from "./scripts/environment.js";
import { init } from "./scripts/UIManager.js";
import { addBlock, deleteModel } from "./scripts/buttonInteract.js";


setScene();
controlCamera();
loadScene();

setBackground();
sun();
loadClouds();
cloudMove();

addBlock();
deleteModel();

init();