from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

class MeteorPhysics:
    def __init__(self):
        self.asteroid_data = None
        self.load_asteroid_data()
    
    def load_asteroid_data(self):
        """Load asteroid data from CSV file"""
        try:
            self.asteroid_data = pd.read_csv('asteroid_data.csv')
            print(f"Loaded {len(self.asteroid_data)} asteroids")
        except Exception as e:
            print(f"Error loading asteroid data: {e}")
            self.asteroid_data = pd.DataFrame()
    
    def calculate_impact_effects(self, diameter_m, velocity_ms, angle_deg, density_kgm3):
        """
        Calculate impact effects using real physics
        Based on meteor_calculation.py logic
        """
        # Convert inputs
        radius = diameter_m / 2
        volume = (4/3) * np.pi * radius**3
        mass = volume * density_kgm3
        
        # Kinetic energy calculation
        kinetic_energy = 0.5 * mass * velocity_ms**2
        
        # Convert to megatons TNT equivalent
        megatons_tnt = kinetic_energy / (4.184e15)
        
        # Impact effects calculations (based on scientific models)
        crater_diameter = self.calculate_crater_diameter(megatons_tnt, angle_deg)
        fireball_radius = self.calculate_fireball_radius(megatons_tnt)
        tsunami_height = self.calculate_tsunami_height(megatons_tnt, angle_deg)
        seismic_magnitude = self.calculate_seismic_magnitude(megatons_tnt)
        affected_population = self.calculate_affected_population(megatons_tnt, crater_diameter)
        
        return {
            'energy_mt': round(megatons_tnt, 2),
            'crater_diameter_km': round(crater_diameter, 2),
            'fireball_radius_km': round(fireball_radius, 2),
            'tsunami_height_m': round(tsunami_height, 1),
            'seismic_magnitude': round(seismic_magnitude, 1),
            'affected_population': int(affected_population),
            'mass_kg': round(mass, 0),
            'kinetic_energy_j': round(kinetic_energy, 0)
        }
    
    def calculate_crater_diameter(self, megatons, angle_deg):
        """Calculate crater diameter based on energy and impact angle"""
        # Simplified crater scaling law
        base_diameter = (megatons ** 0.294) * 1000  # meters
        # Adjust for impact angle (vertical impact = 90°, horizontal = 0°)
        angle_factor = np.sin(np.radians(angle_deg))
        return base_diameter * angle_factor / 1000  # Convert to km
    
    def calculate_fireball_radius(self, megatons):
        """Calculate fireball radius"""
        return (megatons ** 0.4) * 1000 / 1000  # km
    
    def calculate_tsunami_height(self, megatons, angle_deg):
        """Calculate tsunami height for ocean impacts"""
        if angle_deg < 30:  # Ocean impact
            return (megatons ** 0.5) * 10  # meters
        return 0  # Land impact
    
    def calculate_seismic_magnitude(self, megatons):
        """Calculate seismic magnitude"""
        return np.log10(megatons) + 4
    
    def calculate_affected_population(self, megatons, crater_diameter):
        """Estimate affected population"""
        # Very simplified model
        return (megatons ** 0.6) * 1000000
    
    def calculate_orbital_mechanics(self, asteroid_id):
        """
        Calculate orbital mechanics for a specific asteroid
        Simplified version without poliastro dependency
        """
        if self.asteroid_data.empty:
            return None
        
        # Find asteroid by ID (try both string and int conversion)
        asteroid = None
        try:
            # Try exact match first
            asteroid = self.asteroid_data[self.asteroid_data['id'] == asteroid_id]
            if asteroid.empty:
                # Try converting to int
                asteroid = self.asteroid_data[self.asteroid_data['id'] == int(asteroid_id)]
            if asteroid.empty:
                # Try converting to string
                asteroid = self.asteroid_data[self.asteroid_data['id'].astype(str) == str(asteroid_id)]
        except:
            pass
            
        if asteroid is None or asteroid.empty:
            print(f"Asteroid with ID {asteroid_id} not found")
            return None
        
        row = asteroid.iloc[0]
        
        try:
            # Extract orbital elements (using available data from CSV)
            diameter_avg = float(row['diameter_avg_m'])
            velocity_kmh = float(row['last_relative_velocity_kmh'])
            miss_distance = float(row['last_miss_distance_km'])
            
            # Convert velocity to m/s
            velocity_ms = velocity_kmh / 3.6
            
            # Calculate orbital period from available data
            orbital_period_days = float(row['orbital_period_days'])
            
            # Generate orbital points (simplified)
            orbital_points = self.generate_orbital_points(orbital_period_days, miss_distance)
            
            return {
                'asteroid_id': asteroid_id,
                'name': row['name'],
                'diameter_m': diameter_avg,
                'velocity_ms': velocity_ms,
                'miss_distance_km': miss_distance,
                'orbital_period_days': orbital_period_days,
                'orbital_points': orbital_points,
                'last_approach_date': row['last_close_approach_date']
            }
        except Exception as e:
            print(f"Error calculating orbital mechanics: {e}")
            return None
    
    def generate_orbital_points(self, period_days, miss_distance_km):
        """Generate simplified orbital points"""
        # Generate points for visualization (simplified)
        points = []
        steps = 100
        for i in range(steps):
            angle = 2 * np.pi * i / steps
            # Simplified elliptical orbit approximation
            x = miss_distance_km * np.cos(angle) / 149600000  # Convert to AU
            y = miss_distance_km * np.sin(angle) / 149600000
            z = 0
            points.append([x, y, z])
        return points
    
    def get_asteroid_list(self):
        """Get list of all asteroids"""
        if self.asteroid_data.empty:
            return []
        
        asteroids = []
        for _, row in self.asteroid_data.iterrows():
            asteroids.append({
                'id': row['id'],
                'name': row['name'],
                'designation': row['designation'],
                'diameter_avg_m': float(row['diameter_avg_m']),
                'last_relative_velocity_kmh': float(row['last_relative_velocity_kmh']),
                'last_miss_distance_km': float(row['last_miss_distance_km']),
                'is_potentially_hazardous': bool(row['is_potentially_hazardous']),
                'last_close_approach_date': row['last_close_approach_date']
            })
        
        return asteroids

