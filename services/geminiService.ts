import { GoogleGenAI, Type } from "@google/genai";
import { ADVANCED_MODEL, DEFAULT_MODEL } from "../constants";

// Initialize the client
// NOTE: In a real app, ensure process.env.API_KEY is available. 
// For this demo, we assume the environment is correctly configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AIResponse {
  text: string;
  tokens: number;
}

const estimateTokens = (text: string): number => {
  // Rough client-side estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
};

/**
 * Evaluates a prompt's quality and provides a score + feedback.
 */
export const evaluatePrompt = async (promptContent: string): Promise<{ score: number; feedback: string; tokens: number }> => {
  if (!process.env.API_KEY) {
      // Mock response if no key is present for demo UI functionality
      return { 
          score: 7, 
          feedback: "API Key missing. This is a mock evaluation. The prompt is clear but could be more specific regarding the desired output format.", 
          tokens: estimateTokens(promptContent) 
      };
  }

  const systemPrompt = `You are an expert AI Prompt Engineer. 
  Analyze the user's prompt. 
  Provide a score from 1-10 based on clarity, context, and constrainsts.
  Provide concise feedback on how to improve it.
  
  Return JSON format: { "score": number, "feedback": "string" }`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: promptContent,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return {
      score: json.score || 0,
      feedback: json.feedback || "No feedback generated.",
      tokens: (response.usageMetadata?.totalTokenCount || estimateTokens(promptContent))
    };
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw error;
  }
};

/**
 * Enhances a prompt to be more effective.
 */
export const enhancePrompt = async (promptContent: string): Promise<AIResponse> => {
  if (!process.env.API_KEY) return { text: "API Key Missing. Mock Enhancement: " + promptContent + " [Enhanced]", tokens: 10 };

  const systemPrompt = "You are a helpful assistant that rewrites prompts to be more effective, detailed, and robust using prompt engineering best practices. Maintain the original intent.";

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: promptContent,
      config: { systemInstruction: systemPrompt }
    });

    return {
      text: response.text || "",
      tokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error("Gemini Enhance Error:", error);
    throw error;
  }
};

/**
 * Generates a technical code plan based on a simple idea.
 */
export const generateCodePlan = async (idea: string): Promise<AIResponse> => {
  if (!process.env.API_KEY) return { text: "API Key Missing. Mock Plan for: " + idea, tokens: 20 };

  const systemPrompt = `You are a Senior Software Architect. 
  Create a detailed technical implementation plan for the user's app idea.
  Include: 
  1. High-level Architecture
  2. Tech Stack Recommendations
  3. Database Schema (rough draft)
  4. Key API Endpoints
  5. Step-by-step implementation strategy.
  
  Format with Markdown.`;

  try {
    // Use Pro model for reasoning tasks
    const response = await ai.models.generateContent({
      model: ADVANCED_MODEL, 
      contents: idea,
      config: { 
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 2048 } // Use thinking for better planning
      }
    });

    return {
      text: response.text || "",
      tokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error("Gemini Code Plan Error:", error);
    throw error;
  }
};

/**
 * Generates a random fun prompt.
 */
export const generateFunPrompt = async (): Promise<string> => {
   if (!process.env.API_KEY) return "Write a haiku about a missing API Key.";

   try {
     const response = await ai.models.generateContent({
       model: DEFAULT_MODEL,
       contents: "Generate one creative, funny, or thought-provoking prompt for an LLM. Return ONLY the prompt text.",
       config: { temperature: 1.2 }
     });
     return response.text || "Tell me a joke.";
   } catch (error) {
     return "Explain gravity to a chicken.";
   }
};
