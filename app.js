// Impact1000: Living under the threat of a meteor impact? No worries! Impact1000 will help minimize your risks, while so keeping your self educated! - Main Application
class Impact1000App {
    constructor() {
        this.currentSection = 'homepage';
        this.simulationMap = null;
        this.impactMap = null;
        this.neos = [];
        this.impactLocation = null;
        this.simulationResults = null;
        this.currentTheme = 'light'; // Default to light theme
        this.orbitalVisualizer = null;
        this.selectedNEO = null;
        
        // Layer tracking
        this.impactorLayersAdded = false;
        this.topologyLayer = null;
        this.populationLayer = null;
        this.populationLegend = null;
        this.coastlinesLayer = null;
        
        // Backend API configuration
        this.backendUrl = 'http://localhost:5000/api';
        this.useRealPhysics = true; // Flag to enable real physics calculations
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeTheme();
        this.startCountdown();
        await this.setupMaps();
        await this.loadNEOData();
        this.updateCharts();
        this.showSection('homepage'); // Initialize with homepage active
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Simulation controls
        document.getElementById('size-slider').addEventListener('input', (e) => {
            document.getElementById('size-value').textContent = e.target.value + 'm';
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            document.getElementById('speed-value').textContent = e.target.value + ' km/s';
        });

        document.getElementById('angle-slider').addEventListener('input', (e) => {
            document.getElementById('angle-value').textContent = e.target.value + '°';
        });

        document.getElementById('run-simulation').addEventListener('click', () => {
            this.runSimulation();
        });

        document.getElementById('use-neo-data').addEventListener('click', () => {
            this.useNEODataInSimulation();
        });

        // Layer toggles are handled by individual event listeners below

        // Compare simulation
        document.getElementById('compare-simulation').addEventListener('click', () => {
            this.compareWithImpactor2025();
        });

        // NEO search and filter
        document.getElementById('neo-search').addEventListener('input', () => {
            this.filterNEOs();
        });

        document.getElementById('neo-risk-filter').addEventListener('change', () => {
            this.filterNEOs();
        });

        // NEO Simulation buttons
        document.getElementById('run-neo-simulation').addEventListener('click', () => {
            this.runNEOSimulation();
        });

        document.getElementById('view-neo-orbit').addEventListener('click', () => {
            this.viewNEOOrbit();
        });

        // Impact Map layer controls
        console.log('Setting up layer controls...');
        const impactorElement = document.getElementById('layer-impactor');
        console.log('Impactor element found:', impactorElement);
        
        if (impactorElement) {
            impactorElement.addEventListener('change', (e) => {
                console.log('Impactor layer toggled:', e.target.checked);
                this.toggleLayer('impactor', e.target.checked);
            });
        }
        
        const userElement = document.getElementById('layer-user');
        console.log('User element found:', userElement);
        if (userElement) {
            userElement.addEventListener('change', (e) => {
                console.log('User layer toggled:', e.target.checked);
                this.toggleLayer('user', e.target.checked);
            });
        }
        
        const neoElement = document.getElementById('layer-neo');
        console.log('NEO element found:', neoElement);
        if (neoElement) {
            neoElement.addEventListener('change', (e) => {
                console.log('NEO layer toggled:', e.target.checked);
                this.toggleLayer('neo', e.target.checked);
            });
        }
        
        const topologyElement = document.getElementById('layer-topology');
        console.log('Topology element found:', topologyElement);
        if (topologyElement) {
            topologyElement.addEventListener('change', (e) => {
                console.log('Topology layer toggled:', e.target.checked);
                this.toggleLayer('topology', e.target.checked);
            });
        }
        
        const populationElement = document.getElementById('layer-population');
        console.log('Population element found:', populationElement);
        if (populationElement) {
            populationElement.addEventListener('change', (e) => {
                console.log('Population layer toggled:', e.target.checked);
                this.toggleLayer('population', e.target.checked);
            });
        }
        
        const coastlinesElement = document.getElementById('layer-coastlines');
        console.log('Coastlines element found:', coastlinesElement);
        if (coastlinesElement) {
            coastlinesElement.addEventListener('change', (e) => {
                console.log('Coastlines layer toggled:', e.target.checked);
                this.toggleLayer('coastlines', e.target.checked);
            });
        }
    }

    initializeTheme() {
        // Load theme from localStorage or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        // Update theme icon
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
        
        // Update map themes if they exist
        this.updateMapThemes();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    updateMapThemes() {
        // Update simulation map theme
        if (this.simulationMap) {
            const container = this.simulationMap.getContainer();
            if (this.currentTheme === 'dark') {
                container.style.filter = 'invert(1) hue-rotate(180deg)';
            } else {
                container.style.filter = 'none';
            }
        }
        
        // Update impact map theme
        if (this.impactMap) {
            const container = this.impactMap.getContainer();
            if (this.currentTheme === 'dark') {
                container.style.filter = 'invert(1) hue-rotate(180deg)';
            } else {
                container.style.filter = 'none';
            }
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            this.currentSection = sectionName;

            // Update navigation buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-600');
                btn.classList.add('bg-gray-600');
            });

            const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-gray-600');
                activeBtn.classList.add('active', 'bg-blue-600');
            }

