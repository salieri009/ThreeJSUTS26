gi/*
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export default class UIManager {
    constructor(grassManager, animalManager) {
        this.grassManager = grassManager;
        this.animalManager = animalManager;

        // GUI 초기화
        this.gui = new GUI();

        // 풀 설정 섹션 추가
        this._setupGrassControls();

        // 동물 설정 섹션 추가
        this._setupAnimalControls();
    }

    _setupGrassControls() {
        const folder = this.gui.addFolder('Grass Settings');

        // 풀 개수 조정
        folder.add(this.grassManager.params, 'count', 100, 5000)
            .name('Count')
            .step(100)
            .onChange(() => this.grassManager.createGrass());

        // 풀 높이 조정
        folder.add(this.grassManager.params, 'height', 0.1, 3.0)
            .name('Height');

        // 풀 성장 속도 조정
        folder.add(this.grassManager.params, 'growthSpeed', 0.1, 2.0)
            .name('Growth Speed');

        // 풀 색상 변경
        folder.addColor(this.grassManager.params, 'color')
            .name('Color')
            .onChange(color => this.grassManager.updateGrassColor(color));

        folder.open();
    }

    _setupAnimalControls() {
        const folder = this.gui.addFolder('Animal Settings');

        // 동물 개수 조정
        folder.add(this.animalManager.params, 'count', 1, 20)
            .name('Count')
            .step(1)
            .onChange(() => this.animalManager.createAnimals());

        // 동물 크기 조정
        folder.add(this.animalManager.params, 'size', 0.1, 2.0)
            .name('Size')
            .onChange(() => this.animalManager.createAnimals());

        // 동물 이동 속도 조정
        folder.add(this.animalManager.params, 'speed', 0.01, 0.1)
            .name('Speed');

        // 동물 색상 변경
        folder.addColor(this.animalManager.params, 'color')
            .name('Color')
            .onChange(color => this.animalManager.updateAnimalColor(color));

        folder.open();
    }
}
*/