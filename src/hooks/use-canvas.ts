import { useEffect, useRef, useState } from "react";
import { Point, RegressionType } from "@/types";
import {
  canvasToMath,
  drawGrid,
  drawPoints,
  plotEstimatedFunction,
} from "@/lib/canvas";
import { estimateFunction } from "@/lib/regression";

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [estimatedFunction, setEstimatedFunction] = useState<string>("");
  const [regressionType, setRegressionType] =
    useState<RegressionType>("linear");
  const [confidence, setConfidence] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [gridDensity, setGridDensity] = useState<number>(1);

  // Constants for coordinate system
  const BASE_GRID_SIZE = 40;
  const GRID_SIZE = BASE_GRID_SIZE * gridDensity;
  const UNITS_PER_GRID = 1 / zoom;

  const clearDrawing = () => {
    setPoints([]);
    setEstimatedFunction("");
    setConfidence(0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx, canvas, GRID_SIZE, UNITS_PER_GRID);
    clearDrawing();
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
    clearDrawing();
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.2));
    clearDrawing();
  };

  const handleZoomReset = () => {
    setZoom(1);
    setGridDensity(1);
    clearDrawing();
  };

  const handleGridDensityChange = () => {
    setGridDensity((prev) => (prev === 1 ? 0.5 : prev === 0.5 ? 2 : 1));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate new zoom level
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out (0.9) or in (1.1)
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 5); // Clamp between 0.2 and 5

    setZoom(newZoom);
    clearDrawing();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([{ x, y }]);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx, canvas, GRID_SIZE, UNITS_PER_GRID);
    drawPoints(ctx, [{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clear and redraw everything
    drawGrid(ctx, canvas, GRID_SIZE, UNITS_PER_GRID);

    // Draw all points collected so far
    const newPoints = [...points, { x, y }];
    drawPoints(ctx, newPoints);

    // Update points array
    setPoints(newPoints);

    // Estimate and draw function if we have enough points
    if (points.length > 1) {
      const mathPoints = newPoints.map((p) =>
        canvasToMath(p, canvas, GRID_SIZE, UNITS_PER_GRID)
      );
      const result = estimateFunction(mathPoints, regressionType);
      setEstimatedFunction(result.function);
      setConfidence(result.confidence);
      if (result.function) {
        plotEstimatedFunction(
          ctx,
          canvas,
          result.function,
          regressionType,
          GRID_SIZE,
          UNITS_PER_GRID
        );
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and redraw everything in the correct order
    drawGrid(ctx, canvas, GRID_SIZE, UNITS_PER_GRID);
    drawPoints(ctx, points);

    // Update the estimated function
    const mathPoints = points.map((p) =>
      canvasToMath(p, canvas, GRID_SIZE, UNITS_PER_GRID)
    );
    const result = estimateFunction(mathPoints, regressionType);
    setEstimatedFunction(result.function);
    setConfidence(result.confidence);
  };

  // Update canvas size and redraw when container size changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      // Set canvas size to match container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawGrid(ctx, canvas, GRID_SIZE, UNITS_PER_GRID);

      // Redraw points and function if they exist
      if (points.length > 0) {
        drawPoints(ctx, points);
        if (estimatedFunction) {
          plotEstimatedFunction(
            ctx,
            canvas,
            estimatedFunction,
            regressionType,
            GRID_SIZE,
            UNITS_PER_GRID
          );
        }
      }
    };

    // Initial size
    updateCanvasSize();

    // Handle window resize
    window.addEventListener("resize", updateCanvasSize);

    // Handle container resize
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, [GRID_SIZE, UNITS_PER_GRID, points, estimatedFunction, regressionType]);

  // Update grid when zoom or density changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGrid(ctx, canvas, GRID_SIZE, UNITS_PER_GRID);
  }, [GRID_SIZE, UNITS_PER_GRID]);

  return {
    canvasRef,
    estimatedFunction,
    confidence,
    regressionType,
    setRegressionType,
    handleGridDensityChange,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    clearCanvas,
    handleWheel,
    startDrawing,
    draw,
    stopDrawing,
  };
};
