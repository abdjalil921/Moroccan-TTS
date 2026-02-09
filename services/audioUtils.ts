import { SAMPLE_RATE } from '../constants';

/**
 * Decodes a base64 string to an Int16Array PCM buffer.
 */
export const base64ToPCM = (base64: string): Int16Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Convert Uint8Array to Int16Array (little-endian)
  const int16 = new Int16Array(bytes.buffer);
  return int16;
};

/**
 * Creates a WAV header for the PCM data to make it playable by standard HTML Audio.
 */
export const createWavHeader = (dataLength: number, sampleRate: number): Uint8Array => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Concatenates raw PCM data to match a target duration.
 * @param pcmData Original PCM data
 * @param targetDurationMinutes Desired duration in minutes
 * @returns New looped Int16Array
 */
export const loopPcmToDuration = (pcmData: Int16Array, targetDurationMinutes: number): Int16Array => {
  const targetSamples = Math.ceil(targetDurationMinutes * 60 * SAMPLE_RATE);
  const currentSamples = pcmData.length;
  
  if (currentSamples >= targetSamples) {
    return pcmData; // No need to loop if already long enough
  }

  const loopCount = Math.ceil(targetSamples / currentSamples);
  const newBuffer = new Int16Array(currentSamples * loopCount);

  for (let i = 0; i < loopCount; i++) {
    newBuffer.set(pcmData, i * currentSamples);
  }

  // Optional: Trim exactly to targetSamples if strict precision is needed.
  // For now, full loops sound more natural than cutting off mid-word.
  return newBuffer;
};

/**
 * Converts PCM Int16Array to WAV Blob
 */
export const pcmToWavBlob = (pcmData: Int16Array): Blob => {
  const header = createWavHeader(pcmData.byteLength, SAMPLE_RATE);
  return new Blob([header, pcmData], { type: 'audio/wav' });
};

/**
 * Converts PCM Int16Array to MP3 Blob using LameJS
 */
export const pcmToMp3Blob = (pcmData: Int16Array): Blob => {
  if (!window.lamejs) {
    throw new Error("LameJS not loaded");
  }

  const mp3encoder = new window.lamejs.Mp3Encoder(1, SAMPLE_RATE, 128); // Mono, 24kHz, 128kbps
  const samples = pcmData;
  const mp3Data: Int8Array[] = [];

  const blockSize = 1152; // LameJS block size
  for (let i = 0; i < samples.length; i += blockSize) {
    const sampleChunk = samples.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
};
