import { Waveform, DrumSample } from './types';

// C Major Pentatonic Scale over 3 octaves
const C_MAJOR_PENTATONIC_BASE = [261.63, 293.66, 329.63, 392.00, 440.00]; // C4, D4, E4, G4, A4
const C_MAJOR_PENTATONIC_BASE_NAMES = ['C', 'D', 'E', 'G', 'A'];

export const PITCHES = [
  ...C_MAJOR_PENTATONIC_BASE.map(f => f * 0.5), // Octave 3
  ...C_MAJOR_PENTATONIC_BASE,                  // Octave 4
  ...C_MAJOR_PENTATONIC_BASE.map(f => f * 2),   // Octave 5
  ...C_MAJOR_PENTATONIC_BASE.map(f => f * 4),   // Octave 6
].reverse(); // Reverse so highest pitch is at the top

export const PITCH_NAMES = [
  ...C_MAJOR_PENTATONIC_BASE_NAMES.map(n => n + '6'),
  ...C_MAJOR_PENTATONIC_BASE_NAMES.map(n => n + '5'),
  ...C_MAJOR_PENTATONIC_BASE_NAMES.map(n => n + '4'),
  ...C_MAJOR_PENTATONIC_BASE_NAMES.map(n => n + '3'),
].reverse();

// --- BASS ---
const BASS_PENTATONIC_BASE = C_MAJOR_PENTATONIC_BASE.map(f => f * 0.25); // C2, D2, E2, G2, A2
const BASS_PENTATONIC_BASE_NAMES = C_MAJOR_PENTATONIC_BASE_NAMES;

export const BASS_PITCHES = [
  ...BASS_PENTATONIC_BASE,                  // Octave 2
  ...BASS_PENTATONIC_BASE.map(f => f * 2),   // Octave 3
].reverse();

export const BASS_PITCH_NAMES = [
  ...BASS_PENTATONIC_BASE_NAMES.map(n => n + '3'),
  ...BASS_PENTATONIC_BASE_NAMES.map(n => n + '2'),
].reverse();

// --- DRUMS ---
export const DRUM_SAMPLES: DrumSample[] = ['kick', 'snare', 'hat'];
export const DRUM_SAMPLE_NAMES = ['Bumbo', 'Caixa', 'Chimbal'];
export const DRUM_NOTE_HEIGHT = 28;

// --- GENERAL ---
export const NOTE_HEIGHT = 20; // pixels
export const TIMELINE_HEIGHT = PITCHES.length * NOTE_HEIGHT;

export const GRID_COLUMNS_PER_SECOND = 8;
export const NOTE_FIXED_DURATION = 1 / GRID_COLUMNS_PER_SECOND;

export const WAVEFORM_CONFIG: { [key in Waveform]: { name: string } } = {
  sine: { name: 'Tom Puro' },
  square: { name: 'Retrô' },
  sawtooth: { name: 'Sintetizador' },
  triangle: { name: 'Flauta Suave' },
  pulse: { name: 'Pulso' },
  organ: { name: 'Órgão' },
};