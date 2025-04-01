import * as THREE from 'three'; // THREE 핵심 모듈 추가
import SceneManager from './SceneManager.js';
import Farm from './Farm.js';
import GrassManager from './GrassManager.js';
import AnimalManager from './AnimalManager.js';
import UIManager from './UIManager.js';

// Three.js 컨텍스트 초기화
class MainApplication {
    constructor() {
        this._initScene();
        this._initManagers();
        this._startAnimation();
    }

    _initScene() {
        // 1. 씬 매니저 초기화
        this.sceneManager = new SceneManager('scene-container');

        // 2. 농장 평면 생성 (반드시 풀/동물보다 먼저 생성)
        this.farm = new Farm(this.sceneManager.scene);
    }

    _initManagers() {
        // 3. 풀 & 동물 시스템 초기화
        this.grassManager = new GrassManager(this.sceneManager.scene);
        this.animalManager = new AnimalManager(this.sceneManager.scene);

        // 4. UI 컨트롤 패널 연결
        this.uiManager = new UIManager(
            this.grassManager,
            this.animalManager
        );
    }

    _startAnimation() {
        // 5. 애니메이션 루프 설정
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const deltaTime = clock.getDelta();

            // 시스템 업데이트
            this.grassManager.update(deltaTime);
            this.animalManager.update(deltaTime);

            // 렌더링
            this.sceneManager.render();
        };

        // 6. 초기 강제 렌더링
        this.sceneManager.render();
        animate();
    }
}

// 7. 애플리케이션 실행
new MainApplication();
