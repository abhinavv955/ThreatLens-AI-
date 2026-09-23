from typing import Dict, Any

class NutritionService:
    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        if height_cm <= 0:
            return 22.0
        height_m = height_cm / 100.0
        return round(weight_kg / (height_m ** 2), 1)

    @staticmethod
    def calculate_macro_targets(calorie_target: int) -> Dict[str, int]:
        # Standard balanced split: 25% Protein, 50% Carbs, 25% Fat
        protein_g = round((calorie_target * 0.25) / 4)
        carbs_g = round((calorie_target * 0.50) / 4)
        fat_g = round((calorie_target * 0.25) / 9)
        return {
            "protein_target_g": protein_g,
            "carbs_target_g": carbs_g,
            "fat_target_g": fat_g
        }

nutrition_service = NutritionService()
