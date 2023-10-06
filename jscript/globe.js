/*
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// Define a class for the graph
*/
class Graph {
    constructor() {
        this.nodes = new Map();
    }

    // Add a node to the graph
    addNode(key, value) {
        this.nodes.set(key, { value: value, adj: [] });
    }

    // Add an edge between two nodes
    addEdge(key1, key2) {
        this.nodes.get(key1).adj.push(key2);
        this.nodes.get(key2).adj.push(key1); // Since it's an undirected graph
    }

    // Get neighbors of a node
    neighbors(key) {
        return this.nodes.get(key).adj;
    }

    // Get a specific node
    getNode(key) {
        return this.nodes.get(key);
    }
}
/*
class Traceroute {
    constructor(scene) {
        this.scene = scene;
        this.line = this.createLine();
        this.startPoint = new THREE.Vector3();
        this.endPoint = new THREE.Vector3();
        this.progress = 0;
        this.timer = 0;
        this.pingInterval = this.getRandomInterval();
        this.active = false;
    }

    createLine() {
        const material = new THREE.LineBasicMaterial({
            color: 0x00FF00, // Neon green color
            transparent: true,
            opacity: 1,
            depthTest: true,
            blending: THREE.AdditiveBlending, // Additive blending for glow
        });

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(6); // Two points, x, y, z for each
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        return new THREE.Line(geometry, material);
    }

    getRandomInterval() {
        return Math.random() * 3000 + 1000; // Random interval between 1 and 4 seconds
    }

    setEndpoints(startPoint, endPoint) {
        this.startPoint.copy(startPoint);
        this.endPoint.copy(endPoint);
    }

    start() {
        if (!this.active) {
            this.timer = 0;
            this.progress = 0.01; // Start slightly ahead to avoid instant visibility
            this.active = true;
        }
    }

    update(deltaTime) {
        if (this.active) {
            this.timer += deltaTime;

            if (this.timer > this.pingInterval) {
                this.timer = 0;
                this.pingInterval = this.getRandomInterval();
                this.start();
            }

            this.progress += 0.005; // Speed of line movement

            if (this.progress >= 1) {
                this.progress = 0;
                this.active = false;
                this.line.material.opacity = 1; // Reset opacity
            }

            // Update line position
            const lerpVertex = new THREE.Vector3().lerpVectors(this.startPoint, this.endPoint, this.progress);
            this.line.geometry.attributes.position.setXYZ(0, this.startPoint.x, this.startPoint.y, this.startPoint.z);
            this.line.geometry.attributes.position.setXYZ(1, lerpVertex.x, lerpVertex.y, lerpVertex.z);
            this.line.geometry.attributes.position.needsUpdate = true;

            // Update glow effect
            const glowIntensity = Math.min(1, 1 - Math.abs(0.5 - this.progress) * 2); // Glow at the midpoint
            this.line.material.emissiveIntensity = glowIntensity;

            // Fade out the tail
            if (this.progress > 0.5) {
                const tailOpacity = 1 - ((this.progress - 0.5) / 0.5); // Fade out after halfway
                this.line.material.opacity = tailOpacity;
            }
        }
    }
}
*/

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

