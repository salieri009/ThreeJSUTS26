import * as THREE from './build/three.module.js';

export default class Farm {
    constructor(scene, options = {}) {
        const WIDTH = options.width || 20;
        const HEIGHT = options.height || 20;

        // 밭의 베이스(흙)
        const groundGeometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // 갈색(흙색)
            roughness: 0.85,
            metalness: 0.18,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.01;
        ground.receiveShadow = true;
        scene.add(ground);

        // 밭의 경계(테두리)
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B4F23,
            metalness: 0.20,
            roughness: 0.7
        });
        const borderThickness = 0.5;
        const borderHeight = 0.8;
        // 앞뒤
        for (let dz of [-HEIGHT/2 + borderThickness/2, HEIGHT/2 - borderThickness/2]) {
            const border = new THREE.Mesh(
                new THREE.BoxGeometry(WIDTH, borderHeight, borderThickness),
                borderMaterial
            );
            border.position.set(0, borderHeight/2, dz);
            border.castShadow = true;
            scene.add(border);
        }
        // 좌우
        for (let dx of [-WIDTH/2 + borderThickness/2, WIDTH/2 - borderThickness/2]) {
            const border = new THREE.Mesh(
                new THREE.BoxGeometry(borderThickness, borderHeight, HEIGHT),
                borderMaterial
            );
            border.position.set(dx, borderHeight/2, 0);
            border.castShadow = true;
            scene.add(border);
        }

        // 밭의 고랑(줄무늬, 선택사항)
        const rowCount = options.rows || 8;
        for (let i = 1; i < rowCount; i++) {
            const gap = HEIGHT / rowCount;
            const rowGeometry = new THREE.BoxGeometry(WIDTH-0.2, 0.07, 0.17);
            const rowMaterial = new THREE.MeshStandardMaterial({
                color: 0x6A4A1B,
                roughness: 0.7,
                metalness: 0.15
            });
            const row = new THREE.Mesh(rowGeometry, rowMaterial);
            row.position.set(0, 0.04, -HEIGHT/2 + i*gap);
            scene.add(row);
        }
    }
}