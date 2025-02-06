import { Point, RegressionType } from "@/types";
import {
  parseLinearFunction,
  parseQuadraticFunction,
  parseExponentialFunction,
} from "./regression";

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gridSize: number,
  unitsPerGrid: number
) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid settings
  ctx.strokeStyle = "#e5e7eb"; // gray-200
  ctx.lineWidth = 1;
  ctx.font = "12px system-ui";

  const originX = Math.round(canvas.width / 2);
  const originY = Math.round(canvas.height / 2);

  // Draw grid lines and numbers
  for (let x = originX % gridSize; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    const value =
      Math.round(((x - originX) / gridSize) * unitsPerGrid * 10) / 10;
    if (value !== 0) {
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(value.toString(), x, originY + 20);
    }
  }

  for (let y = originY % gridSize; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    const value =
      -Math.round(((y - originY) / gridSize) * unitsPerGrid * 10) / 10;
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
};

export const plotEstimatedFunction = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  estimatedFunction: string,
  regressionType: RegressionType,
  gridSize: number,
  unitsPerGrid: number
) => {
  if (!estimatedFunction) return;

  const originX = canvas.width / 2;
  const originY = canvas.height / 2;

  ctx.strokeStyle = "#22c55e"; // green-500
  ctx.lineWidth = 2;
  ctx.beginPath();

  // Plot points for the estimated function
  for (let px = 0; px < canvas.width; px += 2) {
    const x = ((px - originX) / gridSize) * unitsPerGrid;
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
        y = a * Math.exp(-b * x);
        break;
      }
    }

    const canvasY = originY - (y / unitsPerGrid) * gridSize;
    if (px === 0) {
      ctx.moveTo(px, canvasY);
    } else {
      ctx.lineTo(px, canvasY);
    }
  }
  ctx.stroke();
};

export const drawPoints = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string = "#3b82f6"
) => {
  if (points.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
};

export const canvasToMath = (
  point: Point,
  canvas: HTMLCanvasElement,
  gridSize: number,
  unitsPerGrid: number
): Point => {
  const originX = canvas.width / 2;
  const originY = canvas.height / 2;
  return {
    x: ((point.x - originX) / gridSize) * unitsPerGrid,
    y: (-(point.y - originY) / gridSize) * unitsPerGrid,
  };
};
