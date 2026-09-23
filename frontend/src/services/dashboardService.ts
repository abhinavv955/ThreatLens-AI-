import { ApiClient } from './apiClient';
import { DashboardMetrics } from '../types';

export const DEFAULT_METRICS: DashboardMetrics = {
  dailyCaloriesEaten: 1552,
  dailyCalorieTarget: 2100,
  calorieTrendText: '↘ 8% below your weekly average',
  goalProgressPercent: 74,
  streakDays: 4,
  currentWeightKg: 66.9,
  weightTrendText: '↘ 0.9kg this month',
  bmi: 22.4,
  proteinEatenG: 82,
  proteinTargetG: 110,
  carbsEatenG: 138,
  carbsTargetG: 220,
  fatEatenG: 49,
  fatTargetG: 70,
  waterCups: 5,
  waterTargetCups: 8,
};

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      return await ApiClient.request<DashboardMetrics>('/dashboard');
    } catch {
      return DEFAULT_METRICS;
    }
  },
};
