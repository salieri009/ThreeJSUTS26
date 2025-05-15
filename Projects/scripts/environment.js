import * as THREE from '../build/three.module.js';
import { scene } from './sceneManager.js';

export function setBackground()  {
    const skyGeometry = new THREE.SphereGeometry(200, 8, 6); 
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide,    
    });
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);
}