import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Chrome, CheckCircle } from 'lucide-react';
import { manifestJson, backgroundJs, contentJs, contentCss } from './extension-files';

export default function App() {
  const handleDownload = () => {
    const zip = new JSZip();
    
    zip.file('manifest.json', manifestJson);
    zip.file('background.js', backgroundJs);
    zip.file('content.js', contentJs);
    zip.file('content.css', contentCss);

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
          Baixe o arquivo .zip, extraia em uma pasta e carregue no Chrome.
        </p>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
        >
          <Download size={24} />
          Baixar Extensão (.zip)
        </button>

        <div className="mt-8 text-left bg-blue-50 p-5 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-blue-600" />
            Como instalar:
          </h3>
          <ol className="text-sm text-blue-800 space-y-3 ml-5 list-decimal marker:font-bold">
            <li>Extraia o arquivo <code className="bg-blue-100 px-1 rounded">.zip</code> baixado em uma pasta.</li>
            <li>Acesse <code className="bg-blue-100 px-1 rounded font-bold">chrome://extensions</code> no seu navegador.</li>
            <li>Ative o <b>Modo do desenvolvedor</b> no canto superior direito.</li>
            <li>Clique em <b>Carregar sem compactação</b> e selecione a pasta que você extraiu.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
