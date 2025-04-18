import { isPointNearDot, isPointNearLineSegment, getSvgPathFromStroke, getStroke } from './import';
import { v4 as uuidv4 } from 'uuid';

export const handlePointerDown = (e, {
  isTrash,
  setIsPointerDown,
  setTrashLinePoints,
  lines,
  setUndoStack,
  intersectedDots,
  stopSoundsForLine,
  setLines,
  setSonificationPoints,
  setRedoStack,
  setCurrentLine,
  setSonificationPoints,
  clickPoint,
  svgRef,
  currentColor,
  currentSize,
  ERASER_COLOR,
  previousColor,
  setPreviousColor,
  setCurrentColor,
  setIsEraser,
  setIsTrash,
  isEraser,
  setIsEraser,
  setIsTrash,
  setCurrentLine,
  setSonificationPoints
}) => {
  e.target.setPointerCapture(e.pointerId);
  const clickPoint = [e.pageX, e.pageY];

  if (isTrash) {
    setIsPointerDown(true);
    const { clientX, clientY } = e;
    const canvasRect = svgRef.current.getBoundingClientRect();
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;
    setTrashLinePoints([[x, y]]);

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

export const handlePointerMove = (e, {
  isTrash,
  isPointerDown,
  setTrashLinePoints,
  lines,
  setUndoStack,
  intersectedDots,
  stopSoundsForLine,
  setLines,
  setSonificationPoints,
  setRedoStack,
  setCurrentLine,
  setSonificationPoints,
  newPoint,
  currentSize,
  interpolatePoints,
  sonificationPoints,
  currentLine,
  svgRef
}) => {
  if (e.buttons !== 1) return; // Only draw when mouse button is held down
  const newPoint = [e.pageX, e.pageY, e.pressure];

  if (isTrash && isPointerDown) {
    const { clientX, clientY } = e;
    const canvasRect = svgRef.current.getBoundingClientRect();
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;
    setTrashLinePoints((prevPoints) => [...prevPoints, [x, y]]);

    // Check for intersections with lines
    const updatedLines = lines.filter(line => {
      const isIntersected = line.points.some(([px, py]) => {
        return trashLinePoints.some(([tx, ty]) => {
          const distance = Math.sqrt((px - tx) ** 2 + (py - ty) ** 2);
          return distance < 10; // Adjust the threshold as needed
        });
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
  } else if (isTrash) {
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

export const handlePointerUp = ({
  isTrash,
  setIsPointerDown,
  setTrashLinePoints,
  currentLine,
  setLines,
  setSonificationPoints,
  intersectedDots,
  currentSize,
  sonificationPoints,
  uuidv4,
  numDotsX,
  numDotsY,
  dotRadius,
  currentColor,
  setUndoStack,
  undoStack,
  setRedoStack,
  svgRef,
  ERASER_COLOR,
  previousColor,
  setPreviousColor,
  setCurrentColor,
  setIsEraser,
  setIsTrash,
  isEraser,
  setIsEraser,
  setIsTrash,
  setCurrentLine,
  setSonificationPoints
}) => {
  if (isTrash) {
    setIsPointerDown(false);
    setTrashLinePoints([]); // Clear the trash line points

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