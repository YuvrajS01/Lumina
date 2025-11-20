# Lumina

**Lumina** is a next-generation generative learning application that transforms complex topics into engaging, visual, and narrated stories in seconds.

Powered by Google's **Gemini 2.5**, **Imagen 4.0**, and advanced Text-to-Speech, Lumina acts as your personal AI architect, breaking down concepts into cinematic scenes with custom visuals and voiceovers.

## Features

-   **Generative Scripts**: Uses Gemini 2.5 Flash to create educational, structured scripts.
-   **Cinematic Visuals**: Generates high-quality, photorealistic 3D renders for each scene using Imagen 4.0.
-   **Dynamic Voiceovers**: Converts script text into lifelike speech using Gemini's advanced TTS.
-   **Interactive Player**: A custom-built playback experience with timeline navigation and immersive transitions.

## Tech Stack

-   **Frontend**: React 19, Vite, TypeScript
-   **Styling**: Vanilla CSS (Animations, Glassmorphism)
-   **AI Integration**: Google GenAI SDK
-   **Deployment**: Vercel Serverless Functions

## Getting Started

### Prerequisites

-   Node.js
-   Vercel CLI (`npm i -g vercel`)
-   A Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/YuvrajS01/Lumina.git
    cd Lumina
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  Run Locally:
    Use the Vercel CLI to run the development server (required for API functions):
    ```bash
    vercel dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Deployment

Deploying to Vercel is seamless:

1.  Push your code to a Git repository.
2.  Import the project into Vercel.
3.  Add the `GEMINI_API_KEY` in the Vercel Project Settings > Environment Variables.
4.  Deploy!

---

Built with ❤️ by Yuvraj Singh
