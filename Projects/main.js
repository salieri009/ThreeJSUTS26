import {setScene, setSceneElements, controlCamera} from "/Projects/sceneManager.js";
import UIManager from "./UIManager";

setScene();
setSceneElements();
controlCamera();

const uiManager = new UIManager();