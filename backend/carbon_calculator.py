from typing import Dict
import math

class CarbonCalculator:
    """Calculate carbon savings and impact metrics"""
    
    def __init__(self):
        # CO2 emissions in kg per km for different modes
        self.EMISSIONS_PER_KM = {
            'solo_car': 0.192,  # Average car
            'carpool_2': 0.096,  # 2 people
            'carpool_3': 0.064,  # 3 people
            'carpool_4': 0.048,  # 4 people
            'transit': 0.041,   # Public transit
            'bike': 0.0,
            'walk': 0.0,
            'electric': 0.053   # Electric car
        }
        
        # Average cost per km
        self.COST_PER_KM = {
            'solo_car': 0.60,   # Fuel + maintenance
            'carpool': 0.15,    # Split cost
            'transit': 0.20,
            'bike': 0.02,       # Maintenance
            'walk': 0.0
        }
        
        # Trees equivalent: 1 tree absorbs ~20kg CO2 per year
        self.TREE_ABSORPTION_RATE = 20.0
    
    def calculate_carbon_saved(self, mode: str, distance_km: float, 
                              passengers: int = 1) -> Dict:
        """Calculate carbon savings compared to solo driving"""
        
        # Baseline: solo car emissions
        baseline_emissions = distance_km * self.EMISSIONS_PER_KM['solo_car']
        
        # Calculate actual emissions based on mode
        if mode == 'carpool':
            if passengers == 2:
                actual_emissions = distance_km * self.EMISSIONS_PER_KM['carpool_2']
            elif passengers == 3:
                actual_emissions = distance_km * self.EMISSIONS_PER_KM['carpool_3']
            else:
                actual_emissions = distance_km * self.EMISSIONS_PER_KM['carpool_4']
        elif mode in self.EMISSIONS_PER_KM:
            actual_emissions = distance_km * self.EMISSIONS_PER_KM[mode]
        else:
            actual_emissions = baseline_emissions
        
        carbon_saved = baseline_emissions - actual_emissions
        
        return {
            'carbon_saved_kg': round(carbon_saved, 2),
            'baseline_emissions': round(baseline_emissions, 2),
            'actual_emissions': round(actual_emissions, 2),
            'trees_equivalent': round(carbon_saved / self.TREE_ABSORPTION_RATE * 365, 2),
            'percentage_saved': round((carbon_saved / baseline_emissions * 100), 1) if baseline_emissions > 0 else 0
        }
    
    def calculate_money_saved(self, mode: str, distance_km: float, 
                            passengers: int = 1) -> float:
        """Calculate money saved compared to solo driving"""
        baseline_cost = distance_km * self.COST_PER_KM['solo_car']
        
        if mode == 'carpool':
            actual_cost = distance_km * self.COST_PER_KM['carpool']
        elif mode in self.COST_PER_KM:
            actual_cost = distance_km * self.COST_PER_KM[mode]
        else:
            actual_cost = baseline_cost
        
        return round(baseline_cost - actual_cost, 2)
    
    def calculate_eco_credits(self, mode: str, distance_km: float, 
                            passengers: int = 1) -> int:
        """Calculate eco credits earned for a trip"""
        base_credits = {
            'carpool_driver': 15,
            'carpool_passenger': 10,
            'transit': 5,
            'bike': 3,
            'walk': 3
        }
        
        # Base credits
        if mode == 'carpool':
            credits = base_credits['carpool_driver'] if passengers > 1 else base_credits['carpool_passenger']
        elif mode in base_credits:
            credits = base_credits[mode]
        else:
            credits = 0
        
        # Distance bonus (1 credit per km)
        distance_bonus = math.floor(distance_km)
        
        return credits + distance_bonus
    
    def check_achievements(self, user_impact: Dict) -> list:
        """Check which achievements user has earned"""
        achievements = []
        
        # Trip milestones
        if user_impact['total_trips'] >= 1:
            achievements.append('first_trip')
        if user_impact['total_trips'] >= 10:
            achievements.append('eco_starter')
        if user_impact['total_trips'] >= 50:
            achievements.append('eco_enthusiast')
        if user_impact['total_trips'] >= 100:
            achievements.append('century_club')
        
        # Carbon savings milestones
        if user_impact['total_carbon_saved'] >= 50:
            achievements.append('50kg_saver')
        if user_impact['total_carbon_saved'] >= 100:
            achievements.append('100kg_saver')
        if user_impact['total_carbon_saved'] >= 500:
            achievements.append('500kg_saver')
        if user_impact['total_carbon_saved'] >= 1000:
            achievements.append('eco_warrior')
        
        # Streak achievements
        if user_impact['current_streak'] >= 7:
            achievements.append('week_warrior')
        if user_impact['current_streak'] >= 30:
            achievements.append('perfect_month')
        
        # Mode diversity
        modes_used = sum(1 for count in user_impact.get('trips_by_mode', {}).values() if count > 0)
        if modes_used >= 4:
            achievements.append('mode_master')
        
        return achievements