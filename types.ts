
export enum Platform {
  LINKEDIN = 'LinkedIn',
  TWITTER = 'Twitter',
  INSTAGRAM = 'Instagram'
}

export enum Tone {
  PROFESSIONAL = 'Professional',
  WITTY = 'Witty',
  URGENT = 'Urgent',
  INSPIRATIONAL = 'Inspirational',
  CASUAL = 'Casual'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export enum AspectRatio {
  RATIO_1_1 = '1:1',
  RATIO_3_4 = '3:4',
  RATIO_4_3 = '4:3',
  RATIO_9_16 = '9:16',
  RATIO_16_9 = '16:9',
  RATIO_2_3 = '2:3',
  RATIO_3_2 = '3:2',
  RATIO_21_9 = '21:9'
}

export interface ImageVariant {
  url: string | null;
  isLoading: boolean;
  error?: boolean;
}

export interface GeneratedPost {
  platform: Platform;
  content: string;
  images: ImageVariant[];
  selectedImageIndex: number;
  error?: string;
}

export interface ScheduledPost extends GeneratedPost {
  id: string;
  scheduledDate: string; // ISO string
}

export interface SavedPost extends GeneratedPost {
  id: string;
  savedDate: string; // ISO string
}

export interface GenerateRequest {
  idea: string;
  tone: Tone;
  audience: string;
  imageSize: ImageSize;
  // Optional manual overrides
  aspectRatios: {
    [key in Platform]: AspectRatio;
  };
}

export interface SocialContentResponse {
  linkedin: string;
  twitter: string;
  instagram: string;
}

export interface AnalyticsMetrics {
  impressions: number;
  reach: number;
  engagementRate: number;
  clicks: number;
  history: number[]; // Mock data for sparkline
}
