import { Voice } from './types';

export const VOICES: Voice[] = [
  {
    id: 'Puck', // Mapping Puck to Youssef
    name: 'Youssef',
    gender: 'Male',
    style: 'Casual & Friendly',
    description: 'A friendly, youthful voice from Casablanca. Great for vlogs, social media, and casual Darija conversations.'
  },
  {
    id: 'Charon', // Mapping Charon to Abdelkader
    name: 'Abdelkader',
    gender: 'Male',
    style: 'Deep & Resonant',
    description: 'A deep, authoritative voice. Perfect for storytelling, documentaries, and serious narration.'
  },
  {
    id: 'Kore', // Mapping Kore to Khadija
    name: 'Khadija',
    gender: 'Female',
    style: 'Warm & Soothing',
    description: 'A gentle, warm voice. Ideal for poetry, mindfulness, or friendly assistance.'
  },
  {
    id: 'Fenrir', // Mapping Fenrir to Rachid
    name: 'Rachid',
    gender: 'Male',
    style: 'Bold & Intense',
    description: 'High energy and commanding. Excellent for advertisements, announcements, or energetic sports commentary.'
  },
  {
    id: 'Aoede', // Mapping Aoede to Salma
    name: 'Salma',
    gender: 'Female',
    style: 'Professional & Elegant',
    description: 'Polished and articulate. The best choice for news broadcasting, corporate presentations, and education.'
  }
];

export const SAMPLE_RATE = 24000;
export const MODEL_NAME = 'gemini-2.5-flash-preview-tts';