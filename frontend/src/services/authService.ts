import { ApiClient } from './apiClient';
import { UserProfile } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'usr_maya_1',
  name: 'Maya',
  email: 'maya@example.com',
  age: 28,
  heightCm: 170,
  weightKg: 66.9,
  healthGoal: 'Feel stronger',
  dietaryPreferences: 'Vegetarian · no peanuts',
  allergies: 'Peanuts',
  calorieTarget: 2100,
};

export const authService = {
  async getCurrentUser(): Promise<UserProfile> {
    try {
      return await ApiClient.request<UserProfile>('/users/me');
    } catch {
      const stored = localStorage.getItem('nutritrack_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
      return DEFAULT_USER;
    }
  },

  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const res = await ApiClient.request<{ access_token: string; user: UserProfile }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      ApiClient.setToken(res.access_token);
      localStorage.setItem('nutritrack_user', JSON.stringify(res.user));
      return res.user;
    } catch {
      // Fallback for standalone demo mode
      const user = { ...DEFAULT_USER, email, name: email.split('@')[0] };
      ApiClient.setToken('demo_token_' + Date.now());
      localStorage.setItem('nutritrack_user', JSON.stringify(user));
      return user;
    }
  },

  async register(email: string, password: string, name?: string): Promise<UserProfile> {
    try {
      const res = await ApiClient.request<{ access_token: string; user: UserProfile }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        }
      );
      ApiClient.setToken(res.access_token);
      localStorage.setItem('nutritrack_user', JSON.stringify(res.user));
      return res.user;
    } catch {
      // Fallback for standalone demo mode
      const user = { ...DEFAULT_USER, email, name: name || email.split('@')[0] };
      ApiClient.setToken('demo_token_' + Date.now());
      localStorage.setItem('nutritrack_user', JSON.stringify(user));
      return user;
    }
  },

  logout() {
    ApiClient.clearToken();
    localStorage.removeItem('nutritrack_user');
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const updated = await ApiClient.request<UserProfile>('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      localStorage.setItem('nutritrack_user', JSON.stringify(updated));
      return updated;
    } catch {
      const current = await this.getCurrentUser();
      const updated = { ...current, ...profile };
      localStorage.setItem('nutritrack_user', JSON.stringify(updated));
      return updated;
    }
  }
};
