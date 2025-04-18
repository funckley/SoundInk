import React, { useState, useEffect } from 'react';
import CanvasComponent from './components/CanvasComponent/interface';
import { PlaybackSpeedProvider } from './components/CanvasComponent/playbackSpeedContext'; // Import the provider
import './App.css';
import { preloadSounds } from './components/CanvasComponent/soundPlayer';
import { BpmProvider } from './components/CanvasComponent/bpmContext';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [brushSize, setBrushSize] = useState(16); // Default brush size
  const [volume, setVolume] = useState(50); // Default volume
  const [isEraser, setIsEraser] = useState(false);

  // Use useEffect to preload sounds when the app is loaded
  useEffect(() => {
    const loadSounds = async () => {
      console.log('Preloading sounds...');
      await preloadSounds(); // Preload all sounds
      console.log('All sounds preloaded!');
    };

    loadSounds(); // Call the function
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Lock the screen to prevent scrolling
  useEffect(() => {
    document.body.classList.add('lock-scroll');
    return () => {
      document.body.classList.remove('lock-scroll');
    };
  }, []);

  return (
    <PlaybackSpeedProvider> {/* Wrap your app with PlaybackSpeedProvider */}
      <BpmProvider>
        <div className="app-container">
          <CanvasComponent brushSize={brushSize} />
        </div>
      </BpmProvider>
    </PlaybackSpeedProvider>
  );
}

export default App;