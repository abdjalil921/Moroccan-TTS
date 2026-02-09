import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose?: () => void; // Optional, as first time it might be forced
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setError('API Key cannot be empty');
      return;
    }
    if (!inputKey.startsWith('AIza')) {
       setError('Invalid API Key format (usually starts with AIza)');
       // We don't block it strictly, but warn, just in case.
    }
    onSave(inputKey.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 11 9 13.5 9 11 7.536 11 7 13 4 15a9 9 0 0015-5 5 5 0 00-5-5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Enter API Key</h2>
          <p className="text-emerald-100 text-sm mt-1">Connect to Google Gemini to start</p>
        </div>
        
        <div className="p-6">
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            This application requires your own Google Gemini API key. Your key is stored locally in your browser and never sent to our servers.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google API Key</label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setError('');
                }}
                placeholder="Paste your key here (AIza...)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
            >
              Get Started
            </button>
          </form>

          <div className="mt-6 text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Get a free API key from Google AI Studio &rarr;
            </a>
          </div>
          
          {onClose && (
             <button onClick={onClose} className="mt-4 text-xs text-slate-500 hover:text-slate-300 w-full">
               Cancel
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;