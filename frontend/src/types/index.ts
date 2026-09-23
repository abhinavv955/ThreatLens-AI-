export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  age: number;
  heightCm: number;
  weightKg: number;
  healthGoal: string;
  dietaryPreferences: string;
  allergies: string;
  calorieTarget: number;
}

export interface MacroBreakdown {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodScanResult {
  id: string;
  title: string;
  description: string;
  score: number;
  kcal: number;
  protein: string;
  carbs: string;
  fat: string;
  tags: string[];
  imageUrl: string;
}

export interface LoggedMeal {
  id: string;
  tag: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  kcal: number;
  loggedAt?: string;
}

export interface RecommendationItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl?: string;
  icon?: string;
  iconBg?: 'yellow' | 'pink' | 'default';
  isHighlight?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

export interface DashboardMetrics {
  dailyCaloriesEaten: number;
  dailyCalorieTarget: number;
  calorieTrendText: string;
  goalProgressPercent: number;
  streakDays: number;
  currentWeightKg: number;
  weightTrendText: string;
  bmi: number;
  proteinEatenG: number;
  proteinTargetG: number;
  carbsEatenG: number;
  carbsTargetG: number;
  fatEatenG: number;
  fatTargetG: number;
  waterCups: number;
  waterTargetCups: number;
}
