
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIGeneratedQuestion {
  text: string;
  type: QuestionType;
  options: { text: string }[];
  correctAnswerIndices: number[];
  points: number;
  explanation: string;
}

export const generateAIQuestions = async (topic: string, count: number = 10): Promise<AIGeneratedQuestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate exactly ${count} educational quiz questions about "${topic}". 
      Requirements:
      1. Provide a diverse mix of Multiple Choice (MCQ) and True/False questions.
      2. Ensure all questions are factually accurate and academically rigorous.
      3. For each question, provide a detailed "explanation" explaining the logic behind the correct answer.
      4. DO NOT generate fewer than ${count} questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: [QuestionType.MCQ, QuestionType.TRUE_FALSE] },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING }
                  }
                }
              },
              correctAnswerIndices: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              },
              points: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["text", "type", "options", "correctAnswerIndices", "points", "explanation"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    return parsed;
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    throw error;
  }
};

/**
 * Generates open-ended practice questions based on resume content.
 */
export const generateQuestionsFromResume = async (resumeText: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert technical recruiter and academic advisor. 
      Analyze the following resume and generate 8-10 deep-dive, open-ended practice questions. 
      These questions should challenge the individual on their specific skills, projects, and experiences mentioned.
      
      CRITICAL RULES:
      1. Return ONLY the questions as a list of strings.
      2. DO NOT provide answers, MCQs, or explanations.
      3. Each question must be specific to the resume provided.
      
      RESUME CONTENT:
      ${resumeText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Resume Analysis failed:", error);
    throw error;
  }
};
