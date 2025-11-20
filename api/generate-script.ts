import { GoogleGenAI, Type } from "@google/genai";

export const config = {
    runtime: 'edge',
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { topic } = await req.json();

        if (!topic) {
            return new Response('Missing topic', { status: 400 });
        }

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

        return new Response(response.text, {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
