import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, History, Search } from 'lucide-react';

interface HeroProps {
  onStart: (topic: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lumina_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load history");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onStart(input);
    }
  };

  return (
    <div className="hero-container">
      {/* Abstract Backgrounds */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />

      <div className="hero-content anim-fade">
        <div className="badge">
          <Sparkles size={16} />
          <span>Generative Learning Experience</span>
        </div>
        
        <h1 className="hero-title">
          What do you want to <br />
          <span>understand today?</span>
        </h1>

        <p className="hero-desc">
          Enter any complex topic. Lumina will generate a visual, narrated explainer tailored just for you in seconds.
        </p>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-glow"></div>
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Quantum Computing, Photosynthesis..."
              className="search-input"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="search-btn"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </form>

        {/* Search History Section */}
        {history.length > 0 && (
          <div className="history-section">
            <h3 className="history-title">Recent Explorations</h3>
            <div className="history-tags">
              {history.map((topic, idx) => (
                <button 
                  key={idx} 
                  onClick={() => onStart(topic)}
                  className="history-tag"
                >
                  <History size={14} className="opacity-70" />
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="hero-footer">
          <span>Powered by Gemini 2.5</span>
          <span>•</span>
          <span>Imagen 4.0</span>
          <span>•</span>
          <span>Veo Tech</span>
        </div>
      </div>
    </div>
  );
};