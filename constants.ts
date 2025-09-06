import { Waveform } from './types';

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


export const NOTE_HEIGHT = 20; // pixels
export const TIMELINE_HEIGHT = PITCHES.length * NOTE_HEIGHT;

export const GRID_COLUMNS_PER_SECOND = 8;
export const NOTE_FIXED_DURATION = 1 / GRID_COLUMNS_PER_SECOND;

export const WAVEFORM_CONFIG: { [key in Waveform]: { name: string } } = {
  sine: { name: 'Pure Tone' },
  square: { name: 'Retro' },
  sawtooth: { name: 'Synth Lead' },
  triangle: { name: 'Soft Flute' },
  pulse: { name: 'Pulse' },
};