import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { globeState } from './GlobeState.js';

let camera, scene, bloomScene, renderer, controls, group;
let bloomRenderScene, finalRenderScene, bloomPass, bloomComposer, outputPass, finalComposer;

const particlesData = [];
let particles, pointCloud, particlePositions;

const travelingParticlesCount = 15; // Number of traveling particles
//let maxIndex;

const BLOOM_LAYER = new THREE.Layers();
BLOOM_LAYER.set(1);  // '1' is the layer number for blooming objects

const params = {
	threshold: 0,
	strength: 10,
	radius: 0,
	exposure: 1
};

init();

function init() {

	// RENDERER
	const container = document.getElementById( 'container' );
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.toneMapping = THREE.ReinhardToneMapping;
	container.appendChild( renderer.domElement );

	// SCENE
	//bloomScene = new THREE.Scene();
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 1400, 2400);
	

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
	camera.position.z = 1750;

	//bloomScene.add( camera );
	scene.add( camera );
	

	// CONTROLS
	controls = new OrbitControls( camera, renderer.domElement );
	controls.minDistance = 1000;
	controls.maxDistance = 3000;

	group = new THREE.Group();

	initPostprocessing();

	setupScene();

	//bloomScene.add( globeState.travelingParticles );
	scene.add( group );
	//scene.add( globeState.travelingParticles );
	
	window.addEventListener( 'resize', onWindowResize );
}

function initPostprocessing() {

	// BLOOM
	//bloomComposer = new EffectComposer( renderer );
	//bloomRenderScene = new RenderPass( bloomScene, camera );

	bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	bloomPass.threshold = params.threshold;
	bloomPass.strength = params.strength;
	bloomPass.radius = params.radius;
	bloomPass.renderToScreen = true;

	//bloomComposer.addPass(new RenderPass(bloomScene, camera) );
	//bloomComposer.addPass( bloomPass );

	// FINAL COMPOSER
	finalComposer = new EffectComposer( renderer );
	finalComposer.setSize( window.innerWidth, window.innerHeight );


	finalRenderScene = new RenderPass( scene, camera );

	//outputPass = new OutputPass();
	
	finalComposer.addPass( finalRenderScene );
	//finalComposer.addPass( bloomRenderScene );
	finalComposer.addPass( bloomPass );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	finalComposer.setSize( window.innerWidth, window.innerHeight );
}

