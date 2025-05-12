import { setScene, controlCamera, setSceneElementsTemp} from "./scripts/sceneManager.js";
import { UIManager } from '../build/UIManager.js';
setScene();
controlCamera();
setSceneElementsTemp();

// UIManager 인스턴스 생성
const uiManager = new UIManager({
    onItemDrop: (type, x, y) => {
        // 여기에 Three.js 씬에 오브젝트 추가하는 로직 작성
        console.log('Add to scene:', type, x, y);
        // 예: addSceneElement(type, x, y);
    }
});