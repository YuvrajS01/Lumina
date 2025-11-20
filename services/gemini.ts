import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExplainerScript } from "../types";

// Initialize Client
// NOTE: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the structured script for the explainer.
 */
export const generateScript = async (topic: string): Promise<ExplainerScript> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Create a visually engaging, educational explainer script about: "${topic}". 
    The audience is general public. Keep it concise, exciting, and visual. 
    Create exactly 4 distinct scenes. 
    For 'imagePrompt', describe a high-quality, photorealistic, cinematic 3D render or illustration style image that represents the concept abstractly or concretely.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                heading: { type: Type.STRING },
                explanation: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                voiceoverText: { type: Type.STRING }
              },
              required: ["id", "heading", "explanation", "imagePrompt", "voiceoverText"]
            }
          }
        },
        required: ["title", "summary", "scenes"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate script");
  }

  return JSON.parse(response.text) as ExplainerScript;
};

/**
 * Generates a high-quality image for a scene.
 */
export const generateImageForScene = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      },
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64) throw new Error("No image generated");
    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    console.warn("Imagen 4.0 failed, falling back to Flash Image", e);
    // Fallback to Flash Image if Imagen 4 fails (e.g. quota or availability)
    return generateImageFallback(prompt);
  }
};

const generateImageFallback = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Image generation failed");
}

/**
 * Generates TTS audio for the voiceover.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Aoede' }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Audio generation failed");
  }
  
  // Convert raw PCM to a standard WAV Blob and create a URL
  // This avoids data-uri limits and ensures correct headers
  const wavBlob = createWavBlob(base64Audio);
  return URL.createObjectURL(wavBlob);
};

/**
 * Creates a WAV Blob from raw PCM data.
 * Gemini PCM is 24kHz, 1 channel (mono), 16-bit.
 */
function createWavBlob(base64Pcm: string): Blob {
  // Remove any potential whitespace from base64 string
  const cleanBase64 = base64Pcm.replace(/\s/g, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  
  // WAV Header is 44 bytes
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true); // File size - 8
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); 
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);

  // Combine header and data
  return new Blob([view, bytes], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}