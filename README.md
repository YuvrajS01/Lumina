<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1s008lG_jQrtdu7D2eDhXCHz1f44BTQfI

## Run Locally

**Prerequisites:**  Node.js, Vercel CLI (`npm i -g vercel`)

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in a `.env` file (or let Vercel pull it).
3. Run the app with Vercel CLI (required for API functions):
   `vercel dev`

## Deploy to Vercel

The easiest way to deploy is to use the Vercel CLI or connect your GitHub repository to Vercel.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add your `GEMINI_API_KEY` in the Vercel Project Settings > Environment Variables.
4. Deploy!
