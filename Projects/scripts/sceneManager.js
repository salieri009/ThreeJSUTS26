import * as THREE from '../build/three.module.js';
import { OrbitControls } from '../build/controls/OrbitControls.js';
import { GLTFLoader } from '../build/GLTFLoader.js';

let camera, controls, renderer, scene, tree, cow;
//const grid = new THREE.GridHelper(10, 5);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function setScene() {
    scene = new THREE.Scene();
    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    camera.position.set(5, 15, 20); 
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; 

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);
}

export function setSceneElementsTemp() {
    const dirtGeometry = new THREE.BoxGeometry(10, 8, 10); 
    const dirtMaterial = new THREE.MeshPhongMaterial({
        color: 0x964B00,
    }); 

    const dirt = new THREE.Mesh(dirtGeometry, dirtMaterial); 
    //scene.add(dirt);

    const grassGeometry = new THREE.BoxGeometry(10, 2, 10); 
    const grassMaterial = new THREE.MeshLambertMaterial({
        color: 0x3E5C3A,
    }); 

    const grass = new THREE.Mesh(grassGeometry, grassMaterial); 
    grass.position.set(0, 5, 0);
    scene.add(grass);

    const planeGeometry = new THREE.PlaneGeometry(10, 10, 5, 5);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color : 0x50a000,
        wireframe: true
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI/2;
    plane.position.set = (0, 0, 0);
    scene.add(plane);


    
    modelsShit();
}


function modelsShit(){
    const loader = new GLTFLoader();
    const textureLoad = new THREE.TextureLoader();

    loader.load("models/tree/scene.gltf", function ( gltf ) {
        tree = gltf.scene;
        tree.scale.set(0.01, 0.01, 0.01);	
        tree.position.set(-3, 6, 0);
        tree.traverse(function(node){
            if(node.isMesh){
                node.castShadow = true;
                node.receiveShadow = false;
            }
        });
        scene.add(tree);
    });

    //math.floor + 0.5로 \
    loader.load("models/cow/Cow.gltf", function ( gltf ) {
        cow = gltf.scene;
        cow.scale.set(0.4, 0.4, 0.4);	
        cow.position.set(0, 6, 0);
        cow.traverse(function(node){
            if(node.isMesh){
                node.castShadow = true;
                node.receiveShadow = false;
            }
        });
        scene.add(cow);
    });
}


export function controlCamera() {
    requestAnimationFrame(controlCamera);
    controls.update();
    
    renderer.render(scene, camera);
}



    /*
    const highlightGeometry = new THREE.PlaneGeometry(2, 2);
    const highlightMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotateX(-Math.PI / 2);
    highlight.position.set(0, 6.05, 0);
    scene.add(highlight);

    grid.position.set(0, 6, 0);
    scene.add(grid);
    
    
        /*
    const highlightGeometry = new THREE.PlaneGeometry(2, 2);
    const highlightMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotateX(-Math.PI / 2);
    highlight.position.set(0, 6.05, 0);
    scene.add(highlight);

    grid.position.set(0, 6, 0);
    scene.add(grid);

    const gridSize = 2; 

window.addEventListener('mousemove', function (event) {
    const mousePosition = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObject(grass);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        const gridX = Math.round(point.x / gridSize) * gridSize;
        const gridZ = Math.round(point.z / gridSize) * gridSize;

        highlight.position.set(gridX, 6.05, gridZ);
    }
});


window.addEventListener('mousedown', function (event) {
    const mousePosition = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object.parent;
        if (clickedObject.name.includes("Tree")) {
            selectedObject = clickedObject;
            selectedSize = { width: 1, height: 1 };
            isPlacing = true;
        } else if (clickedObject.name.includes("Cow")) {
            selectedObject = clickedObject;
            selectedSize = { width: 2, height: 1 };
            isPlacing = true;
        }

        if (selectedObject) {
            highlight.scale.set(selectedSize.width, 1, selectedSize.height);
        }
    } else if (isPlacing && selectedObject) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePosition, camera);
        const intersects = raycaster.intersectObject(grass);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            const gridX = Math.round(point.x / gridSize) * gridSize;
            const gridZ = Math.round(point.z / gridSize) * gridSize;

            selectedObject.position.set(gridX + selectedSize.width / 2, 6.4, gridZ + selectedSize.height / 2);

            isPlacing = false;
            selectedObject = null;
        }
    }
});*/