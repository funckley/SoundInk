import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { getStroke } from 'perfect-freehand'; // Used to calculate stroke paths for drawing
import './drawing.css'; // Importing the associated CSS file for styles
import { getSvgPathFromStroke } from './utils'; // Utility function to convert stroke to SVG path
import { getMapRowToNote, setScale } from './soundMappings'; // Function to map rows to musical notes
import { playSound } from './soundPlayer'; // Function to play the sound associated with each note/color
import { PlaybackSpeedProvider, usePlaybackSpeed } from './playbackSpeedContext'; // Context for playback speed
import { stopSoundsForLine, preloadSounds } from './soundPlayer';
import { v4 as uuidv4 } from 'uuid'; // To generate unique IDs
import GridCanvas from '../GridComponent/grid';
import { firstColumn, fistColumnScan, numDotsX, numDotsY, dotRadius } from '../GridComponent/gridConfig';
import { useMediaQuery } from 'react-responsive';
import { useBpm } from './BpmContext'; // Import the BPM context
// import { scales, getDirection, getScaleForDirection } from './soundMappings';

import PlayIcon from './../../assets/icons/play-svgrepo-com-3.svg';
import StopIcon from './../../assets/icons/stop-svgrepo-com-3.svg';
import UndoIcon from './../../assets/icons/undo-xs-svgrepo-com-3.svg';
import RedoIcon from './../../assets/icons/redo-xs-svgrepo-com-3.svg';
import BrushIcon from './../../assets/icons/brush-svgrepo-com-2 copy.svg';
import EraseIcon from './../../assets/icons/eraser-svgrepo-com-3.svg';
import LoopIcon from './../../assets/icons/loop-svgrepo-com-6.svg';
import TempoIcon from './../../assets/icons/metronome-tempo-beat-bpm-svgrepo-com-2.svg';
import GridIcon from './../../assets/icons/grid-circles-svgrepo-com-3.svg';
import TrashIcon from './../../assets/icons/trash-svgrepo-com-2.svg';
import quitIcon from './../../assets/icons/close-delete-remove-trash-cancel-cross-svgrepo-com.svg';
import NoLoopIcon from './../../assets/icons/one-finger-svgrepo-com.svg';
import downloadIcon from './../../assets/icons/download-square-svgrepo-com.svg';
import uploadIcon from './../../assets/icons/upload-square-svgrepo-com.svg';

import muteIcon from './../../assets/icons/mute-silent-volume-sound-off-svgrepo-com.svg';
import bassIcon from './../../assets/icons/bass-svgrepo-com-3.svg';
import guitarIcon from './../../assets/icons/guitar-svgrepo-com-5.svg';
import marimbaIcon from './../../assets/icons/xylophone-svgrepo-com-6.svg';
import pianoIcon from './../../assets/icons/piano-svgrepo-com-3.svg';
import violinIcon from './../../assets/icons/violin-svgrepo-com-3.svg';
import fluteIcon from './../../assets/icons/flute-svgrepo-com-5.svg';
import glassIcon from './../../assets/icons/glass-svgrepo-com-7.svg';
import synthIcon from './../../assets/icons/keyboard-piano-synth-midi-vst-svgrepo-com-3.svg';
import majorIcon from './../../assets/icons/sun-2-svgrepo-com-6.svg';
import harmonicMinorIcon from './../../assets/icons/moon-fog-svgrepo-com-3.svg';
import melodicMinorIcon from './../../assets/icons/saturn-science-svgrepo-com-3.svg';
import minorPentatonicIcon from './../../assets/icons/five-stars-quality-symbol-svgrepo-com.svg';
import majorPentatonicIcon from './../../assets/icons/star-rings-svgrepo-com.svg';


const instrumentIcons = {
  floom: synthIcon,
  epiano: glassIcon,
  synthflute: fluteIcon,
  bass: bassIcon,
  guitar: guitarIcon,
  marimba: marimbaIcon,
  piano: pianoIcon,
  strings: violinIcon,
  mute: muteIcon,
};

const scaleIcons = {
  major: majorIcon,
  harmonicMinor: harmonicMinorIcon,
  melodicMinor: melodicMinorIcon,
  pentatonicMajor: minorPentatonicIcon,
  pentatonicMinor: majorPentatonicIcon,
};

const customInstrumentNames = {
  piano: "Piano",
  marimba: "Marimba",
  bass: "Bass",
  guitar: "Guitar",
  epiano: "Glass Harp",
  floom: "Synthesizer",
  strings: "String Ensemble",
  synthflute: "Flute",
  mute: 'Mute' // Label for mute
};

const customScaleNames = {
  major: "Major Scale",
  harmonicMinor: "Harmonic Minor",
  melodicMinor: "Melodic Minor",
  pentatonicMajor: "Pentatonic Major",
  pentatonicMinor: "Pentatonic Minor",
};

