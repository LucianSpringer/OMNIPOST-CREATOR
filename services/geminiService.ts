import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AspectRatio, ImageSize, Platform, Tone } from "../types";

/**
 * INTERFACE: RESILIENCE POLICY
 * Defines how the service handles failures.
 */
interface ResiliencePolicy {
  maxRetries: number;
  backoffFactor: number;
  timeoutMs: number;
}

/**
 * CLASS: GEMINI CONTENT ORCHESTRATOR
 * * Centralized facade for all AI interactions.
 * Implements Singleton pattern to ensure single API client instance.
 */
export class GeminiContentOrchestrator {
  private static instance: GeminiContentOrchestrator;
  private client: GoogleGenAI | null = null;
  private readonly TEXT_MODEL = "gemini-3-pro-preview";
  private readonly IMAGE_MODEL = "gemini-3-pro-image-preview";
  
  private readonly resilienceConfig: ResiliencePolicy = {
    maxRetries: 2,
    backoffFactor: 1.5,
    timeoutMs: 15000
  };

  private constructor() {}

  public static getInstance(): GeminiContentOrchestrator {
    if (!GeminiContentOrchestrator.instance) {
      GeminiContentOrchestrator.instance = new GeminiContentOrchestrator();
    }
    return GeminiContentOrchestrator.instance;
  }

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("CRITICAL: API Key definition missing in environment context.");
    }
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  /**
   * Wraps execution in a retry loop for enterprise-grade resilience.
   */
  private async executeWithResilience<T>(
    operation: () => Promise<T>, 
    context: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.resilienceConfig.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`[${context}] Attempt ${attempt} failed.`, error);
        
        if (attempt <= this.resilienceConfig.maxRetries) {
          const delay = Math.pow(this.resilienceConfig.backoffFactor, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`[${context}] FAILED after ${this.resilienceConfig.maxRetries} retries.`);
    throw lastError;
  }

  /**
   * Generates multi-platform textual content with enforced JSON schema output.
   */
  public async generateCampaignText(
    idea: string, 
    tone: Tone, 
    audience: string
  ): Promise<{ linkedin: string; twitter: string; instagram: string }> {
    const ai = this.getClient();

    const socialSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        linkedin: { type: Type.STRING, description: "Professional LinkedIn post." },
        twitter: { type: Type.STRING, description: "Viral Tweet < 280 chars." },
        instagram: { type: Type.STRING, description: "Instagram caption with hashtags." },
      },
      required: ["linkedin", "twitter", "instagram"],
    };

    const prompt = `
      CONTEXT: Social Media Management
      OBJECTIVE: Generate high-engagement posts.
      TOPIC: ${idea}
      TONE: ${tone}
      AUDIENCE: ${audience || "General Market"}
      
      INSTRUCTIONS:
      1. Adapt vocabulary to the target audience.
      2. Use platform-specific formatting.
    `;

    return this.executeWithResilience(async () => {
      const response = await ai.models.generateContent({
        model: this.TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: socialSchema,
          systemInstruction: "You are a specialized marketing LLM agent.",
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Generative Model");
      return JSON.parse(text);
    }, "TextGeneration");
  }

  /**
   * Generates visual assets using specific platform aspect ratios.
   */
  public async generateVisualAsset(
    idea: string,
    platform: Platform,
    tone: Tone,
    aspectRatio: AspectRatio,
    size: ImageSize,
    audience: string,
    variantIndex: number
  ): Promise<string> {
    const ai = this.getClient();
    
    // Advanced Prompt Engineering
    const styleMap: Record<Platform, string> = {
      [Platform.LINKEDIN]: "corporate memphis, minimalist, professional, high-key lighting",
      [Platform.TWITTER]: "cyberpunk, vibrant, high contrast, digital illustration",
      [Platform.INSTAGRAM]: "lifestyle, bokeh, golden hour, photorealistic, 8k"
    };

    const basePrompt = `
      GENERATE: Social Media Image
      PLATFORM: ${platform}
      CONCEPT: ${idea}
      MOOD: ${tone}
      STYLE: ${styleMap[platform]}
      CONSTRAINT: No text overlay.
      VARIANT_ID: ${variantIndex}
    `;

    return this.executeWithResilience(async () => {
      const response = await ai.models.generateContent({
        model: this.IMAGE_MODEL,
        contents: { parts: [{ text: basePrompt }] },
        config: {
          imageConfig: { aspectRatio: aspectRatio, imageSize: size },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Model output contained no image data.");
    }, `ImageGen-${platform}-${variantIndex}`);
  }

  public async generateHashtags(content: string, platform: Platform, audience: string): Promise<string> {
    const ai = this.getClient();
    const prompt = `
      Suggest 5-8 highly relevant, trending, and niche hashtags for the following ${platform} post.
      Post Content: "${content}"
      Target Audience: "${audience}"
      
      Return only the hashtags separated by spaces.
    `;

    return this.executeWithResilience(async () => {
        const response = await ai.models.generateContent({
            model: this.TEXT_MODEL,
            contents: prompt
        });
        return response.text || "";
    }, "HashtagGen");
  }

  public async generateAnalyticsInsights(metrics: any): Promise<string> {
    const ai = this.getClient();
    const prompt = `
      Analyze the following social media performance metrics:
      ${JSON.stringify(metrics, null, 2)}
      
      Provide 3 brief, strategic, and actionable tips to improve content performance.
    `;

    return this.executeWithResilience(async () => {
      const response = await ai.models.generateContent({
        model: this.TEXT_MODEL,
        contents: prompt,
        config: {
            systemInstruction: "You are a data-driven social media strategist.",
        },
      });
      return response.text || "Unable to generate insights.";
    }, "AnalyticsInsights");
  }

  public calculateViralityScore(content: string): number {
    if (!content) return 0;
    
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const emojiMatch = content.match(emojiRegex);
    const emojiCount = emojiMatch ? emojiMatch.length : 0;
    
    const hashtagMatch = content.match(/#/g);
    const hashtagCount = hashtagMatch ? hashtagMatch.length : 0;
    
    const lengthScore = content.length > 0 ? Math.log(content.length) : 0;
    const rawScore = (emojiCount * 1.5) + (hashtagCount * 0.8) + lengthScore;
    
    return Math.min(Math.round(rawScore * 5), 100);
  }
}

// Export singleton accessor for simpler consumption
export const geminiService = GeminiContentOrchestrator.getInstance();