function setupScene() {

	//#region SPHERE
	globeState.sphereGeometry = new THREE.IcosahedronGeometry( 600, 3 );
	const sphereMaterial = new THREE.MeshBasicMaterial( { 
		color: '#A9A9A9', 	// Color of the mesh (gray)
		wireframe: true, 	// Disable faces of mesh
		transparent: true,	// Make mesh transparent
		opacity: 0.5 		// Opacity of the mesh
	});
	const sphere = new THREE.Mesh( globeState.sphereGeometry, sphereMaterial );
	// Store the vertices of the sphere in an array
	globeState.sphereVertices = globeState.sphereGeometry.attributes.position.array;
	// Store the number of vertices in the sphere
	globeState.sphereNumVertices = globeState.sphereGeometry.attributes.position.count; // "540"

	let maxIndex = globeState.sphereGeometry.attributes.position.count;
	group.add( sphere );

	// Randomly select a vertext from the sphere
	const startVertexIndex = Math.floor(Math.random() * globeState.sphereGeometry.attributes.position.count) * 3;
	const vertex = new THREE.Vector3(
		globeState.sphereGeometry.attributes.position.array[startVertexIndex],
		globeState.sphereGeometry.attributes.position.array[startVertexIndex + 1],
		globeState.sphereGeometry.attributes.position.array[startVertexIndex + 2]
	);
	const closestVertices = findClosestVertices(vertex, globeState.sphereGeometry, 6);
	const targetVertexIndex = closestVertices[Math.floor(Math.random() * closestVertices.length)];

	particlesData.push({
		source: new THREE.Vector3(
			globeState.sphereGeometry.attributes.position.array[startVertexIndex],
			globeState.sphereGeometry.attributes.position.array[startVertexIndex + 1],
			globeState.sphereGeometry.attributes.position.array[startVertexIndex + 2]
		),
		target: new THREE.Vector3(
			globeState.sphereGeometry.attributes.position.array[targetVertexIndex * 3],
			globeState.sphereGeometry.attributes.position.array[targetVertexIndex * 3 + 1],
			globeState.sphereGeometry.attributes.position.array[targetVertexIndex * 3 + 2]
		),
		closestVertices: closestVertices,
		lerpFactor: 0,
		prevTargetIndex: null,
		visitedCount: 0
	});
	//#endregion

	//#region SPHERE POINTS
	// Create a new buffer geometry to define the positions and colors of points
	const pMaterial = new THREE.PointsMaterial({
		color: '#A9A9A9', // Green color
		size: 20,
		blending: THREE.AdditiveBlending,
		transparent: true,
		sizeAttenuation: true
	});

	// Extract vertices from the sphere geometry
	particles = new THREE.BufferGeometry();	
	particlePositions = new Float32Array(globeState.sphereNumVertices * 3);

	// Loop to initialize particles with random positions and velocities
	for (let i = 0; i < globeState.sphereNumVertices; i++) {

		// Generate positions
		const x = globeState.sphereVertices[i * 3];
		const y = globeState.sphereVertices[i * 3 + 1];
		const z = globeState.sphereVertices[i * 3 + 2];

		// Store the initial position of the particle in the 'particlePositions' array
		particlePositions[i * 3] = x;
		particlePositions[i * 3 + 1] = y;
		particlePositions[i * 3 + 2] = z;

		// Initialize particle data
		particlesData.push({
			velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
			numConnections: 0
		});
	}

	particles.setDrawRange(0, globeState.sphereNumVertices );
	particles.setAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
	pointCloud = new THREE.Points( particles, pMaterial );
	pointCloud.renderOrder = 0;
	pointCloud.layers.set(0);
	group.add( pointCloud ); // Add the particle system to the scene
	//#endregion

	//#region TRAVELING PARTICLES
	const travelingParticlesGeometry = new THREE.BufferGeometry();

	// Use the sphere's vertices to determine the path for traveling particles
	for (let i = 0; i < travelingParticlesCount; i++) {
		// Randomly select a vertext from the sphere
		const vertexIndex = Math.floor(Math.random() * globeState.sphereVertices.length / 3) * 3;
		globeState.travelingParticlesVertices.push(globeState.sphereVertices[vertexIndex], globeState.sphereVertices[vertexIndex + 1], globeState.sphereVertices[vertexIndex + 2]);
	}
	travelingParticlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(globeState.travelingParticlesVertices, 3));
	const travelingParticlesMaterial = new THREE.PointsMaterial({
		color: 0x00FF00,  // Green color
		size: 5,
		transparent: true,
		opacity: 0.5,
		blending: THREE.AdditiveBlending
	});

	globeState.travelingParticles = new THREE.Points(travelingParticlesGeometry, travelingParticlesMaterial);
	globeState.travelingParticles.material.sizeAttenuation = false;
	globeState.travelingParticles.material.needsUpdate = true;
	globeState.travelingParticles.renderOrder = 1;
	globeState.travelingParticles.layers.enable(1); // '1' is the layer number you set for blooming objects
	group.add(globeState.travelingParticles);

	// Initialize the traveling particles data
	for (let i = 0; i < travelingParticlesCount; i++) {
		const sourceIdx = Math.floor(Math.random() * globeState.sphereNumVertices);
		const targetIdx = (sourceIdx + 1) % globeState.sphereNumVertices;

		// Randomly select a vertext from the sphere
		globeState.travelingParticlesData.push({
			source: new THREE.Vector3(
				globeState.sphereVertices[sourceIdx * 3],
				globeState.sphereVertices[sourceIdx * 3 + 1],
				globeState.sphereVertices[sourceIdx * 3 + 2]
			),
			target: new THREE.Vector3(
				globeState.sphereVertices[targetIdx * 3],
				globeState.sphereVertices[targetIdx * 3 + 1],
				globeState.sphereVertices[targetIdx * 3 + 2]
			),
			lerpFactor: 0,
			closestVertices: closestVertices,
			prevTargetIndex: null,
			targetIndex: targetIdx,
			visitedCount: 0
		});
	}
	//#endregion

	animate();
}

