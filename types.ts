/**
 * DOMAIN MODEL: OMNIPOST CREATOR
 * * This file defines the strict type boundaries for the application core.
 * Utilizes Branded Types for ID safety and Discriminated Unions for state handling.
 */

// -- BRANDED TYPES (High Signal: Prevents primitive obsession) --
export type CampaignId = string & { readonly __brand: unique symbol };
export type UserId = string & { readonly __brand: unique symbol };
export type ImageUrl = string & { readonly __brand: unique symbol };

export const createCampaignId = (id: string) => id as CampaignId;
export const createImageUrl = (url: string) => url as ImageUrl;

// -- CORE ENUMS --
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
  CASUAL = 'Casual',
  AUTHORITATIVE = 'Authoritative',
  EMPATHETIC = 'Empathetic'
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

// -- DISCRIMINATED UNIONS FOR IMAGE STATE (High Signal: Exhaustive handling) --
export type ImageVariantState = 
  | { status: 'IDLE' }
  | { status: 'LOADING'; startTime: number }
  | { status: 'SUCCESS'; url: ImageUrl; metadata: { width?: number; height?: number } }
  | { status: 'ERROR'; error: Error; retryCount: number };

export interface ImageVariant {
  id: string;
  state: ImageVariantState;
}

// -- COMPOSITE ENTITIES --
export interface GeneratedPost {
  readonly id: string;
  readonly platform: Platform;
  readonly content: string;
  readonly images: ImageVariant[];
  readonly selectedImageIndex: number;
  readonly metadata: {
    generatedAt: string; // ISO Date
    modelVersion: string;
    tokenUsage?: number;
  };
}

export interface ScheduledPost extends GeneratedPost {
  readonly scheduleId: string;
  scheduledDate: string; // ISO string
}

export interface SavedPost extends GeneratedPost {
  readonly saveId: string;
  savedDate: string; // ISO string
}

// -- SERVICE REQUEST OBJECTS --
export interface GenerateRequest {
  idea: string;
  tone: Tone;
  audience: string;
  imageSize: ImageSize;
  aspectRatios: Record<Platform, AspectRatio>;
  enableSearchGrounding?: boolean; // Feature flag for future
}

export interface AnalyticsMetrics {
  impressions: number;
  reach: number;
  engagementRate: number;
  clicks: number;
  history: number[]; 
  // Add derived metrics for density
  ctr?: number;
  cpm?: number;
}
