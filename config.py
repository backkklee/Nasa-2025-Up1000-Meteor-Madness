# Configuration file for NASA NEO Visualization Platform

# NASA API Configuration
NASA_API_KEY = "blDnIkMiodN56bU3pYopb0ZzSfFnYGg92qnYWq5U"  # Replace with your actual NASA API key
NASA_BASE_URL = "https://api.nasa.gov/neo/rest/v1"

# Application Configuration
DEBUG = True
HOST = "0.0.0.0"
PORT = 5000

# Data Caching Configuration
CACHE_DURATION = 3600  # Cache duration in seconds (1 hour)
MAX_CACHE_SIZE = 1000  # Maximum number of NEOs to cache

# Risk Assessment Parameters
RISK_THRESHOLDS = {
    "HIGH_RISK_SCORE": 60,
    "MEDIUM_RISK_SCORE": 30,
    "LOW_RISK_SCORE": 0
}

# Size Categories (in meters)
SIZE_CATEGORIES = {
    "SMALL": 100,
    "MEDIUM": 1000,
    "LARGE": 10000
}

# Distance Thresholds (in AU)
DISTANCE_THRESHOLDS = {
    "CLOSE_APPROACH": 0.05,  # 7.5M km
    "NEAR_EARTH": 0.1,       # 15M km
    "FAR_APPROACH": 0.5      # 75M km
}

# Velocity Thresholds (in km/s)
VELOCITY_THRESHOLDS = {
    "SLOW": 15,
    "FAST": 25,
    "VERY_FAST": 35
}

# Frontend Configuration
FRONTEND_URL = "http://localhost:8000"  # Update for production
CORS_ORIGINS = ["http://localhost:8000", "http://127.0.0.1:8000"]

# Logging Configuration
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Database Configuration (optional)
DATABASE_URL = "sqlite:///neo_data.db"

# Redis Configuration (optional)
REDIS_URL = "redis://localhost:6379/0"