document.addEventListener("DOMContentLoaded", function () {

    /* 
    *   Creating the scene
    */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    camera.position.z = 7;

    /* 
    *   Creating the geometry
    */

    // Create and merge vertices of an Icosahedron
    let sphereGeometry = new THREE.IcosahedronGeometry( 4, 3 );
    sphereGeometry = BufferGeometryUtils.mergeVertices(sphereGeometry);
    
    // Create materials for the 3D objects
    const sphereMaterial = new THREE.MeshBasicMaterial( { color: '#A9A9A9', wireframe: true, transparent: true, opacity: 0.5 } );
    const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    scene.add(sphere);

    // Create points objects
    const pointsMaterial = new THREE.PointsMaterial( { color: '#A9A9A9', size: 0.075, opacity: 0.5, transparent: true } );
    const points = new THREE.Points( sphereGeometry, pointsMaterial );
    scene.add(points);

    // Create the graph from the Icosahedron
    const graph = new Graph();

    // Extract vertices from the geometry and add them as nodes to the graph
    const verticesArray = sphereGeometry.attributes.position.array;
    for (let i = 0; i < verticesArray.length; i += 3) {
        const vertex = new THREE.Vector3(verticesArray[i], verticesArray[i + 1], verticesArray[i + 2]);
        graph.addNode(i / 3, vertex); // i/3 because every 3 elements in the array represent a single vertex
    }

    // Extract indices to create edges in the graph
    const indicesArray = sphereGeometry.index.array;
    for (let i = 0; i < indicesArray.length; i += 3) {
        graph.addEdge(indicesArray[i], indicesArray[i + 1]);
        graph.addEdge(indicesArray[i], indicesArray[i + 2]);
        graph.addEdge(indicesArray[i + 1], indicesArray[i + 2]);
    }

    // Check if indicesArray exists and log some info
    if(indicesArray) {
        console.log("Indices array length:", indicesArray.length);
        console.log("First 15 indices:", indicesArray.slice(0, 15));
    } else {
        console.log("No indices array present.");
    }

    // Dijkstra's algorithm to find the shortest path
    function dijkstra(graph, startKey) {
        let visited = new Set();
        let distances = new Map();
        let previous = new Map();
        let nodes = Array.from(graph.nodes.keys());
    
        // Initialize distances and previous nodes
        nodes.forEach(node => {
            distances.set(node, Infinity);
            previous.set(node, null);
        });
        distances.set(startKey, 0);
    
        // Main loop
        while (nodes.length) {
            nodes.sort((a, b) => distances.get(a) - distances.get(b));
            let closest = nodes.shift();
    
            if (distances.get(closest) === Infinity) break;
    
            let neighbors = graph.neighbors(closest);
            neighbors.forEach(neighbor => {
                if (visited.has(neighbor)) return;
    
                let alt = distances.get(closest) + 1; // Each edge has a weight of 1
                if (alt < distances.get(neighbor)) {
                    distances.set(neighbor, alt);
                    previous.set(neighbor, closest);
                }
            });
    
            visited.add(closest);
        }

        // Log some info
        console.log("Visited nodes count:", visited.size);
        console.log("Distances:", Array.from(distances.entries()));
    
        return { previous, visited, distances };
    }

    // Variables for the zap effect
    let currentPath = [];
    let currentPathIndex = 0;
    let zapProgress = 0;

    // Checking how many neighbors (edges) some sample vertices have
    console.log("Number of neighbors for vertex 0:", graph.neighbors(0).length);
    console.log("Number of neighbors for vertex 5:", graph.neighbors(5).length);
    console.log("Number of neighbors for vertex 10:", graph.neighbors(10).length);

    // Create Line object
    const lineMaterial = new THREE.LineBasicMaterial( { color: 0x00FF00, transparent: false, depthTest: true } );
    const line = new THREE.Line( sphereGeometry, lineMaterial );
    scene.add( line );


    // Function to update the opacity of the 3D object
    // Constants for controlling the opacity
    const maxDistance = 10;
    const minOpacity = 0.2;
    function updateOpacity() {
        const distance = camera.position.distanceTo(sphere.position);
        const opacity = THREE.MathUtils.clamp(1 - (distance / maxDistance), minOpacity, 1);
        sphereMaterial.opacity = opacity;
    }

    // Render the scene
    function animate() {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
        //sphere.rotation.x += 0.0005;
        //sphere.rotation.y += 0.001;
        //sphere.rotation.z += 0.00075;

        //points.rotation.x += 0.0005;
        //points.rotation.y += 0.001;
        //points.rotation.z += 0.00075;
        updateOpacity();
    }
    animate();

});


    /*
    // Function to start the zap effect
    function startZap() {
        let startKey = Math.floor(Math.random() * (geometry.attributes.position.array.length / 3));
        const { previous: prev, visited, distances } = dijkstra(graph, startKey);

        let endKey;
        do {
            endKey = Math.floor(Math.random() * (geometry.attributes.position.array.length / 3));
            // Check and print if a node is unreachable
            if (prev.get(endKey) === undefined) {
                console.log("Unreachable node:", endKey);
            }
        } while (endKey === startKey);
    
        // Calculate the shortest path
        currentPath = [];
        let currentNode = endKey;

        while (currentNode !== null) {
            const startVertex = graph.getNode(currentNode).value;
            const prevNode = prev.get(currentNode);
            const endVertex = prevNode !== null ? graph.getNode(prevNode).value : null;
            currentPath.push({ start: startVertex, end: endVertex });
            currentNode = prevNode;
        }
        currentPath.reverse();
        console.log("Current path length:", currentPath.length);

        currentPathIndex = 0;
    }

    // Create a material and geometry for the zap line

    const zapGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(6); // 3 vertices x 2 for x, y, z
    zapGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const zapLine = new THREE.Line(zapGeometry, zapMaterial);
    scene.add(zapLine);

    startZap(); // Initialize te first zap

    
    
    // Function to update the zap effect
    function updateZap() {
        if (currentPathIndex < currentPath.length) {
            const { start: startVertex, end: endVertex } = currentPath[currentPathIndex];
    
            if (startVertex !== null && endVertex !== null) {
                // Calculate the position along the current line segment
                const lerpVertex = new THREE.Vector3().lerpVectors(startVertex, endVertex, zapProgress);
                zapLine.geometry.attributes.position.setXYZ(0, startVertex.x, startVertex.y, startVertex.z);
                zapLine.geometry.attributes.position.setXYZ(1, lerpVertex.x, lerpVertex.y, lerpVertex.z);
                zapLine.geometry.attributes.position.needsUpdate = true;

                // Increase the glow effect as zapProgress approaches 1
                const glowIntensity = Math.min(1, 1 - Math.abs(1 - zapProgress) * 10);
                zapLine.material.emissiveIntensity = glowIntensity;
    
                zapProgress += 0.02; // Adjust the speed of the line movement
    
                if (zapProgress >= 1) {
                    zapProgress = 0;
                    currentPathIndex++;
    
                    if (currentPathIndex >= currentPath.length) {
                        // You have reached the end of the entire path
                        currentPathIndex = 0; // Start over or choose another behavior
                    }
                }
            }
        }
    }
    
    // Function to animate the scene
    function animate() {
        requestAnimationFrame(animate);

        updateZap();

        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', function() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        renderer.render(scene, camera);
    }); 
});*/