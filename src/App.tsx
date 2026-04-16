import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Chrome, Code, CheckCircle, Info } from 'lucide-react';
import { manifestJson, backgroundJs, contentJs, contentCss, resultHtml, resultJs } from './extension-files';

export default function App() {
  const [activeTab, setActiveTab] = useState('manifest.json');

  const files = {
    'manifest.json': manifestJson,
    'background.js': backgroundJs,
    'content.js': contentJs,
    'content.css': contentCss,
    'result.html': resultHtml,
    'result.js': resultJs,
  };

  const handleDownload = () => {
    const zip = new JSZip();
    
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'scroll-print-extension.zip');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Chrome size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Scroll Print Area</h1>
            <p className="text-sm text-gray-500">Gerador de Extensão para Chrome</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download size={18} />
          Baixar Extensão (.zip)
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info className="text-blue-600" size={20} />
              Como Funciona?
            </h2>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Esta extensão permite que você selecione uma área específica de uma página web e faça scroll para baixo. A extensão irá tirar múltiplos prints e juntá-los perfeitamente na área que você delimitou.
            </p>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                Clique no ícone da extensão.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                Desenhe um retângulo na tela para definir a largura e o início.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                Faça scroll para baixo ou puxe a alça inferior do retângulo até onde deseja capturar.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                Clique em "Capturar Área" e aguarde o processamento.
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              Como Instalar
            </h2>
            <ol className="space-y-4 text-sm text-gray-700">
              <li className="flex flex-col gap-1">
                <span className="font-semibold">1. Baixe e extraia</span>
                <span className="text-gray-500">Clique no botão azul acima para baixar o .zip e extraia-o em uma pasta.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold">2. Abra as extensões</span>
                <span className="text-gray-500">No Chrome, acesse <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-pink-600">chrome://extensions/</code></span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold">3. Modo do Desenvolvedor</span>
                <span className="text-gray-500">Ative a chave "Modo do desenvolvedor" no canto superior direito.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold">4. Carregar sem compactação</span>
                <span className="text-gray-500">Clique no botão "Carregar sem compactação" e selecione a pasta que você extraiu.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[700px]">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2 overflow-x-auto">
            <Code size={18} className="text-gray-400 mr-2 shrink-0" />
            {Object.keys(files).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveTab(filename)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === filename
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filename}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
            <pre className="text-sm font-mono text-gray-300 leading-relaxed">
              <code>{files[activeTab as keyof typeof files]}</code>
            </pre>
          </div>
        </div>

      </main>
    </div>
  );
}
