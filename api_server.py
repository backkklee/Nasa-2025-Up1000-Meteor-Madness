# Flask API Server for NASA NEO Visualization Platform
# This provides a simple REST API to serve processed NEO data to the frontend

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta
from backend_example import NASA_NEO_Fetcher, NEO_Data_Processor

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize components
fetcher = NASA_NEO_Fetcher(api_key='DEMblDnIkMiodN56bU3pYopb0ZzSfFnYGg92qnYWq5U')  # Replace with actual API key
processor = NEO_Data_Processor()

# Cache for processed data
neo_cache = {
    'data': [],
    'last_updated': None,
    'cache_duration': 3600  # 1 hour in seconds
}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/neos', methods=['GET'])
def get_neos():
    """
    Get all NEOs with optional filtering
    
    Query parameters:
    - risk_level: high, medium, low
    - size_min: minimum diameter in meters
    - size_max: maximum diameter in meters
    - limit: maximum number of results
    """
    # Check cache
    if (neo_cache['last_updated'] and 
        (datetime.now() - neo_cache['last_updated']).seconds < neo_cache['cache_duration']):
        neos = neo_cache['data']
    else:
        # Fetch fresh data
        raw_data = fetcher.get_neo_feed()
        if not raw_data:
            return jsonify({'error': 'Failed to fetch NEO data'}), 500
        
        neos = processor.process_neo_data(raw_data)
        neo_cache['data'] = neos
        neo_cache['last_updated'] = datetime.now()
    
    # Apply filters
    risk_filter = request.args.get('risk_level')
    size_min = request.args.get('size_min', type=float)
    size_max = request.args.get('size_max', type=float)
    limit = request.args.get('limit', type=int, default=100)
    
    filtered_neos = neos
    
    if risk_filter:
        filtered_neos = [neo for neo in filtered_neos if neo['risk_level']['level'] == risk_filter]
    
    if size_min is not None:
        filtered_neos = [neo for neo in filtered_neos if neo['diameter'] >= size_min]
    
    if size_max is not None:
        filtered_neos = [neo for neo in filtered_neos if neo['diameter'] <= size_max]
    
    # Apply limit
    filtered_neos = filtered_neos[:limit]
    
    return jsonify({
        'neos': filtered_neos,
        'total_count': len(filtered_neos),
        'last_updated': neo_cache['last_updated'].isoformat() if neo_cache['last_updated'] else None
    })

@app.route('/api/neos/<neo_id>', methods=['GET'])
def get_neo_details(neo_id):
    """Get detailed information about a specific NEO"""
    neo_data = fetcher.get_neo_lookup(neo_id)
    
    if not neo_data:
        return jsonify({'error': 'NEO not found'}), 404
    
    # Process the detailed data
    processed_neo = {
        'id': neo_data.get('id', ''),
        'name': neo_data.get('name', 'Unknown'),
        'diameter': processor._estimate_diameter(neo_data),
        'velocity': processor._get_relative_velocity(neo_data),
        'distance': processor._get_closest_approach_distance(neo_data),
        'approach_date': processor._get_closest_approach_date(neo_data),
        'orbital_data': processor._extract_orbital_data(neo_data),
        'is_potentially_hazardous': neo_data.get('is_potentially_hazardous', False),
        'absolute_magnitude': neo_data.get('absolute_magnitude_h', 0),
        'albedo': neo_data.get('albedo', 0),
        'spectral_type': neo_data.get('spectral_type', 'Unknown')
    }
    
    # Calculate risk level
    risk = processor.calculate_risk_level(
        processed_neo['diameter'],
        processed_neo['distance'],
        processed_neo['velocity']
    )
    processed_neo['risk_level'] = risk
    
    return jsonify(processed_neo)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get high-risk NEO alerts"""
    # Get all NEOs
    neos_response = get_neos()
    neos_data = neos_response.get_json()
    
    if 'neos' not in neos_data:
        return jsonify({'error': 'Failed to fetch NEO data'}), 500
    
    # Filter for high-risk NEOs
    high_risk_neos = [neo for neo in neos_data['neos'] if neo['risk_level']['level'] == 'high']
    
    # Sort by risk score
    high_risk_neos.sort(key=lambda x: x['risk_level']['score'], reverse=True)
    
    return jsonify({
        'alerts': high_risk_neos,
        'alert_count': len(high_risk_neos),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get NEO statistics"""
    neos_response = get_neos()
    neos_data = neos_response.get_json()
    
    if 'neos' not in neos_data:
        return jsonify({'error': 'Failed to fetch NEO data'}), 500
    
    neos = neos_data['neos']
    
    # Calculate statistics
    total_neos = len(neos)
    high_risk_count = len([neo for neo in neos if neo['risk_level']['level'] == 'high'])
    medium_risk_count = len([neo for neo in neos if neo['risk_level']['level'] == 'medium'])
    low_risk_count = len([neo for neo in neos if neo['risk_level']['level'] == 'low'])
    
    close_approaches = len([neo for neo in neos if neo['distance'] < 0.1])
    
    diameters = [neo['diameter'] for neo in neos if neo['diameter'] > 0]
    largest_diameter = max(diameters) if diameters else 0
    average_diameter = sum(diameters) / len(diameters) if diameters else 0
    
    velocities = [neo['velocity'] for neo in neos if neo['velocity'] > 0]
    average_velocity = sum(velocities) / len(velocities) if velocities else 0
    
    return jsonify({
        'total_neos': total_neos,
        'risk_distribution': {
            'high': high_risk_count,
            'medium': medium_risk_count,
            'low': low_risk_count
        },
        'close_approaches': close_approaches,
        'size_statistics': {
            'largest_diameter': largest_diameter,
            'average_diameter': average_diameter
        },
        'velocity_statistics': {
            'average_velocity': average_velocity
        },
        'last_updated': neo_cache['last_updated'].isoformat() if neo_cache['last_updated'] else None
    })

