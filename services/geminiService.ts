
import { GoogleGenAI, GenerateContentResponse, Modality, Chat } from "@google/genai";
import { Persona, ChatMessage } from "../types";

export class GeminiService {
  private generateInstruction(persona: Persona): string {
    return `
      You are an expert, friendly Tech Mentor who speaks fluently in ${persona.dialect}.
      Your goal is to guide the user (student) through complex technical concepts using the slang, heart, and humor of ${persona.dialect}.
      
      CRITICAL RULES:
      1. Roleplay as a "Periyavar" or "Mentor" who wants the user to truly succeed.
      2. Use REAL and AUTHENTIC ${persona.dialect} vocabulary.
      3. Use local analogies like ${persona.analogies.join(', ')}.
      4. Character traits: ${persona.description}.
      5. Use these specific colloquialisms frequently: ${persona.colloquialisms.join(', ')}.
      6. Response must be in the native Tamil script.
      7. Keep explanations encouraging. If the user asks a follow-up, provide more depth while staying in character.
      8. Format in clean, readable Markdown.
    `;
  }

  async *explainTermStream(term: string, persona: Persona) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `Mentor, please explain this concept to me simply: ${term}`,
      config: {
        systemInstruction: this.generateInstruction(persona),
        temperature: 0.8,
      },
    });

    for await (const chunk of response) {
      yield (chunk as GenerateContentResponse).text;
    }
  }

  async *chatStream(message: string, history: ChatMessage[], persona: Persona) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: this.generateInstruction(persona),
        temperature: 0.7,
      },
    });

    const context = history.map(h => `${h.role === 'user' ? 'Student' : 'Mentor'}: ${h.text}`).join('\n');
    const prompt = `Context of our lesson so far:\n${context}\n\nStudent says: ${message}\n\nMentor response:`;

    const response = await chat.sendMessageStream({ message: prompt });
    for await (const chunk of response) {
      yield (chunk as GenerateContentResponse).text;
    }
  }

  async scanImage(base64Data: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: "What tech item or concept is shown here? Just give the name in English for my mentor to explain." }
        ]
      }
    });
    return response.text?.trim() || "";
  }

  async generateImage(term: string, persona: Persona): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A vibrant visual metaphor for '${term}' in a ${persona.dialect} setting. Focus on ${persona.analogies[0]}. High quality 3D.` }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }

  async speakExplanation(text: string, persona: Persona, voiceName: string = 'Kore'): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    // Stripping markdown and keeping text short for faster synthesis
    const cleanText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanText) return undefined;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `Regional ${persona.dialect} mentor accent: ${cleanText}` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
}

export const geminiService = new GeminiService();
