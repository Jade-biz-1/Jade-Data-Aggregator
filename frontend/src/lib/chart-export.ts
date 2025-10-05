/**
 * Export chart data to CSV format
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Download file
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

/**
 * Export chart as PNG image
 */
export function exportToPNG(chartRef: HTMLElement | null, filename: string) {
  if (!chartRef) {
    console.warn('Chart reference not found');
    return;
  }

  // Find SVG element in the chart
  const svgElement = chartRef.querySelector('svg');
  if (!svgElement) {
    console.warn('SVG element not found in chart');
    return;
  }

  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;

  // Get SVG dimensions
  const bbox = svgElement.getBoundingClientRect();
  clonedSvg.setAttribute('width', bbox.width.toString());
  clonedSvg.setAttribute('height', bbox.height.toString());

  // Convert SVG to data URL
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Create image from SVG
  const img = new Image();
  img.onload = () => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = bbox.width * 2; // 2x for better quality
    canvas.height = bbox.height * 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for better quality
    ctx.scale(2, 2);

    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, bbox.width, bbox.height);

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

/**
 * Export chart as SVG
 */
export function exportToSVG(chartRef: HTMLElement | null, filename: string) {
  if (!chartRef) {
    console.warn('Chart reference not found');
    return;
  }

  const svgElement = chartRef.querySelector('svg');
  if (!svgElement) {
    console.warn('SVG element not found in chart');
    return;
  }

  // Clone and serialize SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  const svgData = new XMLSerializer().serializeToString(clonedSvg);

  downloadFile(svgData, `${filename}.svg`, 'image/svg+xml');
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