// Constants for brush colors and sizes
const colors = ['#161a1d', '#ffb703', '#219ebc', '#9a031e', '#006400'];

const sizes = [25, 50];
const MAX_DELAY = 600; // Maximum delay in milliseconds for the slowest speed

const ERASER_COLOR = '#eae6e1'; // Choose a color that represents the eraser
// Options for stroke drawing (customizable for smoothness, taper, etc.)
const options = {
  size: 16,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
  end: {
    taper: 100,
    easing: (t) => t,
    cap: true,
  },
};

// Helper function to check if a point (from a line) is close enough to a dot
const isPointNearDot = (pointX, pointY, dotX, dotY, dotRadius, lineThickness) => {
  const distance = Math.hypot(pointX - dotX, pointY - dotY);
  // Include both dotRadius and line thickness in the intersection threshold
  return distance <= dotRadius + lineThickness / 2;
};

const isPointNearLineSegment = (point, start, end, strokeWidth) => {
  const [px, py] = point;
  const [sx, sy] = start;
  const [ex, ey] = end;

  // Calculate the distance from the point to the line segment
  const lineLengthSquared = (ex - sx) ** 2 + (ey - sy) ** 2;
  if (lineLengthSquared === 0) {
    // The line segment is a single point
    return Math.hypot(px - sx, py - sy) <= strokeWidth / 2;
  }

  // Project the point onto the line segment
  let t = ((px - sx) * (ex - sx) + (py - sy) * (ey - sy)) / lineLengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamp t to the segment [0, 1]

  const closestPointX = sx + t * (ex - sx);
  const closestPointY = sy + t * (ey - sy);

  // Calculate the distance from the point to the closest point on the line segment
  const distance = Math.hypot(px - closestPointX, py - closestPointY);

  // Check if the distance is within the stroke width
  return distance <= strokeWidth / 2;
};

