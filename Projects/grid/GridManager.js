import * as THREE from './build/three.module.js';

export default class GridManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.size = options.size || 50;       // 그리드 한 변의 셀 수
        this.cellSize = options.cellSize || 1; // 각 셀의 월드 단위 크기
        // gridData[x][z] = null(비어있음) | { buildingId, type, ... }
        this.gridData = Array.from({length: this.size}, () =>
            Array(this.size).fill(null)
        );

        // 시각적 그리드 헬퍼
        this.gridHelper = new THREE.GridHelper(
            this.size * this.cellSize,
            this.size
        );
        this.scene.add(this.gridHelper);

        // 하이라이트 박스
        this.highlightMesh = null;
    }

    // 월드 좌표 → 그리드 인덱스 변환
    worldToGrid(x, z) {
        const gx = Math.floor(x / this.cellSize + this.size / 2);
        const gz = Math.floor(z / this.cellSize + this.size / 2);
        if (gx < 0 || gz < 0 || gx >= this.size || gz >= this.size) return null;
        return { x: gx, z: gz };
    }

    // 그리드 인덱스 → 월드 좌표 (셀 중심)
    gridToWorld(gx, gz) {
        return {
            x: (gx - this.size / 2 + 0.5) * this.cellSize,
            z: (gz - this.size / 2 + 0.5) * this.cellSize,
        };
    }

    // 해당 범위에 배치 가능 여부 (경계/겹침 체크)
    canPlaceBuilding(gx, gz, width, height) {
        if (
            gx < 0 || gz < 0 ||
            gx + width > this.size ||
            gz + height > this.size
        )
            return false;
        for (let x = gx; x < gx + width; x++) {
            for (let z = gz; z < gz + height; z++) {
                if (this.gridData[x][z] !== null) return false;
            }
        }
        return true;
    }

    // 건물 정보 마킹
    markBuilding(gx, gz, width, height, info) {
        for (let x = gx; x < gx + width; x++) {
            for (let z = gz; z < gz + height; z++) {
                this.gridData[x][z] = info;
            }
        }
    }

    // 건물 제거
    unmarkBuilding(gx, gz, width, height) {
        for (let x = gx; x < gx + width; x++) {
            for (let z = gz; z < gz + height; z++) {
                this.gridData[x][z] = null;
            }
        }
    }

    // 격자 셀 하이라이트
    highlightArea(gx, gz, width, height, color = 0xffff00) {
        if (this.highlightMesh) this.scene.remove(this.highlightMesh);

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width * this.cellSize, 0.1, height * this.cellSize),
            new THREE.MeshBasicMaterial({
                color,
                opacity: 0.3,
                transparent: true,
            })
        );
        const pos = this.gridToWorld(gx + (width - 1) / 2, gz + (height - 1) / 2);
        mesh.position.set(pos.x, 0.06, pos.z);
        this.scene.add(mesh);
        this.highlightMesh = mesh;
    }

    // 하이라이트 제거
    clearHighlight() {
        if (this.highlightMesh) {
            this.scene.remove(this.highlightMesh);
            this.highlightMesh = null;
        }
    }

    // (선택) 특정 셀의 정보 얻기
    getCellInfo(gx, gz) {
        if (
            gx < 0 || gz < 0 ||
            gx >= this.size || gz >= this.size
        ) return null;
        return this.gridData[gx][gz];
    }
}
