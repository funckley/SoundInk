import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/sidebar';
import TlDrawCanvasComponent from './components/TlDrawCanvasComponent/drawing';
import GridCanvas from './components/GridComponent/grid';
import { PlaybackSpeedProvider } from './components/TlDrawCanvasComponent/playbackSpeedContext'; // Import the provider
import './App.css';
import { preloadSounds } from './components/TlDrawCanvasComponent/soundPlayer';

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

  return (
    <PlaybackSpeedProvider> {/* Wrap your app with PlaybackSpeedProvider */}
      <div className="app-container">
        <TlDrawCanvasComponent brushSize={brushSize} />
        {/* <TlDrawCanvasComponent /> */}
        {/* <GridCanvas /> */}
        {/* <P5GridCanvas /> */}
      </div>
    </PlaybackSpeedProvider>
  );
}

export default App;