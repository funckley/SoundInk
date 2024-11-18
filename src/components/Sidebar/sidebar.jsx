import React from 'react';
import './sidebar.css';
import PropTypes from 'prop-types'; // Import PropTypes for validation

const Sidebar = ({ isPlaying, onPlayPauseClick, tempo, onTempoChange, brushSize, onBrushSizeChange, volume, onVolumeChange, isEraser, onEraserToggle, onUndo, onRedo }) => {
  return (
    <div className="sidebar">
      {/* Play/Pause Button */}
      <button className="play-pause-button" onClick={onPlayPauseClick}>
        {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
      </button>

      {/* Tempo Slider */}
      <div className="slider-group">
        <label>⏱️ Tempo</label>
        <input
          type="range"
          min="100"
          max="240"
          value={tempo}
          onChange={onTempoChange}
        />
      </div>

      {/* Volume Slider */}
      <div className="slider-group">
        <label>🔊 Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={onVolumeChange}
        />
      </div>

      {/* Brush Size Slider */}
      <div className="slider-group">
        <label>🖌️ Brush Size</label>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={onBrushSizeChange}
        />
      </div>

      {/* Eraser Toggle */}
      <button className={`eraser-toggle ${isEraser ? 'active' : ''}`} onClick={onEraserToggle}>
        {isEraser ? 'ERASER' : 'ERASER'}
      </button>

      {/* Undo and Redo Buttons */}
      <div className="undo-redo-group">
        <button className="undo-button" onClick={onUndo}>↩</button>
        <button className="redo-button" onClick={onRedo}>↪</button>
      </div>

      {/* Color Selection with Sound Icon */}
      <div className="color-group">
        <div className="color-item">
          <div className="color" style={{ backgroundColor: '#d62828' }}></div>
          <button className="sound-icon">♫</button>
        </div>
        <div className="color-item">
          <div className="color" style={{ backgroundColor: '#305cde' }}></div>
          <button className="sound-icon">♫</button>
        </div>
        <div className="color-item">
          <div className="color" style={{ backgroundColor: '#ffb703' }}></div>
          <button className="sound-icon">♫</button>
        </div>
        <div className="color-item">
          <div className="color" style={{ backgroundColor: "#4cbb17" }}></div>
          <button className="sound-icon">♫</button>
        </div>
        <div className="color-item">
          <div className="color" style={{ backgroundColor: '#8a00c4' }}></div>
          <button className="sound-icon">♫</button>
        </div>
      </div>
    </div>
  );
};

// Add PropTypes for validation
Sidebar.propTypes = {
  tempo: PropTypes.number.isRequired, // Validating that 'tempo' is a required number
  brushSize: PropTypes.number.isRequired, // Validating that 'brushSize' is a required number
  volume: PropTypes.number.isRequired, // Validating that 'volume' is a required number
  isPlaying: PropTypes.bool.isRequired, // Validating that 'isPlaying' is a required boolean
  onPlayPauseClick: PropTypes.func.isRequired, // Validating that 'onPlayPauseClick' is a required function
  onTempoChange: PropTypes.func.isRequired, // Validating that 'onTempoChange' is a required function
  onBrushSizeChange: PropTypes.func.isRequired, // Validating that 'onBrushSizeChange' is a required function
  onVolumeChange: PropTypes.func.isRequired, // Validating that 'onVolumeChange' is a required function
  isEraser: PropTypes.bool.isRequired, // Validating that 'isEraser' is a required boolean
  onEraserToggle: PropTypes.func.isRequired, // Validating that 'onEraserToggle' is a required function
  onUndo: PropTypes.func.isRequired, // Validating that 'onUndo' is a required function
  onRedo: PropTypes.func.isRequired, // Validating that 'onRedo' is a required function
};

export default Sidebar;