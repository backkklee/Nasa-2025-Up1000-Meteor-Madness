// Impact1000: Living under the threat of a meteor impact? No worries! Impact1000 will help minimize your risks, while so keeping your self educated! - Main Application
class Impact1000App {
    constructor() {
        this.currentSection = 'homepage';
        this.simulationMap = null;
        this.impactMap = null;
        this.neos = [];
        this.impactLocation = null;
        this.simulationResults = null;
        
        // NASA API configuration
        this.nasaApiKey = 'blDnIkMiodN56bU3pYopb0ZzSfFnYGg92qnYWq5U';
        this.nasaBaseUrl = 'https://api.nasa.gov/neo/rest/v1';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startCountdown();
        await this.setupMaps();
        await this.loadNEOData();
        this.updateCharts();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.textContent.toLowerCase().replace(' ', '-');
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

        // Layer toggles
        document.querySelectorAll('.toggle-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateMapLayers();
            });
        });

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
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;

            // Update navigation buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-blue-600');
                btn.classList.add('bg-gray-600');
            });

            const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
                .find(btn => btn.textContent.toLowerCase().replace(' ', '-') === sectionName);
            if (activeBtn) {
                activeBtn.classList.remove('bg-gray-600');
                activeBtn.classList.add('bg-blue-600');
            }

            // Initialize section-specific features
            if (sectionName === 'simulation') {
                this.initializeSimulationMap();
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

        // Dark theme
        this.simulationMap.getContainer().style.filter = 'invert(1) hue-rotate(180deg)';
    }

    initializeImpactMap() {
        if (this.impactMap) return;

        this.impactMap = L.map('impact-map-container', {
            center: [0, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.impactMap);

        // Dark theme
        this.impactMap.getContainer().style.filter = 'invert(1) hue-rotate(180deg)';

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

    runSimulation() {
        if (!this.impactLocation) {
            alert('Please select an impact location on the map first.');
            return;
        }

        const size = parseFloat(document.getElementById('size-slider').value);
        const speed = parseFloat(document.getElementById('speed-slider').value);
        const angle = parseFloat(document.getElementById('angle-slider').value);
        const density = parseFloat(document.getElementById('material-select').value);

        // Calculate impact effects
        const results = this.calculateImpactEffects(size, speed, angle, density);
        this.simulationResults = results;

        // Update output panels
        document.getElementById('energy-output').textContent = results.energy + ' MT';
        document.getElementById('crater-output').textContent = results.craterDiameter + ' km';
        document.getElementById('fireball-output').textContent = results.fireballRadius + ' km';
        document.getElementById('tsunami-output').textContent = results.tsunamiHeight + ' m';
        document.getElementById('seismic-output').textContent = results.seismicMagnitude;
        document.getElementById('population-output').textContent = results.affectedPopulation.toLocaleString();

        // Add impact zones to map
        this.addImpactZones(results);
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

        // Clear existing zones
        this.simulationMap.eachLayer(layer => {
            if (layer instanceof L.Circle) {
                this.simulationMap.removeLayer(layer);
            }
        });

        const lat = this.impactLocation.lat;
        const lng = this.impactLocation.lng;

        // Add impact zones
        const zones = [
            { radius: parseFloat(results.fireballRadius) * 1000, color: '#dc2626', opacity: 0.3 },
            { radius: parseFloat(results.craterDiameter) * 1000, color: '#ea580c', opacity: 0.2 },
            { radius: parseFloat(results.craterDiameter) * 2000, color: '#d97706', opacity: 0.1 }
        ];

        zones.forEach(zone => {
            L.circle([lat, lng], {
                radius: zone.radius,
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                weight: 2
            }).addTo(this.simulationMap);
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
            // For demo purposes, generate mock data
            // In production, this would fetch from NASA API
            this.neos = this.generateMockNEOData();
            this.populateNEOList();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading NEO data:', error);
        }
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
        
        if (diameter > 1000) score += 40;
        else if (diameter > 100) score += 20;
        else score += 5;
        
        if (distance < 0.05) score += 30;
        else if (distance < 0.1) score += 20;
        else if (distance < 0.5) score += 10;
        
        if (velocity > 25) score += 20;
        else if (velocity > 15) score += 10;
        
        let level = 'low';
        if (score > 60) level = 'high';
        else if (score > 30) level = 'medium';
        
        return { level, score };
    }

    populateNEOList() {
        const container = document.getElementById('neo-list');
        container.innerHTML = '';
        
        this.neos.forEach(neo => {
            const item = document.createElement('div');
            item.className = 'bg-gray-800/50 rounded-lg p-3 cursor-pointer hover:bg-gray-700/50 transition-colors';
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-semibold">${neo.name}</span>
                    <span class="text-xs px-2 py-1 rounded ${
                        neo.riskLevel.level === 'high' ? 'bg-red-600' :
                        neo.riskLevel.level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                    }">${neo.riskLevel.level.toUpperCase()}</span>
                </div>
                <div class="text-xs text-gray-400 space-y-1">
                    <div>Diameter: ${(neo.diameter / 1000).toFixed(2)} km</div>
                    <div>Velocity: ${neo.velocity.toFixed(1)} km/s</div>
                    <div>Distance: ${(neo.distance * 149.6).toFixed(2)}M km</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.simulateNEOImpact(neo);
            });
            
            container.appendChild(item);
        });
    }

    simulateNEOImpact(neo) {
        // Simulate impact for selected NEO
        const results = this.calculateImpactEffects(neo.diameter, neo.velocity, 45, 2500);
        
        alert(`NEO Impact Simulation for ${neo.name}:\n\nEnergy: ${results.energy} MT\nCrater: ${results.craterDiameter} km\nTsunami: ${results.tsunamiHeight} m\nSeismic: ${results.seismicMagnitude}`);
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
            item.className = 'bg-gray-800/50 rounded-lg p-3 cursor-pointer hover:bg-gray-700/50 transition-colors';
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-semibold">${neo.name}</span>
                    <span class="text-xs px-2 py-1 rounded ${
                        neo.riskLevel.level === 'high' ? 'bg-red-600' :
                        neo.riskLevel.level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                    }">${neo.riskLevel.level.toUpperCase()}</span>
                </div>
                <div class="text-xs text-gray-400 space-y-1">
                    <div>Diameter: ${(neo.diameter / 1000).toFixed(2)} km</div>
                    <div>Velocity: ${neo.velocity.toFixed(1)} km/s</div>
                    <div>Distance: ${(neo.distance * 149.6).toFixed(2)}M km</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.simulateNEOImpact(neo);
            });
            
            container.appendChild(item);
        });
    }

    updateStatistics() {
        document.getElementById('total-neos').textContent = this.neos.length;
        
        const closeApproaches = this.neos.filter(neo => neo.distance < 0.1).length;
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
                small: this.neos.filter(n => n.diameter < 100).length,
                medium: this.neos.filter(n => n.diameter >= 100 && n.diameter < 1000).length,
                large: this.neos.filter(n => n.diameter >= 1000).length
            };

            new Chart(sizeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Small (<100m)', 'Medium (100m-1km)', 'Large (>1km)'],
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

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.impact1000App = new Impact1000App();
});