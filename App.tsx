import React, { useState, useEffect } from 'react';
import VoiceSelector from './components/VoiceSelector';
import OutputPlayer from './components/OutputPlayer';
import ApiKeyModal from './components/ApiKeyModal';
import { VOICES } from './constants';
import { generateSpeech, validateScript, enhanceScript } from './services/geminiService';
import { base64ToPCM, loopPcmToDuration, pcmToMp3Blob } from './services/audioUtils';

const App: React.FC = () => {
  // State for API Key
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const [selectedVoiceId, setSelectedVoiceId] = useState(VOICES[0].id);
  const [text, setText] = useState('');
  const [targetDuration, setTargetDuration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Initialize API Key from storage
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  const handleResetApiKey = () => {
    if(confirm("Are you sure you want to remove your API Key?")) {
        localStorage.removeItem('gemini_api_key');
        setApiKey(null);
        setShowApiKeyModal(true);
    }
  };

  const handleEnhance = async () => {
    if (!text.trim()) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhanceScript(text, apiKey);
      setText(enhanced);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedBlob(null);

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    // Validate Input
    const validationError = validateScript(text);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate short audio from API
      const { base64Audio } = await generateSpeech(text, selectedVoiceId, apiKey);
      
      // 2. Decode to PCM
      let pcmData = base64ToPCM(base64Audio);

      // 3. Handle Target Duration Looping
      const durationNum = parseFloat(targetDuration);
      if (!isNaN(durationNum) && durationNum > 0) {
        pcmData = loopPcmToDuration(pcmData, durationNum);
      }

      // 4. Convert to MP3 Blob (using LameJS)
      const mp3Blob = pcmToMp3Blob(pcmData);
      setGeneratedBlob(mp3Blob);

    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans">
      
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onSave={handleSaveApiKey}
        onClose={apiKey ? () => setShowApiKeyModal(false) : undefined} 
      />

      {/* Sidebar - Voices */}
      <aside className="w-80 h-full border-r border-slate-800 bg-slate-900/50 flex flex-col p-6 overflow-y-auto z-10 hidden md:flex">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Moroccan TTS</h1>
            </div>
            <p className="text-slate-500 text-sm">Darija & Arabic Voice Studio</p>
          </div>
          
          <button 
            onClick={handleResetApiKey}
            className="text-slate-600 hover:text-slate-300 transition-colors p-1"
            title="Reset API Key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        <VoiceSelector 
          selectedVoiceId={selectedVoiceId}
          onSelectVoice={setSelectedVoiceId}
          apiKey={apiKey}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto z-10 flex flex-col max-w-4xl mx-auto w-full">
          
          {/* Header Area */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
             <div>
                <h2 className="text-3xl font-bold mb-2">Create Audio in Darija</h2>
                <p className="text-slate-400">Generate lifelike speech using advanced Moroccan voices.</p>
             </div>
             
             {/* Mobile Key Reset */}
             <button 
                onClick={handleResetApiKey}
                className="md:hidden text-xs text-slate-500 underline"
             >
               Change API Key
             </button>
          </div>

          {/* Text Input Area */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="relative group flex flex-col gap-3">
              
              {/* Toolbar */}
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Script</label>
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing || !text.trim()}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${isEnhancing 
                      ? 'bg-purple-900/30 text-purple-300 cursor-wait' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/20 active:scale-95'
                    }
                  `}
                >
                  {isEnhancing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Enhance Script
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-slate-800 rounded-xl p-1">
                   <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your script here... (e.g., 'Salam, kif dayer labas?')"
                    className="w-full h-64 bg-slate-900 rounded-lg p-6 text-lg leading-relaxed text-slate-200 placeholder-slate-600 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700"
                    spellCheck={false}
                    dir="auto" 
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-slate-500">
                    {text.length} characters
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">
                Tip: Click "Enhance" to add realistic emotions (laughs, breaths) and natural flow.
              </p>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Duration Setting */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col justify-center">
                 <label className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Target Duration (Optional)
                 </label>
                 <div className="flex items-center gap-2">
                   <input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(e.target.value)}
                    placeholder="e.g. 5" 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                   />
                   <span className="text-slate-500 text-sm font-medium">min</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">
                   Audio will loop to match this length.
                 </p>
              </div>

              {/* Generate Button Area */}
              <div className="flex items-center justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !text.trim()}
                  className={`
                    w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    ${isLoading 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-emerald-600/25'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>Generate Speech</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                 <span>{error}</span>
              </div>
            )}
            
            {/* Audio Player Component */}
            {generatedBlob && (
              <div className="mt-4 pb-8">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-bold text-slate-200">Result</h3>
                   <span className="text-xs text-emerald-400 font-mono uppercase">MP3 Ready</span>
                 </div>
                 <OutputPlayer audioBlob={generatedBlob} />
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;