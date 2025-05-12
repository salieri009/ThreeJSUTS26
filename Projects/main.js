import { setScene, controlCamera, setSceneElementsTemp} from "./scripts/sceneManager.js";
import { UIManager } from './scripts/UIManager.js';

//sceneMangaer.js==================================================================
setScene();
controlCamera();
setSceneElementsTemp();

// UIManager instantiation =========================================================
// UIManager만 인스턴스화 (모든 UI 로직은 UIManager에 위임)
const uiManager = new UIManager({
    onItemDrop: (type, x, y) => {
        // UIManager에서 드롭 이벤트를 받으면 필요한 작업만 콜백에서 처리
        // 예시: 콘솔 출력 (실제 오브젝트 추가는 SceneManager에서 별도 함수로 하면 됨)
        console.log('드롭된 타입:', type, '위치:', x, y);
        // 필요하다면 SceneManager의 함수 호출 (예: addObjectToScene(type, x, y))
    }
});
//=====================================================================================