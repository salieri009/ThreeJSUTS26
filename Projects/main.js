import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { animate, loadScene } from "./scripts/gridModels.js";

import {  cloudMove, loadClouds, setBackground, sun, createRain, updateRain, removeRain,
    createSnow, updateSnow, removeSnow,
    createStorm, updateStorm, removeStorm,
    setWeather} from "./scripts/environment.js";

import { init } from "./scripts/UIManager.js";
import { addBlock, deleteModel } from "./scripts/buttonInteract.js";
// import * as seasonSyncUtil from './seasonSyncUtil';

//==================================================//
setScene();
controlCamera();
loadScene();
animate();
//===================Weather========================//
setBackground();
sun();
loadClouds();
cloudMove();

// 날씨 버튼 이벤트 연결//
//Test Function //


// weatherAnimate();


//=====================================================//
addBlock();
deleteModel();
//=============UI Calling=====================================//

// initClock();
init();
