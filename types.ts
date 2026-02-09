export interface Voice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
  description: string;
}

export interface TTSRequest {
  text: string;
  voiceName: string;
}

export interface ProcessingState {
  isGenerating: boolean;
  progress: number; // 0-100
  status: string;
}

export interface GeneratedAudio {
  url: string; // Blob URL for playback
  blob: Blob; // Raw blob for download/processing
  duration: number; // In seconds
}

// Minimal type definition for global lamejs
declare global {
  interface Window {
    lamejs: {
      Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => Mp3Encoder;
    };
  }
}

export interface Mp3Encoder {
  encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
  flush(): Int8Array;
}
