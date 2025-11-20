import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExplainerScript } from '../types';
import { Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft, Home } from 'lucide-react';

interface PlayerProps {
  script: ExplainerScript;
  onReset: () => void;
}

// Reliable background music (Google Media)
const BG_MUSIC_URL = "https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3";

export const Player: React.FC<PlayerProps> = ({ script, onReset }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  
  const currentScene = script.scenes[currentSceneIndex];

  // Background Music Logic
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = isMuted ? 0 : 0.10; // Ambient volume
      
      // Attempt to play BG music if the experience has started
      if (isPlaying) {
        const playPromise = bgMusicRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play was prevented or interrupted, which is common
            // Don't log the object to avoid circular JSON errors in some environments
            console.debug("BG Audio autoplay prevented");
          });
        }
      } else {
        bgMusicRef.current.pause();
      }
    }
    
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 1.0;
    }
  }, [isPlaying, isMuted]);

  // Handle Scene Changes
  useEffect(() => {
    // If we are in a "playing" state globally and have audio, play it
    if (isPlaying && currentScene.audioUrl) {
       playVoiceover();
    }
  }, [currentSceneIndex, currentScene.audioUrl]); 

  const playVoiceover = useCallback(() => {
    if (audioRef.current && currentScene.audioUrl) {
      // Only set src if it's different to avoid reloading if React re-renders
      if (audioRef.current.src !== currentScene.audioUrl) {
        audioRef.current.src = currentScene.audioUrl;
        audioRef.current.load(); // Ensure it's loaded
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
        .then(() => {
          // Success
        })
        .catch(() => {
          // Prevent circular error logging
          console.warn("Voiceover playback interrupted or prevented");
          setIsPlaying(false); // Pause UI if playback fails
        });
      }
      
      audioRef.current.onended = () => {
        // Auto advance
        if (currentSceneIndex < script.scenes.length - 1) {
           setTimeout(() => handleNext(), 1000);
        } else {
          setIsPlaying(false); // End of show
        }
      };
    }
  }, [currentScene.audioUrl, currentSceneIndex, script.scenes.length]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      // Pause everything
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Resume/Start
      if (currentScene.audioUrl) {
        // Ensure src is set
        if (!audioRef.current.src || audioRef.current.src !== currentScene.audioUrl) {
           audioRef.current.src = currentScene.audioUrl;
           audioRef.current.load();
        }
        audioRef.current.play().catch(() => {
          console.warn("Play failed");
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentSceneIndex < script.scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  };

  return (
    <div className="player-container anim-fade">
      <audio 
        ref={audioRef} 
        className="hidden" 
        onError={(e) => {
          // Log only the error message, not the event object to avoid circular references
          const err = e.currentTarget.error;
          console.warn("Voiceover Audio Error", err ? `Code: ${err.code}` : "Unknown");
        }}
      />
      {/* Removed crossOrigin to avoid unnecessary CORS checks that might fail */}
      <audio 
        ref={bgMusicRef} 
        src={BG_MUSIC_URL} 
        loop 
        preload="auto"
        className="hidden"
        onError={(e) => {
           const err = e.currentTarget.error;
           console.warn("BG Music Error", err ? `Code: ${err.code}` : "Unknown");
        }}
      />
      
      {/* Visual Stage */}
      <div className="visual-stage">
        {currentScene.imageUrl ? (
          <>
             <img 
              key={currentScene.id} 
              src={currentScene.imageUrl} 
              alt={currentScene.imagePrompt}
              className="scene-image"
            />
            <div className="stage-gradient" />
          </>
        ) : (
          <div className="scene-placeholder">
             <div className="spinner" />
          </div>
        )}

        {/* Top Left Home */}
        <div className="stage-controls-left">
           <button onClick={onReset} className="control-btn-round">
             <Home size={20} />
           </button>
        </div>
        
        {/* Top Right Volume */}
        <div className="stage-controls">
          <button onClick={() => setIsMuted(!isMuted)} className="control-btn-round">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Timeline Indicators */}
        <div className="timeline">
          {script.scenes.map((s, idx) => (
            <div 
              key={s.id} 
              className={`timeline-segment ${idx === currentSceneIndex ? 'active' : idx < currentSceneIndex ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Narrative Panel */}
      <div className="narrative-panel anim-slide">
        <div>
           <div className="chapter-label">
             Chapter {currentSceneIndex + 1} / {script.scenes.length}
           </div>
           
           <h1 className="scene-heading">
             {currentScene.heading}
           </h1>

           <p className="scene-text">
             {currentScene.explanation}
           </p>
            
           {currentScene.voiceoverText && (
             <div className="voiceover-box">
               "{currentScene.voiceoverText}"
             </div>
           )}
        </div>

        <div className="playback-controls">
          <button 
            onClick={handlePrev}
            disabled={currentSceneIndex === 0}
            className="nav-btn"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={handlePlayPause}
            className="play-btn-large"
            disabled={!currentScene.audioUrl} // Disable play if audio isn't ready
          >
             {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>

          <button 
            onClick={handleNext}
            disabled={currentSceneIndex === script.scenes.length - 1}
            className="nav-btn"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};