function render() {
	//scene.traverse( disposeMaterial );
	//scene.children.length = 0;

	const time = Date.now() * 0.0005;

	group.rotation.x = time * 0.075;
	group.rotation.y = time * 0.1;
	group.rotation.z = time * 0.05;

	//scene.traverse( darkenNonBloomed );
	//bloomComposer.render();
	//scene.traverse( restoreMaterial );
	renderer.autoClear = false;
	renderer.clear();
	
	camera.layers.set(1);  // Set the camera to the bloom layer.
	finalComposer.render(); 
	//bloomComposer.render();  // Render the bloom composer.

	renderer.clearDepth();  // Clear the depth, so the next render isn't occluded by this one.
	camera.layers.set(0);  // Set the camera back to the default layer, to render everything.
	renderer.render(scene, camera);  // Render the scene.
	//finalComposer.render();  // Render the final composer.
}

function animate() {
	requestAnimationFrame( animate );
	moveParticlesAlongEdges();
	render();
}

function findClosestVertices (vert, geometry, count) {
	const distances = [];

	for (let i = 0; i < geometry.attributes.position.count; i++) {
        const v = new THREE.Vector3(
			geometry.attributes.position.array[i * 3],
			geometry.attributes.position.array[i * 3 + 1],
			geometry.attributes.position.array[i * 3 + 2]
		);
		distances.push({
			index: i,
			distance: vert.distanceTo(v)
		});
		
    }

	distances.sort((a, b) => a.distance - b.distance);

	const closest = [];

	for (let i = 0; i < count; i++) {
        closest.push(distances[i].index);
    }

	return closest;
}

// This function checks if the particle system is ready for the next movement step.
// It is called before each movement step.
function isParticleSystemReady() {
	if (globeState.pauseMovement) {
		//console.warn("The system is paused. No movement will occur.");
		return false;
	}

	if (particlesData.length === 0) {
		console.error("Error: particlesData array is empty!");
		return false;
	}

	return true;
}

// This function sets a timeout to revive/reset a particle after it has been "consumed" or reached its destination.
// It is called after a particle has been "consumed" or reached its destination.
function handleParticleTimeout() {
    setTimeout(() => {
        globeState.pauseMovement = false;
        const newStartVertexIndex = Math.floor(Math.random() * globeState.sphereGeometry.attributes.position.count) * 3;
        const newVertex = new THREE.Vector3(
            globeState.sphereGeometry.attributes.position.array[newStartVertexIndex],
            globeState.sphereGeometry.attributes.position.array[newStartVertexIndex + 1],
            globeState.sphereGeometry.attributes.position.array[newStartVertexIndex + 2]
        );
        const newClosestVertices = findClosestVertices(newVertex, globeState.sphereGeometry, 6);
        const newTargetVertexIndex = newClosestVertices[Math.floor(Math.random() * newClosestVertices.length)];

        globeState.travelingParticlesVertices.push(
            globeState.sphereGeometry.attributes.position.array[newStartVertexIndex],
            globeState.sphereGeometry.attributes.position.array[newStartVertexIndex + 1],
            globeState.sphereGeometry.attributes.position.array[newStartVertexIndex + 2]
        );
        globeState.travelingParticles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(globeState.travelingParticlesVertices, 3));
        globeState.travelingParticles.geometry.setDrawRange(0, globeState.travelingParticlesVertices.length / 3); // Adjust draw range to new vertex count

        globeState.travelingParticlesData.push({
            source: new THREE.Vector3(
                globeState.sphereGeometry.attributes.position.array[newStartVertexIndex],
                globeState.sphereGeometry.attributes.position.array[newStartVertexIndex + 1],
                globeState.sphereGeometry.attributes.position.array[newStartVertexIndex + 2]
            ),
            target: new THREE.Vector3(
                globeState.sphereGeometry.attributes.position.array[newTargetVertexIndex * 3],
                globeState.sphereGeometry.attributes.position.array[newTargetVertexIndex * 3 + 1],
                globeState.sphereGeometry.attributes.position.array[newTargetVertexIndex * 3 + 2]
            ),
            closestVertices: newClosestVertices,
            lerpFactor: 0,
            prevTargetIndex: null
        });
    }, 3000 + Math.random() * 2000); // Random wait time between 3 to 5 seconds
}

