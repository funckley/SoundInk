// import React from 'react';
// import { EditorProvider } from './contexts/editorContext';
// import TlDrawCanvasComponent from './components/TlDrawCanvasComponent/drawing';
// import GridCanvas from './components/GridComponent/grid';
// import './App.css';

// function App() {
//   return (
//     <EditorProvider>
//       <div className="App">
//         <header className="App-header">
//           {/* <h1>Music and Art Therapy App</h1> */}
//         </header>
//         <TlDrawCanvasComponent />
//         <GridCanvas />
//       </div>
//     </EditorProvider>
//   );
// }

// export default App;

////////////////////////////////////////////////////////////////////

// import React from 'react'; 
// import { EditorProvider } from './contexts/editorContext'; // Provides global state for the app
// import TlDrawCanvasComponent from './components/TlDrawCanvasComponent/drawing'; // Main drawing canvas (renamed to drawing)
// import GridCanvas from './components/GridComponent/grid'; // The grid system that maps notes to beats
// import './App.css'; // App-wide styling

// function App() {
//   return (
//     // EditorProvider makes the global state available to the entire app
//     <EditorProvider> 
//       <div className="App">
//         <header className="App-header">
//           {/* The title header is commented out, could be used if needed */}
//           {/* <h1>Music and Art Therapy App</h1> */}
//         </header>
//         {/* Drawing canvas component */}
//         <TlDrawCanvasComponent />
//         {/* Grid system component */}
//         <GridCanvas />
//       </div>
//     </EditorProvider>
//   );
// }

// export default App;

////////////////////////////////////////////////////////////////////

// import React, { useState } from 'react';
// import Sidebar from './components/Sidebar/sidebar';
// import TlDrawCanvasComponent from './components/TlDrawCanvasComponent/drawing';
// import GridCanvas from './components/GridComponent/grid';
// import './App.css';

// function App() {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [tempo, setTempo] = useState(120); // Default tempo
//   const [brushSize, setBrushSize] = useState(16); // Default brush size
//   const [volume, setVolume] = useState(50); // Default volume
//   const [isEraser, setIsEraser] = useState(false); // added this Sep 12

//   const handlePlayPauseClick = () => {
//     setIsPlaying(!isPlaying); // Toggle play/pause
//   };

//   const handleTempoChange = (e) => {
//     setTempo(e.target.value); // Update tempo value
//   };

//   const handleBrushSizeChange = (e) => {
//     setBrushSize(e.target.value); // Update brush size value
//   };

//   const handleVolumeChange = (e) => {
//     setVolume(e.target.value); // Update volume value
//   };

//   return (
//     <div className="app-container">
//       <Sidebar
//         isPlaying={isPlaying}
//         onPlayPauseClick={handlePlayPauseClick}
//         tempo={tempo}
//         onTempoChange={handleTempoChange}
//         brushSize={brushSize}
//         onBrushSizeChange={handleBrushSizeChange}
//         volume={volume}
//         onVolumeChange={handleVolumeChange}
//       />
//       <div className="canvas-container">
//         <TlDrawCanvasComponent brushSize={brushSize} />
//         <GridCanvas />
//       </div>
//     </div>
//   );
// }

// export default App;

////////////////////////////////////////////////////////////////////

// import React, { useState } from 'react';
// import Sidebar from './components/Sidebar/sidebar';
// import TlDrawCanvasComponent from './components/TlDrawCanvasComponent/drawing';
// import GridCanvas from './components/GridComponent/grid';
// import './App.css';

// function App() {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [tempo, setTempo] = useState(120); // Default tempo
//   const [brushSize, setBrushSize] = useState(16); // Default brush size
//   const [volume, setVolume] = useState(50); // Default volume
//   const [isEraser, setIsEraser] = useState(false);

//   // const handlePlayPauseClick = () => setIsPlaying(!isPlaying);
//   // const handleTempoChange = (e) => setTempo(Number(e.target.value));
//   // const handleBrushSizeChange = (e) => setBrushSize(Number(e.target.value));
//   // const handleVolumeChange = (e) => setVolume(Number(e.target.value));
//   // const handleEraserToggle = () => setIsEraser(!isEraser);
//   // const handleUndo = () => {/* Undo logic */};
//   // const handleRedo = () => {/* Redo logic */};

//   return (
//     <div className="app-container">
//       {/* <Sidebar
//         isPlaying={isPlaying}
//         onPlayPauseClick={handlePlayPauseClick}
//         tempo={tempo}
//         onTempoChange={handleTempoChange}
//         brushSize={brushSize}
//         onBrushSizeChange={handleBrushSizeChange}
//         volume={volume}
//         onVolumeChange={handleVolumeChange}
//         isEraser={isEraser}
//         onEraserToggle={handleEraserToggle}
//         onUndo={handleUndo}
//         onRedo={handleRedo}
//       /> */}
//       <TlDrawCanvasComponent tempo={tempo} />
//       <TlDrawCanvasComponent brushSize={brushSize} />
//       <GridCanvas />
//     </div>
//   );
// }

// export default App;

////////////////////////////////////////////////////////////////////

import React, { useState } from 'react';
import Sidebar from './components/Sidebar/sidebar';
import TlDrawCanvasComponent from './components/TlDrawCanvasComponent/drawing';
import GridCanvas from './components/GridComponent/grid';
import { PlaybackSpeedProvider } from './components/TlDrawCanvasComponent/playbackSpeedContext'; // Import the provider
import './App.css';
import P5GridCanvas from './components/GridComponent/P5GridCanvas';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [brushSize, setBrushSize] = useState(16); // Default brush size
  const [volume, setVolume] = useState(50); // Default volume
  const [isEraser, setIsEraser] = useState(false);

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