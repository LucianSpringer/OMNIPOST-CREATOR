
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AspectRatio, ImageSize, Platform, Tone } from "../types";

// Initialize helper to get client with fresh key
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey });
};

const TEXT_MODEL = "gemini-3-pro-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview";

// Schema for structured text output
const socialSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    linkedin: {
      type: Type.STRING,
      description: "A professional, long-form post suitable for LinkedIn.",
    },
    twitter: {
      type: Type.STRING,
      description: "A short, punchy tweet under 280 characters with relevant hashtags.",
    },
    instagram: {
      type: Type.STRING,
      description: "A visual-focused caption with emojis and a block of relevant hashtags.",
    },
  },
  required: ["linkedin", "twitter", "instagram"],
};

export const generateSocialText = async (idea: string, tone: Tone, audience: string) => {
  const ai = getAiClient();
  
  const prompt = `
    You are an expert social media manager.
    Topic: ${idea}
    Tone: ${tone}
    Target Audience: ${audience || "General Audience"}
    
    Generate three distinct posts optimized for LinkedIn, Twitter (X), and Instagram.
    Ensure the tone and language resonate specifically with the target audience.
    Respect the format and best practices of each platform.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: socialSchema,
        systemInstruction: "You are a world-class social media copywriter who adapts voice perfectly to specific audiences.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from model");
    
    return JSON.parse(text) as { linkedin: string; twitter: string; instagram: string };
  } catch (error) {
    console.error("Text generation failed:", error);
    throw error;
  }
};

export const generateSocialImageVariant = async (
  idea: string,
  platform: Platform,
  tone: Tone,
  aspectRatio: AspectRatio,
  size: ImageSize,
  audience: string,
  variantIndex: number
): Promise<string> => {
  const ai = getAiClient();
  
  // Tailor prompt slightly per platform style
  let styleModifier = "";
  switch (platform) {
    case Platform.LINKEDIN:
      styleModifier = "professional, corporate, clean, high-quality photography or minimal vector art";
      break;
    case Platform.TWITTER:
      styleModifier = "engaging, trending, vibrant, digital art or editorial style";
      break;
    case Platform.INSTAGRAM:
      styleModifier = "aesthetic, lifestyle, highly visual, filter-like colors, photorealistic";
      break;
  }

  const basePrompt = `
    Create a stunning, high-quality image for a ${platform} post.
    Topic: ${idea}
    Mood/Tone: ${tone}
    Target Audience: ${audience}
    Visual Style: ${styleModifier}
    Ensure the image is text-free or has very minimal text. Focus on visual storytelling that appeals to the target audience.
    Variation ${variantIndex + 1}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: basePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: size,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error(`Image generation failed for ${platform} variant ${variantIndex}:`, error);
    throw error;
  }
};

export const generateHashtags = async (content: string, platform: Platform, audience: string) => {
    const ai = getAiClient();
    const prompt = `
      Suggest 5-8 highly relevant, trending, and niche hashtags for the following ${platform} post.
      Post Content: "${content}"
      Target Audience: "${audience}"
      
      Return only the hashtags separated by spaces.
    `;

    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt
        });
        return response.text || "";
    } catch (error) {
        console.error("Hashtag generation failed:", error);
        return "";
    }
};

export const generateAnalyticsInsights = async (metrics: any) => {
  const ai = getAiClient();
  
  const prompt = `
    Analyze the following social media performance metrics:
    ${JSON.stringify(metrics, null, 2)}
    
    Provide 3 brief, strategic, and actionable tips to improve content performance based on this data.
    Focus on increasing engagement and reach.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a data-driven social media strategist.",
      },
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Analytics insight generation failed:", error);
    throw error;
  }
};
