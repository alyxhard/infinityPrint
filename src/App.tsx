import React, { useState } from 'react';
import { Code } from 'lucide-react';
import { manifestJson, backgroundJs, contentJs, contentCss } from './extension-files';

export default function App() {
  const [activeTab, setActiveTab] = useState('manifest.json');

  const files = {
    'manifest.json': manifestJson,
    'background.js': backgroundJs,
    'content.js': contentJs,
    'content.css': contentCss,
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-300 font-sans flex flex-col">
      <div className="bg-[#252526] border-b border-[#333] px-4 pt-2 flex items-center gap-1 overflow-x-auto">
        <Code size={18} className="text-gray-400 mx-2 shrink-0" />
        {Object.keys(files).map((filename) => (
          <button
            key={filename}
            onClick={() => setActiveTab(filename)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === filename
                ? 'border-blue-500 text-white bg-[#1e1e1e]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]'
            }`}
          >
            {filename}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-6">
        <pre className="text-sm font-mono leading-relaxed">
          <code>{files[activeTab as keyof typeof files]}</code>
        </pre>
      </div>
    </div>
  );
}
