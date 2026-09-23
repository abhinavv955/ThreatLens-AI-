import os
import requests
from typing import Dict, Any, List
from ..config import settings

class AIAssistantService:
    @staticmethod
    def get_coach_response(user_message: str, context: Dict[str, Any]) -> str:
        """
        Generate contextual AI nutrition advice.
        Uses Gemini API if key is available; otherwise applies intelligent contextual rules.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        user_name = context.get("user_name", "Maya")
        goal = context.get("goal", "Feel stronger")
        preferences = context.get("preferences", "Vegetarian")
        calories_eaten = context.get("calories_eaten", 1552)
        calorie_target = context.get("calorie_target", 2100)
        remaining = max(0, calorie_target - calories_eaten)

        if api_key:
            try:
                system_instruction = f"""
                You are NutriTrack AI, a calm, supportive, science-backed nutrition coach.
                User Context:
                - Name: {user_name}
                - Health Goal: {goal}
                - Dietary Preferences: {preferences}
                - Calories eaten today: {calories_eaten} kcal / {calorie_target} kcal target ({remaining} kcal remaining).
                Tone: Encouraging, concise, practical (2-3 sentences max).
                """
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{system_instruction}\n\nUser: {user_message}\nNutriTrack AI:"}
                        ]
                    }]
                }
                res = requests.post(url, json=payload, timeout=8)
                if res.status_code == 200:
                    candidates = res.json().get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return text.strip()
            except Exception:
                pass

        # Intelligent contextual fallback
        lower_msg = user_message.strip().lower()
        if "dinner" in lower_msg:
            return f"Based on today's log ({calories_eaten} of {calorie_target} kcal), you have about {remaining} kcal left. A grilled paneer or tofu stir-fry with broccoli and quinoa would balance your macros beautifully."
        elif "calorie" in lower_msg or "goal" in lower_msg:
            pct = round((calories_eaten / calorie_target) * 100)
            return f"You're at {calories_eaten:,} of your {calorie_target:,} kcal target ({pct}% complete) — right on track for your consistency streak!"
        elif "protein" in lower_msg or "vegetarian" in lower_msg:
            return "Try a chickpea & roasted quinoa power bowl with tahini and hemp seeds — providing ~28g of high-quality plant protein and rich micronutrients."
        elif "snack" in lower_msg:
            return "A handful of roasted almonds with an apple or roasted edamame will give you steady energy without a blood sugar spike."
        
        return f"Great question, {user_name}! Keeping your goal to '{goal}' in mind, prioritize whole foods with lean protein and fiber to maintain steady energy."

ai_assistant_service = AIAssistantService()
