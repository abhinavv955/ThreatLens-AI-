from typing import List, Dict, Any

class RecommendationService:
    @staticmethod
    def get_recommendations_for_user(user) -> List[Dict[str, Any]]:
        return [
            {
                "id": "rec_1",
                "tag": "BREAKFAST · 08:30",
                "title": "High-protein start",
                "description": "18g short of today's protein goal. Greek yogurt, berries & almond butter close the gap.",
                "imageUrl": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80",
            },
            {
                "id": "rec_2",
                "tag": "LUNCH · 13:00",
                "title": "Green power bowl",
                "description": f"A fiber-forward lunch matched to your {user.dietary_preferences.split('·')[0].strip()} preference and 520 kcal budget.",
                "imageUrl": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80",
            },
            {
                "id": "rec_3",
                "tag": "SMART SNACK · 16:30",
                "title": "Crunch without the crash",
                "description": "Roasted chickpeas and lime keep energy steady before your evening workout.",
                "icon": "⚡",
                "iconBg": "yellow",
                "isHighlight": True,
            },
            {
                "id": "rec_4",
                "tag": "MOVEMENT · 18:00",
                "title": "20 min zone 2",
                "description": "A low-impact walk today supports your consistency streak without overtraining.",
                "icon": "💗",
                "iconBg": "pink",
            },
        ]

recommendation_service = RecommendationService()
