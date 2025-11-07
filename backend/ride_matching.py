from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from geopy.distance import geodesic
import math

class RideMatchingEngine:
    """Advanced ride matching algorithm with multi-objective optimization"""
    
    def __init__(self):
        self.MAX_DETOUR_PERCENT = 0.15  # 15% max detour
        self.MAX_TIME_WINDOW_MINUTES = 30
        self.MAX_DETOUR_MINUTES = 10
    
    def calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calculate distance in km between two coordinates using Haversine formula"""
        return geodesic(point1, point2).kilometers
    
    def calculate_route_distance(self, waypoints: List[Tuple[float, float]]) -> float:
        """Calculate total distance of a route with multiple waypoints"""
        total_distance = 0
        for i in range(len(waypoints) - 1):
            total_distance += self.calculate_distance(waypoints[i], waypoints[i + 1])
        return total_distance
    
    def is_point_on_route(self, point: Tuple[float, float], 
                          origin: Tuple[float, float], 
                          destination: Tuple[float, float]) -> Tuple[bool, float]:
        """Check if a point is reasonably on the route between origin and destination"""
        # Calculate direct route distance
        direct_distance = self.calculate_distance(origin, destination)
        
        # Calculate detour distance
        detour_distance = (self.calculate_distance(origin, point) + 
                          self.calculate_distance(point, destination))
        
        # Calculate detour percentage
        detour_percent = (detour_distance - direct_distance) / direct_distance
        
        is_on_route = detour_percent <= self.MAX_DETOUR_PERCENT
        return is_on_route, detour_percent
    
    def time_window_matches(self, time1: datetime, time2: datetime, 
                           flexibility_minutes: int = 15) -> Tuple[bool, float]:
        """Check if two times are within acceptable window"""
        time_diff_minutes = abs((time1 - time2).total_seconds() / 60)
        matches = time_diff_minutes <= flexibility_minutes
        score = 1.0 - (time_diff_minutes / self.MAX_TIME_WINDOW_MINUTES)
        return matches, max(0, score)
    
    def calculate_match_score(self, trip_request: dict, ride_offer: dict) -> float:
        """Calculate compatibility score between trip request and ride offer"""
        score = 0.0
        
        # Extract coordinates
        req_origin = (trip_request['origin']['latitude'], trip_request['origin']['longitude'])
        req_dest = (trip_request['destination']['latitude'], trip_request['destination']['longitude'])
        offer_origin = (ride_offer['origin']['latitude'], ride_offer['origin']['longitude'])
        offer_dest = (ride_offer['destination']['latitude'], ride_offer['destination']['longitude'])
        
        # 1. Route Similarity Score (40 points)
        origin_on_route, origin_detour = self.is_point_on_route(req_origin, offer_origin, offer_dest)
        dest_on_route, dest_detour = self.is_point_on_route(req_dest, offer_origin, offer_dest)
        
        if origin_on_route and dest_on_route:
            route_score = 40 * (1 - (origin_detour + dest_detour) / 2)
            score += route_score
        else:
            return 0  # Not compatible
        
        # 2. Time Window Score (30 points)
        req_time = trip_request['departure_time']
        offer_time = ride_offer['departure_time']
        
        if isinstance(req_time, str):
            req_time = datetime.fromisoformat(req_time.replace('Z', '+00:00'))
        if isinstance(offer_time, str):
            offer_time = datetime.fromisoformat(offer_time.replace('Z', '+00:00'))
        
        time_matches, time_score = self.time_window_matches(
            req_time, offer_time, 
            trip_request.get('flexibility_minutes', 15)
        )
        
        if time_matches:
            score += 30 * time_score
        else:
            return 0  # Not compatible
        
        # 3. Capacity Check (20 points)
        if ride_offer['available_seats'] >= trip_request.get('seats_needed', 1):
            score += 20
        else:
            return 0  # Not enough seats
        
        # 4. Convenience Score (10 points) - based on pickup/dropoff proximity
        pickup_distance = self.calculate_distance(req_origin, offer_origin)
        dropoff_distance = self.calculate_distance(req_dest, offer_dest)
        
        # Closer pickup/dropoff = higher score
        convenience_score = 10 * (1 - min(1, (pickup_distance + dropoff_distance) / 10))
        score += convenience_score
        
        return score
    
    def find_matches(self, trip_request: dict, available_rides: List[dict], 
                    top_n: int = 3) -> List[Dict]:
        """Find top matching rides for a trip request"""
        matches = []
        
        for ride in available_rides:
            if ride['status'] != 'available':
                continue
            
            score = self.calculate_match_score(trip_request, ride)
            
            if score > 0:
                matches.append({
                    'ride': ride,
                    'score': score,
                    'estimated_pickup_time': ride['departure_time'],
                    'estimated_detour_minutes': 5  # Simplified for now
                })
        
        # Sort by score descending
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        return matches[:top_n]
    
    def optimize_route(self, driver_location: Tuple[float, float],
                      destination: Tuple[float, float],
                      passengers: List[Dict]) -> List[Dict]:
        """Optimize pickup/dropoff sequence for multiple passengers"""
        # Simplified nearest-neighbor optimization
        # In production, use more sophisticated algorithms (TSP solver)
        
        waypoints = [{
            'type': 'pickup',
            'location': driver_location,
            'passenger': None,
            'order': 0
        }]
        
        current_location = driver_location
        remaining_passengers = passengers.copy()
        order = 1
        
        # Add pickups using nearest-neighbor
        while remaining_passengers:
            nearest = min(remaining_passengers, 
                         key=lambda p: self.calculate_distance(
                             current_location, 
                             (p['origin']['latitude'], p['origin']['longitude'])
                         ))
            
            pickup_location = (nearest['origin']['latitude'], nearest['origin']['longitude'])
            waypoints.append({
                'type': 'pickup',
                'location': pickup_location,
                'address': nearest['origin']['address'],
                'passenger': nearest,
                'order': order
            })
            
            current_location = pickup_location
            remaining_passengers.remove(nearest)
            order += 1
        
        # Add dropoffs in similar fashion
        remaining_dropoffs = passengers.copy()
        while remaining_dropoffs:
            nearest = min(remaining_dropoffs,
                         key=lambda p: self.calculate_distance(
                             current_location,
                             (p['destination']['latitude'], p['destination']['longitude'])
                         ))
            
            dropoff_location = (nearest['destination']['latitude'], nearest['destination']['longitude'])
            waypoints.append({
                'type': 'dropoff',
                'location': dropoff_location,
                'address': nearest['destination']['address'],
                'passenger': nearest,
                'order': order
            })
            
            current_location = dropoff_location
            remaining_dropoffs.remove(nearest)
            order += 1
        
        # Add final destination
        waypoints.append({
            'type': 'destination',
            'location': destination,
            'passenger': None,
            'order': order
        })
        
        return waypoints