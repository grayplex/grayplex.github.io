// ./jscript/globe/ParticleTrail.js
import * as THREE from 'three';
import { globeState } from './GlobeState.js';

//globeState = new GlobeState();

export class ParticleTrail {
    constructor() {
        this.trailVertices = [];
        this.maxTrailLength = 50; // You can adjust this value
        this.trailGeometry = null;
        this.trailMaterial = null;
        this.trail = null;

        this.initTrail();
    }

    initTrail() {
        this.trailGeometry = new THREE.BufferGeometry();
        this.trailMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Choose the color

        // Initial dummy data for the trail
        for (let i = 0; i < this.maxTrailLength; i++) {
            this.trailVertices.push(new THREE.Vector3());
        }

        this.trailGeometry.setFromPoints(this.trailVertices);
        this.trail = new THREE.Line(this.trailGeometry, this.trailMaterial);
    }

    updateTrail(newPosition) {
        // Remove the oldest position
        this.trailVertices.shift();
        // Add the new position
        this.trailVertices.push(newPosition.clone());

        this.trail.geometry.setFromPoints(this.trailVertices);
        this.trail.geometry.verticesNeedUpdate = true;
    }

    getTrailObject() {
        return this.trail;
    }
}
