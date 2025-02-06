"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  ZoomIn,
  ZoomOut,
  Grid2x2,
  Maximize2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RegressionType = "linear" | "quadratic" | "exponential";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
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
      drawGrid(ctx, canvas);
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
  }, []);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid settings
    ctx.strokeStyle = "#e5e7eb"; // gray-200
    ctx.lineWidth = 1;
    ctx.font = "12px system-ui";

    const originX = Math.round(canvas.width / 2);
    const originY = Math.round(canvas.height / 2);

    // Draw grid lines and numbers
    for (let x = originX % GRID_SIZE; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();

      const value =
        Math.round(((x - originX) / GRID_SIZE) * UNITS_PER_GRID * 10) / 10;
      if (value !== 0) {
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "center";
        ctx.fillText(value.toString(), x, originY + 20);
      }
    }

    for (let y = originY % GRID_SIZE; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();

      const value =
        -Math.round(((y - originY) / GRID_SIZE) * UNITS_PER_GRID * 10) / 10;
      if (value !== 0) {
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "right";
        ctx.fillText(value.toString(), originX - 10, y + 4);
      }
    }

    // Draw axes
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvas.width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvas.height);
    ctx.stroke();

    ctx.fillStyle = "#000000";
    ctx.textAlign = "right";
    ctx.fillText("0", originX - 8, originY + 20);

    // Plot the estimated function if it exists
    if (estimatedFunction) {
      plotEstimatedFunction(ctx, canvas);
    }
  };

  // Convert canvas coordinates to mathematical coordinates
  const canvasToMath = (
    point: { x: number; y: number },
    canvas: HTMLCanvasElement
  ) => {
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    return {
      x: ((point.x - originX) / GRID_SIZE) * UNITS_PER_GRID,
      y: (-(point.y - originY) / GRID_SIZE) * UNITS_PER_GRID,
    };
  };

  // Function to plot the estimated function
  const plotEstimatedFunction = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    if (!estimatedFunction) return;

    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    ctx.strokeStyle = "#22c55e"; // green-500
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Plot points for the estimated function
    for (let px = 0; px < canvas.width; px += 2) {
      const x = ((px - originX) / GRID_SIZE) * UNITS_PER_GRID;
      let y;

      switch (regressionType) {
        case "linear": {
          const [slope, intercept] = parseLinearFunction(estimatedFunction);
          y = slope * x + intercept;
          break;
        }
        case "quadratic": {
          const [a, b, c] = parseQuadraticFunction(estimatedFunction);
          y = a * x * x + b * x + c;
          break;
        }
        case "exponential": {
          const [a, b] = parseExponentialFunction(estimatedFunction);
          y = a * Math.exp(-b * x); // Flip the sign of b*x to match drawing direction
          break;
        }
      }

      const canvasY = originY - (y / UNITS_PER_GRID) * GRID_SIZE;
      if (px === 0) {
        ctx.moveTo(px, canvasY);
      } else {
        ctx.lineTo(px, canvasY);
      }
    }
    ctx.stroke();
  };

  // Parse functions
  const parseLinearFunction = (func: string): [number, number] => {
    const match = func.match(/(-?\d*\.?\d*)x\s*([-+])?\s*(-?\d*\.?\d*)/);
    if (!match) return [0, 0];
    const slope = parseFloat(match[1]) || 0;
    const intercept = (match[2] === "-" ? -1 : 1) * (parseFloat(match[3]) || 0);
    return [slope, intercept];
  };

  const parseQuadraticFunction = (func: string): [number, number, number] => {
    // Simplified parser for ax² + bx + c
    const match = func.match(
      /(-?\d*\.?\d*)x²\s*([-+])?\s*(-?\d*\.?\d*)x\s*([-+])?\s*(-?\d*\.?\d*)/
    );
    if (!match) return [0, 0, 0];
    const a = parseFloat(match[1]) || 0;
    const b = (match[2] === "-" ? -1 : 1) * (parseFloat(match[3]) || 0);
    const c = (match[4] === "-" ? -1 : 1) * (parseFloat(match[5]) || 0);
    return [a, b, c];
  };

  const parseExponentialFunction = (func: string): [number, number] => {
    // Parse ae^(bx)
    const match = func.match(/(-?\d*\.?\d*)e\^{(-?\d*\.?\d*)x}/);
    if (!match) return [0, 0];
    const a = parseFloat(match[1]) || 0;
    const b = parseFloat(match[2]) || 0;
    return [a, b];
  };

  // Estimate function using selected regression type
  const estimateFunction = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";

    const canvas = canvasRef.current;
    if (!canvas) return "";

    const mathPoints = points.map((p) => canvasToMath(p, canvas));

    switch (regressionType) {
      case "linear":
        return estimateLinearFunction(mathPoints);
      case "quadratic":
        return estimateQuadraticFunction(mathPoints);
      case "exponential":
        return estimateExponentialFunction(mathPoints);
      default:
        return "";
    }
  };

  const estimateLinearFunction = (points: { x: number; y: number }[]) => {
    const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    let numerator = 0;
    let denominator = 0;
    points.forEach((point) => {
      const xDiff = point.x - meanX;
      numerator += xDiff * (point.y - meanY);
      denominator += xDiff * xDiff;
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Calculate R-squared (confidence)
    const yPred = points.map((p) => slope * p.x + intercept);
    setConfidence(
      calculateRSquared(
        points.map((p) => p.y),
        yPred
      )
    );

    const formatNumber = (num: number) => Math.round(num * 100) / 100;
    const slopeStr = formatNumber(slope);
    const interceptStr = formatNumber(Math.abs(intercept));

    if (intercept === 0) return `${slopeStr}x`;
    return `${slopeStr}x ${intercept >= 0 ? "+" : "-"} ${interceptStr}`;
  };

  const estimateQuadraticFunction = (points: { x: number; y: number }[]) => {
    // Simple quadratic regression using least squares
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumXXX = points.reduce((sum, p) => sum + p.x * p.x * p.x, 0);
    const sumXXXX = points.reduce((sum, p) => sum + p.x * p.x * p.x * p.x, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXXY = points.reduce((sum, p) => sum + p.x * p.x * p.y, 0);

    // Solve system of equations
    const d =
      n * sumXX * sumXXXX +
      2 * sumX * sumXXX * sumXX -
      sumXX * sumXX * sumXX -
      sumX * sumX * sumXXXX -
      sumXXX * sumXXX;

    if (Math.abs(d) < 1e-10) return "";

    // Calculate coefficients and flip the sign of 'a' to match canvas coordinates
    const a = -(
      (n * sumXXY * sumXX +
        sumX * sumXY * sumXXX +
        sumY * sumXXX * sumXX -
        sumXX * sumXXY * sumXX -
        sumX * sumXXX * sumY -
        sumXY * sumXXX) /
      d
    );
    const b =
      (n * sumXX * sumXXY +
        sumY * sumXXX * sumX +
        sumXY * sumXX * sumXX -
        sumXX * sumXY * sumXX -
        sumY * sumXX * sumXXX -
        sumX * sumXXY) /
      d;
    const c =
      (sumY * sumXX * sumXXXX +
        sumXY * sumXXX * sumXX +
        sumXXY * sumX * sumXXX -
        sumXX * sumXXY * sumXXX -
        sumXY * sumX * sumXXXX -
        sumY * sumXXX * sumXXX) /
      d;

    // Calculate R-squared
    const yPred = points.map((p) => a * p.x * p.x + b * p.x + c);
    setConfidence(
      calculateRSquared(
        points.map((p) => p.y),
        yPred
      )
    );

    const formatNumber = (num: number) => Math.round(num * 100) / 100;
    return `${formatNumber(Math.abs(a))}x² ${b >= 0 ? "+" : ""} ${formatNumber(
      b
    )}x ${c >= 0 ? "+" : ""} ${formatNumber(c)}`;
  };

  const estimateExponentialFunction = (points: { x: number; y: number }[]) => {
    // Convert to linear form: ln(y) = ln(a) + bx
    const validPoints = points.filter((p) => p.y > 0);
    if (validPoints.length < 2) return "";

    const lnPoints = validPoints.map((p) => ({ x: p.x, y: Math.log(p.y) }));
    const meanX = lnPoints.reduce((sum, p) => sum + p.x, 0) / lnPoints.length;
    const meanY = lnPoints.reduce((sum, p) => sum + p.y, 0) / lnPoints.length;

    let numerator = 0;
    let denominator = 0;
    lnPoints.forEach((point) => {
      const xDiff = point.x - meanX;
      numerator += xDiff * (point.y - meanY);
      denominator += xDiff * xDiff;
    });

    const b = denominator !== 0 ? -numerator / denominator : 0; // Flip the sign of b
    const lnA = meanY + b * meanX; // Change subtraction to addition due to sign flip
    const a = Math.exp(lnA);

    // Calculate R-squared
    const yPred = points.map((p) => a * Math.exp(b * p.x));
    setConfidence(
      calculateRSquared(
        points.map((p) => p.y),
        yPred
      )
    );

    const formatNumber = (num: number) => Math.round(num * 100) / 100;
    return `${formatNumber(a)}e^{${formatNumber(b)}x}`;
  };

  const calculateRSquared = (actual: number[], predicted: number[]) => {
    const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssTotal = actual.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    );
    const ssResidual = actual.reduce(
      (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
      0
    );
    return 1 - ssResidual / ssTotal;
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

    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
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
    drawGrid(ctx, canvas);

    // Draw all points collected so far
    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(x, y);
    ctx.stroke();

    // Update points array
    setPoints([...points, { x, y }]);

    // Estimate and draw function if we have enough points
    if (points.length > 1) {
      const newEstimatedFunction = estimateFunction([...points, { x, y }]);
      setEstimatedFunction(newEstimatedFunction);
      if (newEstimatedFunction) {
        plotEstimatedFunction(ctx, canvas);
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
    drawGrid(ctx, canvas);

    // Draw the blue line
    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Update the estimated function
    const newEstimatedFunction = estimateFunction(points);
    setEstimatedFunction(newEstimatedFunction);
  };

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

    drawGrid(ctx, canvas);
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

  // Update grid when zoom or density changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGrid(ctx, canvas);
  }, [zoom, gridDensity]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-bold">Plotify</div>
            <div className="flex items-center gap-4">
              {confidence > 0 && (
                <div className="text-sm text-gray-600">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="text-center mb-8">
          <span className="text-2xl">f(x) = </span>
          <span className="text-2xl font-mono">
            {estimatedFunction ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: estimatedFunction
                    .replace("x²", "x<sup>2</sup>")
                    .replace("e^{", "e<sup>")
                    .replace("x}", "x</sup>"),
                }}
              />
            ) : (
              "________"
            )}
          </span>
        </div>

        <div className="relative bg-white rounded-lg shadow-lg border flex-1 mb-2">
          {/* Canvas controls */}
          <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white hover:bg-gray-100 gap-2"
                >
                  {regressionType.charAt(0).toUpperCase() +
                    regressionType.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRegressionType("linear")}>
                  Linear
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRegressionType("quadratic")}
                >
                  Quadratic
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRegressionType("exponential")}
                >
                  Exponential
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              className="bg-white hover:bg-gray-100"
              onClick={handleGridDensityChange}
            >
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleZoomReset}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Reset Zoom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              className="bg-white hover:bg-gray-100"
              onClick={clearCanvas}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-lg"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onWheel={handleWheel}
          />
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          ⭐ Developed by{" "}
          <Link
            href="https://github.com/magnusrodseth"
            className="underline"
            target="_blank"
          >
            Magnus Rødseth
          </Link>
        </div>
      </main>
    </div>
  );
}
