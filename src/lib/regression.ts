import { Point, RegressionType } from "@/types";

export const parseLinearFunction = (func: string): [number, number] => {
  const match = func.match(/(-?\d*\.?\d*)x\s*([-+])?\s*(-?\d*\.?\d*)/);
  if (!match) return [0, 0];
  const slope = parseFloat(match[1]) || 0;
  const intercept = (match[2] === "-" ? -1 : 1) * (parseFloat(match[3]) || 0);
  return [slope, intercept];
};

export const parseQuadraticFunction = (
  func: string
): [number, number, number] => {
  const match = func.match(
    /(-?\d*\.?\d*)x²\s*([-+])?\s*(-?\d*\.?\d*)x\s*([-+])?\s*(-?\d*\.?\d*)/
  );
  if (!match) return [0, 0, 0];
  const a = parseFloat(match[1]) || 0;
  const b = (match[2] === "-" ? -1 : 1) * (parseFloat(match[3]) || 0);
  const c = (match[4] === "-" ? -1 : 1) * (parseFloat(match[5]) || 0);
  return [a, b, c];
};

export const parseExponentialFunction = (func: string): [number, number] => {
  const match = func.match(/(-?\d*\.?\d*)e\^{(-?\d*\.?\d*)x}/);
  if (!match) return [0, 0];
  const a = parseFloat(match[1]) || 0;
  const b = parseFloat(match[2]) || 0;
  return [a, b];
};

export const estimateLinearFunction = (points: Point[]) => {
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

  const yPred = points.map((p) => slope * p.x + intercept);
  const confidence = calculateRSquared(
    points.map((p) => p.y),
    yPred
  );

  const formatNumber = (num: number) => Math.round(num * 100) / 100;
  const slopeStr = formatNumber(slope);
  const interceptStr = formatNumber(Math.abs(intercept));

  return {
    function:
      intercept === 0
        ? `${slopeStr}x`
        : `${slopeStr}x ${intercept >= 0 ? "+" : "-"} ${interceptStr}`,
    confidence,
  };
};

export const estimateQuadraticFunction = (points: Point[]) => {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumXXX = points.reduce((sum, p) => sum + p.x * p.x * p.x, 0);
  const sumXXXX = points.reduce((sum, p) => sum + p.x * p.x * p.x * p.x, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXXY = points.reduce((sum, p) => sum + p.x * p.x * p.y, 0);

  const d =
    n * sumXX * sumXXXX +
    2 * sumX * sumXXX * sumXX -
    sumXX * sumXX * sumXX -
    sumX * sumX * sumXXXX -
    sumXXX * sumXXX;

  if (Math.abs(d) < 1e-10) return { function: "", confidence: 0 };

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

  const yPred = points.map((p) => a * p.x * p.x + b * p.x + c);
  const confidence = calculateRSquared(
    points.map((p) => p.y),
    yPred
  );

  const formatNumber = (num: number) => Math.round(num * 100) / 100;
  return {
    function: `${formatNumber(Math.abs(a))}x² ${
      b >= 0 ? "+" : ""
    } ${formatNumber(b)}x ${c >= 0 ? "+" : ""} ${formatNumber(c)}`,
    confidence,
  };
};

export const estimateExponentialFunction = (points: Point[]) => {
  const validPoints = points.filter((p) => p.y > 0);
  if (validPoints.length < 2) return { function: "", confidence: 0 };

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

  const b = denominator !== 0 ? -numerator / denominator : 0;
  const lnA = meanY + b * meanX;
  const a = Math.exp(lnA);

  const yPred = points.map((p) => a * Math.exp(b * p.x));
  const confidence = calculateRSquared(
    points.map((p) => p.y),
    yPred
  );

  const formatNumber = (num: number) => Math.round(num * 100) / 100;
  return {
    function: `${formatNumber(a)}e^{${formatNumber(b)}x}`,
    confidence,
  };
};

export const calculateRSquared = (actual: number[], predicted: number[]) => {
  const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const ssResidual = actual.reduce(
    (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
    0
  );
  return 1 - ssResidual / ssTotal;
};

export const estimateFunction = (points: Point[], type: RegressionType) => {
  if (points.length < 2) return { function: "", confidence: 0 };

  switch (type) {
    case "linear":
      return estimateLinearFunction(points);
    case "quadratic":
      return estimateQuadraticFunction(points);
    case "exponential":
      return estimateExponentialFunction(points);
    default:
      return { function: "", confidence: 0 };
  }
};
