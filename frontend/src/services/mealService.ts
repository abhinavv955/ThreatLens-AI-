import { ApiClient } from './apiClient';
import { LoggedMeal } from '../types';

export const INITIAL_MEALS: LoggedMeal[] = [
  { id: '1', tag: 'Breakfast', name: 'Berry chia bowl', kcal: 328 },
  { id: '2', tag: 'Lunch', name: 'Paneer power bowl', kcal: 520 },
  { id: '3', tag: 'Snack', name: 'Almond & apple', kcal: 180 },
];

export const mealService = {
  async getTodayMeals(): Promise<LoggedMeal[]> {
    try {
      return await ApiClient.request<LoggedMeal[]>('/meals');
    } catch {
      const stored = localStorage.getItem('nutritrack_meals');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
      return INITIAL_MEALS;
    }
  },

  async logMeal(meal: Omit<LoggedMeal, 'id'>): Promise<LoggedMeal> {
    const newMeal: LoggedMeal = {
      ...meal,
      id: 'meal_' + Date.now(),
      loggedAt: new Date().toISOString(),
    };

    try {
      return await ApiClient.request<LoggedMeal>('/meals', {
        method: 'POST',
        body: JSON.stringify(newMeal),
      });
    } catch {
      const current = await this.getTodayMeals();
      const updated = [...current, newMeal];
      localStorage.setItem('nutritrack_meals', JSON.stringify(updated));
      return newMeal;
    }
  },

  async deleteMeal(id: string): Promise<void> {
    try {
      await ApiClient.request<void>(`/meals/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const current = await this.getTodayMeals();
      const updated = current.filter((m) => m.id !== id);
      localStorage.setItem('nutritrack_meals', JSON.stringify(updated));
    }
  },
};
