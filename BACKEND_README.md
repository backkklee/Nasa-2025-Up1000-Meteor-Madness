# Impact1000 Backend API Setup

This document explains how to set up and run the real physics backend for the Impact1000 application.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Running the Backend

### Option 1: Using the batch file (Windows)
```bash
start_backend.bat
```

### Option 2: Direct Python command
```bash
python backend_api.py
```

The backend will start on `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if the backend is running

### Asteroids
- **GET** `/api/asteroids` - Get list of all asteroids
- **GET** `/api/asteroid/{id}` - Get specific asteroid orbital data

### Impact Calculations
- **POST** `/api/impact/calculate` - Calculate impact effects
  - Body: `{"diameter_m": 1000, "velocity_ms": 17000, "angle_deg": 45, "density_kgm3": 2500}`
- **POST** `/api/impact/asteroid/{id}` - Calculate impact for specific asteroid

## Features

### Real Physics Calculations
- Kinetic energy calculations using actual physics formulas
- Crater diameter scaling based on energy and impact angle
- Fireball radius calculations
- Tsunami height predictions for ocean impacts
- Seismic magnitude calculations
- Population impact estimates

### Orbital Mechanics
- Integration with poliastro for orbital calculations
- Real asteroid orbital data processing
- 3D orbital visualization support

### Data Sources
- Real asteroid data from `asteroid_data.csv`
- NASA-compatible data format
- Historical close approach data

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   - Change the port in `backend_api.py` (line: `app.run(port=5001)`)
   - Update frontend URL in `app.js` (line: `this.backendUrl = 'http://localhost:5001/api'`)

2. **Missing dependencies**
   - Run `pip install -r requirements.txt`
   - Ensure all packages are installed correctly

3. **CSV file not found**
   - Ensure `asteroid_data.csv` is in the same directory as `backend_api.py`

### Debug Mode
The backend runs in debug mode by default. To disable:
```python
app.run(debug=False, host='0.0.0.0', port=5000)
```

## Integration with Frontend

The frontend automatically detects if the backend is available and falls back to simplified calculations if not. The `useRealPhysics` flag in `app.js` controls this behavior.

## Development

To modify the physics calculations, edit the `MeteorPhysics` class in `backend_api.py`. The calculations are based on scientific models for impact effects and orbital mechanics.
