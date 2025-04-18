import { getStrokePoints, getStrokeOutlinePoints } from "perfect-freehand";

// Constants for brush colors and sizes
export const colors = ['#161a1d', '#ffb703', '#219ebc', '#9a031e', '#006400'];

export const sizes = [25, 50];
export const MAX_DELAY = 600; // Maximum delay in milliseconds for the slowest speed
const color0 = '#161a1d'; // Default color for the first brush

// export const ERASER_COLOR = '#eae6e1'; // Choose a color that represents the eraser
export const ERASER_COLOR = 'color0'; // Choose a color that represents the eraser

export const thinning = 0.5; // Amount to thin the stroke by
// Options for stroke drawing (customizable for smoothness, taper, etc.)
export const options = {
  size: 16,
  thinning: thinning,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
  end: {
    taper: 20,
    easing: (t) => t,
    cap: true,
  },
};

// Helper function to check if a point (from a line) is close enough to a dot
export const isPointNearDot = (pointX, pointY, dotX, dotY, dotRadius, lineThickness) => {
  const distance = Math.hypot(pointX - dotX, pointY - dotY);
  // Include both dotRadius and line thickness in the intersection threshold
  return distance <= dotRadius + (lineThickness - 10) / 2;
};

// export const isPointNearDot = (pointX, pointY, dotX, dotY, dotRadius, strokeOutline, index) => {
//   // Calculate the distance between the point and the dot
//   const distance = Math.hypot(pointX - dotX, pointY - dotY);

//   // Calculate the local width of the stroke at the given index
//   const localWidth = calculateLocalWidth(strokeOutline, index);

//   // Check if the distance is within the combined radius of the dot and the local stroke width
//   return distance <= dotRadius + localWidth / 2;
// };

export const calculateLocalWidth = (strokeOutline, index) => {
  // Ensure the strokeOutline is valid and the index is within bounds
  if (!strokeOutline || strokeOutline.length === 0 || index < 0 || index >= strokeOutline.length) {
    console.error('Invalid strokeOutline or index out of bounds:', { strokeOutline, index });
    return 0; // Return 0 as a fallback width
  }

  const leftPoint = strokeOutline[index];
  const rightPoint = strokeOutline[strokeOutline.length - 1 - index];

  // Ensure the points are valid
  if (!leftPoint || !rightPoint) {
    console.error('Invalid points in strokeOutline:', { leftPoint, rightPoint });
    return 0; // Return 0 as a fallback width
  }

  return Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
};

/**
 * Calculates the maximum stroke width based on perfect-freehand options.
 * @param {object} options - The perfect-freehand options (e.g., size, thinning).
 * @returns {number} - The calculated stroke width.
 */
export const getStrokeWidthFromOptions = (options) => {
  // The maximum stroke width is determined by the `size` option
  // and the effect of `thinning` (if thinning is applied).
  return options.size * (1 - options.thinning); // Maximum width without pressure
};

export const getStrokeWidth = (pressure = 0.5, options) => {
  return options.size * (1 - options.thinning + pressure * options.thinning);
};


export const isPointNearLineSegment = (point, start, end, strokeWidth) => {
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