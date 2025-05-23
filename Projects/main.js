import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { animate, loadScene } from "./scripts/gridModels.js";

import {  cloudMove, loadClouds, setBackground, sun, createRain, updateRain, removeRain,
    createSnow, updateSnow, removeSnow,
    createStorm, updateStorm, removeStorm,
    setWeather} from "./scripts/environment.js";

import { init } from "./scripts/UIManager.js";
import { addBlock, deleteModel } from "./scripts/buttonInteract.js";

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
document.querySelectorAll('.scene-overlay-weather-controls .overlay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.category;
        setWeather(type, scene); // scene은 environment.js에서 export 하거나 import해서 사용
    });
});

// 날씨 애니메이션 루프
function weatherAnimate() {
    requestAnimationFrame(weatherAnimate);
    updateRain();
    updateSnow();
    updateStorm();
}

weatherAnimate();


//=====================================================//
addBlock();
deleteModel();
//=====================================================//
init();