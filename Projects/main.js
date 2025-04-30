import { setScene, setSceneElements, controlCamera } from "/Projects/sceneManager.js";
import UIManager from "./UIManager.js";

// Three.js 씬 및 컨트롤 초기화
setScene();
setSceneElements();
controlCamera();

// UI 매니저 인스턴스 생성
const ui = new UIManager();
