import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Vector to sample a random point
const tempPosition = new THREE.Vector3();

/*
class Path {
    constructor() {
        this.vertices = [];
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.LineBasicMaterial({
            color: 0x14b1ff,
            transparent: true,
            opacity: 0.5
        });
        this.line = new THREE.Line(this.geometry, this.material);

        sampler.sample(tempPosition);
        this.previousPoint = tempPosition.clone();

        // Initialize a random index within the points geometry
        //this.randomIndex = Math.floor(Math.random() * points.geometry.attributes.position.count);
    }

    update() {
        let pointFound = false;
        //const positions = points.geometry.attributes.position;

        while (!pointFound) {
            sampler.sample(tempPosition);

            if (tempPosition.distanceTo(this.previousPoint) < 30) {
                this.vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
                this.previousPoint = tempPosition.clone();
                pointFound = true;
            }
        }
        this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.vertices, 3));
    }
}*/


//document.addEventListener("DOMContentLoaded", function () {

    /* 
    *   Creating the scene
    */

    // Create scene and camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 5, 12);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    camera.position.z = 7;

    const controls = new OrbitControls(camera, renderer.domElement);

    //const group = new THREE.Group();
    //scene.add(group);
    
    /* 
    *   Creating the geometry
    */

    let sampler = null;
    let points = null;
    let path = null;

    // Create materials for the sphere
    const sphereGeometry = new THREE.IcosahedronGeometry( 4, 3 );
    const sphereMaterial = new THREE.MeshBasicMaterial( { color: '#A9A9A9', wireframe: true, transparent: true, opacity: 0.5 } );
    const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    scene.add(sphere);

    // Create points objects
    const pointsMaterial = new THREE.PointsMaterial( { color: '#A9A9A9', size: 0.075, opacity: 0.5, transparent: true } );
    points = new THREE.Points( sphereGeometry, pointsMaterial );
    scene.add(points);

    //sampler = new MeshSurfaceSampler(points).build();

    //path = new Path();
    //group.add(path.line);

    renderer.setAnimationLoop(render);
    
    /*
    // Render the scene
    function animate() {
        requestAnimationFrame( animate );

        // Rotate the 3D objects randomly within desired range
        const rotationSpeedX = Math.random() * (0.0001 - 0.0005) + 0.0005;
        const rotationSpeedY = Math.random() * (0.0001 - 0.0005) + 0.0005;
        const rotationSpeedZ = Math.random() * (0.00075 - 0.000375) + 0.000375;
        
        sphere.rotation.x += rotationSpeedX;
        sphere.rotation.y -= rotationSpeedY;
        sphere.rotation.z -= rotationSpeedZ;

        points.rotation.x += rotationSpeedX;
        points.rotation.y -= rotationSpeedY;
        points.rotation.z -= rotationSpeedZ;

        // Stop the progression once we have reached 10,000 points
        if (path.vertices.length < 30000) {
            path.update();
        }

        controls.update();
        renderer.render( scene, camera);

        updateOpacity();
    }
    
    animate();

     */

    function render() {
        // Rotate the 3D objects randomly within desired range
        const rotationSpeedX = Math.random() * (0.0001 - 0.0005) + 0.0005;
        const rotationSpeedY = Math.random() * (0.0001 - 0.0005) + 0.0005;
        const rotationSpeedZ = Math.random() * (0.00075 - 0.000375) + 0.000375;
        
        sphere.rotation.x += rotationSpeedX;
        sphere.rotation.y -= rotationSpeedY;
        sphere.rotation.z -= rotationSpeedZ;

        points.rotation.x += rotationSpeedX;
        points.rotation.y -= rotationSpeedY;
        points.rotation.z -= rotationSpeedZ;

        //group.rotation.x += rotationSpeedX;
        //group.rotation.y -= rotationSpeedY;
        //group.rotation.z -= rotationSpeedZ;
        
        // Stop the progression once we have reached 50 points
        //if (path.vertices.length < 150) {
        //  path.update();
        //}
      
        controls.update();
        renderer.render(scene, camera);
      }

    // Handle window resize
    window.addEventListener('resize', function() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        renderer.render(scene, camera);
    });

//});