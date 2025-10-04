# NASA NEO Data Fetcher - Backend Example
# This is a Python backend example showing how to integrate with NASA's NeoWs API
# For the frontend visualization platform

import requests
import json
from datetime import datetime, timedelta
import time

class NASA_NEO_Fetcher:
    def __init__(self, api_key='blDnIkMiodN56bU3pYopb0ZzSfFnYGg92qnYWq5U'):
        """
        Initialize the NASA NEO data fetcher
        
        Args:
            api_key (str): NASA API key (get from https://api.nasa.gov/)
        """
        self.api_key = api_key
        self.base_url = 'https://api.nasa.gov/neo/rest/v1'
        self.session = requests.Session()
        
    def get_neo_feed(self, start_date=None, end_date=None):
        """
        Fetch NEO data for a date range
        
        Args:
            start_date (str): Start date in YYYY-MM-DD format
            end_date (str): End date in YYYY-MM-DD format
            
        Returns:
            dict: NEO data from NASA API
        """
        if not start_date:
            start_date = datetime.now().strftime('%Y-%m-%d')
        if not end_date:
            end_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
            
        url = f"{self.base_url}/feed"
        params = {
            'start_date': start_date,
            'end_date': end_date,
            'api_key': self.api_key
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching NEO data: {e}")
            return None
    
    def get_neo_lookup(self, neo_id):
        """
        Get detailed information about a specific NEO
        
        Args:
            neo_id (str): NASA NEO ID
            
        Returns:
            dict: Detailed NEO information
        """
        url = f"{self.base_url}/neo/{neo_id}"
        params = {'api_key': self.api_key}
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching NEO details: {e}")
            return None
    
    def get_neo_browse(self, page=0, size=20):
        """
        Browse all NEOs with pagination
        
        Args:
            page (int): Page number (0-based)
            size (int): Number of results per page (max 20)
            
        Returns:
            dict: Paginated NEO data
        """
        url = f"{self.base_url}/neo/browse"
        params = {
            'page': page,
            'size': size,
            'api_key': self.api_key
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error browsing NEOs: {e}")
            return None

class NEO_Data_Processor:
    def __init__(self):
        """Initialize the NEO data processor"""
        pass
    
    def calculate_risk_level(self, diameter, miss_distance, velocity):
        """
        Calculate risk level based on NEO parameters
        
        Args:
            diameter (float): NEO diameter in meters
            miss_distance (float): Miss distance in astronomical units
            velocity (float): Relative velocity in km/s
            
        Returns:
            dict: Risk level and score
        """
        score = 0
        
        # Size factor (larger = more dangerous)
        if diameter > 1000:
            score += 40
        elif diameter > 100:
            score += 20
        else:
            score += 5
        
        # Distance factor (closer = more dangerous)
        miss_distance_km = miss_distance * 149597870.7  # Convert AU to km
        if miss_distance_km < 7500000:  # 7.5M km
            score += 30
        elif miss_distance_km < 15000000:  # 15M km
            score += 20
        elif miss_distance_km < 75000000:  # 75M km
            score += 10
        
        # Velocity factor (faster = more dangerous)
        if velocity > 25:
            score += 20
        elif velocity > 15:
            score += 10
        
        # Determine risk level
        if score > 60:
            level = 'high'
        elif score > 30:
            level = 'medium'
        else:
            level = 'low'
        
        return {'level': level, 'score': score}
    
    def process_neo_data(self, raw_data):
        """
        Process raw NASA NEO data into frontend-friendly format
        
        Args:
            raw_data (dict): Raw data from NASA API
            
        Returns:
            list: Processed NEO data
        """
        processed_neos = []
        
        if 'near_earth_objects' in raw_data:
            for date, neos in raw_data['near_earth_objects'].items():
                for neo in neos:
                    processed_neo = {
                        'id': neo.get('id', ''),
                        'name': neo.get('name', 'Unknown'),
                        'diameter': self._estimate_diameter(neo),
                        'velocity': self._get_relative_velocity(neo),
                        'distance': self._get_closest_approach_distance(neo),
                        'approach_date': self._get_closest_approach_date(neo),
                        'orbital_data': self._extract_orbital_data(neo),
                        'is_potentially_hazardous': neo.get('is_potentially_hazardous', False)
                    }
                    
                    # Calculate risk level
                    risk = self.calculate_risk_level(
                        processed_neo['diameter'],
                        processed_neo['distance'],
                        processed_neo['velocity']
                    )
                    processed_neo['risk_level'] = risk
                    
                    processed_neos.append(processed_neo)
        
        return processed_neos
    
    def _estimate_diameter(self, neo):
        """Estimate diameter from size data"""
        estimated_diameter = neo.get('estimated_diameter', {})
        meters = estimated_diameter.get('meters', {})
        
        if 'estimated_diameter_min' in meters and 'estimated_diameter_max' in meters:
            return (meters['estimated_diameter_min'] + meters['estimated_diameter_max']) / 2
        return 100  # Default estimate
    
    def _get_relative_velocity(self, neo):
        """Get relative velocity from close approach data"""
        close_approach_data = neo.get('close_approach_data', [])
        if close_approach_data:
            return float(close_approach_data[0].get('relative_velocity', {}).get('kilometers_per_second', 0))
        return 0
    
    def _get_closest_approach_distance(self, neo):
        """Get closest approach distance in AU"""
        close_approach_data = neo.get('close_approach_data', [])
        if close_approach_data:
            return float(close_approach_data[0].get('miss_distance', {}).get('astronomical', 0))
        return 0
    
    def _get_closest_approach_date(self, neo):
        """Get closest approach date"""
        close_approach_data = neo.get('close_approach_data', [])
        if close_approach_data:
            return close_approach_data[0].get('close_approach_date', '')
        return ''
    
    def _extract_orbital_data(self, neo):
        """Extract orbital elements"""
        orbital_data = neo.get('orbital_data', {})
        return {
            'semi_major_axis': float(orbital_data.get('semi_major_axis', 0)),
            'eccentricity': float(orbital_data.get('eccentricity', 0)),
            'inclination': float(orbital_data.get('inclination', 0)),
            'longitude_of_ascending_node': float(orbital_data.get('longitude_of_ascending_node', 0)),
            'argument_of_periapsis': float(orbital_data.get('argument_of_periapsis', 0)),
            'mean_anomaly': float(orbital_data.get('mean_anomaly', 0))
        }

# Example usage
if __name__ == "__main__":
    # Initialize the fetcher (replace with your actual API key)
    fetcher = NASA_NEO_Fetcher(api_key='DEMO_KEY')
    processor = NEO_Data_Processor()
    
    # Fetch NEO data for the next 7 days
    print("Fetching NEO data...")
    raw_data = fetcher.get_neo_feed()
    
    if raw_data:
        # Process the data
        processed_neos = processor.process_neo_data(raw_data)
        
        print(f"Found {len(processed_neos)} NEOs")
        
        # Display high-risk NEOs
        high_risk_neos = [neo for neo in processed_neos if neo['risk_level']['level'] == 'high']
        
        if high_risk_neos:
            print(f"\nHigh-risk NEOs detected: {len(high_risk_neos)}")
            for neo in high_risk_neos[:3]:  # Show top 3
                print(f"- {neo['name']}: {neo['diameter']:.1f}m diameter, "
                      f"{neo['distance']*149.6:.1f}M km distance, "
                      f"Risk score: {neo['risk_level']['score']}")
        else:
            print("No high-risk NEOs detected in the next 7 days")
    else:
        print("Failed to fetch NEO data")
