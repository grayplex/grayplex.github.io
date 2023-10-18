class GlobeState {
    constructor() {
        
        // properties
        this._pauseMovement = false;
        this._travelingParticlesData = [];
        this._travelingParticlesVertices = [];
        this._travelingParticles = null;
        this._sphereGeometry = null;
        this._sphereNumVertices = 0;
        this._sphereVertices = null;
    }

    //#region getters and setters
    get pauseMovement() {
        return this._pauseMovement;
    }
    set pauseMovement(value) {
        this._pauseMovement = value;
    }
    get travelingParticlesData() {
        return this._travelingParticlesData;
    }
    set travelingParticlesData(value) {
        this._travelingParticlesData = value;
    }
    get travelingParticlesVertices() {
        return this._travelingParticlesVertices;
    }
    set travelingParticlesVertices(value) {
        this._travelingParticlesVertices = value;
    }
    get travelingParticles() {
        return this._travelingParticles;
    }
    set travelingParticles(value) {
        this._travelingParticles = value;
    }
    get sphereGeometry() {
        return this._sphereGeometry;
    }
    set sphereGeometry(value) {
        this._sphereGeometry = value;
    }
    get sphereNumVertices() {
        return this._sphereNumVertices;
    }
    set sphereNumVertices(value) {
        this._sphereNumVertices = value;
    }
    get sphereVertices() {
        return this._sphereVertices;
    }
    set sphereVertices(value) {
        this._sphereVertices = value;
    }
    //#endregion

    // Methods can be added to manipulate the properties, e.g.:
    setPauseMovement(value) {
        this.pauseMovement = value;
    }
}

const globeState = new GlobeState();
//Object.freeze(globeState);

export { globeState };