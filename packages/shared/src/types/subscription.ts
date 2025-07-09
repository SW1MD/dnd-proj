export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  max_characters?: number; // null = unlimited
  max_simultaneous_games?: number; // null = unlimited
  max_players_per_game?: number; // null = unlimited
  ai_dm_access: boolean;
  ai_map_generation: boolean;
  premium_character_options: boolean;
  voice_chat: boolean;
  custom_campaigns: boolean;
  priority_support: boolean;
  storage_gb: number;
  features?: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  ended_at?: string;
  amount: number;
  currency: string;
  billing_period: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Joined data
  plan?: SubscriptionPlan;
}

export interface SubscriptionUsage {
  id: string;
  user_id: string;
  subscription_id: string;
  metric: string; // 'characters_created', 'games_played', 'ai_requests', etc.
  count: number;
  date: string; // ISO date string
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'refunded';
  payment_method?: string; // 'card', 'paypal', etc.
  failure_reason?: string;
  metadata?: Record<string, any>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method_id?: string;
  trial_days?: number;
}

export interface CreateSubscriptionResponse {
  subscription: UserSubscription;
  client_secret?: string; // For Stripe confirmation
  requires_action: boolean;
}

export interface UpdateSubscriptionRequest {
  plan_id?: string;
  cancel_at_period_end?: boolean;
}

export interface SubscriptionLimits {
  characters: {
    current: number;
    limit?: number; // undefined = unlimited
  };
  simultaneous_games: {
    current: number;
    limit?: number;
  };
  players_per_game: {
    current: number;
    limit?: number;
  };
  storage: {
    used_gb: number;
    limit_gb: number;
  };
  features: {
    ai_dm_access: boolean;
    ai_map_generation: boolean;
    premium_character_options: boolean;
    voice_chat: boolean;
    custom_campaigns: boolean;
    priority_support: boolean;
  };
}

export interface SubscriptionUsageMetrics {
  period_start: string;
  period_end: string;
  metrics: {
    [key: string]: {
      count: number;
      limit?: number;
      percentage?: number;
    };
  };
}

// Webhook types for Stripe
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface SubscriptionWebhookData {
  subscription_id: string;
  customer_id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  canceled_at?: number;
  ended_at?: number;
  trial_start?: number;
  trial_end?: number;
  amount?: number;
  currency?: string;
}

// Free tier constants
export const FREE_TIER_LIMITS = {
  max_characters: 3,
  max_simultaneous_games: 1,
  max_players_per_game: 4,
  storage_gb: 1,
  ai_dm_access: false,
  ai_map_generation: false,
  premium_character_options: false,
  voice_chat: false,
  custom_campaigns: false,
  priority_support: false,
} as const;

// Subscription feature flags
export enum SubscriptionFeature {
  AI_DM_ACCESS = 'ai_dm_access',
  AI_MAP_GENERATION = 'ai_map_generation',
  PREMIUM_CHARACTER_OPTIONS = 'premium_character_options',
  VOICE_CHAT = 'voice_chat',
  CUSTOM_CAMPAIGNS = 'custom_campaigns',
  PRIORITY_SUPPORT = 'priority_support',
  UNLIMITED_CHARACTERS = 'unlimited_characters',
  UNLIMITED_GAMES = 'unlimited_games',
  UNLIMITED_PLAYERS = 'unlimited_players',
}

// Usage metrics
export enum UsageMetric {
  CHARACTERS_CREATED = 'characters_created',
  GAMES_PLAYED = 'games_played',
  GAMES_HOSTED = 'games_hosted',
  AI_REQUESTS = 'ai_requests',
  MAP_GENERATIONS = 'map_generations',
  STORAGE_USED = 'storage_used',
  VOICE_MINUTES = 'voice_minutes',
} 