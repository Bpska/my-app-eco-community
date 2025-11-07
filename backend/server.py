from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

# Import our models and utilities
from models import (
    UserProfile, UserRegister, UserLogin, TokenResponse,
    TripRequest, RideOffer, CarbonImpact, Challenge
)
from auth import hash_password, verify_password, create_access_token, decode_access_token
from ride_matching import RideMatchingEngine
from carbon_calculator import CarbonCalculator


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Initialize engines
ride_matcher = RideMatchingEngine()
carbon_calc = CarbonCalculator()

# Helper function to get current user from token
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(' ')[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"email": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user['_id'] = str(user['_id'])
    return user

# ============= AUTH ROUTES =============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user profile
    hashed_password = hash_password(user_data.password)
    user_profile = UserProfile(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        university=user_data.university,
        phone=user_data.phone
    )
    
    # Insert user
    result = await db.users.insert_one(user_profile.dict(by_alias=True, exclude={'id'}))
    user_id = str(result.inserted_id)
    
    # Create carbon impact record
    carbon_impact = CarbonImpact(user_id=user_id)
    await db.carbon_impacts.insert_one(carbon_impact.dict(by_alias=True, exclude={'id'}))
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "university": user_data.university
        }
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": credentials.email})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(user['_id']),
            "email": user['email'],
            "full_name": user['full_name'],
            "university": user.get('university', ''),
            "is_driver": user.get('is_driver', False)
        }
    )

@api_router.get("/auth/me")
async def get_current_user_info(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    user.pop('password_hash', None)
    return user

# ============= PROFILE ROUTES =============
@api_router.put("/profile")
async def update_profile(profile_data: dict, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    # Update allowed fields
    allowed_fields = ['full_name', 'phone', 'department', 'student_id', 
                     'is_driver', 'driver_info', 'preferences', 'emergency_contacts']
    
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"_id": user['_id']},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}

# ============= TRIP & RIDE MATCHING ROUTES =============
@api_router.post("/trips/request")
async def create_trip_request(trip_data: TripRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    trip_data.user_id = user['_id']
    result = await db.trip_requests.insert_one(trip_data.dict(by_alias=True, exclude={'id'}))
    
    # Find matching rides
    available_rides = await db.ride_offers.find({"status": "available"}).to_list(100)
    matches = ride_matcher.find_matches(trip_data.dict(), available_rides)
    
    return {
        "trip_id": str(result.inserted_id),
        "matches": matches,
        "message": f"Found {len(matches)} matching rides"
    }

@api_router.post("/rides/offer")
async def create_ride_offer(ride_data: RideOffer, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    if not user.get('is_driver'):
        raise HTTPException(status_code=400, detail="User must be registered as driver")
    
    ride_data.driver_id = user['_id']
    result = await db.ride_offers.insert_one(ride_data.dict(by_alias=True, exclude={'id'}))
    
    return {
        "ride_id": str(result.inserted_id),
        "message": "Ride offer created successfully"
    }

@api_router.get("/rides/available")
async def get_available_rides(authorization: Optional[str] = Header(None)):
    await get_current_user(authorization)
    
    rides = await db.ride_offers.find({"status": "available"}).to_list(100)
    
    # Convert ObjectId to string
    for ride in rides:
        ride['_id'] = str(ride['_id'])
    
    return rides

# ============= CARBON IMPACT ROUTES =============
@api_router.get("/impact")
async def get_user_impact(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    impact = await db.carbon_impacts.find_one({"user_id": user['_id']})
    if not impact:
        # Create default impact record
        impact = CarbonImpact(user_id=user['_id'])
        await db.carbon_impacts.insert_one(impact.dict(by_alias=True, exclude={'id'}))
    else:
        impact['_id'] = str(impact['_id'])
    
    return impact

@api_router.post("/impact/record-trip")
async def record_trip_impact(trip_data: dict, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    mode = trip_data.get('mode', 'carpool')
    distance_km = trip_data.get('distance_km', 10)
    passengers = trip_data.get('passengers', 2)
    
    # Calculate impact
    carbon_data = carbon_calc.calculate_carbon_saved(mode, distance_km, passengers)
    money_saved = carbon_calc.calculate_money_saved(mode, distance_km, passengers)
    credits = carbon_calc.calculate_eco_credits(mode, distance_km, passengers)
    
    # Update user's carbon impact
    await db.carbon_impacts.update_one(
        {"user_id": user['_id']},
        {
            "$inc": {
                "total_carbon_saved": carbon_data['carbon_saved_kg'],
                "money_saved": money_saved,
                "sustainable_miles": distance_km * 0.621371,  # km to miles
                "total_trips": 1,
                f"trips_by_mode.{mode}": 1,
                "eco_credits": credits,
                "current_streak": 1
            },
            "$set": {
                "last_trip_date": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "carbon_saved": carbon_data,
        "money_saved": money_saved,
        "credits_earned": credits,
        "message": "Trip impact recorded successfully"
    }

# ============= HEALTH CHECK =============
@api_router.get("/")
async def root():
    return {
        "message": "EcoCommute AI API",
        "version": "1.0.0",
        "status": "running"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
