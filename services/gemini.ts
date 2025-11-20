import { ExplainerScript } from "../types";

/**
 * Generates the structured script for the explainer.
 */
export const generateScript = async (topic: string): Promise<ExplainerScript> => {
  const response = await fetch('/api/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate script");
  }

  const data = await response.json();
  return data as ExplainerScript;
};

/**
 * Generates a high-quality image for a scene.
 */
export const generateImageForScene = async (prompt: string): Promise<string> => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate image");
  }

  const data = await response.json();
  return data.image;
};

/**
 * Generates TTS audio for the voiceover.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await fetch('/api/generate-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate speech");
  }

  const data = await response.json();

  // Convert raw PCM to a standard WAV Blob and create a URL
  // This avoids data-uri limits and ensures correct headers
  const wavBlob = createWavBlob(data.audio);
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