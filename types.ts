export interface Scene {
  id: number;
  heading: string;
  explanation: string;
  imagePrompt: string;
  voiceoverText: string;
  imageUrl?: string; // Populated after generation
  audioUrl?: string; // Populated after generation
}

export interface ExplainerScript {
  title: string;
  summary: string;
  scenes: Scene[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  LOADING_ASSETS = 'LOADING_ASSETS',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export interface GenerationProgress {
  message: string;
  percent: number;
}
