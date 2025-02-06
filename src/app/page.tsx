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
import { useCanvas } from "@/hooks/use-canvas";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  const {
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
  } = useCanvas();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Logo />
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
