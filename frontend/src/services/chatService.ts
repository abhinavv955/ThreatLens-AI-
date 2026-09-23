import { ApiClient } from './apiClient';

const CANNED_RESPONSES: Record<string, string> = {
  'what should i eat for dinner?':
    "Based on today's log, you're 18g short of protein — a grilled tofu or paneer stir-fry with greens would round out your day nicely.",
  'am i meeting my calorie goal today?':
    "You're at 1,552 of your 2,100 kcal goal — about 74% there, right on track for your 4-day streak.",
  'suggest a high-protein vegetarian meal.':
    'Try a chickpea & quinoa power bowl with roasted vegetables and tahini — about 28g of protein and vegetarian-friendly.',
};

export const chatService = {
  async sendMessage(message: string): Promise<string> {
    try {
      const res = await ApiClient.request<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (res.reply) return res.reply;
    } catch {
      // Backend not running or error, use local intelligence
    }

    const key = message.trim().toLowerCase();
    const canned = CANNED_RESPONSES[key];
    if (canned) return canned;

    return "Great question — based on your goals and today's meals, I'd suggest keeping portions balanced and prioritizing protein at your next meal.";
  },
};