const TlDrawCanvasComponent = () => {
  const { playbackSpeed, setPlaybackSpeed } = usePlaybackSpeed(); // Access playbackSpeed
  const [sonificationPoints, setSonificationPoints] = useState([]); // Points that trigger sounds
  const [lines, setLines] = useState([]); // List of drawn lines
  const [currentLine, setCurrentLine] = useState([]); // Current line being drawn
  const [currentColor, setCurrentColor] = useState(colors[0]); // Currently selected brush color
  const [currentSize, setCurrentSize] = useState(30); // Currently selected brush size
  const [isEraser, setIsEraser] = useState(false); // Toggle for eraser mode
  const [isTrash, setIsTrash] = useState(false); // Toggle for trash mode
  const [undoStack, setUndoStack] = useState([]); // Stack for undo functionality
  const [redoStack, setRedoStack] = useState([]); // Stack for redo functionality
  const [currentColumn, setCurrentColumn] = useState(-1); // Current column being played back (for visual feedback)
  const intersectedDots = useRef({}); // Ref to track intersected dots
  const [showGrid, setShowGrid] = useState(true); // Add state to control grid visibility
  const [isPlaying, setIsPlaying] = useState(false); // To control playback state
  const [loop, setLoop] = useState(false); // To control looping
  let playbackStopped = useRef(false); // To stop playback externally
  const [scannedColumn, setScannedColumn] = useState(-1);
  const [previousColor, setPreviousColor] = useState(colors[0]);
  // const [bpm, setBpm] = useState(250); // Default BPM is 250
  const [currentScale, setCurrentScale] = useState('pentatonicMinor'); // Default scale is harmonic minor
  const [currentDirection, setCurrentDirection] = useState('ascending'); // Default direction is ascending
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false); // Toggle for pop-up
  const { bpm, setBpm } = useBpm(); // Access bpm and setBpm from context
  const scaleMenuRef = useRef(null); // Ref for the scale menu
  const instrumentMenuRef = useRef(null); // Ref for the instrument menu
  const originalSvgSize = useRef({ width: window.innerWidth, height: window.innerHeight });
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const svgRef = useRef();
  let loadInputRef = null; // Create a ref for the hidden input element

  // Add this at the top of your component, along with other state variables
  const [selectedColor, setSelectedColor] = useState(null); // Track the color for which the modal is shown
  // State to hold instrument assignment for each color
  const [colorInstrumentMap, setColorInstrumentMap] = useState({
    '#161a1d': 'piano',
    '#ffb703': 'epiano',
    '#fb8500': 'marimba',
    '#023047': 'guitar',
    '#219ebc': 'floom',
    '#d62828': 'synthflute',
    '#9a031e': 'bass',
    '#5f0f40': 'strings',
    '#006400': 'piano',
    '#8ac926': 'piano'
  });

  // Define the available instrument options
  // const instrumentOptions = ['bass', 'epiano', 'floom', 'guitar', 'marimba', 'piano', 'strings', 'synthflute'];
  const instrumentOptions = ['piano', 'marimba', 'bass', 'guitar', 'epiano', 'floom', 'strings', 'synthflute', 'mute'];

  // Inside your component
  const colorInstrumentMapRef = useRef(colorInstrumentMap); // Create a ref for instrument mappings
  const loopRef = useRef(loop); // Create a ref for loop
  const playbackSpeedRef = useRef(playbackSpeed);
  const playStopButtonRef = useRef(null);

  // Define breakpoints
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });
  const isDesktop = useMediaQuery({ minWidth: 1025 });

  // Dynamically adjust styles based on the screen size
  const buttonSize = isMobile ? '40px' : isTablet ? '60px' : '80px';
  const gapSize = isMobile ? '10px' : isTablet ? '15px' : '20px';
  const sidebarWidth = isMobile ? '15vw' : '10vw';

  // Function to save the current drawing
  const handleSaveDrawing = () => {
    const dataToSave = { lines, sonificationPoints };

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);

    const fileData = {
      dataset: dataToSave,
      svg: svgString,
    };

    const jsonBlob = new Blob([JSON.stringify(fileData)], { type: "application/json" });
    const url = URL.createObjectURL(jsonBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  // Function to load a drawing
  const handleLoadDrawing = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonData = JSON.parse(event.target.result);
  
      if (jsonData.dataset) {
        const loadedLines = jsonData.dataset.lines || [];
        const loadedSonificationPoints = jsonData.dataset.sonificationPoints || [];
  
        // Update the state with loaded data
        setLines(loadedLines);
        setSonificationPoints(loadedSonificationPoints);
  
        // Rebuild intersectedDots to link sonification points for playback
        const updatedIntersectedDots = {};
        loadedLines.forEach((line) => {
          if (line.intersections) {
            Object.entries(line.intersections).forEach(([column, rows]) => {
              if (!updatedIntersectedDots[column]) updatedIntersectedDots[column] = {};
              Object.entries(rows).forEach(([row, intersectionData]) => {
                updatedIntersectedDots[column][row] = intersectionData;
              });
            });
          }
        });
  
        // Update the intersectedDots reference
        intersectedDots.current = updatedIntersectedDots;
      }
    };
  
    reader.readAsText(file);
  };
  
  const handleClickOutside = (event) => {
    // Check if the click is outside the scale menu
    if (scaleMenuRef.current && !scaleMenuRef.current.contains(event.target)) {
      setIsScaleMenuOpen(false); // Close the scale menu
    }
  };

  useEffect(() => {
    const loadSounds = async () => {
      await preloadSounds(); // Preload sounds
      setIsLoading(false);   // Hide pop-up after loading
    };
    loadSounds();
  }, []);

  useEffect(() => {
    if (isScaleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener on unmount
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isScaleMenuOpen]);

  const handleClickOutsideInstrument = (event) => {
    if (
      instrumentMenuRef.current &&
      !instrumentMenuRef.current.contains(event.target)
    ) {
      closeInstrumentMenu(); // Close the instrument menu
    }
  };
  
  useEffect(() => {
    if (selectedColor) {
      document.addEventListener("mousedown", handleClickOutsideInstrument);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideInstrument);
    }
  
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideInstrument);
  }, [selectedColor]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && playStopButtonRef.current) {
        event.preventDefault(); // Prevent default scrolling or other space-related actions
        playStopButtonRef.current.click(); // Simulate button click
      }
    };
  
    window.addEventListener('keydown', handleKeyPress);
  
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    colorInstrumentMapRef.current = colorInstrumentMap; // Update ref whenever state changes
  }, [colorInstrumentMap]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed; // Update ref whenever state changes
  }, [playbackSpeed]);

  // Update these refs whenever the state changes
  useEffect(() => {
      loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    const preventSelection = (e) => {
      e.preventDefault();
    };

    // Add event listeners to prevent selection
    window.addEventListener('selectstart', preventSelection);
    window.addEventListener('dragstart', preventSelection);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('selectstart', preventSelection);
      window.removeEventListener('dragstart', preventSelection);
    };
  }, []);

  const handleScaleChange = (selectedScale) => {
    setCurrentScale(selectedScale); // Update current scale for UI
    // setCurrentDirection(selectedScale)
    console.log('Selected scale:', currentScale);
    // if (currentScale === 'major') {
    //   setCurrentDirection('release');
    // } else if (currentScale === 'harmonicMinor') {
    //   setCurrentDirection('tension');
    // } else if (currentScale === 'melodicMinor') {
    //   setCurrentDirection('ascending');
    // }
    setScale(selectedScale); // Update global scale
    setIsScaleMenuOpen(false); // Close the menu
  };

  // Function to open the instrument selection menu for a specific color
  const openInstrumentMenu = (color) => {
    setSelectedColor(color); // Set the color for which the menu should be shown
  };

  // Function to update the selected instrument for the currently selected color
  const updateInstrumentForColor = (instrument) => {
    setColorInstrumentMap((prevMap) => ({
      ...prevMap,
      [selectedColor]: instrument, // Update the map with the selected instrument for the color
    }));
    closeInstrumentMenu(); // Close the modal after selection
  };

  // Function to close the instrument selection menu
  const closeInstrumentMenu = () => {
    setSelectedColor(null); // Clear the selected color, hiding the modal
  };

  const toggleGrid = () => {
    setShowGrid((prevShowGrid) => !prevShowGrid);
    // console.log('Grid visibility toggled:', !showGrid);
  };

  useEffect(() => {}, [playbackSpeed]);

  // Helper function to check if two line segments intersect (used for eraser functionality)
  const doLineSegmentsIntersect = (p0, p1, p2, p3) => {
    // Validate that all points are defined
    if (!p0 || !p1 || !p2 || !p3) {
      return false;
    }
  
    const det = (p1[0] - p0[0]) * (p3[1] - p2[1]) - (p1[1] - p0[1]) * (p3[0] - p2[0]);
    if (det === 0) {
      return false; // Lines are parallel
    }
    const lambda = ((p3[1] - p2[1]) * (p3[0] - p0[0]) + (p2[0] - p3[0]) * (p3[1] - p0[1])) / det;
    const gamma = ((p0[1] - p1[1]) * (p3[0] - p0[0]) + (p1[0] - p0[0]) * (p3[1] - p0[1])) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  };

  // Interpolates points between start and end to generate smooth lines
  const interpolatePoints = (start, end, numPoints) => {
    const points = [];
    for (let i = 1; i <= numPoints; i++) {
      const t = i / (numPoints + 1);
      const x = start[0] + (end[0] - start[0]) * t;
      const y = start[1] + (end[1] - start[1]) * t;
      const pressure = start[2] + (end[2] - start[2]) * t;
      points.push([x, y, pressure]);
    }
    return points;
  };

  const alignDotsToGrid = (scaleX, scaleY) => {
    const updatedDots = {};
  
    Object.keys(intersectedDots.current).forEach((colIndex) => {
      updatedDots[colIndex] = {};
      Object.keys(intersectedDots.current[colIndex]).forEach((rowIndex) => {
        const dot = intersectedDots.current[colIndex][rowIndex];
        updatedDots[colIndex][rowIndex] = {
          x: dot.x * scaleX,
          y: dot.y * scaleY,
          color: dot.color,
        };
      });
    });
  
    return updatedDots;
  };

  const handleResize = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
  
    // Calculate scale factors
    const scaleX = newWidth / originalSvgSize.current.width;
    const scaleY = newHeight / originalSvgSize.current.height;
  
    // Update each line's points
    const resizedLines = lines.map((line) => ({
      ...line,
      points: line.points.map(([x, y]) => [x * scaleX, y * scaleY]), // Scale points
    }));
  
    // Update `lines` with resized data
    setLines(resizedLines);
  
    // Recalculate the positions of sonification dots
    intersectedDots.current = alignDotsToGrid(scaleX, scaleY);
  
    // Update the original size
    originalSvgSize.current = { width: newWidth, height: newHeight };
  };

  useEffect(() => {
    const resizeListener = () => handleResize();
    window.addEventListener('resize', resizeListener);
  
    return () => window.removeEventListener('resize', resizeListener);
  }, [lines, intersectedDots]);

  // Handles the slider input for changing playback speed
  const handleSliderChange = (e) => {
    const value = Number(e.target.value);

    const playbackSpeedValue = 50 + value; // Adjusting the base to 200 ms
    setPlaybackSpeed(playbackSpeedValue); // Ensure playbackSpeed is updated correctly

    console.log("Current playback speed:", playbackSpeedValue);
  };

  // Called when user starts drawing (pointer down)
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    const clickPoint = [e.pageX, e.pageY];
  
    if (isTrash) {
      // Eraser mode: Check if the click intersects with any line's rendered stroke area
      const updatedLines = lines.filter((line) => {
        const isIntersected = line.points.some((startPoint, index) => {
          if (index === line.points.length - 1) return false; // Skip the last point
  
          const endPoint = line.points[index + 1];
          return isPointNearLineSegment(
            clickPoint,
            startPoint,
            endPoint,
            line.size // Include the stroke width in the calculation
          );
        });
  
        if (isIntersected) {
          const lineId = line.lineId;
  
          // Add the erased line to the undo stack
          setUndoStack((prev) => [...prev, { lines, sonificationPoints }]);
  
          // Remove intersections from intersectedDots
          for (const column in intersectedDots.current) {
            for (const row in intersectedDots.current[column]) {
              if (intersectedDots.current[column][row].lineId === lineId) {
                delete intersectedDots.current[column][row];
              }
            }
          }
  
          // Stop associated sounds
          stopSoundsForLine(lineId);
        }
  
        return !isIntersected; // Keep non-erased lines
      });
  
      // Update lines and sonification points
      const remainingSonificationPoints = updatedLines.flatMap((line) => line.sonificationPoints);
      setLines(updatedLines);
      setSonificationPoints(remainingSonificationPoints);
      setRedoStack([]); // Clear redo stack after erasing
    } else {
      // Regular drawing mode
      setCurrentLine([clickPoint]);
      setSonificationPoints([clickPoint]); // Initialize sound-triggering points
    }
  };

  const handlePointerMove = (e) => {
    if (e.buttons !== 1) return; // Only draw when mouse button is held down
    const newPoint = [e.pageX, e.pageY, e.pressure];
  
    if (isTrash) {
      // Eraser mode: remove sonification points that intersect with the eraser path
      setLines((prevLines) =>
        prevLines.map((line) => {
          const updatedSonificationPoints = line.sonificationPoints.filter((point) => {
            // Check if the current eraser point overlaps with this sonification point
            return !isPointNearDot(newPoint[0], newPoint[1], point[0], point[1], currentSize, line.size);
          });
  
          return {
            ...line,
            sonificationPoints: updatedSonificationPoints,
          };
        })
      );
  
      // Update the sonification points state for real-time feedback
      setSonificationPoints((prevPoints) =>
        prevPoints.filter((point) => {
          return !isPointNearDot(newPoint[0], newPoint[1], point[0], point[1], currentSize, currentSize);
        })
      );
  
      // Visually erase by drawing with the background color
      setCurrentLine((prevLine) => [...prevLine, newPoint]);
    } else {
      // Regular drawing mode
      setCurrentLine((prevLine) => [...prevLine, newPoint]);
      setSonificationPoints((prevPoints) => {
        // Interpolate points for smoother sonification
        const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : newPoint;
        const distance = Math.hypot(newPoint[0] - lastPoint[0], newPoint[1] - lastPoint[1]);
        const numInterpolatedPoints = Math.floor(distance / 5); // Adjust this value for more/less interpolation
        const interpolatedPoints = interpolatePoints(lastPoint, newPoint, numInterpolatedPoints);
        return [...prevPoints, ...interpolatedPoints, newPoint];
      });
    }
  };

  const handlePointerUp = () => {
    if (isTrash) {
      // "Soft" eraser mode: Erase only sonification points locally without deleting entire lines
      setLines((prevLines) =>
        prevLines.map((line) => {
          const updatedSonificationPoints = line.sonificationPoints.filter((point) => {
            const isNearEraser = currentLine.some((eraserPoint) =>
              isPointNearDot(eraserPoint[0], eraserPoint[1], point[0], point[1], currentSize, line.size)
            );
  
            // If the point is near the eraser, clean up `intersectedDots`
            if (isNearEraser) {
              for (const col in intersectedDots.current) {
                for (const row in intersectedDots.current[col]) {
                  if (
                    intersectedDots.current[col][row].point === point &&
                    intersectedDots.current[col][row].lineId === line.lineId
                  ) {
                    delete intersectedDots.current[col][row];
                  }
                }
              }
            }
  
            return !isNearEraser; // Keep only points not erased
          });
  
          return {
            ...line,
            sonificationPoints: updatedSonificationPoints,
          };
        })
      );
  
      // Update global sonification points (for real-time playback accuracy)
      const remainingSonificationPoints = sonificationPoints.filter((point) => {
        return !currentLine.some((eraserPoint) =>
          isPointNearDot(eraserPoint[0], eraserPoint[1], point[0], point[1], currentSize, currentSize)
        );
      });
  
      setSonificationPoints(remainingSonificationPoints);
      setCurrentLine([]); // Clear the current drawing line
    } else {
      // Regular drawing mode
      const lineId = uuidv4(); // Generate a unique ID for this new line
  
      const newLine = {
        points: currentLine,
        color: currentColor,
        size: currentSize,
        sonificationPoints: [],
        lineId, // Assign the unique ID to the line
        intersections: {}, // Initialize an object to store intersections
      };
  
      // Add intersections to both intersectedDots and newLine.intersections
      sonificationPoints.forEach((point) => {
        for (let i = 0; i < numDotsX; i++) {
          for (let j = 0; j < numDotsY; j++) {
            const dotX = (window.innerWidth / numDotsX) * i + window.innerWidth / numDotsX / 2;
            const dotY = (window.innerHeight / numDotsY) * j + window.innerHeight / numDotsY / 2;
  
            if (isPointNearDot(point[0], point[1], dotX, dotY, dotRadius, currentSize)) {
              if (!intersectedDots.current[i]) intersectedDots.current[i] = {};
              if (!newLine.intersections[i]) newLine.intersections[i] = {};
  
              intersectedDots.current[i][j] = { point, color: currentColor, size: currentSize, lineId };
              newLine.intersections[i][j] = { point, color: currentColor, size: currentSize, lineId };
            }
          }
        }
      });
  
      // Save the new line and reset the current state
      setUndoStack([...undoStack, { lines, sonificationPoints }]);
      setLines((prevLines) => [...prevLines, newLine]);
      setRedoStack([]);
      setCurrentLine([]);
      setSonificationPoints([]);
    }
  };