@app.route('/api/simulate', methods=['POST'])
def simulate_impact():
    """Simulate impact scenario"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Extract parameters
    diameter = data.get('diameter', 100)
    velocity = data.get('velocity', 17)
    angle = data.get('angle', 45)
    density = data.get('density', 2500)
    
    # Validate parameters
    if not all(isinstance(param, (int, float)) for param in [diameter, velocity, angle, density]):
        return jsonify({'error': 'Invalid parameter types'}), 400
    
    if diameter <= 0 or velocity <= 0 or angle < 0 or angle > 90 or density <= 0:
        return jsonify({'error': 'Invalid parameter values'}), 400
    
    # Calculate impact effects
    radius = diameter / 2
    volume = (4/3) * 3.14159 * (radius ** 3)
    mass = volume * density
    kinetic_energy = 0.5 * mass * ((velocity * 1000) ** 2)  # Convert to m/s
    
    # Convert to megatons TNT equivalent
    megatons = kinetic_energy / (4.184e15)
    
    # Estimate crater diameter (simplified formula)
    crater_diameter = (megatons ** 0.294) * 1000  # meters
    
    # Determine risk level and comparable event
    if megatons > 1000:
        risk_level = 'Extreme'
        comparison = 'Chicxulub impact (dinosaur extinction)'
    elif megatons > 100:
        risk_level = 'High'
        comparison = 'Tunguska event'
    elif megatons > 10:
        risk_level = 'Medium'
        comparison = 'Chelyabinsk meteor'
    elif megatons > 1:
        risk_level = 'Low-Medium'
        comparison = 'Nuclear bomb'
    else:
        risk_level = 'Low'
        comparison = 'Small meteorite'
    
    return jsonify({
        'simulation_results': {
            'impact_energy_megatons': megatons,
            'crater_diameter_km': crater_diameter / 1000,
            'risk_level': risk_level,
            'comparable_event': comparison,
            'parameters': {
                'diameter_m': diameter,
                'velocity_km_s': velocity,
                'angle_degrees': angle,
                'density_kg_m3': density
            }
        },
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting NASA NEO Visualization API Server...")
    print("Available endpoints:")
    print("  GET  /api/health - Health check")
    print("  GET  /api/neos - Get NEOs with filtering")
    print("  GET  /api/neos/<id> - Get specific NEO details")
    print("  GET  /api/alerts - Get high-risk alerts")
    print("  GET  /api/statistics - Get NEO statistics")
    print("  POST /api/simulate - Run impact simulation")
    print("\nTo use with frontend, update app.js to point to this server")
    print("Example: const API_BASE_URL = 'http://localhost:5000/api';")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
