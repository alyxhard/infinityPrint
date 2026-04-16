import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Chrome, CheckCircle, Info } from 'lucide-react';
import { manifestJson, backgroundJs, contentJs, contentCss, readmeMd } from './extension-files';

export default function App() {
  const generateIcon = (size: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(new Blob([]));

      // Draw background
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.beginPath();
      // Use roundRect if available, otherwise fallback to rect
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, size, size, size * 0.22);
      } else {
        ctx.rect(0, 0, size, size);
      }
      ctx.fill();

      // Draw Chrome logo matching Lucide styling
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, size * (2 / 24)); // equivalent to 2px stroke in 24px viewbox
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Helper to map coordinates from 24x24 SVG viewBox to dynamic size
      const map = (val: number) => (val / 24) * size;

      // Outer circle (<circle cx="12" cy="12" r="10"></circle>)
      ctx.beginPath();
      ctx.arc(map(12), map(12), map(10), 0, 2 * Math.PI);
      ctx.stroke();

      // Inner circle (<circle cx="12" cy="12" r="4"></circle>)
      ctx.beginPath();
      ctx.arc(map(12), map(12), map(4), 0, 2 * Math.PI);
      ctx.stroke();

      // Line 1 (<line x1="21.17" y1="8" x2="12" y2="8"></line>)
      ctx.beginPath();
      ctx.moveTo(map(21.17), map(8));
      ctx.lineTo(map(12), map(8));
      ctx.stroke();

      // Line 2 (<line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>)
      ctx.beginPath();
      ctx.moveTo(map(3.95), map(6.06));
      ctx.lineTo(map(8.54), map(14));
      ctx.stroke();

      // Line 3 (<line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>)
      ctx.beginPath();
      ctx.moveTo(map(10.88), map(21.94));
      ctx.lineTo(map(15.46), map(14));
      ctx.stroke();

      canvas.toBlob((blob) => {
        resolve(blob || new Blob([]));
      }, 'image/png');
    });
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    
    zip.file('manifest.json', manifestJson);
    zip.file('background.js', backgroundJs);
    zip.file('content.js', contentJs);
    zip.file('content.css', contentCss);
    zip.file('README.md', readmeMd);

    // Generate and add icons
    zip.file('icon16.png', await generateIcon(16));
    zip.file('icon48.png', await generateIcon(48));
    zip.file('icon128.png', await generateIcon(128));

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'scroll-print-extension.zip');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
          <Chrome size={32} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Scroll Print Area</h1>
        <p className="text-gray-500 mb-8">
          Download the .zip file, extract it, and load it into Chrome.
        </p>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
        >
          <Download size={24} />
          Download Extension (.zip)
        </button>

        <div className="mt-8 text-left bg-blue-50 p-5 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-blue-600" />
            How to install:
          </h3>
          <ol className="text-sm text-blue-800 space-y-3 ml-5 list-decimal marker:font-bold">
            <li>Extract the downloaded <code className="bg-blue-100 px-1 rounded">.zip</code> archive into a folder.</li>
            <li>Go to <code className="bg-blue-100 px-1 rounded font-bold">chrome://extensions</code> in your browser.</li>
            <li>Enable <b>Developer mode</b> in the top right corner.</li>
            <li>Click <b>Load unpacked</b> and select the folder you just extracted.</li>
          </ol>
        </div>

        <div className="mt-4 text-left bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Info size={18} className="text-gray-600" />
            How to use:
          </h3>
          <ol className="text-sm text-gray-700 space-y-3 ml-5 list-decimal marker:font-bold">
            <li><b>Activate:</b> Click the extension icon in your Chrome toolbar.</li>
            <li><b>Select:</b> Click and hold the left mouse button to draw a selection box.</li>
            <li><b>Scroll:</b> While holding the mouse button down, use your mouse wheel to scroll down the page and stretch the area.</li>
            <li><b>Capture:</b> Release the mouse button. The extension will auto-stitch the image and copy it to your clipboard.</li>
            <li><b>Paste:</b> Press <kbd className="bg-gray-200 px-1 rounded text-xs">Ctrl+V</kbd> or <kbd className="bg-gray-200 px-1 rounded text-xs">Cmd+V</kbd> to paste the image anywhere!</li>
            <li><b>Cancel:</b> Press <kbd className="bg-gray-200 px-1 rounded text-xs">ESC</kbd> at any time to cancel.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