const handlePlay = async () => {
  if (isPlaying) return;

  setIsPlaying(true);
  playbackStopped.current = false;

  do {
    for (let column = fistColumnScan; column < numDotsX; column++) {
      if (playbackStopped.current) break;

      setCurrentColumn(column); // Update the scanned column
      setScannedColumn(column);

      // Determine if the current column is a multiple of 4 relative to `firstColumn`
      const isAccentColumn = (column - firstColumn) % 4 === 0;

      // Check the latest colorInstrumentMap and play sounds accordingly
      if (intersectedDots.current[column]) {
        const playPromises = [];
        for (const row in intersectedDots.current[column]) {
          const { color } = intersectedDots.current[column][row];
          // const note = mapRowToNote[row];
          const mapRowToNote = getMapRowToNote();
          const note = mapRowToNote[row];

          // Reference the updated colorInstrumentMap for each sound
          playPromises.push(
            playSound(
              color,
              note,
              1,
              playbackSpeedRef.current, // Use the updated playbackSpeedRef
              intersectedDots.current[column][row].lineId,
              colorInstrumentMapRef.current,
              isAccentColumn
            )
          );
        }
        await Promise.all(playPromises);
      }

      // Dynamically adjust tempo using `playbackSpeedRef.current`
      await new Promise(resolve =>
        setTimeout(resolve, playbackSpeedRef.current)
      );
    }
  } while (loopRef.current && !playbackStopped.current); // Check `loopRef.current` at the end of each pass

  setCurrentColumn(-1);
  setScannedColumn(-1);
  setIsPlaying(false);
};

  // // Undo and redo logic for managing drawing history
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack.pop();
  
      // Add current state to redo stack before applying undo
      setRedoStack([{ lines, sonificationPoints }, ...redoStack]);
  
      // Set lines and sonification points to the previous state
      setLines(previousState.lines);
      setSonificationPoints(previousState.sonificationPoints);
  
      // Clear and rebuild intersection data based on the undone lines
      intersectedDots.current = {}; // Reset first to avoid data carryover
  
      previousState.lines.forEach(line => {
        if (!line.erased) {
          // If the line was not erased, restore its intersection points
          if (line.intersections) {
            Object.entries(line.intersections).forEach(([column, rows]) => {
              if (!intersectedDots.current[column]) intersectedDots.current[column] = {};
              Object.entries(rows).forEach(([row, intersectionData]) => {
                intersectedDots.current[column][row] = intersectionData;
              });
            });
          }
        }
      });
    }
  };

  // Updated redo functionality with intersection handling
  const handleRedo = () => {
    if (redoStack.length > 0) {
      // Retrieve the next state from redo stack
      const nextState = redoStack.shift();
  
      // Add the current state to the undo stack before applying redo
      setUndoStack([...undoStack, { lines, sonificationPoints }]);
  
      // Update lines and sonification points with the redone state
      setLines(nextState.lines);
      setSonificationPoints(nextState.sonificationPoints);
  
      // Clear and rebuild intersection data based on the redone lines
      intersectedDots.current = {}; // Reset to avoid overlapping data
  
      nextState.lines.forEach(line => {
        if (!line.erased) {
          // If the line is visible (not erased), re-add its intersection points
          if (line.intersections) {
            Object.entries(line.intersections).forEach(([column, rows]) => {
              if (!intersectedDots.current[column]) intersectedDots.current[column] = {};
              Object.entries(rows).forEach(([row, intersectionData]) => {
                intersectedDots.current[column][row] = intersectionData;
              });
            });
          }
        }
      });
    }
  };


  const allStrokes = lines.map((line, index) => {
    const strokeOptions = { ...options, size: line.size };
    return (
      <path
        key={index}
        d={getSvgPathFromStroke(getStroke(line.points, strokeOptions))}
        fill={line.color}
      />
    );
  });

  // Generates the stroke for the current line being drawn
  const currentStroke = getSvgPathFromStroke(getStroke(currentLine, { ...options, size: currentSize }));

