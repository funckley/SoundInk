// gridConfig.js

export const firstColumn = 0; // Number of columns to hide initially
export const fistColumnScan = firstColumn; // First column to scan
export const numDotsX = 36;   // Total number of columns
export const numDotsY = 15;   // Total number of rows
export const dotRadius = 5;   // Radius of each dot  
// Add any other global configuration values her05

export const gridConfigurations = [
    { numDotsX: 8, numDotsY: 15, dotRadius: 10, accent: 2 }, // 2/4
    { numDotsX: 12, numDotsY: 15, dotRadius: 10, accent: 3 }, // 3/4
    { numDotsX: 16, numDotsY: 15, dotRadius: 9, accent: 4 },  // 4/4
    { numDotsX: 24, numDotsY: 15, dotRadius: 7, accent: 6 },  // 6/8
    { numDotsX: 32, numDotsY: 15, dotRadius: 6, accent: 8 }, // 4/8
    { numDotsX: 48, numDotsY: 15, dotRadius: 5, accent: 12 }, // 12/16
  ];

  // meters:
  //  3/4 4/4 6/8 4/8 