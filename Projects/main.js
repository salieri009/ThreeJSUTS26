import { setScene, setSceneElements, controlCamera } from "/Projects/sceneManager.js";
import UIManager from "./UIManager.js";

// Initialize the Three.js scene and controls
setScene();
setSceneElements();
controlCamera();

// Create an instance of UIManager
const ui = new UIManager();