import { GoogleGenAI, Modality } from "@google/genai";
import { MODEL_NAME } from '../constants';

const TEXT_MODEL_NAME = 'gemini-2.5-flash';

// Basic sanitization to remove stage directions and trim
export const sanitizeScript = (text: string): string => {
  // Remove text inside square brackets [ ] or parentheses ( )
  let cleaned = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

export const validateScript = (text: string): string | null => {
  const cleaned = sanitizeScript(text);
  if (cleaned.length === 0) return "Script cannot be empty.";
  if (!/[.!?]$/.test(cleaned)) return "Script must end with a punctuation mark (. ! ?).";
  return null;
};

export const enhanceScript = async (text: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide a valid Google Gemini API Key.");
  }

  if (!text.trim()) {
    throw new Error("Please enter some text to enhance.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      You are an expert Moroccan Darija scriptwriter and voice coach. 
      Rewrite the following text to make it sound incredibly realistic, emotional, and human for a Text-to-Speech engine.
      
      Rules:
      1. Keep the language in Moroccan Darija (Arabic or Latin script, matching the input).
      2. Add natural filler words where appropriate (e.g., "ze3ma", "yak", "euh", "ra").
      3. CRITICAL: Do NOT use brackets [] or parentheses () for directions. The system removes them. 
      4. INSTEAD, write the sounds phonetically:
         - For laughter, write "Hahaha!" or "Hehehe".
         - For breaths/sighs, write "Ah..." or "Ouff...".
         - For hesitation, use "Hmm..." or "...".
      5. Use punctuation (..., !, ?, ?!) aggressively to control pacing and intonation.
      6. Make the text convey specific emotions (excitement, sarcasm, warmth) through word choice and punctuation.

      Input Text: "${text}"
      
      Output only the enhanced text, nothing else.
    `;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: prompt
    });

    const enhancedText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!enhancedText) {
      throw new Error("Failed to enhance text.");
    }

    return enhancedText.trim();

  } catch (error: any) {
    console.error("Enhancement Error:", error);
    throw new Error("Could not enhance script. Check your API key or try again.");
  }
};

export const generateSpeech = async (
  text: string, 
  voiceName: string,
  apiKey: string
): Promise<{ base64Audio: string }> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide a valid Google Gemini API Key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanedText = sanitizeScript(text);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: cleanedText,
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });

    const candidate = response.candidates?.[0];
    
    if (!candidate) {
      throw new Error("No candidates returned from Gemini.");
    }

    const parts = candidate.content?.parts;

    // 1. Try to find audio part
    const audioPart = parts?.find(p => p.inlineData && p.inlineData.data);
    if (audioPart?.inlineData?.data) {
      return { base64Audio: audioPart.inlineData.data };
    }

    // 2. Check if model returned text (refusal or error explanation)
    const textPart = parts?.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`Gemini returned text instead of audio: "${textPart.text}"`);
    }

    // 3. Fallback error
    throw new Error(`No audio content returned. Finish Reason: ${candidate.finishReason || 'Unknown'}`);

  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    // Basic error mapping
    if (error.message?.includes('400')) {
      throw new Error("Invalid Argument (400): Please check your script for disallowed characters or stage directions.");
    }
    if (error.message?.includes('429')) {
      throw new Error("Quota Exceeded (429): The system is busy. Please try again later.");
    }
    if (error.message?.includes('API key')) {
      throw new Error("Invalid API Key. Please check your settings.");
    }
    throw error;
  }
};