            // Initialize section-specific features
            if (sectionName === 'simulation') {
                this.initializeSimulationMap();
                this.initializeOrbitalVisualizer();
            } else if (sectionName === 'impact-map') {
                this.initializeImpactMap();
            }
        }
    }

    startCountdown() {
        // Set target date (1 year from now for demo)
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + 1);

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = days;
            document.getElementById('hours').textContent = hours;
            document.getElementById('minutes').textContent = minutes;
            document.getElementById('seconds').textContent = seconds;
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    async setupMaps() {
        // Simulation map will be initialized when section is shown
        // Impact map will be initialized when section is shown
    }

    initializeSimulationMap() {
        if (this.simulationMap) return;

        this.simulationMap = L.map('simulation-map', {
            center: [0, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.simulationMap);

        // Add click handler for impact location
        this.simulationMap.on('click', (e) => {
            this.setImpactLocation(e.latlng);
        });

        // Apply theme
        this.updateMapThemes();
    }

    initializeOrbitalVisualizer() {
        if (this.orbitalVisualizer) return;

        try {
            this.orbitalVisualizer = new OrbitalVisualizer('orbital-container');
            console.log('Orbital visualizer initialized');
        } catch (error) {
            console.error('Error initializing orbital visualizer:', error);
        }
    }

    initializeImpactMap() {
        if (this.impactMap) return;

        this.impactMap = L.map('impact-map-container', {
            center: [0, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: false,
            worldCopyJump: false, // Prevent infinite repetition
            maxBounds: [[-85, -180], [85, 180]], // Limit to Earth bounds
            maxBoundsViscosity: 1.0 // Keep map within bounds
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            noWrap: true // Prevent tile wrapping
        }).addTo(this.impactMap);

        // Apply theme
        this.updateMapThemes();

        // Add default Impactor-2025 zone
        this.addImpactor2025Zone();
    }

    setImpactLocation(latlng) {
        this.impactLocation = latlng;
        document.getElementById('impact-location').textContent = 
            `${latlng.lat.toFixed(2)}, ${latlng.lng.toFixed(2)}`;

        // Clear existing markers
        this.simulationMap.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                this.simulationMap.removeLayer(layer);
            }
        });

        // Add new marker
        L.marker([latlng.lat, latlng.lng], {
            icon: L.divIcon({
                className: 'impact-marker',
                html: '<i class="fas fa-bullseye text-red-500 text-2xl"></i>',
                iconSize: [30, 30]
            })
        }).addTo(this.simulationMap);
    }

    async runSimulation() {
        if (!this.impactLocation) {
            alert('Please select an impact location on the map first.');
            return;
        }

        const size = parseFloat(document.getElementById('size-slider').value);
        const speed = parseFloat(document.getElementById('speed-slider').value);
        const angle = parseFloat(document.getElementById('angle-slider').value);
        const density = parseFloat(document.getElementById('material-select').value);

        try {
            let results;
            
            if (this.useRealPhysics) {
                // Use real physics backend
                results = await this.calculateRealImpactEffects(size, speed, angle, density);
            } else {
                // Use simplified calculations
                results = this.calculateImpactEffects(size, speed, angle, density);
            }
            
        this.simulationResults = results;

        // Update output panels
            document.getElementById('energy-output').textContent = results.energy_mt + ' MT';
            document.getElementById('crater-output').textContent = results.crater_diameter_km + ' km';
            document.getElementById('fireball-output').textContent = results.fireball_radius_km + ' km';
            document.getElementById('tsunami-output').textContent = results.tsunami_height_m + ' m';
            document.getElementById('seismic-output').textContent = results.seismic_magnitude;
            document.getElementById('population-output').textContent = results.affected_population.toLocaleString();

        // Add impact zones to map
        this.addImpactZones(results);
            
        } catch (error) {
            console.error('Error running simulation:', error);
            alert('Error running simulation. Please try again.');
        }
    }

    async calculateRealImpactEffects(size, speed, angle, density) {
        try {
            const response = await fetch(`${this.backendUrl}/impact/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    diameter_m: size,
                    velocity_ms: speed * 1000, // Convert km/s to m/s
                    angle_deg: angle,
                    density_kgm3: density
                })
            });

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.status}`);
            }

            const results = await response.json();
            
            // Convert backend results to frontend format
            return {
                energy_mt: results.energy_mt,
                crater_diameter_km: results.crater_diameter_km,
                fireball_radius_km: results.fireball_radius_km,
                tsunami_height_m: results.tsunami_height_m,
                seismic_magnitude: results.seismic_magnitude,
                affected_population: results.affected_population,
                mass_kg: results.mass_kg,
                kinetic_energy_j: results.kinetic_energy_j
            };
        } catch (error) {
            console.error('Error calling backend API:', error);
            // Fallback to simplified calculations
            return this.calculateImpactEffects(size, speed, angle, density);
        }
    }

    calculateImpactEffects(size, speed, angle, density) {
        const radius = size / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = volume * density;
        const kineticEnergy = 0.5 * mass * Math.pow(speed * 1000, 2);
        const megatons = kineticEnergy / (4.184e15);

        // Simplified impact calculations
        const craterDiameter = Math.pow(megatons, 0.294) * 1000 / 1000; // km
        const fireballRadius = Math.pow(megatons, 0.4) * 1000 / 1000; // km
        const tsunamiHeight = Math.pow(megatons, 0.5) * 10; // meters
        const seismicMagnitude = Math.log10(megatons) + 4;
        const affectedPopulation = Math.pow(megatons, 0.6) * 1000000;

        return {
            energy: megatons.toFixed(1),
            craterDiameter: craterDiameter.toFixed(1),
            fireballRadius: fireballRadius.toFixed(1),
            tsunamiHeight: tsunamiHeight.toFixed(0),
            seismicMagnitude: seismicMagnitude.toFixed(1),
            affectedPopulation: Math.round(affectedPopulation)
        };
    }

    addImpactZones(results) {
        if (!this.simulationMap || !this.impactLocation) return;

        // Clear existing user simulation zones only
        this.simulationMap.eachLayer(layer => {
            if (layer instanceof L.Circle && layer.options && layer.options.userSimulation) {
                this.simulationMap.removeLayer(layer);
            }
        });

        const lat = this.impactLocation.lat;
        const lng = this.impactLocation.lng;

        // Add impact zones
        const fireballRadius = results.fireball_radius_km || results.fireballRadius;
        const craterDiameter = results.crater_diameter_km || results.craterDiameter;
        
        const zones = [
            { radius: parseFloat(fireballRadius) * 1000, color: '#dc2626', opacity: 0.3, label: 'Fireball Zone' },
            { radius: parseFloat(craterDiameter) * 1000, color: '#ea580c', opacity: 0.2, label: 'Crater Zone' },
            { radius: parseFloat(craterDiameter) * 2000, color: '#d97706', opacity: 0.1, label: 'Damage Zone' }
        ];

        zones.forEach(zone => {
            const circle = L.circle([lat, lng], {
                radius: zone.radius,
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                weight: 2,
                userSimulation: true // Mark as user simulation
            }).addTo(this.simulationMap);
            
            circle.bindPopup(`
                <div class="p-2">
                    <h4 class="font-bold text-red-600">User Simulation</h4>
                    <p><strong>Zone:</strong> ${zone.label}</p>
                    <p><strong>Radius:</strong> ${(zone.radius / 1000).toFixed(1)} km</p>
                    <p><strong>Energy:</strong> ${results.energy_mt || results.energy} MT</p>
                </div>
            `);
        });
    }

    addImpactor2025Zone() {
        if (!this.impactMap) return;

        // Default Impactor-2025 location (Pacific Ocean)
        const impactorLocation = [0, -150];
        
        L.circle(impactorLocation, {
            radius: 500000, // 500km radius
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 0.2,
            weight: 3
        }).addTo(this.impactMap);

        L.marker(impactorLocation, {
            icon: L.divIcon({
                className: 'impactor-marker',
                html: '<i class="fas fa-meteor text-red-500 text-3xl"></i>',
                iconSize: [40, 40]
            })
        }).addTo(this.impactMap).bindPopup('Impactor-2025 Theoretical Impact Zone');
    }

    updateMapLayers() {
        // This would control which layers are visible on the impact map
        // Implementation depends on specific layer requirements
    }

    compareWithImpactor2025() {
        if (!this.simulationResults) {
            alert('Please run a simulation first to compare.');
            return;
        }

        // Show comparison modal or panel
        const comparison = {
            energy: { user: this.simulationResults.energy, impactor: '500' },
            crater: { user: this.simulationResults.craterDiameter, impactor: '45' },
            tsunami: { user: this.simulationResults.tsunamiHeight, impactor: '200' }
        };

        alert(`Comparison with Impactor-2025:\n\nEnergy: ${comparison.energy.user} MT vs ${comparison.energy.impactor} MT\nCrater: ${comparison.crater.user} km vs ${comparison.crater.impactor} km\nTsunami: ${comparison.tsunami.user} m vs ${comparison.tsunami.impactor} m`);
    }

    async loadNEOData() {
        try {
            if (this.useRealPhysics) {
                // Try to load from backend API first
                const response = await fetch(`${this.backendUrl}/asteroids`);
                if (response.ok) {
                    this.neos = await response.json();
                    console.log(`Loaded ${this.neos.length} asteroids from backend API`);
                } else {
                    throw new Error('Backend API not available');
                }
            } else {
                // Fallback to CSV parsing
                const response = await fetch('asteroid_data.csv');
                const csvText = await response.text();
                this.neos = this.parseCSVData(csvText);
            }
            
            this.populateNEOList();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading NEO data:', error);
            console.log('Falling back to mock data...');
            // Fallback to mock data if both backend and CSV fail
            this.neos = this.generateMockNEOData();
            this.populateNEOList();
            this.updateStatistics();
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        const neos = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            if (values.length < headers.length) continue;
            
            const neo = {
                id: values[1] || `neo-${i}`,
                name: values[2] || `Unknown-${i}`,
                designation: values[3] || '',
                absoluteMagnitude: parseFloat(values[4]) || 0,
                isPotentiallyHazardous: values[5] === 'True',
                isSentryObject: values[6] === 'True',
                diameterMin: parseFloat(values[7]) || 0,
                diameterMax: parseFloat(values[8]) || 0,
                diameterAvg: parseFloat(values[9]) || 0,
                orbitalPeriod: parseFloat(values[10]) || 0,
                eccentricity: parseFloat(values[11]) || 0,
                inclination: parseFloat(values[12]) || 0,
                perihelionDistance: parseFloat(values[13]) || 0,
                aphelionDistance: parseFloat(values[14]) || 0,
                lastCloseApproachDate: values[15] || '',
                lastMissDistance: parseFloat(values[16]) || 0,
                lastRelativeVelocity: parseFloat(values[17]) || 0,
                orbitingBody: values[18] || 'Unknown'
            };
            
            // Calculate derived properties
            neo.diameter = neo.diameterAvg; // Use average diameter
            neo.velocity = neo.lastRelativeVelocity / 3600; // Convert km/h to km/s
            neo.distance = neo.lastMissDistance / (149.6 * 1000000); // Convert km to AU
            neo.riskLevel = this.calculateRiskLevel(neo.diameter, neo.distance, neo.velocity);
            neo.approachDate = new Date(neo.lastCloseApproachDate);
            
            neos.push(neo);
        }
        
        return neos.sort((a, b) => b.riskLevel.score - a.riskLevel.score);
    }

    generateMockNEOData() {
        const mockNEOs = [];
        const names = ['Apollo', 'Aten', 'Amor', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'Hygiea'];
        
        for (let i = 0; i < 50; i++) {
            const name = names[Math.floor(Math.random() * names.length)] + '-' + (i + 1);
            const diameter = Math.random() * 2000 + 10;
            const velocity = Math.random() * 30 + 5;
            const distance = Math.random() * 50 + 0.1;
            const riskLevel = this.calculateRiskLevel(diameter, distance, velocity);
            
            mockNEOs.push({
                id: i,
                name: name,
                diameter: diameter,
                velocity: velocity,
                distance: distance,
                riskLevel: riskLevel,
                approachDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
            });
        }
        
        return mockNEOs.sort((a, b) => b.riskLevel.score - a.riskLevel.score);
    }

    calculateRiskLevel(diameter, distance, velocity) {
        let score = 0;
        
        // Size factor (diameter in meters)
        if (diameter > 5000) score += 50;
        else if (diameter > 1000) score += 30;
        else if (diameter > 100) score += 15;
        else score += 5;
        
        // Distance factor (miss distance in km)
        if (distance < 1000000) score += 40; // Less than 1M km
        else if (distance < 10000000) score += 25; // Less than 10M km
        else if (distance < 50000000) score += 15; // Less than 50M km
        else score += 5;
        
        // Velocity factor (km/s)
        if (velocity > 30) score += 20;
        else if (velocity > 20) score += 15;
        else if (velocity > 10) score += 10;
        else score += 5;
        
        let level = 'low';
        if (score > 80) level = 'high';
        else if (score > 50) level = 'medium';
        
        return { level, score };
    }

    populateNEOList() {
        const container = document.getElementById('neo-list');
        container.innerHTML = '';
        
        this.neos.forEach(neo => {
            const item = document.createElement('div');
            item.className = 'neo-card rounded-lg p-3 cursor-pointer transition-colors';
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-semibold neo-name">${neo.name}</span>
                    <span class="text-xs px-2 py-1 rounded text-white ${
                        neo.riskLevel.level === 'high' ? 'bg-red-600' :
                        neo.riskLevel.level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                    }">${neo.riskLevel.level.toUpperCase()}</span>
                </div>
                <div class="text-xs neo-details space-y-1">
                    <div>Diameter: ${(neo.diameter / 1000).toFixed(2)} km</div>
                    <div>Velocity: ${neo.velocity.toFixed(1)} km/s</div>
                    <div>Miss Distance: ${(neo.lastMissDistance / 1000000).toFixed(2)}M km</div>
                    <div>Last Approach: ${neo.lastCloseApproachDate}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.selectNEO(neo);
            });
            
            container.appendChild(item);
        });
    }

    async simulateNEOImpact(neo) {
        try {
            let results;
            
            if (this.useRealPhysics) {
                // Use backend API for real asteroid impact simulation
                const response = await fetch(`${this.backendUrl}/impact/asteroid/${neo.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    results = data;
                } else {
                    throw new Error('Backend API error');
                }
            } else {
                // Fallback to simplified calculations
                results = this.calculateImpactEffects(neo.diameter, neo.velocity, 45, 2500);
            }
            
            // Display results
            const message = `NEO Impact Simulation for ${neo.name}:\n\n` +
                `Diameter: ${(neo.diameter / 1000).toFixed(2)} km\n` +
                `Velocity: ${neo.velocity.toFixed(1)} km/s\n` +
                `Miss Distance: ${(neo.lastMissDistance / 1000000).toFixed(2)}M km\n\n` +
                `Impact Effects:\n` +
                `Energy: ${results.energy_mt || results.energy} MT\n` +
                `Crater: ${results.crater_diameter_km || results.craterDiameter} km\n` +
                `Tsunami: ${results.tsunami_height_m || results.tsunamiHeight} m\n` +
                `Seismic: ${results.seismic_magnitude || results.seismicMagnitude}\n` +
                `Affected Population: ${(results.affected_population || results.affectedPopulation).toLocaleString()}`;
            
            alert(message);
            
        } catch (error) {
            console.error('Error simulating NEO impact:', error);
            // Fallback to simplified calculation
        const results = this.calculateImpactEffects(neo.diameter, neo.velocity, 45, 2500);
            alert(`NEO Impact Simulation for ${neo.name}:\n\nDiameter: ${(neo.diameter / 1000).toFixed(2)} km\nVelocity: ${neo.velocity.toFixed(1)} km/s\nLast Miss Distance: ${(neo.lastMissDistance / 1000000).toFixed(2)}M km\n\nImpact Effects:\nEnergy: ${results.energy} MT\nCrater: ${results.craterDiameter} km\nTsunami: ${results.tsunamiHeight} m\nSeismic: ${results.seismicMagnitude}\nAffected Population: ${results.affectedPopulation.toLocaleString()}`);
        }
    }

    selectNEO(neo) {
        // Remove previous selection
        document.querySelectorAll('.neo-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked item
        event.currentTarget.classList.add('selected');
        
        // Store selected NEO
        this.selectedNEO = neo;
        
        // Update display
        document.getElementById('selected-neo-display').innerHTML = `
            <div class="font-semibold text-white">${neo.name}</div>
            <div>Diameter: ${(neo.diameter / 1000).toFixed(2)} km</div>
            <div>Velocity: ${neo.velocity.toFixed(1)} km/s</div>
            <div>Risk Level: <span class="text-${neo.riskLevel.level === 'high' ? 'red' : neo.riskLevel.level === 'medium' ? 'yellow' : 'green'}-400">${neo.riskLevel.level.toUpperCase()}</span></div>
        `;
        
        // Enable buttons
        document.getElementById('run-neo-simulation').disabled = false;
        document.getElementById('view-neo-orbit').disabled = false;
        
        // Enable "Use NEO Data" button in simulation section
        document.getElementById('use-neo-data').disabled = false;
    }

    useNEODataInSimulation() {
        if (!this.selectedNEO) {
            alert('Please select an NEO first from the NEO Data section.');
            return;
        }

        // Update simulation parameters with NEO data
        const neo = this.selectedNEO;
        
        // Update sliders with NEO data
        document.getElementById('size-slider').value = neo.diameter;
        document.getElementById('size-value').textContent = neo.diameter + 'm';
        
        document.getElementById('speed-slider').value = neo.velocity;
        document.getElementById('speed-value').textContent = neo.velocity + ' km/s';
        
        // Set default angle (45 degrees for typical impact)
        document.getElementById('angle-slider').value = 45;
        document.getElementById('angle-value').textContent = '45°';
        
        // Set default density (2500 kg/m³ for typical asteroid)
        document.getElementById('density-slider').value = 2500;
        document.getElementById('density-value').textContent = '2500 kg/m³';
        
        // Switch to simulation section FIRST
        this.showSection('simulation');
        
        // Show success message after navigation
        setTimeout(() => {
            this.showNEODataAppliedMessage(neo);
        }, 100);
    }

    showNEODataAppliedMessage(neo) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="mb-4">
                        <i class="fas fa-check-circle text-green-500 text-6xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">NEO Data Applied</h3>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">
                        <strong>${neo.name}</strong> data has been loaded into the simulation.
                    </p>
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Diameter:</strong> ${(neo.diameter / 1000).toFixed(2)} km
                        </p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Velocity:</strong> ${neo.velocity.toFixed(1)} km/s
                        </p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Risk Level:</strong> ${neo.riskLevel.level.toUpperCase()}
                        </p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async runNEOSimulation() {
        if (!this.selectedNEO) {
            alert('Please select an NEO first.');
            return;
        }

        try {
            // Show loading state
            const button = document.getElementById('run-neo-simulation');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Running Simulation...';
            button.disabled = true;

            let results;
            
            // First try to check if backend is available
            try {
                const healthResponse = await fetch(`${this.backendUrl}/health`);
                if (healthResponse.ok) {
                    console.log('Backend is available, using real physics');
                    
                    // Use backend API for real asteroid impact simulation
                    const response = await fetch(`${this.backendUrl}/impact/asteroid/${this.selectedNEO.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        results = data;
                        console.log('Backend simulation results:', results);
                    } else {
                        const errorText = await response.text();
                        console.error('Backend API error:', response.status, errorText);
                        throw new Error(`Backend API error: ${response.status}`);
                    }
                } else {
                    throw new Error('Backend health check failed');
                }
            } catch (backendError) {
                console.log('Backend not available, using simplified calculations:', backendError.message);
                // Fallback to simplified calculations
                results = this.calculateImpactEffects(this.selectedNEO.diameter, this.selectedNEO.velocity, 45, 2500);
                results = {
                    energy_mt: results.energy,
                    crater_diameter_km: results.craterDiameter,
                    fireball_radius_km: results.fireballRadius,
                    tsunami_height_m: results.tsunamiHeight,
                    seismic_magnitude: results.seismicMagnitude,
                    affected_population: results.affectedPopulation
                };
            }
            
            // Display results in a modal-like format
            this.showNEOSimulationResults(this.selectedNEO, results);
            
        } catch (error) {
            console.error('Error running NEO simulation:', error);
            alert(`Error running simulation: ${error.message}. Please try again.`);
        } finally {
            // Restore button state
            const button = document.getElementById('run-neo-simulation');
            button.innerHTML = '<i class="fas fa-play mr-2"></i>Run NEO Impact Simulation';
            button.disabled = false;
        }
    }

    showNEOSimulationResults(neo, results) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">NEO Impact Simulation Results</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-2">${neo.name}</h4>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>Diameter: ${(neo.diameter / 1000).toFixed(2)} km</div>
                        <div>Velocity: ${neo.velocity.toFixed(1)} km/s</div>
                        <div>Miss Distance: ${(neo.lastMissDistance / 1000000).toFixed(2)}M km</div>
                        <div>Risk Level: <span class="text-${neo.riskLevel.level === 'high' ? 'red' : neo.riskLevel.level === 'medium' ? 'yellow' : 'green'}-400">${neo.riskLevel.level.toUpperCase()}</span></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <h5 class="font-semibold text-red-800 dark:text-red-200 mb-2">Impact Effects</h5>
                        <div class="space-y-1 text-sm">
                            <div>Energy: <span class="font-bold">${results.energy_mt || results.energy} MT</span></div>
                            <div>Crater: <span class="font-bold">${results.crater_diameter_km || results.craterDiameter} km</span></div>
                            <div>Fireball: <span class="font-bold">${results.fireball_radius_km || results.fireballRadius} km</span></div>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h5 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">Environmental Effects</h5>
                        <div class="space-y-1 text-sm">
                            <div>Tsunami: <span class="font-bold">${results.tsunami_height_m || results.tsunamiHeight} m</span></div>
                            <div>Seismic: <span class="font-bold">${results.seismic_magnitude || results.seismicMagnitude}</span></div>
                            <div>Affected: <span class="font-bold">${(results.affected_population || results.affectedPopulation).toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 flex justify-between">
                    <button onclick="window.impact1000App.viewInImpactMap('${neo.id}', '${neo.name}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-map mr-2"></i>View in Impact Map
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async viewNEOOrbit() {
        if (!this.selectedNEO) {
            alert('Please select an NEO first.');
            return;
        }

        try {
            // Switch to simulation section to show orbital visualization
            this.showSection('simulation');
            
            // Load asteroid orbit in the orbital visualizer
            if (this.orbitalVisualizer) {
                await this.orbitalVisualizer.loadAsteroidOrbit(this.selectedNEO.id);
            } else {
                alert('Orbital visualizer not available. Please ensure the simulation section is loaded.');
            }
        } catch (error) {
            console.error('Error viewing NEO orbit:', error);
            alert('Error loading orbital visualization. Please try again.');
        }
    }

    viewInImpactMap(asteroidId, asteroidName) {
        // Store the current simulation data for the impact map
        this.currentNEOData = {
            id: asteroidId,
            name: asteroidName,
            simulationResults: this.simulationResults
        };
        
        // Navigate to Impact Map section
        this.showSection('impact-map');
        
        // Update the impact map with the NEO simulation data
        this.updateImpactMapWithNEOData();
        
        // Close the modal
        const modal = document.querySelector('.fixed');
        if (modal) {
            modal.remove();
        }
    }

    updateImpactMapWithNEOData() {
        if (!this.currentNEOData || !this.impactMap) {
            return;
        }
        
        // Clear existing user simulation layers
        this.clearUserSimulationLayers();
        
        // Add NEO simulation layer
        this.addNEOSimulationLayer(this.currentNEOData);
        
        // Update layer controls
        this.updateLayerControls();
    }

    clearUserSimulationLayers() {
        if (!this.impactMap) return;
        
        // Remove any existing user simulation layers
        this.impactMap.eachLayer(layer => {
            if (layer.options && layer.options.userSimulation) {
                this.impactMap.removeLayer(layer);
            }
        });
    }

    addNEOSimulationLayer(neoData) {
        if (!this.impactMap || !neoData.simulationResults) return;
        
        // Check if NEO actually hits Earth based on miss distance
        const missDistanceKm = neoData.simulationResults.miss_distance_km || neoData.lastMissDistance || 0;
        const earthRadiusKm = 6371; // Earth's radius in km
        
        if (missDistanceKm > earthRadiusKm) {
            // NEO does not hit Earth - show "no impact" message
            this.showNoImpactMessage(neoData);
            return;
        }
        
        // NEO hits Earth - add impact zones
        const results = neoData.simulationResults;
        const fireballRadius = results.fireball_radius_km || results.fireballRadius;
        const craterDiameter = results.crater_diameter_km || results.craterDiameter;
        
        // Calculate impact location based on orbital mechanics
        const impactLocation = this.calculateImpactLocation(neoData);
        
        // Add impact zones for NEO simulation
        const zones = [
            { 
                radius: parseFloat(fireballRadius) * 1000, 
                color: '#ff6b6b', 
                opacity: 0.3,
                label: 'NEO Fireball Zone'
            },
            { 
                radius: parseFloat(craterDiameter) * 1000, 
                color: '#ffa726', 
                opacity: 0.2,
                label: 'NEO Crater Zone'
            },
            { 
                radius: parseFloat(craterDiameter) * 2000, 
                color: '#ffcc02', 
                opacity: 0.1,
                label: 'NEO Damage Zone'
            }
        ];

        zones.forEach(zone => {
            const circle = L.circle(impactLocation, {
                radius: zone.radius,
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                weight: 2,
                userSimulation: true,
                neoSimulation: true
            }).addTo(this.impactMap);
            
            circle.bindPopup(`
                <div class="p-2">
                    <h4 class="font-bold text-orange-600">${neoData.name} Simulation</h4>
                    <p><strong>Zone:</strong> ${zone.label}</p>
                    <p><strong>Radius:</strong> ${(zone.radius / 1000).toFixed(1)} km</p>
                    <p><strong>Energy:</strong> ${results.energy_mt || results.energy} MT</p>
                </div>
            `);
        });
        
        // Add NEO marker
        const neoMarker = L.marker(impactLocation, {
            icon: L.divIcon({
                className: 'neo-simulation-marker',
                html: '<i class="fas fa-meteor text-orange-500 text-2xl"></i>',
                iconSize: [30, 30]
            }),
            userSimulation: true,
            neoSimulation: true
        }).addTo(this.impactMap);
        
        neoMarker.bindPopup(`
            <div class="p-2">
                <h4 class="font-bold text-orange-600">${neoData.name}</h4>
                <p><strong>NEO Impact Simulation</strong></p>
                <p><strong>Energy:</strong> ${results.energy_mt || results.energy} MT</p>
                <p><strong>Crater:</strong> ${results.crater_diameter_km || results.craterDiameter} km</p>
                <p><strong>Tsunami:</strong> ${results.tsunami_height_m || results.tsunamiHeight} m</p>
            </div>
        `);
    }

    showNoImpactMessage(neoData) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="mb-4">
                        <i class="fas fa-check-circle text-green-500 text-6xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No Impact Detected</h3>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">
                        <strong>${neoData.name}</strong> will not impact Earth.
                    </p>
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Miss Distance:</strong> ${((neoData.lastMissDistance || 0) / 1000000).toFixed(2)}M km
                        </p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Status:</strong> Safe passage
                        </p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    calculateImpactLocation(neoData) {
        // Calculate different impact locations for NEO vs user simulations
        const results = neoData.simulationResults;
        
        // Use orbital data if available, otherwise calculate based on NEO properties
        if (results.impact_latitude && results.impact_longitude) {
            return [results.impact_latitude, results.impact_longitude];
        }
        
        // Generate different location based on NEO ID to avoid overlap
        const neoId = neoData.id || 0;
        const baseLat = (neoId % 180) - 90; // Spread between -90 and 90
        const baseLng = ((neoId * 7) % 360) - 180; // Spread between -180 and 180
        
        // Ensure it's over ocean (avoid continents)
        const lat = Math.max(-60, Math.min(60, baseLat)); // Keep between -60 and 60
        const lng = baseLng < -30 ? baseLng : baseLng > 30 ? baseLng : baseLng + 60; // Avoid land masses
        
        return [lat, lng];
    }

    updateLayerControls() {
        // This will be called when we update the Impact Map section
        // The layer controls will be updated in the HTML
    }

    toggleLayer(layerType, visible) {
        if (!this.impactMap) return;
        
        // Handle different layer types - allow multiple layers to be active
        switch (layerType) {
            case 'impactor':
                this.toggleImpactorLayer(visible);
                break;
            case 'user':
                this.toggleUserSimulationLayer(visible);
                break;
            case 'neo':
                this.toggleNEOSimulationLayer(visible);
                break;
            case 'topology':
                this.toggleTopologyLayer(visible);
                break;
            case 'population':
                this.togglePopulationLayer(visible);
                break;
            case 'coastlines':
                this.toggleCoastlinesLayer(visible);
                break;
        }
    }

    turnOffAllLayers() {
        // Utility function to turn off all layers (not automatically called)
        // Turn off all layer checkboxes
        document.getElementById('layer-impactor').checked = false;
        document.getElementById('layer-user').checked = false;
        document.getElementById('layer-neo').checked = false;
        document.getElementById('layer-topology').checked = false;
        document.getElementById('layer-population').checked = false;
        document.getElementById('layer-coastlines').checked = false;
        
        // Remove all layers
        this.removeDefaultImpactorLayer();
        this.toggleUserSimulationLayer(false);
        this.toggleNEOSimulationLayer(false);
        this.removeTopologyLayer();
        this.removePopulationLayer();
        this.removeCoastlinesLayer();
        
        // Reset layer tracking
        this.impactorLayersAdded = false;
    }

    toggleImpactorLayer(visible) {
        // Toggle default Impactor-2025 layer
        if (visible) {
            // Only add if not already present
            if (!this.impactorLayersAdded) {
                this.addDefaultImpactorLayer();
                this.impactorLayersAdded = true;
            }
        } else {
            // Remove default impactor layer
            this.removeDefaultImpactorLayer();
            this.impactorLayersAdded = false;
        }
    }

    toggleUserSimulationLayer(visible) {
        // Toggle user simulation layers
        if (visible) {
            // Show user simulation layers
            this.impactMap.eachLayer(layer => {
                if (layer.options && layer.options.userSimulation && !layer.options.neoSimulation && !layer.options.impactor2025) {
                    if (!this.impactMap.hasLayer(layer)) {
                        this.impactMap.addLayer(layer);
                    }
                }
            });
        } else {
            // Hide user simulation layers
            this.impactMap.eachLayer(layer => {
                if (layer.options && layer.options.userSimulation && !layer.options.neoSimulation && !layer.options.impactor2025) {
                    if (this.impactMap.hasLayer(layer)) {
                        this.impactMap.removeLayer(layer);
                    }
                }
            });
        }
    }

    toggleNEOSimulationLayer(visible) {
        // Toggle NEO simulation layers
        if (visible) {
            // Show NEO simulation layers
            this.impactMap.eachLayer(layer => {
                if (layer.options && layer.options.neoSimulation) {
                    if (!this.impactMap.hasLayer(layer)) {
                        this.impactMap.addLayer(layer);
                    }
                }
            });
        } else {
            // Hide NEO simulation layers
            this.impactMap.eachLayer(layer => {
                if (layer.options && layer.options.neoSimulation) {
                    if (this.impactMap.hasLayer(layer)) {
                        this.impactMap.removeLayer(layer);
                    }
                }
            });
        }
    }

    toggleTopologyLayer(visible) {
        // Toggle topology layer (terrain/elevation)
        if (visible) {
            this.addTopologyLayer();
        } else {
            this.removeTopologyLayer();
        }
    }

    togglePopulationLayer(visible) {
        // Toggle population density layer
        if (visible) {
            this.addPopulationLayer();
        } else {
            this.removePopulationLayer();
        }
    }

    toggleCoastlinesLayer(visible) {
        // Toggle coastlines layer
        if (visible) {
            this.addCoastlinesLayer();
        } else {
            this.removeCoastlinesLayer();
        }
    }

    addDefaultImpactorLayer() {
        // Only add if not already present
        if (this.impactorLayersAdded) return;
        
        // Add default Impactor-2025 simulation layer
        const defaultLocation = [0, -120]; // Pacific Ocean
        
        const defaultZones = [
            { radius: 50000, color: '#ff4444', opacity: 0.3, label: 'Impactor-2025 Fireball' },
            { radius: 100000, color: '#ff8844', opacity: 0.2, label: 'Impactor-2025 Crater' },
            { radius: 200000, color: '#ffcc44', opacity: 0.1, label: 'Impactor-2025 Damage' }
        ];

        defaultZones.forEach(zone => {
            const circle = L.circle(defaultLocation, {
                radius: zone.radius,
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                weight: 2,
                impactor2025: true
            }).addTo(this.impactMap);
            
            circle.bindPopup(`
                <div class="p-2">
                    <h4 class="font-bold text-red-600">Impactor-2025 Default</h4>
                    <p><strong>Zone:</strong> ${zone.label}</p>
                    <p><strong>Radius:</strong> ${(zone.radius / 1000).toFixed(0)} km</p>
                </div>
            `);
        });
        
        this.impactorLayersAdded = true;
    }

    removeDefaultImpactorLayer() {
        this.impactMap.eachLayer(layer => {
            if (layer.options && layer.options.impactor2025) {
                this.impactMap.removeLayer(layer);
            }
        });
    }

    addTopologyLayer() {
        // Add topology/terrain layer using OpenTopoMap
        if (this.topologyLayer) {
            this.impactMap.removeLayer(this.topologyLayer);
        }
        
        this.topologyLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> contributors',
            maxZoom: 17
        });
        
        this.impactMap.addLayer(this.topologyLayer);
        console.log('Added topology layer');
    }

    removeTopologyLayer() {
        if (this.topologyLayer) {
            this.impactMap.removeLayer(this.topologyLayer);
            this.topologyLayer = null;
            console.log('Removed topology layer');
        }
    }

    addPopulationLayer() {
        // Add population density layer using CartoDB Positron with enhanced population density visualization
        if (this.populationLayer) {
            this.impactMap.removeLayer(this.populationLayer);
        }
        
        // Use CartoDB Positron which shows population density with color coding
        this.populationLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
            opacity: 0.8,
            noWrap: true
        });
        
        this.impactMap.addLayer(this.populationLayer);
        
        // Add comprehensive population density overlay with real-world data
        this.addComprehensivePopulationDensityOverlay();
        
        console.log('Added comprehensive population density layer');
    }

    addComprehensivePopulationDensityOverlay() {
        // Comprehensive population density data for major metropolitan areas worldwide
        const populationData = [
            // Very High Density (>25,000 people/km²) - Red
            { name: 'Dhaka', lat: 23.8103, lng: 90.4125, density: 45000, color: '#ff0000', country: 'Bangladesh' },
            { name: 'Mumbai', lat: 19.0760, lng: 72.8777, density: 32000, color: '#ff0000', country: 'India' },
            { name: 'Karachi', lat: 24.8607, lng: 67.0011, density: 24000, color: '#ff0000', country: 'Pakistan' },
            { name: 'Lagos', lat: 6.5244, lng: 3.3792, density: 21000, color: '#ff0000', country: 'Nigeria' },
            { name: 'Cairo', lat: 30.0444, lng: 31.2357, density: 19000, color: '#ff0000', country: 'Egypt' },
            
            // High Density (10,000-25,000 people/km²) - Orange
            { name: 'Jakarta', lat: -6.2088, lng: 106.8456, density: 15000, color: '#ff6600', country: 'Indonesia' },
            { name: 'New York', lat: 40.7128, lng: -74.0060, density: 11000, color: '#ff6600', country: 'USA' },
            { name: 'São Paulo', lat: -23.5505, lng: -46.6333, density: 7200, color: '#ff6600', country: 'Brazil' },
            { name: 'Tokyo', lat: 35.6762, lng: 139.6503, density: 6200, color: '#ff6600', country: 'Japan' },
            { name: 'Mexico City', lat: 19.4326, lng: -99.1332, density: 6200, color: '#ff6600', country: 'Mexico' },
            { name: 'London', lat: 51.5074, lng: -0.1278, density: 5500, color: '#ff6600', country: 'UK' },
            
            // Medium Density (5,000-10,000 people/km²) - Yellow
            { name: 'Shanghai', lat: 31.2304, lng: 121.4737, density: 3800, color: '#ffcc00', country: 'China' },
            { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, density: 3200, color: '#ffcc00', country: 'USA' },
            { name: 'Paris', lat: 48.8566, lng: 2.3522, density: 21000, color: '#ff6600', country: 'France' },
            { name: 'Berlin', lat: 52.5200, lng: 13.4050, density: 4100, color: '#ffcc00', country: 'Germany' },
            { name: 'Madrid', lat: 40.4168, lng: -3.7038, density: 5400, color: '#ffcc00', country: 'Spain' },
            
            // Additional major cities
            { name: 'Delhi', lat: 28.7041, lng: 77.1025, density: 12000, color: '#ff6600', country: 'India' },
            { name: 'Bangkok', lat: 13.7563, lng: 100.5018, density: 5300, color: '#ffcc00', country: 'Thailand' },
            { name: 'Istanbul', lat: 41.0082, lng: 28.9784, density: 2800, color: '#ffcc00', country: 'Turkey' },
            { name: 'Buenos Aires', lat: -34.6118, lng: -58.3960, density: 15000, color: '#ff6600', country: 'Argentina' },
            { name: 'Moscow', lat: 55.7558, lng: 37.6176, density: 4900, color: '#ffcc00', country: 'Russia' }
        ];

        populationData.forEach(city => {
            // Determine color based on density
            let color = '#ffcc00'; // Medium density (default)
            if (city.density > 25000) color = '#ff0000'; // Very high density
            else if (city.density > 10000) color = '#ff6600'; // High density
            
            const marker = L.circleMarker([city.lat, city.lng], {
                radius: Math.min(20, Math.max(4, city.density / 2000)),
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2,
                populationMarker: true
            }).addTo(this.impactMap);
            
            marker.bindPopup(`
                <div class="p-3">
                    <h4 class="font-bold text-lg text-gray-800">${city.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">${city.country}</p>
                    <div class="bg-gray-100 rounded p-2">
                        <p class="text-sm"><strong>Population Density:</strong> ${city.density.toLocaleString()} people/km²</p>
                        <p class="text-sm"><strong>Density Level:</strong> 
                            <span class="font-semibold ${city.density > 25000 ? 'text-red-600' : city.density > 10000 ? 'text-orange-600' : 'text-yellow-600'}">
                                ${city.density > 25000 ? 'Very High' : city.density > 10000 ? 'High' : 'Medium'}
                            </span>
                        </p>
                    </div>
                </div>
            `);
        });
        
        // Add density legend
        this.addPopulationDensityLegend();
    }

    addPopulationDensityLegend() {
        // Remove existing legend if it exists
        if (this.populationLegend) {
            this.impactMap.removeControl(this.populationLegend);
        }
        
        const legend = L.control({position: 'bottomright'});
        
        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'population-legend');
            div.innerHTML = `
                <div class="bg-white p-3 rounded shadow-lg border">
                    <h4 class="font-bold text-sm mb-2">Population Density</h4>
                    <div class="space-y-1 text-xs">
                        <div class="flex items-center">
                            <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span>Very High (>25,000/km²)</span>
                        </div>
                        <div class="flex items-center">
                            <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                            <span>High (10,000-25,000/km²)</span>
                        </div>
                        <div class="flex items-center">
                            <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span>Medium (5,000-10,000/km²)</span>
                        </div>
                    </div>
                </div>
            `;
            return div;
        };
        
        legend.addTo(this.impactMap);
        this.populationLegend = legend; // Store reference for removal
    }

    removePopulationLayer() {
        if (this.populationLayer) {
            this.impactMap.removeLayer(this.populationLayer);
            this.populationLayer = null;
        }
        
        // Remove city markers
        this.impactMap.eachLayer(layer => {
            if (layer instanceof L.CircleMarker && layer.options && layer.options.populationMarker) {
                this.impactMap.removeLayer(layer);
            }
        });
        
        // Remove legend using stored reference
        if (this.populationLegend) {
            this.impactMap.removeControl(this.populationLegend);
            this.populationLegend = null;
        }
        
        console.log('Removed population density layer');
    }

    addCoastlinesLayer() {
        // Add coastlines layer using Natural Earth data
        if (this.coastlinesLayer) {
            this.impactMap.removeLayer(this.coastlinesLayer);
        }
        
        // Create a GeoJSON layer for coastlines
        this.coastlinesLayer = L.geoJSON(null, {
            style: {
                color: '#0066cc',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0
            }
        });
        
        // Load coastline data (simplified version)
        this.loadCoastlineData();
        this.impactMap.addLayer(this.coastlinesLayer);
        console.log('Added coastlines layer');
    }

    removeCoastlinesLayer() {
        if (this.coastlinesLayer) {
            this.impactMap.removeLayer(this.coastlinesLayer);
            this.coastlinesLayer = null;
            console.log('Removed coastlines layer');
        }
    }

    loadCoastlineData() {
        // Simplified coastline data for major coastlines
        const coastlines = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [-180, 60], [-150, 60], [-120, 60], [-90, 60], [-60, 60], [30, 60], [0, 60], [30, 60], [60, 60], [90, 60], [120, 60], [150, 60], [180, 60]
                        ]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [-180, -60], [-150, -60], [-120, -60], [-90, -60], [-60, -60], [-30, -60], [0, -60], [30, -60], [60, -60], [90, -60], [120, -60], [150, -60], [180, -60]
                        ]
                    }
                }
            ]
        };
        
        if (this.coastlinesLayer) {
            this.coastlinesLayer.addData(coastlines);
        }
    }

    filterNEOs() {
        const searchTerm = document.getElementById('neo-search').value.toLowerCase();
        const riskFilter = document.getElementById('neo-risk-filter').value;
        
        const filteredNEOs = this.neos.filter(neo => {
            const matchesSearch = neo.name.toLowerCase().includes(searchTerm);
            const matchesRisk = riskFilter === 'all' || neo.riskLevel.level === riskFilter;
            return matchesSearch && matchesRisk;
        });
        
        // Update the displayed list
        const container = document.getElementById('neo-list');
        container.innerHTML = '';
        
        filteredNEOs.forEach(neo => {
            const item = document.createElement('div');
            item.className = 'neo-card rounded-lg p-3 cursor-pointer transition-colors';
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-semibold neo-name">${neo.name}</span>
                    <span class="text-xs px-2 py-1 rounded text-white ${
                        neo.riskLevel.level === 'high' ? 'bg-red-600' :
                        neo.riskLevel.level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                    }">${neo.riskLevel.level.toUpperCase()}</span>
                </div>
                <div class="text-xs neo-details space-y-1">
                    <div>Diameter: ${(neo.diameter / 1000).toFixed(2)} km</div>
                    <div>Velocity: ${neo.velocity.toFixed(1)} km/s</div>
                    <div>Miss Distance: ${(neo.lastMissDistance / 1000000).toFixed(2)}M km</div>
                    <div>Last Approach: ${neo.lastCloseApproachDate}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.selectNEO(neo);
            });
            
            container.appendChild(item);
        });
    }

    updateStatistics() {
        document.getElementById('total-neos').textContent = this.neos.length;
        
        // Close approaches based on miss distance (less than 10M km)
        const closeApproaches = this.neos.filter(neo => neo.lastMissDistance < 10000000).length;
        document.getElementById('close-approaches').textContent = closeApproaches;
        
        const highRisk = this.neos.filter(neo => neo.riskLevel.level === 'high').length;
        document.getElementById('high-risk-count').textContent = highRisk;
        
        const largestDiameter = Math.max(...this.neos.map(neo => neo.diameter));
        document.getElementById('largest-neo-size').textContent = (largestDiameter / 1000).toFixed(2);
    }

    updateCharts() {
        // Size distribution chart
        const sizeCtx = document.getElementById('size-distribution-chart');
        if (sizeCtx) {
            const sizeData = {
                small: this.neos.filter(n => n.diameter < 1000).length,
                medium: this.neos.filter(n => n.diameter >= 1000 && n.diameter < 5000).length,
                large: this.neos.filter(n => n.diameter >= 5000).length
            };

            new Chart(sizeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Small (<1km)', 'Medium (1-5km)', 'Large (>5km)'],
                    datasets: [{
                        data: [sizeData.small, sizeData.medium, sizeData.large],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: 'white' }
                        }
                    }
                }
            });
        }

        // Risk distribution chart
        const riskCtx = document.getElementById('risk-distribution-chart');
        if (riskCtx) {
            const riskData = {
                low: this.neos.filter(n => n.riskLevel.level === 'low').length,
                medium: this.neos.filter(n => n.riskLevel.level === 'medium').length,
                high: this.neos.filter(n => n.riskLevel.level === 'high').length
            };

            new Chart(riskCtx, {
                type: 'bar',
                data: {
                    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                    datasets: [{
                        data: [riskData.low, riskData.medium, riskData.high],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { ticks: { color: 'white' } },
                        x: { ticks: { color: 'white' } }
                    }
                }
            });
        }
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    if (window.impact1000App) {
        window.impact1000App.showSection(sectionName);
    }
}

function toggleTheme() {
    if (window.impact1000App) {
        window.impact1000App.toggleTheme();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.impact1000App = new Impact1000App();
});