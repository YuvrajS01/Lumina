import React, { useState } from 'react';
import { AppState, ExplainerScript, GenerationProgress } from './types';
import { generateScript, generateImageForScene, generateSpeech } from './services/gemini';
import { Hero } from './components/Hero';
import { Player } from './components/Player';
import { AlertCircle } from 'lucide-react';

const HISTORY_KEY = 'lumina_history';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [script, setScript] = useState<ExplainerScript | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({ message: '', percent: 0 });
  const [error, setError] = useState<string | null>(null);

  const saveToHistory = (topic: string) => {
    try {
      const existing = localStorage.getItem(HISTORY_KEY);
      let history: string[] = existing ? JSON.parse(existing) : [];
      
      // Remove duplicates (case insensitive) and move to top
      history = history.filter(h => h.toLowerCase() !== topic.toLowerCase());
      history.unshift(topic);
      
      // Keep last 8
      if (history.length > 8) {
        history = history.slice(0, 8);
      }
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Could not save history", e);
    }
  };

  const startGeneration = async (topic: string) => {
    saveToHistory(topic); // Save before starting
    setState(AppState.GENERATING_SCRIPT);
    setError(null);
    setProgress({ message: 'Consulting the AI Architect...', percent: 10 });

    try {
      const generatedScript = await generateScript(topic);
      setScript(generatedScript);
      
      setState(AppState.LOADING_ASSETS);
      
      const totalAssets = generatedScript.scenes.length * 2;
      let completedAssets = 0;

      const updateProgress = (msg: string) => {
        completedAssets++;
        const percent = 20 + (completedAssets / totalAssets) * 80;
        setProgress({ message: msg, percent });
      };
      
      generatedScript.scenes.map(async (scene, index) => {
        generateImageForScene(scene.imagePrompt)
          .then(url => {
            scene.imageUrl = url;
            updateProgress(`Visualizing Scene ${index + 1}...`);
            setScript(prev => prev ? { ...prev } : null);
          })
          .catch(e => console.error(`Failed image scene ${index}`, e));

        generateSpeech(scene.voiceoverText)
          .then(url => {
            scene.audioUrl = url;
            updateProgress(`Voicing Scene ${index + 1}...`);
            setScript(prev => prev ? { ...prev } : null);
          })
          .catch(e => console.error(`Failed audio scene ${index}`, e));
      });

      const firstScene = generatedScript.scenes[0];
      
      const checkFirstScene = setInterval(() => {
        if (firstScene.imageUrl && firstScene.audioUrl) {
          clearInterval(checkFirstScene);
          setState(AppState.PLAYING);
        }
      }, 500);
      
      setTimeout(() => {
         if (state !== AppState.PLAYING) {
           clearInterval(checkFirstScene);
           setState(AppState.PLAYING);
         }
      }, 15000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong generating the content.");
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setScript(null);
    setError(null);
  };

  if (state === AppState.IDLE) {
    return <Hero onStart={startGeneration} />;
  }

  if (state === AppState.GENERATING_SCRIPT || state === AppState.LOADING_ASSETS) {
    return (
      <div className="loader-screen anim-fade">
        <div className="loader-ring">
          <div className="spinner" />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Creating your experience
        </h2>
        <p style={{ color: '#94a3b8' }}>{progress.message}</p>

        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    );
  }

  if (state === AppState.ERROR) {
    return (
      <div className="loader-screen anim-fade">
        <div style={{ 
          width: '64px', height: '64px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle size={32} color="#EF4444" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Generation Failed
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', maxWidth: '400px', textAlign: 'center' }}>
          {error}
        </p>
        <button 
          onClick={handleReset}
          className="badge"
          style={{ cursor: 'pointer', padding: '0.75rem 2rem' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (state === AppState.PLAYING && script) {
    return <Player script={script} onReset={handleReset} />;
  }

  return null;
};

export default App;