import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database.session import Base, engine, SessionLocal
from .models import User, Meal, FoodItem, WeightHistory, ChatMessage
from .auth.security import get_password_hash
from .api.api_router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nutritrack.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db_data():
    """Create tables and seed initial demo data if database is fresh."""
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        
        # Check if default demo user exists
        existing_user = db.query(User).filter(User.email == "maya@example.com").first()
        if not existing_user:
            logger.info("Seeding default demo user (Maya)...")
            demo_user = User(
                email="maya@example.com",
                password_hash=get_password_hash("password123"),
                name="Maya",
                age=28,
                height_cm=170.0,
                weight_kg=66.9,
                health_goal="Feel stronger",
                dietary_preferences="Vegetarian · no peanuts",
                allergies="Peanuts",
                calorie_target=2100,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Seed initial meals
            initial_meals = [
                Meal(
                    user_id=demo_user.id,
                    meal_type="Breakfast",
                    title="Berry chia bowl",
                    total_calories=328,
                    total_protein_g=12.0,
                    total_carbs_g=48.0,
                    total_fat_g=11.0,
                ),
                Meal(
                    user_id=demo_user.id,
                    meal_type="Lunch",
                    title="Paneer power bowl",
                    total_calories=520,
                    total_protein_g=32.0,
                    total_carbs_g=46.0,
                    total_fat_g=22.0,
                ),
                Meal(
                    user_id=demo_user.id,
                    meal_type="Snack",
                    title="Almond & apple",
                    total_calories=180,
                    total_protein_g=4.0,
                    total_carbs_g=24.0,
                    total_fat_g=8.0,
                ),
            ]
            db.add_all(initial_meals)
            db.commit()
            logger.info("Database initialized and demo data seeded successfully.")
        
        db.close()
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")

@app.on_event("startup")
def on_startup():
    init_db_data()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }

# Include all API routes
app.include_router(api_router, prefix=settings.API_PREFIX)
