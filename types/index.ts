export interface Book {
  id: string;
  author: string;
  title: string;
  subTitle: string;
  imageLink: string;
  audioLink: string;
  audioLength?: number;
  summaryLength?: number;
  totalRating: number;
  averageRating: number;
  keyIdeas: Array<
    | string
    | {
        title: string;
        description: string;
      }
  >;
  type: 'audio' | 'text' | 'audio & text';
  status: 'selected' | 'recommended' | 'suggested';
  subscriptionRequired: boolean;
  summary: string;
  tags: string[];
  bookDescription: string;
  authorDescription: string;
  category?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface Subscription {
  id: string;
  type: 'basic' | 'premium' | 'premium-plus';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  billingInterval?: 'monthly' | 'yearly';
  paymentIntentId?: string;
  updatedAt?: string;
}