// This function updates the position of a particle based on its current interpolation factor.
// It is called after a particle has been "consumed" or reached its destination.
function updateParticlePosition(particleData, i) {
	const newPosition = new THREE.Vector3();
    newPosition.lerpVectors(particleData.source, particleData.target, particleData.lerpFactor);
	globeState.travelingParticlesVertices[i * 3] = newPosition.x;
	globeState.travelingParticlesVertices[i * 3 + 1] = newPosition.y;
	globeState.travelingParticlesVertices[i * 3 + 2] = newPosition.z;
}

// This function resets a particle's data and state after it reaches a certain condition.
// It is called after a particle has been "consumed" or reached its destination.
function resetParticle(particleData, i) {
	particleData.lerpFactor = 0;
	particleData.prevTargetIndex = particleData.closestVertices.indexOf(particleData.targetIndex);
	particleData.source = particleData.target.clone();

    const closestVertices = findClosestVertices(particleData.source, globeState.sphereGeometry, 8);
	const availableVertices = closestVertices.filter(idx => idx !== particleData.prevTargetIndex && idx !== particleData.targetIndex);

	particleData.targetIndex = availableVertices[Math.floor(Math.random() * availableVertices.length)];
    particleData.target = new THREE.Vector3(
        globeState.sphereGeometry.attributes.position.array[particleData.targetIndex * 3],
        globeState.sphereGeometry.attributes.position.array[particleData.targetIndex * 3 + 1],
        globeState.sphereGeometry.attributes.position.array[particleData.targetIndex * 3 + 2]
    );

	particleData.visitedCount += 1;

	if (particleData.visitedCount >= (5 + Math.floor(Math.random() * 6))) { // Between 5 to 10 vertices
        particleData.visitedCount = 0;
        globeState.pauseMovement = true;

        globeState.travelingParticlesVertices.splice(i * 3, 3); // Remove 3 items starting from the i*3 index
        globeState.travelingParticles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(globeState.travelingParticlesVertices, 3));
        globeState.travelingParticles.geometry.setDrawRange(0, globeState.travelingParticlesVertices.length / 3); // Adjust draw range to new vertex count
        globeState.travelingParticlesData.splice(i, 1);

		handleParticleTimeout(particleData, i);
	}
}

// This function handles the movement of a single particle.
// It is called for each particle in the particlesData array.
function moveParticle(particleData, i) {
	// Add a vistedCount property if not present
	if (typeof particleData.visitedCount === 'undefined') {
		particleData.visitedCount = 0;
	}

	particleData.lerpFactor += 0.025; // Adjust this speed as necessary

	if (particleData.lerpFactor > 1) {
		resetParticle(particleData, i);
	} else {
		updateParticlePosition(particleData, i);
	}
}

// This function handles the movement of all particles.
// It is called once per frame.
function moveParticlesAlongEdges() {
	if (!isParticleSystemReady()) {
		return;
	}

    for (let i = 0; i < globeState.travelingParticlesData.length; i++) { // Changed from travelingParticlesCount to the length of the array
		const particleData = globeState.travelingParticlesData[i];
		moveParticle(particleData, i);
	}

	// After all particles have been processed, update the geometry.
    globeState.travelingParticles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(globeState.travelingParticlesVertices, 3));
    globeState.travelingParticles.geometry.attributes.position.needsUpdate = true;
}

