export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'pulse';

export interface Note {
  id: string;
  time: number; // in seconds
  pitch: number; // frequency in Hz
  duration: number; // in seconds
  waveform: Waveform;
}

export interface EffectsState {
  distortion: {
    active: boolean;
    drive: number; // 0 to 1
    tone: number; // Hz (200 to 5000)
    output: number; // 0 to 1
  };
  panner: {
    active: boolean;
    pan: number; // -1 (left) to 1 (right)
  };
  phaser: {
    active: boolean;
    frequency: number; // 0.5 to 10 Hz
    depth: number; // 100 to 1500
    feedback: number; // 0 to 0.8
  };
  flanger: {
    active: boolean;
    delay: number; // ms (0 to 10)
    depth: number; // ms (0 to 2)
    feedback: number; // 0 to 0.8
    rate: number; // Hz
  };
  chorus: {
    active: boolean;
    rate: number; // Hz (0.1 to 8)
    depth: number; // 0 to 1
    delay: number; // ms (2 to 20)
  };
  tremolo: {
    active: boolean;
    frequency: number; // Hz (0.1 to 20)
    depth: number; // 0 to 1
  };
  reverb: {
    active: boolean;
    decay: number; // seconds (0.1 to 5)
    wet: number; // 0 to 1 (mix)
  };
  delay: {
    active: boolean;
    time: number; // in seconds
    feedback: number; // 0 to 1
  };
}