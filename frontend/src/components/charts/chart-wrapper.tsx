'use client';

import { ReactNode, useRef, useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { exportToCSV, exportToPNG, exportToSVG } from '@/lib/chart-export';

interface ChartWrapperProps {
  children: ReactNode;
  data: any[];
  title: string;
  enableExport?: boolean;
  enableZoom?: boolean;
}

export function ChartWrapper({
  children,
  data,
  title,
  enableExport = true,
  enableZoom = false
}: ChartWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleExportCSV = () => {
    exportToCSV(data, title.replace(/\s+/g, '_').toLowerCase());
    setShowExportMenu(false);
  };

  const handleExportPNG = () => {
    exportToPNG(chartRef.current, title.replace(/\s+/g, '_').toLowerCase());
    setShowExportMenu(false);
  };

  const handleExportSVG = () => {
    exportToSVG(chartRef.current, title.replace(/\s+/g, '_').toLowerCase());
    setShowExportMenu(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.6));
  };

  return (
    <div className="relative">
      {/* Chart Controls */}
      <div className="absolute top-0 right-0 z-10 flex gap-2">
        {enableZoom && (
          <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-50 rounded-l-lg"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-50 rounded-r-lg border-l border-gray-200"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}

        {enableExport && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
              title="Export Chart"
            >
              <Download className="h-4 w-4 text-gray-600" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={handleExportPNG}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg text-sm"
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={handleExportSVG}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-t border-gray-100"
                  >
                    Export as SVG
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg text-sm border-t border-gray-100"
                  >
                    Export as CSV
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div
        ref={chartRef}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
}