# Initialize physics engine
physics = MeteorPhysics()

@app.route('/api/asteroids', methods=['GET'])
def get_asteroids():
    """Get list of all asteroids"""
    asteroids = physics.get_asteroid_list()
    print(f"Returning {len(asteroids)} asteroids to frontend")
    if asteroids:
        print(f"First asteroid ID: {asteroids[0]['id']}")
    return jsonify(asteroids)

@app.route('/api/asteroid/<int:asteroid_id>', methods=['GET'])
def get_asteroid(asteroid_id):
    """Get specific asteroid orbital mechanics"""
    orbital_data = physics.calculate_orbital_mechanics(asteroid_id)
    if orbital_data:
        return jsonify(orbital_data)
    else:
        return jsonify({'error': 'Asteroid not found'}), 404

@app.route('/api/impact/calculate', methods=['POST'])
def calculate_impact():
    """Calculate impact effects"""
    data = request.json
    
    # Extract parameters
    diameter_m = float(data.get('diameter_m', 1000))
    velocity_ms = float(data.get('velocity_ms', 17000))  # Default 17 km/s
    angle_deg = float(data.get('angle_deg', 45))
    density_kgm3 = float(data.get('density_kgm3', 2500))  # Default rock density
    
    # Calculate impact effects
    results = physics.calculate_impact_effects(diameter_m, velocity_ms, angle_deg, density_kgm3)
    
    return jsonify(results)

@app.route('/api/impact/asteroid/<int:asteroid_id>', methods=['POST'])
def calculate_asteroid_impact(asteroid_id):
    """Calculate impact effects for a specific asteroid"""
    print(f"Calculating impact for asteroid ID: {asteroid_id}")
    orbital_data = physics.calculate_orbital_mechanics(asteroid_id)
    if not orbital_data:
        print(f"Asteroid {asteroid_id} not found in database")
        return jsonify({'error': 'Asteroid not found'}), 404
    
    # Use asteroid's actual properties
    diameter_m = orbital_data['diameter_m']
    velocity_ms = orbital_data['velocity_ms']
    angle_deg = 45  # Default impact angle
    density_kgm3 = 2500  # Default rock density
    
    # Calculate impact effects
    results = physics.calculate_impact_effects(diameter_m, velocity_ms, angle_deg, density_kgm3)
    
    # Add orbital data to results
    results['orbital_data'] = orbital_data
    
    return jsonify(results)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'asteroids_loaded': len(physics.asteroid_data)
    })

if __name__ == '__main__':
    print("Starting Meteor Physics Backend API...")
    print(f"Loaded {len(physics.asteroid_data)} asteroids")
    app.run(debug=True, host='0.0.0.0', port=5000)
