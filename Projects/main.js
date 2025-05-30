import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { animate, loadScene } from "./scripts/gridModels.js";
import {  cloudMove, loadClouds, setBackground, sun, } from "./scripts/environment.js";
import { init } from "./scripts/UIManager.js";
import { addBlock, deleteModel } from "./scripts/buttonInteract.js";
import * as seasonSyncUtil from './scripts/seasonSyncUtil.js';

//Scene & Camera Setup
// - Initialize the Three.js scene, camera, and renderer
setScene();
controlCamera();
loadScene();
//Begin rendering
animate();
setBackground();
sun();
loadClouds();
cloudMove();

// Terrain & Object Controls
// - Enable terrain expansion and model deletion
addBlock();
deleteModel();
seasonSyncUtil.initSeasonSyncUtil()

init();
