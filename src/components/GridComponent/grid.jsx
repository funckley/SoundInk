import React, { useRef, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { firstColumn, numDotsX, numDotsY, dotRadius } from './gridConfig'; // Import constants

const ERASER_COLOR = '#eae6e1'; // Choose a color that represents the eraser

const GridCanvas = ({ showGrid, scannedColumn, intersectedDots }) => {
    const canvasRef = useRef(null);

    const drawGlowingDot = (ctx, x, y, color) => {
        ctx.save(); // Save the context state
    
        const glowLayers = [
            { blur: 15, sizeMultiplier: 7, color: `${color}33` },  // Softer outer glow
            { blur: 10, sizeMultiplier: 5, color: `${color}55` },    // Mid glow
            { blur: 5, sizeMultiplier: 3, color: `${color}99` },     // Inner glow
            { blur: 2, sizeMultiplier: 1.5, color: `${color}CC` }    // Core glow, slightly transparent
        ];
    
        glowLayers.forEach(({ blur, sizeMultiplier, color }) => {
            ctx.shadowColor = color;
            ctx.shadowBlur = blur;
            ctx.fillStyle = color;
    
            ctx.beginPath();
            ctx.arc(x, y, dotRadius * sizeMultiplier, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        });
    
        ctx.restore(); // Restore the original context state
    };

    const drawSmoothDot = (ctx, x, y, color, isScanned, isIntersected) => {
        if (isScanned || isIntersected) {
            drawGlowingDot(ctx, x, y, color);
        } else {
            const circlePoints = [
                [x - dotRadius, y],
                [x, y - dotRadius],
                [x + dotRadius, y],
                [x, y + dotRadius],
                [x - dotRadius, y],
            ];

            const path = getStroke(circlePoints, {
                size: dotRadius * 2,
                thinning: 0,
                smoothing: 1,
                streamline: 1,
                start: { taper: 0 },
                end: { taper: 0 },
            });

            ctx.fillStyle = color;
            ctx.beginPath();
            path.forEach(([px, py], i) => {
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            });
            ctx.closePath();
            ctx.fill();
        }
    };

    const drawDots = (ctx, width, height) => {
        const dotSpacingX = width / numDotsX;
        const dotSpacingY = height / numDotsY;
    
        ctx.clearRect(0, 0, width, height);
    
        for (let i = 0; i < numDotsX; i++) {
            if (i < firstColumn) continue; // Skip columns before firstVisibleColumn

            for (let j = 0; j < numDotsY; j++) {
                const x = i * dotSpacingX + dotSpacingX / 2;
                const y = j * dotSpacingY + dotSpacingY / 2;

                const isScanned = i === scannedColumn; // Check if it's the scanned column
                const intersectData = intersectedDots?.[i]?.[j]; // Check if this dot is intersected
                const isIntersected = Boolean(intersectData);

                // Logging the row and column for debugging
                // console.log(`Rendering dot at (${i}, ${j}) - Scanned: ${isScanned}, Intersected: ${isIntersected}, Color: ${intersectData?.color}`);
                
                // Check if the intersected dot's color is the eraser (background color)
                const isBackgroundColor = intersectData?.color === ERASER_COLOR;

                if (isScanned && isIntersected && !isBackgroundColor) {
                    const lineColor = intersectData.color;
                    drawGlowingDot(ctx, x, y, lineColor); // Draw intense glow
                } else if (isScanned) {
                    drawSmoothDot(ctx, x, y, 'rgba(255, 88, 51, 0.11)', true); // Mild glow for scanned dots
                } else if (isBackgroundColor) {
                    // For dots erased with the soft eraser, draw with the regular dot color
                    drawSmoothDot(ctx, x, y, 'rgba(228, 193, 158, 0.5)', false);
                } else {
                    drawSmoothDot(ctx, x, y, 'rgba(228, 193, 158, 0.5)', false); // Regular dot color
                }
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (showGrid) {
                drawDots(ctx, canvas.width, canvas.height); // Only draw dots if grid is shown
            }
        };
    
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [scannedColumn, intersectedDots, showGrid]); // Add showGrid as a dependency

    return showGrid ? <canvas ref={canvasRef} className="grid-canvas" /> : null;
};

export default GridCanvas;