return (
  <div className="main-container">
    <div  className="controls">
      
{/* 
    <div className="custom-slider-buttons-group">
      <input
        type="range"
        min="1"
        max="100"
        step="1"
        className="custom-vertical-slider"
      />
      <div className="stacked-buttons">
        <button className="stacked-button">+</button>
        <button className="stacked-button">0</button>
        <button className="stacked-button">-</button>
      </div>
    </div> */}

      <div className="play-group">
        <button
            ref={playStopButtonRef} // Add a ref here
            className={`play-stop-button ${isPlaying ? 'stop-mode' : 'play-mode'}`}
            onClick={() => {
              if (isPlaying) {
                playbackStopped.current = true;
              } else {
                handlePlay();
              }
            }}
          >
            <img
              src={isPlaying ? StopIcon : PlayIcon}
              alt={isPlaying ? "Stop" : "Play"}
              className={`icon ${isPlaying ? "iconStop" : "iconPlay"}`}
            />
          </button>
      </div>

      {/* Loop & Scale Control */}
      <div className="loop-scale-group">
        <button
          className={`loop-button ${loop ? 'active' : 'inactive'}`}
          onClick={() => setLoop(!loop)}
        >
          <img
            src={loop ? LoopIcon : NoLoopIcon}
            alt={loop ? "Loop" : "noLoop"}
            className={loop ? "iconLoop" : "noLoop"}
          />
        </button>
        <button
            className="scale-button"
            onClick={() => setIsScaleMenuOpen(true)} // Open the pop-up
          >
            <img
              src={scaleIcons[currentScale]}
              alt={`${currentScale} icon`}
              className="scale-icon"
            />
        </button>
      </div>

      {/* Brush size slider */}
      {/* Playback Speed Slider */}
      <div className="vertical-sliders">
        <div className="brush-size-group">
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={currentSize}
            onChange={(e) => setCurrentSize(Number(e.target.value))}
          />
          </div>
          <div className="slider-group">
          <input
            id="bpm"
            type="range"
            min="60" // Slowest tempo
            max="400" // Fastest tempo
            step="5" // Increment for each slider step
            value={bpm}
            onChange={(e) => {
              const bpmValue = Number(e.target.value); // Get BPM from the slider
              setBpm(bpmValue); // Set BPM in state
              const playbackSpeedValue = Math.round(60000 / bpmValue); // Convert BPM to delay in ms
              setPlaybackSpeed(playbackSpeedValue); // Update playback speed
              // console.log("Current BPM:", bpmValue, "Playback Speed (ms):", playbackSpeedValue);
            }}
          />
        </div>
      </div>

      <div className="color-group">
        {colors.map((color, index) => (
          <div key={index} className="color-instrument-pair">
            <button
              // className="color-button"
              className={`color-button ${currentColor === color ? 'active' : ''}`} // Add active class
              // style={{ backgroundColor: isEraser ? ERASER_COLOR : color }}
              style={{ backgroundColor: isEraser ? color : color }}
              // onClick={() => {
              //   setCurrentColor(isEraser ? ERASER_COLOR : color);
              //   setIsEraser(false);
              // }}
              onClick={() => {
                setCurrentColor(color); // Set the selected color
                setIsEraser(false);     // Deactivate eraser
                setIsTrash(false);      // Deactivate trash
              }}
            />
            <button
              className="instrument-select-button"
              onClick={() => openInstrumentMenu(color)}
            >
              <img
                src={instrumentIcons[colorInstrumentMap[color]]}
                alt={colorInstrumentMap[color]}
                className="instrument-sidebar-icon"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Center the Eraser button in its own container */}
      <div className="eraser-container">
        <button
          className={`eraser-button ${isEraser ? 'active' : ''}`}
          // onClick={() => setIsEraser(!isEraser)}
          onClick={() => {
            if (isEraser) {
              // If eraser is already on, turn it off and restore the previous color
              setCurrentColor(previousColor);
              setIsTrash(false);
            } else {
              // If eraser is off, save the current color and set to eraser color
              setPreviousColor(currentColor);
              setCurrentColor(ERASER_COLOR);
              setIsTrash(false);
            }
            setIsEraser(!isEraser); // Toggle the eraser mode
          }}
        >
        <img src={EraseIcon} alt="Eraser" className="iconTrash" />
        </button>

        <button
          className={`trash-button ${isTrash ? 'active' : ''}`}
          // onClick={() => setIsTrash(!isTrash)}
          onClick={() => {
            if (isTrash) {
              // If eraser is already on, turn it off and restore the previous color
              setCurrentColor(previousColor);
              setIsEraser(false);
            } else {
              // If eraser is off, save the current color and set to eraser color
              setPreviousColor(currentColor);
              setCurrentColor(ERASER_COLOR);
              setIsEraser(false);
            }
            setIsTrash(!isTrash); // Toggle the eraser mode
          }}
        >
          <img src={TrashIcon} alt="Eraser" className="iconEraser" />
        </button>
      </div>

      {/* Undo and Redo Buttons */}
      <div className="steps-group">
        <button className="undo" onClick={handleUndo}>
          <img src={UndoIcon} alt="Undo" className="iconDo" />
        </button>
        <button className="redo" onClick={handleRedo}>
          <img src={RedoIcon} alt="Redo" className="iconDo" />
        </button>
      </div>

      {/* Save and Load Buttons */}
      <div className="save-load-buttons">
        <button className="save-button" onClick={handleSaveDrawing}>
          <img src={downloadIcon} alt="Download Icon" className="iconDown" />
        </button>
        <button
          className="load-button"
          onClick={() => loadInputRef.click()} // Trigger the hidden file input
        >
          <img src={uploadIcon} alt="Upload Icon" className="iconUp" />
        </button>
      </div>
      
      {/* Toggle Grid Visibility Button */}
      <div className="grid-group">
        <button className="grid-button" onClick={toggleGrid}>
          <img src={GridIcon} alt="Grid Icon" className="iconGrid" />
        </button>
      </div>

      {/* Hidden file input for loading */}
      <input
        type="file"
        accept=".json"
        onChange={handleLoadDrawing}
        style={{ display: "none" }} // Hide the input, trigger with a button
        ref={(input) => (loadInputRef = input)} // Assign the input to the ref
      />

      {/* Your other UI elements */}
      <svg ref={svgRef} /* other attributes */>
        {/* SVG content */}
      </svg>
    </div>

    <div className="tldraw-container">
      {/* Grid Canvas Component */}
      <GridCanvas showGrid={showGrid} scannedColumn={scannedColumn} intersectedDots={intersectedDots.current} />

      {/* SVG Drawing Area */}
      <svg
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none', width: '100%', height: '100%' }}
      >

        {allStrokes}
        {currentLine.length > 0 && <path d={currentStroke} fill={currentColor} />}
      </svg>
    </div>

    {/* Instrument Selection Modal */}
    {/* {selectedColor && (
      <div ref={instrumentMenuRef} className="instrument-selection-modal">
        <div className="instrument-options-grid">
          {instrumentOptions.map((instrument, index) => (
            <div key={index} className="instrument-option-cell">
              <button
                onClick={() => updateInstrumentForColor(instrument)}
                className="instrument-option-button"
              >
                <img
                  src={instrumentIcons[instrument]}
                  alt={instrument}
                  className="instrument-icon"
                />
              </button>
              <span className="instrument-label">
                {customInstrumentNames[instrument]}
              </span>
            </div>
          ))}
        </div>
        <button onClick={closeInstrumentMenu} className="close-modal-button">
          <img src={quitIcon} alt="Close" className="iconQuit" />
        </button>
      </div>
    )} */}

    {/* Scale Selection Modal */}
    {/* {isScaleMenuOpen && (
      <div ref={scaleMenuRef} className="scale-selection-modal">
        <div className="scale-options-vertical">
          {Object.keys(scaleIcons).map((scale) => (
            <div key={scale} className="scale-option-row">
              <button
                className="scale-option-button"
                onClick={() => handleScaleChange(scale)}
              >
                <img
                  src={scaleIcons[scale]}
                  alt={`${scale} icon`}
                  className="scale-option-icon"
                />
              </button>
              <span className="scale-label">
                {customScaleNames[scale]}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsScaleMenuOpen(false)}
          className="close-modal-button"
        >
          <img src={quitIcon} alt="Close" className="iconQuit" />
        </button>
      </div>
    )} */}

    {/* Instrument Selection Modal */}
    {selectedColor && (
      <div ref={instrumentMenuRef} className="instrument-selection-modal">
        <button onClick={closeInstrumentMenu} className="close-modal-button top-left">
          <img src={quitIcon} alt="Close" className="iconQuit" />
        </button>
        <div className="instrument-options-grid">
          {instrumentOptions.map((instrument, index) => (
            <div key={index} className="instrument-option-cell">
              <button
                onClick={() => updateInstrumentForColor(instrument)}
                className="instrument-option-button"
              >
                <img
                  src={instrumentIcons[instrument]}
                  alt={instrument}
                  className="instrument-icon"
                />
              </button>
              <span className="instrument-label">
                {customInstrumentNames[instrument]}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Scale Selection Modal */}
    {isScaleMenuOpen && (
      <div ref={scaleMenuRef} className="scale-selection-modal">
        <button
          onClick={() => setIsScaleMenuOpen(false)}
          className="close-modal-button top-left"
        >
          <img src={quitIcon} alt="Close" className="iconQuit" />
        </button>
        <div className="scale-options-grid">
          {Object.keys(scaleIcons).map((scale, index) => (
            <div key={index} className="scale-option-cell">
              <button
                className="scale-option-button"
                onClick={() => handleScaleChange(scale)}
              >
                <img
                  src={scaleIcons[scale]}
                  alt={`${scale} icon`}
                  className="scale-option-icon"
                />
              </button>
              <span className="scale-label">{customScaleNames[scale]}</span>
            </div>
          ))}
        </div>
      </div>
    )}


    {isLoading && (
      <div className="loading-popup">
        <div className="loading-content">
          <h1>SoundInk</h1>
          <p>Please wait while the sounds are being loaded.</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )}
  </div>
);
}

export default TlDrawCanvasComponent;