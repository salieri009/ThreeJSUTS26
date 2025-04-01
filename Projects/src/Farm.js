import * as THREE from 'three';

export default class Farm {
    constructor(scene) {
        const WIDTH = 20;
        const HEIGHT = 20;

        const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });

        this.plane = new THREE.Mesh(geometry, material);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.receiveShadow = true;

        scene.add(this.plane);
    }
}
