/*
import * as THREE from 'three';

export default class AnimalManager {
    constructor(scene) {
        this.scene = scene;
        this.animals = [];
        this.params = {
            count: 5,
            size: 0.5,
            speed: 0.02,
            color: 0xffa500
        };
        this.createAnimals();
    }

    createAnimals() {
        this.animals.forEach(animal => this.scene.remove(animal));
        this.animals = [];

        const geometry = new THREE.SphereGeometry(this.params.size);
        const material = new THREE.MeshStandardMaterial({
            color: this.params.color,
            roughness: 0.8
        });

        for (let i = 0; i < this.params.count; i++) {
            const animal = new THREE.Mesh(geometry, material);
            animal.position.set(
                (Math.random() - 0.5) * 18,
                this.params.size,
                (Math.random() - 0.5) * 18
            );
            animal.userData = {
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize()
            };
            animal.castShadow = true;
            this.scene.add(animal);
            this.animals.push(animal);
        }
    }

    update(deltaTime) {
        this.animals.forEach(animal => {
            animal.position.add(
                animal.userData.direction.clone()
                    .multiplyScalar(this.params.speed * deltaTime)
            );

            if (Math.abs(animal.position.x) > 9 ||
                Math.abs(animal.position.z) > 9) {
                animal.userData.direction.negate();
            }
        });
    }

    updateColor(newColor) {
        this.animals.forEach(animal => {
            animal.material.color.set(newColor);
        });
    }
}*/
