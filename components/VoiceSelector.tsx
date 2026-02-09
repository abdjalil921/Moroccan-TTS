import React, { useState } from 'react';
import { VOICES } from '../constants';
import { Voice } from '../types';
import { generateSpeech } from '../services/geminiService';
import { base64ToPCM, pcmToWavBlob } from '../services/audioUtils';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (id: string) => void;
  apiKey: string | null;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoiceId, onSelectVoice, apiKey }) => {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  const handlePreview = async (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation(); // Prevent selecting when clicking preview
    if (playingPreview) return; // Prevent multiple clicks

    if (!apiKey) {
      alert("Please set your API Key first.");
      return;
    }

    setPlayingPreview(voice.id);
    
    try {
      // Generate a quick live preview in Darija/Arabic
      const { base64Audio } = await generateSpeech(`Salam, ana smiti ${voice.name}.`, voice.id, apiKey);
      const pcm = base64ToPCM(base64Audio);
      const wavBlob = pcmToWavBlob(pcm);
      const url = URL.createObjectURL(wavBlob);
      
      const audio = new Audio(url);
      audio.onended = () => {
        setPlayingPreview(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingPreview(null);
        alert("Failed to play preview.");
      };
      audio.play();

    } catch (err) {
      console.error(err);
      setPlayingPreview(null);
      alert("Preview failed. Check API Key or quota.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        Voice Selection
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {VOICES.map((voice) => (
          <div
            key={voice.id}
            onClick={() => onSelectVoice(voice.id)}
            className={`
              relative p-4 rounded-xl border cursor-pointer transition-all duration-200 group
              ${selectedVoiceId === voice.id 
                ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10' 
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-semibold ${selectedVoiceId === voice.id ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {voice.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600">
                    {voice.gender}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600">
                    {voice.style}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {voice.description}
                </p>
              </div>
              
              <button
                onClick={(e) => handlePreview(e, voice)}
                disabled={playingPreview !== null}
                className={`
                  p-2 rounded-full transition-colors flex-shrink-0
                  ${playingPreview === voice.id 
                    ? 'text-emerald-400 bg-emerald-400/10 animate-pulse' 
                    : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10'
                  }
                `}
                title="Play Preview"
              >
                 {playingPreview === voice.id ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0117 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0113 10a3.983 3.983 0 01-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                 ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceSelector;