import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSG } from 'three-csg-ts';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// 1. Target the specific div
const container = document.getElementById('slice-button');

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();

// Use container dimensions, not window dimensions
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3, 1.5, -2);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    powerPreference: "high-performance",
    alpha: true, // Crucial for transparent background
});

renderer.setClearColor(0x000000, 0); // Transparent clear color
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.outputColorSpace = THREE.SRGBColorSpace; 

// Append to the div, not document.body
container.appendChild(renderer.domElement);

// --- POST PROCESSING SETUP ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    2.5,  // Bloom Strength
    0.6,  // Bloom Radius
    0.1   // Bloom Threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Load model
const loader = new GLTFLoader();
let targetMesh = null;

loader.load(
    '../model/beat_saber_block_fix.glb', 
    (gltf) => {
        targetMesh = gltf.scene;
        targetMesh.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material && node.material.name === 'Material.003') {
                    node.material.emissive = new THREE.Color(0x0fffff);
                    node.material.emissiveIntensity = 0.5; 
                    node.material.color = new THREE.Color(0x00ffff);
                } else {
                    node.material.color = new THREE.Color(0x0044aa); 
                    node.material.emissive = new THREE.Color(0x0044aa);
                    node.material.emissiveIntensity = 0.3;
                }
            }
        });
        scene.add(targetMesh);
    }
);

// Orbit Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.NONE 
};

// Window resizing - adjust to container dynamically
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
});

const raycaster = new THREE.Raycaster();
const mouseStart = new THREE.Vector2();
const mouseEnd = new THREE.Vector2();
let isDragging = false;
let isSliced = false;

// Custom Helper: Get mouse coordinates relative to the div, not the whole screen
function getRelativeMousePosition(event) {
    const rect = container.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
}

function performSlice(start, end) {
    const vStart = new THREE.Vector3(start.x, start.y, 0.5).unproject(camera);
    const vEnd = new THREE.Vector3(end.x, end.y, 0.5).unproject(camera);

    const dragDirection = new THREE.Vector3().subVectors(vEnd, vStart).normalize();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    const planeNormal = new THREE.Vector3().crossVectors(dragDirection, cameraDirection).normalize();

    const bladeGeo = new THREE.BoxGeometry(100, 100, 0.01);
    const bladeMat = new THREE.MeshBasicMaterial({ visible: false });
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);

    const centerPoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
    bladeMesh.position.copy(centerPoint);
    
    bladeMesh.lookAt(new THREE.Vector3().addVectors(centerPoint, planeNormal));
    bladeMesh.updateMatrixWorld();

    sliceMeshWithCSG(bladeMesh);
}

const cutFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3300,        
    emissive: 0xffffff,     
    emissiveIntensity: 2.0,
});

function sliceMeshWithCSG(bladeMesh) {
    if (!targetMesh) return;

    const newTargetGroup = new THREE.Group();
    const leftGroup = new THREE.Group();
    const rightGroup = new THREE.Group();

    const cutterSize = 1000; 
    const cutterGeo = new THREE.BoxGeometry(cutterSize, cutterSize, cutterSize);

    const leftCutter = new THREE.Mesh(cutterGeo.clone(), cutFaceMaterial);
    const rightCutter = new THREE.Mesh(cutterGeo.clone(), cutFaceMaterial);

    leftCutter.position.copy(bladeMesh.position);
    rightCutter.position.copy(bladeMesh.position);
    leftCutter.rotation.copy(bladeMesh.rotation);
    rightCutter.rotation.copy(bladeMesh.rotation);

    leftCutter.translateZ(-cutterSize / 2);
    rightCutter.translateZ(cutterSize / 2);

    leftCutter.updateMatrixWorld(true);
    leftCutter.geometry.applyMatrix4(leftCutter.matrixWorld);
    leftCutter.position.set(0, 0, 0);
    leftCutter.rotation.set(0, 0, 0);
    leftCutter.scale.set(1, 1, 1);
    leftCutter.updateMatrixWorld(true);

    rightCutter.updateMatrixWorld(true);
    rightCutter.geometry.applyMatrix4(rightCutter.matrixWorld);
    rightCutter.position.set(0, 0, 0);
    rightCutter.rotation.set(0, 0, 0);
    rightCutter.scale.set(1, 1, 1);
    rightCutter.updateMatrixWorld(true);

    const meshesToSlice = [];
    targetMesh.traverse(child => {
        if (child.isMesh) {
            meshesToSlice.push(child);
        }
    });

    meshesToSlice.forEach(mesh => {
        try {
            const cloned = mesh.clone();
            cloned.geometry = mesh.geometry.clone();
            cloned.geometry.applyMatrix4(mesh.matrixWorld);

            cloned.position.set(0, 0, 0);
            cloned.rotation.set(0, 0, 0);
            cloned.scale.set(1, 1, 1);
            cloned.updateMatrixWorld(true);

            const leftHalf = CSG.subtract(cloned, leftCutter);
            const rightHalf = CSG.subtract(cloned, rightCutter);

            leftHalf.castShadow = true;
            leftHalf.receiveShadow = true;
            rightHalf.castShadow = true;
            rightHalf.receiveShadow = true;

            leftGroup.add(leftHalf);
            rightGroup.add(rightHalf);
        } catch (e) {
            console.error("CSG failed:", e);
        }
    });
    
    const separationDistance = 0.5; 
    const separationDirection = new THREE.Vector3(0, 0, 1);
    separationDirection.applyQuaternion(bladeMesh.quaternion);

    leftGroup.position.addScaledVector(separationDirection, separationDistance);
    rightGroup.position.addScaledVector(separationDirection, -separationDistance);

    scene.remove(targetMesh);

    newTargetGroup.add(leftGroup);
    newTargetGroup.add(rightGroup);

    scene.add(newTargetGroup);
    targetMesh = newTargetGroup;

    isSliced = true;
    removeSliceListeners();

    // -----------------------------------------------------
    // EMIT CUSTOM EVENT TO ACT AS A BUTTON PRESS
    // -----------------------------------------------------
    const sliceEvent = new CustomEvent('sliceComplete');
    container.dispatchEvent(sliceEvent);
}

function onMouseDown(e) {
    if (isSliced || e.button !== 2) return; 
    e.preventDefault(); 
    isDragging = true;
    
    // Use container-relative coordinates
    const pos = getRelativeMousePosition(e);
    mouseStart.set(pos.x, pos.y);
}

function onMouseUp(e) {
    if (e.button !== 2) return;
    e.preventDefault();

    if (!isDragging || isSliced) return;
    isDragging = false;

    // Use container-relative coordinates
    const pos = getRelativeMousePosition(e);
    mouseEnd.set(pos.x, pos.y);

    if (!targetMesh) return;

    const midPoint = new THREE.Vector2().addVectors(mouseStart, mouseEnd).multiplyScalar(0.5);

    raycaster.setFromCamera(midPoint, camera);
    const intersects = raycaster.intersectObject(targetMesh, true);

    if (intersects.length > 0) {
        performSlice(mouseStart, mouseEnd); 
    }
}

// Block the context menu specifically on the container to prevent visual bugs
container.addEventListener('contextmenu', e => e.preventDefault());

function removeSliceListeners() {
    container.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
}

// Attach mousedown to container, but mouseup to window so dragging out of the div still registers the cut
container.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
}
animate();