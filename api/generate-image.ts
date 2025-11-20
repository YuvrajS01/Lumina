import { GoogleGenAI, Modality } from "@google/genai";

export const config = {
    runtime: 'edge',
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return new Response('Missing prompt', { status: 400 });
        }

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

            return new Response(JSON.stringify({ image: `data:image/jpeg;base64,${base64}` }), {
                headers: { 'Content-Type': 'application/json' },
            });

        } catch (e) {
            console.warn("Imagen 4.0 failed, falling back to Flash Image", e);

            // Fallback
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
                return new Response(JSON.stringify({ image: `data:image/png;base64,${part.inlineData.data}` }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error("Image generation failed");
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
