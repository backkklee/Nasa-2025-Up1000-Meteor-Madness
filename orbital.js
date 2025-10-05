// Enhanced orbital visualization using Three.js
class OrbitalVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.asteroidOrbit = null;
        this.asteroid = null;
        this.earth = null;
        this.sun = null;
        this.animationId = null;
        this.backendUrl = 'http://localhost:5000/api';
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.createCelestialBodies();
        this.setupControls();
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011); // Dark space background
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 50);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 0, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    createCelestialBodies() {
        // Sun
        const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sun);
        
        // Earth orbit circle
        const earthOrbitGeometry = new THREE.RingGeometry(10, 10.1, 64);
        const earthOrbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4444ff, 
            transparent: true, 
            opacity: 0.3 
        });
        const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
        earthOrbit.rotation.x = Math.PI / 2;
        this.scene.add(earthOrbit);
        
        // Earth
        const earthGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const earthMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.position.set(10, 0, 0);
        this.earth.castShadow = true;
        this.earth.receiveShadow = true;
        this.scene.add(this.earth);
        
        // Controls are initialized after renderer is created
    }

    setupControls() {
        if (!this.renderer) return;
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }
    
    async loadAsteroidOrbit(asteroidId) {
        try {
            const response = await fetch(`${this.backendUrl}/asteroid/${asteroidId}`);
            if (!response.ok) {
                throw new Error('Failed to load asteroid data');
            }
            
            const data = await response.json();
            this.createAsteroidOrbit(data);
        } catch (error) {
            console.error('Error loading asteroid orbit:', error);
            // Fallback to mock orbit
            this.createMockAsteroidOrbit();
        }
    }
    
    createAsteroidOrbit(asteroidData) {
        // Remove existing asteroid orbit
        if (this.asteroidOrbit) {
            this.scene.remove(this.asteroidOrbit);
        }
        if (this.asteroid) {
            this.scene.remove(this.asteroid);
        }
        
        // Create asteroid orbit path
        const orbitPoints = asteroidData.orbital_points || [];
        if (orbitPoints.length > 0) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array(orbitPoints.flat().map(v => v * 10)); // Scale up
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const material = new THREE.LineBasicMaterial({ 
                color: 0xff4444,
                transparent: true,
                opacity: 0.8
            });
            
            this.asteroidOrbit = new THREE.Line(geometry, material);
            this.scene.add(this.asteroidOrbit);
        }
        
        // Create asteroid
        const asteroidGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0xaa4444 });
        this.asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        this.asteroid.castShadow = true;
        
        // Position asteroid at first orbital point
        if (orbitPoints.length > 0) {
            const firstPoint = orbitPoints[0];
            this.asteroid.position.set(
                firstPoint[0] * 10,
                firstPoint[1] * 10,
                firstPoint[2] * 10
            );
        }
        
        this.scene.add(this.asteroid);
        
        // Store orbital data for animation
        this.asteroidOrbitData = orbitPoints;
        this.orbitIndex = 0;
    }
    
    createMockAsteroidOrbit() {
        // Create a simple elliptical orbit
        const points = [];
        const steps = 100;
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 8;
            const z = Math.sin(angle * 2) * 2;
            points.push([x, y, z]);
        }
        
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(points.flat().map(v => v * 0.1));
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const material = new THREE.LineBasicMaterial({ color: 0xff4444 });
        this.asteroidOrbit = new THREE.Line(geometry, material);
        this.scene.add(this.asteroidOrbit);
        
        // Create asteroid
        const asteroidGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0xaa4444 });
        this.asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        this.asteroid.position.set(15, 0, 0);
        this.scene.add(this.asteroid);
        
        this.asteroidOrbitData = points;
        this.orbitIndex = 0;
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate Earth around Sun
        if (this.earth) {
            this.earth.rotation.y += 0.01;
            const time = Date.now() * 0.0001;
            this.earth.position.x = Math.cos(time) * 10;
            this.earth.position.z = Math.sin(time) * 10;
        }
        
        // Animate asteroid along orbit
        if (this.asteroid && this.asteroidOrbitData) {
            this.orbitIndex = (this.orbitIndex + 0.5) % this.asteroidOrbitData.length;
            const point = this.asteroidOrbitData[Math.floor(this.orbitIndex)];
            this.asteroid.position.set(
                point[0] * 10,
                point[1] * 10,
                point[2] * 10
            );
        }
        
        // Rotate Sun
        if (this.sun) {
            this.sun.rotation.y += 0.005;
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Export for use in main application
window.OrbitalVisualizer = OrbitalVisualizer;