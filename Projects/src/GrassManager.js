import * as THREE from 'three';

export default class GrassManager {
    constructor(scene) {
        this.scene = scene;
        this.grassBlades = [];
        this.params = {
            count: 1000,
            height: 1.0,
            growthSpeed: 0.5,
            color: 0x4CAF50
        };
        this.createGrass();
    }

    createGrass() {
        this.grassBlades.forEach(blade => this.scene.remove(blade));
        this.grassBlades = [];

        const geometry = new THREE.PlaneGeometry(0.1, 1);
        geometry.translate(0, 0.5, 0);

        const material = new THREE.MeshStandardMaterial({
            color: this.params.color,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < this.params.count; i++) {
            const blade = new THREE.Mesh(geometry, material);
            blade.position.set(
                (Math.random() - 0.5) * 18,
                0,
                (Math.random() - 0.5) * 18
            );
            blade.rotation.y = Math.random() * Math.PI * 2;
            blade.scale.y = 0.1;
            blade.userData = {
                originalHeight: Math.random() * 0.5 + 0.5,
                growthStage: Math.random() * 0.2
            };
            blade.castShadow = true;
            this.scene.add(blade);
            this.grassBlades.push(blade);
        }
    }

    update(deltaTime) {
        this.grassBlades.forEach(blade => {
            blade.userData.growthStage += deltaTime * this.params.growthSpeed;
            if (blade.userData.growthStage < 1) {
                blade.scale.y = 0.1 + blade.userData.growthStage *
                    (blade.userData.originalHeight * this.params.height - 0.1);
            }
        });
    }

    updateColor(newColor) {
        this.grassBlades.forEach(blade => {
            blade.material.color.set(newColor);
        });
    }
}
