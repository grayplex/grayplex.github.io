/* --------------------------
*	IMPORT
* -------------------------- */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* --------------------------
*	GENERAL VARIABLES
* -------------------------- */
let group;
let container;
const particlesData = [];
let camera, scene, renderer;
let positions, colors;
let particles;
let pointCloud;
let particlePositions;
let linesMesh;
let sphereGeometry;
let sphereNumVertices;
let sphereVertices;
const postprocessing = {};
let travelingParticles;
const travelingParticlesData = [];
const travelingParticlesVertices = [];
const travelingParticlesCount = 1; // Number of traveling particles
let maxIndex;
let lastUpdateTime = 0; // <-- Add this right after your other global variables
let pauseMovement = false;



function init() {

	//#region SCENE
	container = document.getElementById( 'container' );
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
	camera.position.z = 1750;
	const controls = new OrbitControls( camera, container );
	controls.minDistance = 1000;
	controls.maxDistance = 3000;
	scene = new THREE.Scene();
	group = new THREE.Group();
	scene.add( group );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	//#endregion

	//#region GEOMETRY
	/*
	*		Sphere Object
	*/
	sphereGeometry = new THREE.IcosahedronGeometry( 750, 3 );
	const sphereMaterial = new THREE.MeshBasicMaterial( { 
		color: '#A9A9A9', 	// Color of the mesh (gray)
		wireframe: true, 	// Disable faces of mesh
		transparent: true,	// Make mesh transparent
		opacity: 0.5 		// Opacity of the mesh
	});
	const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	sphereVertices = sphereGeometry.attributes.position.array;
	sphereNumVertices = sphereGeometry.attributes.position.count; // "540"

	maxIndex = sphereGeometry.attributes.position.count;
	group.add( sphere );

	const startVertexIndex = Math.floor(Math.random() * sphereGeometry.attributes.position.count) * 3;
	const vertex = new THREE.Vector3(
		sphereGeometry.attributes.position.array[startVertexIndex],
		sphereGeometry.attributes.position.array[startVertexIndex + 1],
		sphereGeometry.attributes.position.array[startVertexIndex + 2]
	);
	const closestVertices = findClosestVertices(vertex, sphereGeometry, 6);
	const targetVertexIndex = closestVertices[Math.floor(Math.random() * closestVertices.length)];

	particlesData.push({
		source: new THREE.Vector3(
			sphereGeometry.attributes.position.array[startVertexIndex],
			sphereGeometry.attributes.position.array[startVertexIndex + 1],
			sphereGeometry.attributes.position.array[startVertexIndex + 2]
		),
		target: new THREE.Vector3(
			sphereGeometry.attributes.position.array[targetVertexIndex * 3],
			sphereGeometry.attributes.position.array[targetVertexIndex * 3 + 1],
			sphereGeometry.attributes.position.array[targetVertexIndex * 3 + 2]
		),
		closestVertices: closestVertices,
		lerpFactor: 0,
		prevTargetIndex: null
	});


	/*
	*		Points Object
	*/
	const segments = sphereNumVertices * 10;
	positions = new Float32Array( segments * 3 );
	colors = new Float32Array( segments * 3 );

	const glowMaterial = new THREE.ShaderMaterial({
		uniforms: {
			c: { value: 0.34 },
			p: { value: 5.5 },
			glowColor: { type: "c", value: new THREE.Color(0x00ff00) }, // Green Color
			viewVector: { type: "v3", value: camera.position }
		},
		vertexShader: `
			uniform vec3 viewVector;
			uniform float c;
			uniform float p;
			varying float intensity;
			void main() {
				vec3 vNormal = normalize( normalMatrix * normal );
				vec3 vNormel = normalize( normalMatrix * viewVector );
				intensity = pow( c - dot(vNormal, vNormel), p );
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,
		fragmentShader: `
			uniform vec3 glowColor;
			varying float intensity;
			void main() {
				vec3 glow = glowColor * intensity;
				gl_FragColor = vec4( glow, 1.0 );
			}`,
		side: THREE.FrontSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	});
	
	const pMaterial = glowMaterial;

	// Extract vertices from the sphere geometry
	particles = new THREE.BufferGeometry();	
	particlePositions = new Float32Array(sphereNumVertices * 3);

	// Loop to initialize particles with random positions and velocities
	for (let i = 0; i < sphereNumVertices; i++) {

		// Generate positions
		const x = sphereVertices[i * 3];
		const y = sphereVertices[i * 3 + 1];
		const z = sphereVertices[i * 3 + 2];

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


	particles.setDrawRange(0, sphereNumVertices );
	particles.setAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
	pointCloud = new THREE.Points( particles, pMaterial );
	group.add( pointCloud ); // Add the particle system to the scene


	/*
	*		Line Mesh Object
	*/
	const lineGeometry = new THREE.BufferGeometry(); // Create a new buffer geometry to define the positions and colors of lines
	lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
	lineGeometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setUsage( THREE.DynamicDrawUsage ) );
	lineGeometry.computeBoundingSphere();
	lineGeometry.setDrawRange( 0, 0 );
	const lineMaterial = new THREE.LineBasicMaterial( {
		vertexColors: true,	
		blending: THREE.AdditiveBlending,	// Blending mode for rendering (additive blending)
		transparent: true
	} );
	linesMesh = new THREE.LineSegments( lineGeometry, lineMaterial );
	group.add( linesMesh );


	/*
	*	Travelling Particles
	*/
	const travelingParticlesGeometry = new THREE.BufferGeometry();
	// Use the sphere's vertices to determine the path for traveling particles
	for (let i = 0; i < travelingParticlesCount; i++) {
		// Randomly select a vertext from the sphere
		const vertexIndex = Math.floor(Math.random() * sphereVertices.length / 3) * 3;
		travelingParticlesVertices.push(sphereVertices[vertexIndex], sphereVertices[vertexIndex + 1], sphereVertices[vertexIndex + 2]);
	}
	travelingParticlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(travelingParticlesVertices, 3));
	const travelingParticlesMaterial = new THREE.PointsMaterial({
		color: 0x00FF00,  // Green color
		size: 20,
		transparent: true,
		opacity: 0.7,
		blending: THREE.AdditiveBlending
	});
	travelingParticles = new THREE.Points(travelingParticlesGeometry, travelingParticlesMaterial);
	group.add(travelingParticles);

	for (let i = 0; i < travelingParticlesCount; i++) {
		const sourceIdx = Math.floor(Math.random() * sphereNumVertices);
		const targetIdx = (sourceIdx + 1) % sphereNumVertices;
	
		travelingParticlesData.push({
			source: new THREE.Vector3(
				sphereVertices[sourceIdx * 3],
				sphereVertices[sourceIdx * 3 + 1],
				sphereVertices[sourceIdx * 3 + 2]
			),
			target: new THREE.Vector3(
				sphereVertices[targetIdx * 3],
				sphereVertices[targetIdx * 3 + 1],
				sphereVertices[targetIdx * 3 + 2]
			),
			lerpFactor: 0,
			closestVertices: closestVertices,
			prevTargetIndex: null,
			targetIndex: targetIdx
		});
	}
	//#endregion

	//#region RENDER
	initPostprocessing();
	renderer.autoClear = false;
	container.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize );
	//#endregion
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

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}

function initPostprocessing() {

	const renderPass = new RenderPass( scene, camera );

	const bokehPass = new BokehPass( scene, camera, {
		focus: 100,
		aperture: 0.5,
		maxblur: 0.001,
		width: window.innerWidth,
		height: window.innerHeight
	} );

	const outputPass = new OutputPass();

	const composer = new EffectComposer( renderer );

	composer.addPass( renderPass );
	composer.addPass( bokehPass );
	composer.addPass( outputPass );

	postprocessing.composer = composer;
	postprocessing.bokeh = bokehPass;

}

function moveParticlesAlongEdges() {
	if (pauseMovement) return;

	if (travelingParticlesData.length === 0) {
		console.error("Error: travelingParticlesData array is empty!");
		return;
	}

    for (let i = 0; i < travelingParticlesCount; i++) {
		const particleData = travelingParticlesData[i];

		// Add a visitedCount property if not present
        if (typeof particleData.visitedCount === 'undefined') {
            particleData.visitedCount = 0;
        }

		particleData.lerpFactor += 0.025; // Adjust this speed as necessary

        if (particleData.lerpFactor > 1) {
			particleData.lerpFactor = 0;
			particleData.prevTargetIndex = particleData.closestVertices.indexOf(particleData.targetIndex);
			particleData.source = particleData.target.clone();

			const closestVertices = findClosestVertices(particleData.source, sphereGeometry, 8);
			const availableVertices = closestVertices.filter(idx => idx !== particleData.prevTargetIndex && idx !== particleData.targetIndex);

			particleData.targetIndex = availableVertices[Math.floor(Math.random() * availableVertices.length)];
			particleData.target = new THREE.Vector3(
				sphereGeometry.attributes.position.array[particleData.targetIndex * 3],
				sphereGeometry.attributes.position.array[particleData.targetIndex * 3 + 1],
				sphereGeometry.attributes.position.array[particleData.targetIndex * 3 + 2]
			);

			particleData.visitedCount += 1;

			if (particleData.visitedCount >= (5 + Math.floor(Math.random() * 6))) { // Between 5 to 10 vertices
				// Reset particle
				particleData.visitedCount = 0;
                pauseMovement = true;

				travelingParticlesVertices.splice(i * 3, 3); // Remove 3 items starting from the i*3 index
				travelingParticles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(travelingParticlesVertices, 3));
				travelingParticles.geometry.setDrawRange(0, travelingParticlesVertices.length / 3); // Adjust draw range to new vertex count
				travelingParticlesData.splice(i, 1);
				i--;

				setTimeout(() => {
                    // After the timeout, select a new random vertex to start from
                    const sourceIdx = Math.floor(Math.random() * sphereNumVertices);
                    particleData.source = new THREE.Vector3(
                        sphereVertices[sourceIdx * 3],
                        sphereVertices[sourceIdx * 3 + 1],
                        sphereVertices[sourceIdx * 3 + 2]
                    );
                    
                    const closestVertices = findClosestVertices(particleData.source, sphereGeometry, 8);
                    const availableVertices = closestVertices.filter(idx => idx !== particleData.prevTargetIndex && idx !== particleData.targetIndex);
                    particleData.targetIndex = availableVertices[Math.floor(Math.random() * availableVertices.length)];
                    particleData.target = new THREE.Vector3(
                        sphereVertices[particleData.targetIndex * 3],
                        sphereVertices[particleData.targetIndex * 3 + 1],
                        sphereVertices[particleData.targetIndex * 3 + 2]
                    );

                    pauseMovement = false;
                }, 3000 + Math.random() * 2000); // Random wait time between 3 to 5 seconds
				continue;
			}
		}
		const newPos = new THREE.Vector3();
		newPos.lerpVectors(particleData.source, particleData.target, particleData.lerpFactor);
		travelingParticlesVertices[i * 3] = newPos.x;
		travelingParticlesVertices[i * 3 + 1] = newPos.y;
		travelingParticlesVertices[i * 3 + 2] = newPos.z;
    }

    travelingParticles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(travelingParticlesVertices, 3));
	travelingParticles.geometry.attributes.position.needsUpdate = true;
}

function animate() {
	// Request the next animation frame and render the scene
	requestAnimationFrame( animate );
	moveParticlesAlongEdges();
	render();
}

function render() {

	const time = Date.now() * 0.0005;

	group.rotation.x = time * 0.075;
	group.rotation.y = time * 0.1;
	group.rotation.z = time * 0.05;

	postprocessing.composer.render( 0.1 );

}

init();
animate();