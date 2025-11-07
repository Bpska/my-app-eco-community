from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserPreferences(BaseModel):
    music: str = "any"
    conversation_level: str = "moderate"  # quiet, moderate, chatty
    temperature: str = "comfortable"
    smoking_allowed: bool = False
    pets_allowed: bool = False

class DriverInfo(BaseModel):
    vehicle_type: str = ""  # sedan, suv, hatchback, etc.
    capacity: int = 4
    license_plate: str = ""
    is_verified: bool = False

class EmergencyContact(BaseModel):
    name: str
    phone: str
    relationship: str

class UserProfile(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    email: EmailStr
    password_hash: str
    full_name: str
    phone: str = ""
    university: str = ""
    student_id: str = ""
    department: str = ""
    is_driver: bool = False
    driver_info: Optional[DriverInfo] = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    emergency_contacts: List[EmergencyContact] = []
    safety_rating: float = 5.0
    total_ratings: int = 0
    verified_badges: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    university: str
    phone: str = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TripLocation(BaseModel):
    latitude: float
    longitude: float
    address: str

class TripRequest(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    origin: TripLocation
    destination: TripLocation
    departure_time: datetime
    flexibility_minutes: int = 15  # ±15 minutes
    mode: str = "carpool"  # carpool, transit, bike, walk, hybrid
    seats_needed: int = 1
    is_recurring: bool = False
    recurring_days: List[str] = []  # ["monday", "wednesday"]
    status: str = "searching"  # searching, matched, active, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class RideOffer(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    driver_id: str
    origin: TripLocation
    destination: TripLocation
    departure_time: datetime
    available_seats: int
    route_waypoints: List[TripLocation] = []
    passengers: List[str] = []  # list of user_ids
    price_per_seat: float = 0.0
    status: str = "available"  # available, full, active, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class CarbonImpact(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    total_carbon_saved: float = 0.0  # kg CO2
    money_saved: float = 0.0
    sustainable_miles: float = 0.0
    total_trips: int = 0
    trips_by_mode: dict = {"carpool": 0, "transit": 0, "bike": 0, "walk": 0}
    current_streak: int = 0
    longest_streak: int = 0
    last_trip_date: Optional[datetime] = None
    eco_credits: int = 0
    badges: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str  # carpool, transit, bike, walk, community, streak
    requirement: dict  # {"type": "trip_count", "value": 100}
    credits_reward: int

class Challenge(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    description: str
    type: str  # individual, team, seasonal
    start_date: datetime
    end_date: datetime
    requirement: dict
    credits_reward: int
    participants: List[str] = []
    leaderboard: List[dict] = []
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}