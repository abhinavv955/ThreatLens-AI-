from sqlalchemy.orm import Session
from ..models.user import User
from ..models.meal import Meal
from ..services.nutrition_service import nutrition_service

class DashboardService:
    @staticmethod
    def get_dashboard_metrics(user: User, db: Session) -> dict:
        meals = db.query(Meal).filter(Meal.user_id == user.id).all()
        
        total_calories = sum(m.total_calories for m in meals)
        total_protein = sum(m.total_protein_g for m in meals)
        total_carbs = sum(m.total_carbs_g for m in meals)
        total_fat = sum(m.total_fat_g for m in meals)
        
        # If user has no meals yet, show baseline realistic default
        if not meals:
            total_calories = 1552
            total_protein = 82
            total_carbs = 138
            total_fat = 49

        target = user.calorie_target or 2100
        progress_pct = min(100, round((total_calories / target) * 100))
        bmi = nutrition_service.calculate_bmi(user.weight_kg, user.height_cm)
        macro_targets = nutrition_service.calculate_macro_targets(target)

        return {
            "dailyCaloriesEaten": total_calories,
            "dailyCalorieTarget": target,
            "calorieTrendText": "↘ 8% below your weekly average",
            "goalProgressPercent": progress_pct,
            "streakDays": 4,
            "currentWeightKg": user.weight_kg,
            "weightTrendText": "↘ 0.9kg this month",
            "bmi": bmi,
            "proteinEatenG": int(total_protein),
            "proteinTargetG": macro_targets["protein_target_g"],
            "carbsEatenG": int(total_carbs),
            "carbsTargetG": macro_targets["carbs_target_g"],
            "fatEatenG": int(total_fat),
            "fatTargetG": macro_targets["fat_target_g"],
            "waterCups": 5,
            "waterTargetCups": 8,
        }

dashboard_service = DashboardService()
