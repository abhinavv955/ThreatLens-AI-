import { RecommendationItem } from '../types';

export const INITIAL_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: 'rec_1',
    tag: 'BREAKFAST · 08:30',
    title: 'High-protein start',
    description: "18g short of today's protein goal. Greek yogurt, berries & almond butter close the gap.",
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_2',
    tag: 'LUNCH · 13:00',
    title: 'Green power bowl',
    description: 'A fiber-forward lunch matched to your vegetarian preference and 520 kcal budget.',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_3',
    tag: 'SMART SNACK · 16:30',
    title: 'Crunch without the crash',
    description: 'Roasted chickpeas and lime keep energy steady before your evening run.',
    icon: '⚡',
    iconBg: 'yellow',
    isHighlight: true,
  },
  {
    id: 'rec_4',
    tag: 'MOVEMENT · 18:00',
    title: '20 min zone 2',
    description: 'A low-impact walk today supports your consistency streak without overtraining.',
    icon: '💗',
    iconBg: 'pink',
  },
];

export const recommendationService = {
  async getRecommendations(): Promise<RecommendationItem[]> {
    return INITIAL_RECOMMENDATIONS;
  },
};
