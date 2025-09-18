import { Note, EffectsState, Composition, DrumNote, DrumSample, BassEffectsState, DrumEffectsState } from '../types';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  
  // Master I/O
  private masterIn: GainNode | null = null; // Melody input (goes to effects)
  private bassIn: GainNode | null = null; // Bass input
  private drumIn: GainNode | null = null; // Drum input
  private masterOut: GainNode | null = null; // Final output gain
  
  // Track Volume & Timbre
  private melodyVolumeNode: GainNode | null = null;
  private bassVolumeNode: GainNode | null = null;
  private drumVolumeNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null; // For bass "weight"
  private drumTone = 0.5; // For drum "tone"

  // Melody Effect Nodes
  private distortionInput: GainNode | null = null;
  private distortionWet: GainNode | null = null;
  private distortionDry: GainNode | null = null;
  private distortionShaper: WaveShaperNode | null = null;
  private toneFilter: BiquadFilterNode | null = null;
  private distortionOutput: GainNode | null = null;

  private pannerInput: GainNode | null = null;
  private pannerWet: GainNode | null = null;
  private pannerDry: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private pannerOutput: GainNode | null = null;

  private phaserInput: GainNode | null = null;
  private phaserWet: GainNode | null = null;
  private phaserDry: GainNode | null = null;
  private phaserLfo: OscillatorNode | null = null;
  private phaserDepth: GainNode | null = null;
  private phaserBaseFreq: ConstantSourceNode | null = null;
  private phaserFilters: BiquadFilterNode[] = [];
  private phaserFeedback: GainNode | null = null;
  private phaserOutput: GainNode | null = null;

  private flangerInput: GainNode | null = null;
  private flangerWet: GainNode | null = null;
  private flangerDry: GainNode | null = null;
  private flangerDelay: DelayNode | null = null;
  private flangerLfo: OscillatorNode | null = null;
  private flangerDepth: GainNode | null = null;
  private flangerBaseDelay: ConstantSourceNode | null = null;
  private flangerFeedback: GainNode | null = null;
  private flangerOutput: GainNode | null = null;
  
  private chorusInput: GainNode | null = null;
  private chorusWet: GainNode | null = null;
  private chorusDry: GainNode | null = null;
  private chorusDelay: DelayNode | null = null;
  private chorusLfo: OscillatorNode | null = null;
  private chorusDepth: GainNode | null = null;
  private chorusBaseDelay: ConstantSourceNode | null = null;
  private chorusOutput: GainNode | null = null;

  private tremoloInput: GainNode | null = null;
  private tremoloWet: GainNode | null = null;
  private tremoloDry: GainNode | null = null;
  private tremoloLfo: OscillatorNode | null = null;
  private tremoloDepth: GainNode | null = null;
  private tremoloBaseGain: ConstantSourceNode | null = null;
  private tremoloOutput: GainNode | null = null;

  private delayInput: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private delayDry: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayOutput: GainNode | null = null;
  
  private reverbInput: GainNode | null = null;
  private reverbWet: GainNode | null = null;
  private reverbDry: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbOutput: GainNode | null = null;
  
  // Bass Effect Nodes
  private bassDistortionInput: GainNode | null = null;
  private bassDistortionWet: GainNode | null = null;
  private bassDistortionDry: GainNode | null = null;
  private bassDistortionShaper: WaveShaperNode | null = null;
  private bassDistortionOutput: GainNode | null = null;
  private bassReverbInput: GainNode | null = null;
  private bassReverbWet: GainNode | null = null;
  private bassReverbDry: GainNode | null = null;
  private bassReverbConvolver: ConvolverNode | null = null;
  private bassReverbOutput: GainNode | null = null;
  private bassChorusInput: GainNode | null = null;
  // FIX: Added dedicated nodes for the bass chorus effect to allow proper control.
  private bassChorusWet: GainNode | null = null;
  private bassChorusDry: GainNode | null = null;
  private bassChorusDelay: DelayNode | null = null;
  private bassChorusLfo: OscillatorNode | null = null;
  private bassChorusDepth: GainNode | null = null;
  private bassChorusBaseDelay: ConstantSourceNode | null = null;
  private bassChorusOutput: GainNode | null = null;
  private bassCompressor: DynamicsCompressorNode | null = null;

  // Drum Effect Nodes
  private drumDelayInput: GainNode | null = null;
  private drumDelayWet: GainNode | null = null;
  private drumDelayDry: GainNode | null = null;
  private drumDelayNode: DelayNode | null = null;
  private drumDelayFeedback: GainNode | null = null;
  private drumDelayOutput: GainNode | null = null;
  private drumReverbInput: GainNode | null = null;
  private drumReverbWet: GainNode | null = null;
  private drumReverbDry: GainNode | null = null;
  private drumReverbConvolver: ConvolverNode | null = null;
  private drumReverbOutput: GainNode | null = null;
  private drumCompressor: DynamicsCompressorNode | null = null;
  private drumFilter: BiquadFilterNode | null = null;

  // Custom Waves
  private pulseWave: PeriodicWave | null = null;
  private organWave: PeriodicWave | null = null;

  public async initAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      return;
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      return;
    }
    if (this.audioContext) return;
    
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.audioContext = ac;
    
    // Create track inputs and master output
    this.masterIn = ac.createGain(); // Melody
    this.bassIn = ac.createGain();
    this.drumIn = ac.createGain();
    this.masterOut = ac.createGain();

    // Create volume controls
    this.melodyVolumeNode = ac.createGain();
    this.bassVolumeNode = ac.createGain();
    this.drumVolumeNode = ac.createGain();

    // Connect melody volume to master input
    this.melodyVolumeNode.connect(this.masterIn);

    // Create timbre controls
    this.bassFilter = ac.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 1500; // Default to a bright sound
    this.bassFilter.Q.value = 1;

    let melodyFxChain: AudioNode = this.masterIn;

    // --- Create a FIXED, SEQUENTIAL effects chain for MELODY track ---
    
    // 1. Distortion
    this.distortionInput = ac.createGain();
    this.distortionWet = ac.createGain();
    this.distortionDry = ac.createGain();
    this.distortionShaper = ac.createWaveShaper();
    this.toneFilter = ac.createBiquadFilter(); this.toneFilter.type = 'lowpass';
    this.distortionOutput = ac.createGain();
    this.distortionInput.connect(this.distortionDry).connect(this.distortionOutput);
    this.distortionInput.connect(this.distortionWet).connect(this.distortionShaper).connect(this.toneFilter).connect(this.distortionOutput);
    melodyFxChain.connect(this.distortionInput);
    melodyFxChain = this.distortionOutput;

    // 2. Panner
    this.pannerInput = ac.createGain();
    this.pannerWet = ac.createGain();
    this.pannerDry = ac.createGain();
    this.pannerNode = ac.createStereoPanner();
    this.pannerOutput = ac.createGain();
    this.pannerInput.connect(this.pannerDry).connect(this.pannerOutput);
    this.pannerInput.connect(this.pannerWet).connect(this.pannerNode).connect(this.pannerOutput);
    melodyFxChain.connect(this.pannerInput);
    melodyFxChain = this.pannerOutput;

    // 3. Phaser
    this.phaserInput = ac.createGain();
    this.phaserWet = ac.createGain();
    this.phaserDry = ac.createGain();
    this.phaserOutput = ac.createGain();
    this.phaserLfo = ac.createOscillator();
    this.phaserDepth = ac.createGain();
    this.phaserFeedback = ac.createGain();
    this.phaserBaseFreq = ac.createConstantSource();
    this.phaserFilters = Array.from({ length: 4 }, () => {
        const f = ac.createBiquadFilter();
        f.type = 'allpass';
        this.phaserBaseFreq.connect(f.frequency);
        this.phaserDepth.connect(f.frequency);
        return f;
    });
    this.phaserLfo.connect(this.phaserDepth);
    this.phaserInput.connect(this.phaserDry).connect(this.phaserOutput);
    this.phaserInput.connect(this.phaserWet).connect(this.phaserFilters[0]).connect(this.phaserFilters[1]).connect(this.phaserFilters[2]).connect(this.phaserFilters[3]).connect(this.phaserOutput);
    this.phaserFilters[3].connect(this.phaserFeedback).connect(this.phaserFilters[0]);
    this.phaserLfo.start();
    this.phaserBaseFreq.start();
    melodyFxChain.connect(this.phaserInput);
    melodyFxChain = this.phaserOutput;

    // 4. Flanger
    this.flangerInput = ac.createGain();
    this.flangerWet = ac.createGain();
    this.flangerDry = ac.createGain();
    this.flangerOutput = ac.createGain();
    this.flangerDelay = ac.createDelay(0.1);
    this.flangerLfo = ac.createOscillator();
    this.flangerDepth = ac.createGain();
    this.flangerFeedback = ac.createGain();
    this.flangerBaseDelay = ac.createConstantSource();
    this.flangerBaseDelay.connect(this.flangerDelay.delayTime);
    this.flangerLfo.connect(this.flangerDepth).connect(this.flangerDelay.delayTime);
    this.flangerInput.connect(this.flangerDry).connect(this.flangerOutput);
    this.flangerInput.connect(this.flangerWet).connect(this.flangerDelay).connect(this.flangerOutput);
    this.flangerDelay.connect(this.flangerFeedback).connect(this.flangerDelay);
    this.flangerLfo.start();
    this.flangerBaseDelay.start();
    melodyFxChain.connect(this.flangerInput);
    melodyFxChain = this.flangerOutput;

    // 5. Chorus
    this.chorusInput = ac.createGain();
    this.chorusWet = ac.createGain();
    this.chorusDry = ac.createGain();
    this.chorusOutput = ac.createGain();
    this.chorusDelay = ac.createDelay(1.0);
    this.chorusLfo = ac.createOscillator();
    this.chorusDepth = ac.createGain();
    this.chorusBaseDelay = ac.createConstantSource();
    this.chorusBaseDelay.connect(this.chorusDelay.delayTime);
    this.chorusLfo.connect(this.chorusDepth).connect(this.chorusDelay.delayTime);
    this.chorusInput.connect(this.chorusDry).connect(this.chorusOutput);
    this.chorusInput.connect(this.chorusWet).connect(this.chorusDelay).connect(this.chorusOutput);
    this.chorusLfo.start();
    this.chorusBaseDelay.start();
    melodyFxChain.connect(this.chorusInput);
    melodyFxChain = this.chorusOutput;

    // 6. Tremolo
    this.tremoloInput = ac.createGain();
    this.tremoloWet = ac.createGain();
    this.tremoloDry = ac.createGain();
    this.tremoloOutput = ac.createGain();
    const tremoloGain = ac.createGain();
    tremoloGain.gain.value = 0; // FIX: Set intrinsic value to 0 for correct modulation
    this.tremoloLfo = ac.createOscillator();
    this.tremoloDepth = ac.createGain();
    this.tremoloBaseGain = ac.createConstantSource();
    this.tremoloBaseGain.connect(tremoloGain.gain);
    this.tremoloLfo.connect(this.tremoloDepth).connect(tremoloGain.gain);
    this.tremoloInput.connect(this.tremoloDry).connect(this.tremoloOutput);
    this.tremoloInput.connect(this.tremoloWet).connect(tremoloGain).connect(this.tremoloOutput);
    this.tremoloLfo.start();
    this.tremoloBaseGain.start();
    melodyFxChain.connect(this.tremoloInput);
    melodyFxChain = this.tremoloOutput;
    
    // 7. Delay
    this.delayInput = ac.createGain();
    this.delayWet = ac.createGain();
    this.delayDry = ac.createGain();
    this.delayOutput = ac.createGain();
    this.delayNode = ac.createDelay(5.0);
    this.delayFeedback = ac.createGain();
    this.delayInput.connect(this.delayDry).connect(this.delayOutput);
    this.delayInput.connect(this.delayWet).connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback).connect(this.delayNode);
    this.delayNode.connect(this.delayOutput);
    melodyFxChain.connect(this.delayInput);
    melodyFxChain = this.delayOutput;
    
    // 8. Reverb
    this.reverbInput = ac.createGain();
    this.reverbWet = ac.createGain();
    this.reverbDry = ac.createGain();
    this.reverbOutput = ac.createGain();
    this.reverbConvolver = ac.createConvolver();
    this.reverbInput.connect(this.reverbDry).connect(this.reverbOutput);
    this.reverbInput.connect(this.reverbWet).connect(this.reverbConvolver).connect(this.reverbOutput);
    melodyFxChain.connect(this.reverbInput);
    melodyFxChain = this.reverbOutput;
    
    // --- Create effects chain for BASS track ---
    // Order: Distortion -> Chorus -> Compressor -> Reverb
    let bassFxChain: AudioNode = this.bassIn.connect(this.bassFilter).connect(this.bassVolumeNode);
    
    // Bass Distortion
    this.bassDistortionInput = ac.createGain();
    this.bassDistortionWet = ac.createGain();
    this.bassDistortionDry = ac.createGain();
    this.bassDistortionShaper = ac.createWaveShaper();
    this.bassDistortionOutput = ac.createGain();
    this.bassDistortionInput.connect(this.bassDistortionDry).connect(this.bassDistortionOutput);
    this.bassDistortionInput.connect(this.bassDistortionWet).connect(this.bassDistortionShaper).connect(this.bassDistortionOutput);
    bassFxChain.connect(this.bassDistortionInput);
    bassFxChain = this.bassDistortionOutput;

    // Bass Chorus (Re-using melody chorus logic as a template)
    // FIX: Correctly set up the bass chorus audio graph.
    this.bassChorusInput = ac.createGain();
    this.bassChorusWet = ac.createGain();
    this.bassChorusDry = ac.createGain();
    this.bassChorusOutput = ac.createGain();
    this.bassChorusDelay = ac.createDelay(1.0);
    this.bassChorusLfo = ac.createOscillator();
    this.bassChorusDepth = ac.createGain();
    this.bassChorusBaseDelay = ac.createConstantSource();
    this.bassChorusBaseDelay.connect(this.bassChorusDelay.delayTime);
    this.bassChorusLfo.connect(this.bassChorusDepth).connect(this.bassChorusDelay.delayTime);
    this.bassChorusInput.connect(this.bassChorusDry).connect(this.bassChorusOutput);
    this.bassChorusInput.connect(this.bassChorusWet).connect(this.bassChorusDelay).connect(this.bassChorusOutput);
    this.bassChorusLfo.start();
    this.bassChorusBaseDelay.start();
    bassFxChain.connect(this.bassChorusInput);
    bassFxChain = this.bassChorusOutput;

    // Bass Compressor
    this.bassCompressor = ac.createDynamicsCompressor();
    bassFxChain.connect(this.bassCompressor);
    bassFxChain = this.bassCompressor;

    // Bass Reverb
    this.bassReverbInput = ac.createGain();
    this.bassReverbWet = ac.createGain();
    this.bassReverbDry = ac.createGain();
    this.bassReverbOutput = ac.createGain();
    this.bassReverbConvolver = ac.createConvolver();
    this.bassReverbInput.connect(this.bassReverbDry).connect(this.bassReverbOutput);
    this.bassReverbInput.connect(this.bassReverbWet).connect(this.bassReverbConvolver).connect(this.bassReverbOutput);
    bassFxChain.connect(this.bassReverbInput);
    bassFxChain = this.bassReverbOutput;
    
    // --- Create effects chain for DRUM track ---
    // Order: Filter -> Compressor -> Delay -> Reverb
    let drumFxChain: AudioNode = this.drumIn.connect(this.drumVolumeNode);

    // Drum Filter
    this.drumFilter = ac.createBiquadFilter();
    this.drumFilter.type = 'lowpass';
    drumFxChain.connect(this.drumFilter);
    drumFxChain = this.drumFilter;
    
    // Drum Compressor
    this.drumCompressor = ac.createDynamicsCompressor();
    drumFxChain.connect(this.drumCompressor);
    drumFxChain = this.drumCompressor;

    // Drum Delay
    this.drumDelayInput = ac.createGain();
    this.drumDelayWet = ac.createGain();
    this.drumDelayDry = ac.createGain();
    this.drumDelayOutput = ac.createGain();
    this.drumDelayNode = ac.createDelay(5.0);
    this.drumDelayFeedback = ac.createGain();
    this.drumDelayInput.connect(this.drumDelayDry).connect(this.drumDelayOutput);
    this.drumDelayInput.connect(this.drumDelayWet).connect(this.drumDelayNode);
    this.drumDelayNode.connect(this.drumDelayFeedback).connect(this.drumDelayNode);
    this.drumDelayNode.connect(this.drumDelayOutput);
    drumFxChain.connect(this.drumDelayInput);
    drumFxChain = this.drumDelayOutput;

    // Drum Reverb
    this.drumReverbInput = ac.createGain();
    this.drumReverbWet = ac.createGain();
    this.drumReverbDry = ac.createGain();
    this.drumReverbOutput = ac.createGain();
    this.drumReverbConvolver = ac.createConvolver();
    this.drumReverbInput.connect(this.drumReverbDry).connect(this.drumReverbOutput);
    this.drumReverbInput.connect(this.drumReverbWet).connect(this.drumReverbConvolver).connect(this.drumReverbOutput);
    drumFxChain.connect(this.drumReverbInput);
    drumFxChain = this.drumReverbOutput;
    
    // --- Connect all tracks to master out ---
    melodyFxChain.connect(this.masterOut); // Melody effects chain output
    bassFxChain.connect(this.masterOut); // Bass effects chain output
    drumFxChain.connect(this.masterOut); // Drum effects chain output
    this.masterOut.connect(ac.destination);

    this._createCustomWaves();
  }

  private _createDistortionCurve(amount: number): Float32Array {
    const k = Math.max(0, typeof amount === 'number' ? amount * 100 : 50);
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public updateEffects(effects: EffectsState): void {
    if (!this.audioContext || !this.distortionWet) return;
    const ac = this.audioContext;
    const { currentTime } = ac;

    // Distortion
    this.distortionWet.gain.setValueAtTime(effects.distortion.active ? 1 : 0, currentTime);
    this.distortionDry.gain.setValueAtTime(effects.distortion.active ? 0 : 1, currentTime);
    if(effects.distortion.active){
      this.distortionShaper.curve = this._createDistortionCurve(effects.distortion.drive);
      this.toneFilter.frequency.setValueAtTime(effects.distortion.tone, currentTime);
      this.distortionOutput.gain.setValueAtTime(effects.distortion.output, currentTime);
    }

    // Panner
    this.pannerWet.gain.setValueAtTime(effects.panner.active ? 1 : 0, currentTime);
    this.pannerDry.gain.setValueAtTime(effects.panner.active ? 0 : 1, currentTime);
    if(effects.panner.active) this.pannerNode.pan.setValueAtTime(effects.panner.pan, currentTime);

    // Phaser
    this.phaserWet.gain.setValueAtTime(effects.phaser.active ? 1 : 0, currentTime);
    this.phaserDry.gain.setValueAtTime(effects.phaser.active ? 0 : 1, currentTime);
    if(effects.phaser.active){
      this.phaserLfo.frequency.setValueAtTime(effects.phaser.frequency, currentTime);
      this.phaserDepth.gain.setValueAtTime(effects.phaser.depth, currentTime);
      this.phaserBaseFreq.offset.setValueAtTime(effects.phaser.depth * 1.5, currentTime);
      this.phaserFeedback.gain.setValueAtTime(effects.phaser.feedback, currentTime);
    }

    // Flanger
    this.flangerWet.gain.setValueAtTime(effects.flanger.active ? 1 : 0, currentTime);
    this.flangerDry.gain.setValueAtTime(effects.flanger.active ? 0 : 1, currentTime);
    if(effects.flanger.active){
      const delay = effects.flanger.delay / 1000;
      const depth = effects.flanger.depth / 1000;
      const baseDelay = Math.max(delay, depth);

      this.flangerLfo.frequency.setValueAtTime(effects.flanger.rate, currentTime); // FIX: Use user-controlled rate
      this.flangerDepth.gain.setValueAtTime(depth, currentTime);
      this.flangerBaseDelay.offset.setValueAtTime(baseDelay, currentTime);
      this.flangerFeedback.gain.setValueAtTime(effects.flanger.feedback, currentTime);
    }

    // Chorus
    this.chorusWet.gain.setValueAtTime(effects.chorus.active ? 1 : 0, currentTime);
    this.chorusDry.gain.setValueAtTime(effects.chorus.active ? 0 : 1, currentTime);
    if(effects.chorus.active){
      this.chorusLfo.frequency.setValueAtTime(effects.chorus.rate, currentTime);
      this.chorusDepth.gain.setValueAtTime(effects.chorus.depth / 1000, currentTime); // Subtle depth
      this.chorusBaseDelay.offset.setValueAtTime(effects.chorus.delay / 1000, currentTime);
    }
    
    // Tremolo
    this.tremoloWet.gain.setValueAtTime(effects.tremolo.active ? 1 : 0, currentTime);
    this.tremoloDry.gain.setValueAtTime(effects.tremolo.active ? 0 : 1, currentTime);
    if(effects.tremolo.active){
      this.tremoloLfo.frequency.setValueAtTime(effects.tremolo.frequency, currentTime);
      const depth = effects.tremolo.depth;
      this.tremoloDepth.gain.setValueAtTime(depth / 2, currentTime);
      this.tremoloBaseGain.offset.setValueAtTime(1 - (depth / 2), currentTime);
    }
    
    // Delay
    this.delayWet.gain.setValueAtTime(effects.delay.active ? 1 : 0, currentTime);
    this.delayDry.gain.setValueAtTime(effects.delay.active ? 0 : 1, currentTime);
    if(effects.delay.active){
      this.delayNode.delayTime.setValueAtTime(effects.delay.time, currentTime);
      this.delayFeedback.gain.setValueAtTime(effects.delay.feedback, currentTime);
    }

    // Reverb
    this.reverbWet.gain.setValueAtTime(effects.reverb.active ? effects.reverb.wet : 0, currentTime);
    this.reverbDry.gain.setValueAtTime(effects.reverb.active ? (1.0 - effects.reverb.wet) : 1, currentTime);
    if(effects.reverb.active) {
        this.reverbConvolver.buffer = this._createReverbImpulseResponse(effects.reverb.decay);
    }
  }

  public updateBassEffects(effects: BassEffectsState): void {
      // FIX: Check for all required bass chorus nodes and remove usage of non-existent `getDestination` method.
      if (!this.audioContext || !this.bassDistortionWet || !this.bassCompressor || !this.bassChorusInput || !this.bassChorusWet || !this.bassChorusDry || !this.bassChorusLfo || !this.bassChorusDepth || !this.bassChorusBaseDelay) return;
      const { currentTime } = this.audioContext;
      
      // Bass Distortion
      this.bassDistortionWet.gain.setValueAtTime(effects.distortion.active ? 1 : 0, currentTime);
      this.bassDistortionDry.gain.setValueAtTime(effects.distortion.active ? 0 : 1, currentTime);
      if(effects.distortion.active){
        this.bassDistortionShaper.curve = this._createDistortionCurve(effects.distortion.drive * 0.5); // Bass distortion is usually more subtle
      }
      
      // Bass Chorus
      this.bassChorusWet.gain.setValueAtTime(effects.chorus.active ? 0.5 : 0, currentTime); // Mix chorus at 50%
      this.bassChorusDry.gain.setValueAtTime(effects.chorus.active ? 0.5 : 1, currentTime);
      if (effects.chorus.active) {
        this.bassChorusLfo.frequency.setValueAtTime(effects.chorus.rate, currentTime);
        this.bassChorusDepth.gain.setValueAtTime(effects.chorus.depth / 1000, currentTime);
        this.bassChorusBaseDelay.offset.setValueAtTime(effects.chorus.delay / 1000, currentTime);
      }

      // Bass Compressor
      const comp = this.bassCompressor;
      comp.threshold.setValueAtTime(effects.compressor.active ? effects.compressor.threshold : 0, currentTime);
      comp.ratio.setValueAtTime(effects.compressor.active ? effects.compressor.ratio : 1, currentTime);
      comp.attack.setValueAtTime(effects.compressor.active ? effects.compressor.attack : 0.003, currentTime);
      comp.release.setValueAtTime(effects.compressor.active ? effects.compressor.release : 0.25, currentTime);

      // Bass Reverb
      this.bassReverbWet.gain.setValueAtTime(effects.reverb.active ? effects.reverb.wet : 0, currentTime);
      this.bassReverbDry.gain.setValueAtTime(effects.reverb.active ? (1.0 - effects.reverb.wet) : 1, currentTime);
      if(effects.reverb.active) {
          this.bassReverbConvolver.buffer = this._createReverbImpulseResponse(effects.reverb.decay);
      }
  }
  
  public updateDrumEffects(effects: DrumEffectsState): void {
      if (!this.audioContext || !this.drumDelayWet || !this.drumCompressor || !this.drumFilter) return;
      const { currentTime } = this.audioContext;

      // Drum Filter
      this.drumFilter.frequency.setValueAtTime(effects.filter.active ? effects.filter.frequency : 22050, currentTime);
      this.drumFilter.Q.setValueAtTime(effects.filter.active ? effects.filter.q : 1, currentTime);

      // Drum Compressor
      const comp = this.drumCompressor;
      comp.threshold.setValueAtTime(effects.compressor.active ? effects.compressor.threshold : 0, currentTime);
      comp.ratio.setValueAtTime(effects.compressor.active ? effects.compressor.ratio : 1, currentTime);
      comp.attack.setValueAtTime(effects.compressor.active ? effects.compressor.attack : 0.003, currentTime);
      comp.release.setValueAtTime(effects.compressor.active ? effects.compressor.release : 0.25, currentTime);

      // Drum Delay
      this.drumDelayWet.gain.setValueAtTime(effects.delay.active ? 1 : 0, currentTime);
      this.drumDelayDry.gain.setValueAtTime(effects.delay.active ? 0 : 1, currentTime);
      if(effects.delay.active){
        this.drumDelayNode.delayTime.setValueAtTime(effects.delay.time, currentTime);
        this.drumDelayFeedback.gain.setValueAtTime(effects.delay.feedback, currentTime);
      }

      // Drum Reverb
      this.drumReverbWet.gain.setValueAtTime(effects.reverb.active ? effects.reverb.wet : 0, currentTime);
      this.drumReverbDry.gain.setValueAtTime(effects.reverb.active ? (1.0 - effects.reverb.wet) : 1, currentTime);
      if(effects.reverb.active) {
          this.drumReverbConvolver.buffer = this._createReverbImpulseResponse(effects.reverb.decay);
      }
  }

  public setMelodyVolume(level: number): void {
    if (this.melodyVolumeNode && this.audioContext) {
      this.melodyVolumeNode.gain.setTargetAtTime(level, this.audioContext.currentTime, 0.01);
    }
  }
  
  public setBassVolume(level: number): void {
    if (this.bassVolumeNode && this.audioContext) {
      this.bassVolumeNode.gain.setTargetAtTime(level, this.audioContext.currentTime, 0.01);
    }
  }

  public setDrumVolume(level: number): void {
    if (this.drumVolumeNode && this.audioContext) {
      this.drumVolumeNode.gain.setTargetAtTime(level, this.audioContext.currentTime, 0.01);
    }
  }
  
  public setBassWeight(weight: number): void { // weight 0-1
    if (this.bassFilter && this.audioContext) {
      // More weight = lower cutoff frequency for a heavier, bassier sound
      const minFreq = 80;
      const maxFreq = 1500;
      // Exponential scale: as weight -> 1, freq -> minFreq
      const freq = minFreq * Math.pow(maxFreq / minFreq, 1 - weight);
      this.bassFilter.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.01);
    }
  }

  public setDrumTone(tone: number): void { // tone 0-1
      this.drumTone = tone;
  }

  private _createSoundSource(note: Note, timeOffset: number, context: BaseAudioContext): OscillatorNode {
    if (note.waveform === 'pulse' && this.pulseWave) {
      const pulseOsc = context.createOscillator();
      pulseOsc.setPeriodicWave(this.pulseWave);
      pulseOsc.frequency.setValueAtTime(note.pitch, timeOffset);
      return pulseOsc;
    }
    if (note.waveform === 'organ' && this.organWave) {
      const organOsc = context.createOscillator();
      organOsc.setPeriodicWave(this.organWave);
      organOsc.frequency.setValueAtTime(note.pitch, timeOffset);
      return organOsc;
    }
    const osc = context.createOscillator();
    osc.type = note.waveform as OscillatorType;
    osc.frequency.setValueAtTime(note.pitch, timeOffset);
    return osc;
  }

  private mergeConsecutiveNotes(notes: Note[]): Note[] {
    if (notes.length === 0) return [];
    const notesByGroup: { [key: string]: Note[] } = {};
    notes.forEach(note => {
      const key = `${note.pitch}-${note.waveform}`;
      if (!notesByGroup[key]) notesByGroup[key] = [];
      notesByGroup[key].push(note);
    });

    const mergedNotes: Note[] = [];
    for (const key in notesByGroup) {
      const groupNotes = notesByGroup[key].sort((a, b) => a.time - b.time);
      if (groupNotes.length === 0) continue;
      let currentNote = { ...groupNotes[0] };
      for (let i = 1; i < groupNotes.length; i++) {
        const nextNote = groupNotes[i];
        if (Math.abs(nextNote.time - (currentNote.time + currentNote.duration)) < 0.001) {
          currentNote.duration += nextNote.duration;
        } else {
          mergedNotes.push(currentNote);
          currentNote = { ...nextNote };
        }
      }
      mergedNotes.push(currentNote);
    }
    return mergedNotes;
  }

  public playComposition(composition: Composition, effects: EffectsState, bassEffects: BassEffectsState, drumEffects: DrumEffectsState): void {
    if (!this.audioContext || this.audioContext.state !== 'running' || !this.bassIn || !this.drumIn) {
      console.error("AudioContext not running. Call initAudioContext from a user gesture first.");
      return;
    }

    this.updateEffects(effects); 
    this.updateBassEffects(bassEffects);
    this.updateDrumEffects(drumEffects);
    
    this.stopAll();
    const now = this.audioContext.currentTime;
    
    // Play Melody
    const melodyNotes = this.mergeConsecutiveNotes(composition.melody);
    melodyNotes.forEach(note => {
      const gainNode = this.audioContext.createGain();
      gainNode.connect(this.melodyVolumeNode);
      const source = this._createSoundSource(note, now + note.time, this.audioContext);
      source.connect(gainNode);
      const attackTime = 0.005, releaseTime = 0.01, peakVolume = 0.25;
      const startTime = now + note.time, endTime = startTime + note.duration;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(peakVolume, startTime + attackTime);
      gainNode.gain.setValueAtTime(peakVolume, endTime - releaseTime);
      gainNode.gain.linearRampToValueAtTime(0, endTime);
      source.start(startTime);
      source.stop(endTime);
      this.activeSources.push(source);
    });

    // Play Bass
    const bassNotes = this.mergeConsecutiveNotes(composition.bass);
    bassNotes.forEach(note => {
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.bassIn);
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.pitch, now + note.time);
        osc.connect(gainNode);
        const attackTime = 0.005, releaseTime = 0.01, peakVolume = 0.35;
        const startTime = now + note.time, endTime = startTime + note.duration;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(peakVolume, startTime + attackTime);
        gainNode.gain.setValueAtTime(peakVolume, endTime - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, endTime);
        osc.start(startTime);
        osc.stop(endTime);
        this.activeSources.push(osc);
    });

    // Play Drums
    composition.drums.forEach(note => {
        this._playDrumSample(note.sample, now + note.time);
    });
  }
  
  public stopAll(): void {
      if(!this.audioContext) return;
      this.activeSources.forEach(source => { try { source.stop(); } catch(e) {} });
      this.activeSources = [];
  }

  public playPreviewNote(noteInfo: { pitch: number; waveform: Note['waveform']; duration?: number }, effects: EffectsState): void {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      this.initAudioContext().then(() => {
        if (this.audioContext?.state === 'running') this.playPreviewNote(noteInfo, effects);
      });
      return;
    }

    this.updateEffects(effects);

    const now = this.audioContext.currentTime;
    const duration = noteInfo.duration || 0.2;

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.melodyVolumeNode);

    const partialNote: Note = {
      pitch: noteInfo.pitch,
      waveform: noteInfo.waveform,
      id: '',
      time: 0,
      duration: 0,
    };
    const source = this._createSoundSource(partialNote, now, this.audioContext);

    source.connect(gainNode);

    const attackTime = 0.005;
    const releaseTime = duration * 0.7;
    const peakVolume = 0.2;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakVolume, now + attackTime);
    gainNode.gain.setValueAtTime(peakVolume, now + duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    source.start(now);
    source.stop(now + duration);
  }

  public playPreviewBassNote(pitch: number): void {
      if (!this.audioContext || this.audioContext.state !== 'running') {
        this.initAudioContext().then(() => {
          if (this.audioContext?.state === 'running') this.playPreviewBassNote(pitch);
        });
        return;
      }

      if (!this.bassIn) return;
      const now = this.audioContext.currentTime;
      const gainNode = this.audioContext.createGain();
      gainNode.connect(this.bassIn);
      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, now);
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
  }

  public playPreviewDrumSample(sample: DrumSample): void {
      if (!this.audioContext || this.audioContext.state !== 'running') {
        this.initAudioContext().then(() => {
          if (this.audioContext?.state === 'running') this.playPreviewDrumSample(sample);
        });
        return;
      }
      this._playDrumSample(sample, this.audioContext.currentTime);
  }

  public async exportToWav(
    composition: Composition, 
    duration: number, 
    effects: EffectsState, 
    bassEffects: BassEffectsState, 
    drumEffects: DrumEffectsState,
    params: { melodyVolume: number; bassVolume: number; bassWeight: number; drumVolume: number; drumTone: number }
  ): Promise<void> {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const sampleRate = this.audioContext.sampleRate;
      const offlineContext = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
      
      const masterOut = offlineContext.createGain();
      masterOut.connect(offlineContext.destination);

      // --- Create Melody Track with Effects ---
      const melodyVolumeNode = offlineContext.createGain();
      melodyVolumeNode.gain.value = params.melodyVolume;
      const melodyIn = offlineContext.createGain();
      melodyVolumeNode.connect(melodyIn);
      let melodyFxChain: AudioNode = melodyIn;
      
      const effectChain: { [K in keyof EffectsState]: (input: AudioNode, output: AudioNode, eff: EffectsState[K]) => void } = {
          distortion: (input, output, eff) => {
            const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
            const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
            const shaper = offlineContext.createWaveShaper();
            const tone = offlineContext.createBiquadFilter();
            const outGain = offlineContext.createGain();
            if (eff.active) {
                shaper.curve = this._createDistortionCurve(eff.drive);
                tone.type = 'lowpass'; tone.frequency.value = eff.tone;
                outGain.gain.value = eff.output;
            }
            input.connect(dry).connect(output);
            input.connect(wet).connect(shaper).connect(tone).connect(outGain).connect(output);
          },
          panner: (input, output, eff) => {
            const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
            const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
            const panner = offlineContext.createStereoPanner();
            if (eff.active) panner.pan.value = eff.pan;
            input.connect(dry).connect(output);
            input.connect(wet).connect(panner).connect(output);
          },
          phaser: (input, output, eff) => {
             const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
             const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
             input.connect(dry).connect(output);
             if (eff.active) {
                const pLfo = offlineContext.createOscillator(); pLfo.frequency.value = eff.frequency;
                const pDepth = offlineContext.createGain(); pDepth.gain.value = eff.depth;
                const pBase = offlineContext.createConstantSource(); pBase.offset.value = eff.depth * 1.5;
                const pFbk = offlineContext.createGain(); pFbk.gain.value = eff.feedback;
                const pFilters = Array.from({length: 4}, () => {
                    const f = offlineContext.createBiquadFilter(); f.type = 'allpass';
                    pBase.connect(f.frequency); pDepth.connect(f.frequency);
                    return f;
                });
                pLfo.connect(pDepth); pBase.start(0); pLfo.start(0);
                input.connect(wet).connect(pFilters[0]).connect(pFilters[1]).connect(pFilters[2]).connect(pFilters[3]).connect(output);
                pFilters[3].connect(pFbk).connect(pFilters[0]);
             } else {
                 input.connect(wet).connect(output); // Passthrough if inactive
             }
          },
          flanger: (input, output, eff) => {
             const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
             const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
             input.connect(dry).connect(output);
             if (eff.active) {
                const fLfo = offlineContext.createOscillator(); fLfo.frequency.value = eff.rate; // FIX: Use user-controlled rate
                const fDepth = offlineContext.createGain();
                const fBase = offlineContext.createConstantSource();
                const fFbk = offlineContext.createGain(); fFbk.gain.value = eff.feedback;
                const fDelayNode = offlineContext.createDelay(0.1);
                const f_delay = eff.delay / 1000, f_depth = eff.depth / 1000;
                const f_baseDelay = Math.max(f_delay, f_depth);
                fDepth.gain.value = f_depth; fBase.offset.value = f_baseDelay;
                fBase.connect(fDelayNode.delayTime); fLfo.connect(fDepth).connect(fDelayNode.delayTime);
                fBase.start(0); fLfo.start(0);
                input.connect(wet).connect(fDelayNode).connect(output);
                fDelayNode.connect(fFbk).connect(fDelayNode);
             } else {
                 input.connect(wet).connect(output);
             }
          },
          chorus: (input, output, eff) => {
            const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
            const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
            input.connect(dry).connect(output);
            if(eff.active) {
                const cLfo = offlineContext.createOscillator(); cLfo.frequency.value = eff.rate;
                const cDepth = offlineContext.createGain(); cDepth.gain.value = eff.depth / 1000;
                const cBase = offlineContext.createConstantSource(); cBase.offset.value = eff.delay / 1000;
                const cDelayNode = offlineContext.createDelay(1.0);
                cBase.connect(cDelayNode.delayTime); cLfo.connect(cDepth).connect(cDelayNode.delayTime);
                cBase.start(0); cLfo.start(0);
                input.connect(wet).connect(cDelayNode).connect(output);
            } else {
                 input.connect(wet).connect(output);
            }
          },
          tremolo: (input, output, eff) => {
            const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
            const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
            input.connect(dry).connect(output);
            if(eff.active){
                const tLfo = offlineContext.createOscillator(); tLfo.frequency.value = eff.frequency;
                const tDepth = offlineContext.createGain(); tDepth.gain.value = eff.depth / 2;
                const tBase = offlineContext.createConstantSource(); tBase.offset.value = 1 - (eff.depth / 2);
                const tGain = offlineContext.createGain();
                tGain.gain.value = 0; // FIX: Set intrinsic value to 0 for correct modulation
                tBase.connect(tGain.gain); tLfo.connect(tDepth).connect(tGain.gain);
                tBase.start(0); tLfo.start(0);
                input.connect(wet).connect(tGain).connect(output);
            } else {
                input.connect(wet).connect(output);
            }
          },
          delay: (input, output, eff) => {
            const wet = offlineContext.createGain(); wet.gain.value = eff.active ? 1 : 0;
            const dry = offlineContext.createGain(); dry.gain.value = eff.active ? 0 : 1;
            input.connect(dry).connect(output);
            if(eff.active) {
                const dNode = offlineContext.createDelay(5.0); dNode.delayTime.value = eff.time;
                const dFbk = offlineContext.createGain(); dFbk.gain.value = eff.feedback;
                input.connect(wet).connect(dNode);
                dNode.connect(dFbk).connect(dNode);
                dNode.connect(output);
            } else {
                input.connect(wet).connect(output);
            }
          },
          reverb: (input, output, eff) => {
            const wet = offlineContext.createGain();
            const dry = offlineContext.createGain();
            if(eff.active) {
                wet.gain.value = eff.wet;
                dry.gain.value = 1.0 - eff.wet;
                const reverb = offlineContext.createConvolver();
                reverb.buffer = this._createReverbImpulseResponseForContext(eff.decay, offlineContext);
                input.connect(wet).connect(reverb).connect(output);
            } else {
                wet.gain.value = 0;
                dry.gain.value = 1;
            }
             input.connect(dry).connect(output);
          },
      };

      const effectOrder: (keyof EffectsState)[] = ['distortion', 'panner', 'phaser', 'flanger', 'chorus', 'tremolo', 'delay', 'reverb'];
      for (const key of effectOrder) {
          const nextNode = offlineContext.createGain();
          (effectChain[key] as any)(melodyFxChain, nextNode, effects[key]);
          melodyFxChain = nextNode;
      }
      melodyFxChain.connect(masterOut);
      
      const pulseWave = this._createPulseWaveForContext(offlineContext);
      const organWave = this._createOrganWaveForContext(offlineContext);
      this.mergeConsecutiveNotes(composition.melody).forEach(note => {
        const gainNode = offlineContext.createGain(); gainNode.connect(melodyVolumeNode);
        let source: OscillatorNode;
        if(note.waveform === 'pulse' && pulseWave){
            source = offlineContext.createOscillator(); source.setPeriodicWave(pulseWave); source.frequency.value = note.pitch;
        } else if (note.waveform === 'organ' && organWave) {
            source = offlineContext.createOscillator(); source.setPeriodicWave(organWave); source.frequency.value = note.pitch;
        } else {
            source = offlineContext.createOscillator(); source.type = note.waveform as OscillatorType; source.frequency.value = note.pitch;
        }
        source.connect(gainNode);
        const attackTime = 0.005, releaseTime = 0.01, peakVolume = 0.25;
        const startTime = note.time, endTime = startTime + note.duration;
        gainNode.gain.setValueAtTime(0, startTime); gainNode.gain.linearRampToValueAtTime(peakVolume, startTime + attackTime);
        gainNode.gain.setValueAtTime(peakVolume, endTime - releaseTime); gainNode.gain.linearRampToValueAtTime(0, endTime);
        source.start(startTime); source.stop(endTime);
      });

      // --- Create Bass Track ---
      const bassVolumeNode = offlineContext.createGain(); 
      bassVolumeNode.gain.value = params.bassVolume;
      const bassWeightFilter = offlineContext.createBiquadFilter();
      bassWeightFilter.type = 'lowpass';
      bassWeightFilter.Q.value = 1;
      const minFreq = 80; const maxFreq = 1500;
      bassWeightFilter.frequency.value = minFreq * Math.pow(maxFreq / minFreq, 1 - params.bassWeight);
      
      let bassFxChain: AudioNode = offlineContext.createGain();
      bassFxChain.connect(bassWeightFilter).connect(bassVolumeNode);
      const bassIn = bassFxChain;

      // Bass FX Chain: Distortion -> Chorus -> Compressor -> Reverb
      const bassDistOut = offlineContext.createGain();
      effectChain.distortion(bassVolumeNode, bassDistOut, { active: bassEffects.distortion.active, drive: bassEffects.distortion.drive * 0.5, tone: 5000, output: 1 });
      
      const bassChorusOut = offlineContext.createGain();
      effectChain.chorus(bassDistOut, bassChorusOut, bassEffects.chorus);

      const bassComp = offlineContext.createDynamicsCompressor();
      if(bassEffects.compressor.active){
          bassComp.threshold.value = bassEffects.compressor.threshold;
          bassComp.ratio.value = bassEffects.compressor.ratio;
          bassComp.attack.value = bassEffects.compressor.attack;
          bassComp.release.value = bassEffects.compressor.release;
      }
      bassChorusOut.connect(bassComp);
      
      const bassReverbOut = offlineContext.createGain();
      effectChain.reverb(bassComp, bassReverbOut, bassEffects.reverb);
      bassReverbOut.connect(masterOut);

      this.mergeConsecutiveNotes(composition.bass).forEach(note => {
          const gainNode = offlineContext.createGain(); gainNode.connect(bassIn);
          const osc = offlineContext.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = note.pitch;
          osc.connect(gainNode);
          const attackTime = 0.005, releaseTime = 0.01, peakVolume = 0.35;
          const startTime = note.time, endTime = startTime + note.duration;
          gainNode.gain.setValueAtTime(0, startTime); gainNode.gain.linearRampToValueAtTime(peakVolume, startTime + attackTime);
          gainNode.gain.setValueAtTime(peakVolume, endTime - releaseTime); gainNode.gain.linearRampToValueAtTime(0, endTime);
          osc.start(startTime); osc.stop(endTime);
      });

      // --- Create Drum Track ---
      const drumVolumeNode = offlineContext.createGain(); 
      drumVolumeNode.gain.value = params.drumVolume;
      const drumIn = drumVolumeNode;

      // Drum FX Chain: Filter -> Compressor -> Delay -> Reverb
      const drumFilter = offlineContext.createBiquadFilter();
      drumFilter.type = 'lowpass';
      if(drumEffects.filter.active){
          drumFilter.frequency.value = drumEffects.filter.frequency;
          drumFilter.Q.value = drumEffects.filter.q;
      }
      drumVolumeNode.connect(drumFilter);

      const drumComp = offlineContext.createDynamicsCompressor();
      if(drumEffects.compressor.active){
          drumComp.threshold.value = drumEffects.compressor.threshold;
          drumComp.ratio.value = drumEffects.compressor.ratio;
          drumComp.attack.value = drumEffects.compressor.attack;
          drumComp.release.value = drumEffects.compressor.release;
      }
      drumFilter.connect(drumComp);
      
      const drumDelayOut = offlineContext.createGain();
      effectChain.delay(drumComp, drumDelayOut, drumEffects.delay);
      
      const drumReverbOut = offlineContext.createGain();
      effectChain.reverb(drumDelayOut, drumReverbOut, drumEffects.reverb);
      drumReverbOut.connect(masterOut);

      composition.drums.forEach(note => {
          this._playDrumSampleOffline(offlineContext, drumIn, note.sample, note.time, params.drumTone);
      });

      const renderedBuffer = await offlineContext.startRendering();
      const wavBlob = this.bufferToWav(renderedBuffer);
      this.downloadBlob(wavBlob, 'sonif-ai-effect.wav');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none'; a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

    private _createPulseWaveForContext(context: BaseAudioContext): PeriodicWave {
        const real_pulse = new Float32Array(256);
        for (let i = 0; i < 256; i++) real_pulse[i] = i < 64 ? 1 : -1;
        const imag_pulse = new Float32Array(real_pulse.length).fill(0);
        return context.createPeriodicWave(real_pulse, imag_pulse);
    }
    
    private _createOrganWaveForContext(context: BaseAudioContext): PeriodicWave {
      const real = new Float32Array([0, 0.8, 0.4, 0.2, 0.1, 0.05]);
      const imag = new Float32Array(real.length).fill(0);
      return context.createPeriodicWave(real, imag);
    }

    private _createCustomWaves(): void {
        if (!this.audioContext) return;
        this.pulseWave = this._createPulseWaveForContext(this.audioContext);
        this.organWave = this._createOrganWaveForContext(this.audioContext);
    }
    
    private _createReverbImpulseResponse(decay: number): AudioBuffer {
        return this._createReverbImpulseResponseForContext(decay, this.audioContext);
    }

    private _createReverbImpulseResponseForContext(decay: number, context: BaseAudioContext): AudioBuffer {
        const sampleRate = context.sampleRate;
        const length = Math.ceil(sampleRate * decay);
        if (length <= 1) return context.createBuffer(2, 1, sampleRate);
        const impulse = context.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        const earlyReflections = [
            { time: 0.015, gain: 0.4, pan: -0.8 }, { time: 0.022, gain: 0.3, pan: 0.7 },
            { time: 0.030, gain: 0.35, pan: -0.4 }, { time: 0.045, gain: 0.2, pan: 0.6 },
        ];

        for(const ref of earlyReflections) {
            const index = Math.floor(ref.time * sampleRate);
            if(index < length && index >= 0) {
                const angle = (ref.pan * 0.5 + 0.5) * Math.PI * 0.5;
                impulseL[index] += Math.cos(angle) * ref.gain;
                impulseR[index] += Math.sin(angle) * ref.gain;
            }
        }

        const tailStart = Math.floor(0.05 * sampleRate);
        for (let i = tailStart; i < length; i++) {
            const power = Math.pow(1 - i / length, 2.5);
            impulseL[i] += (Math.random() * 2 - 1) * power * 0.25;
            impulseR[i] += (Math.random() * 2 - 1) * power * 0.25;
        }

        let max = 0.00001;
        for (let i = 0; i < length; i++) {
          if (Math.abs(impulseL[i]) > max) max = Math.abs(impulseL[i]);
          if (Math.abs(impulseR[i]) > max) max = Math.abs(impulseR[i]);
        }
        for (let i = 0; i < length; i++) { impulseL[i] /= max; impulseR[i] /= max; }
        return impulse;
    }

  private bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels, length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length), view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let pos = 0;
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(length - pos - 4);

    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
    
    let dataIndex = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][dataIndex] || 0));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      dataIndex++;
    }
    return new Blob([view], { type: 'audio/wav' });
  }

  private _playDrumSample(sample: DrumSample, time: number) {
      this._playDrumSampleOffline(this.audioContext, this.drumIn, sample, time, this.drumTone);
  }

  private _playDrumSampleOffline(context: BaseAudioContext, destination: AudioNode, sample: DrumSample, time: number, tone: number) {
    if (!destination) return;
    switch (sample) {
      case 'kick': {
        const osc = context.createOscillator(); const gain = context.createGain();
        osc.connect(gain); gain.connect(destination);
        
        const startFreq = 60 + (tone * 90);
        const endFreq = 0.01;
        const duration = 0.25;

        osc.frequency.setValueAtTime(startFreq, time); 
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.0, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        gain.gain.linearRampToValueAtTime(0, time + duration + 0.01);
        
        osc.start(time); 
        osc.stop(time + duration + 0.01);
        break;
      }
      case 'snare': {
        const noise = context.createBufferSource();
        const bufferSize = context.sampleRate * 0.1;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const noiseFilter = context.createBiquadFilter(); 
        noiseFilter.type = 'highpass'; 
        noiseFilter.frequency.value = 800 + (tone * 1200);
        noise.connect(noiseFilter);
        const noiseGain = context.createGain();
        noiseFilter.connect(noiseGain); noiseGain.connect(destination);
        
        noiseGain.gain.setValueAtTime(0, time);
        noiseGain.gain.linearRampToValueAtTime(0.4, time + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        noise.start(time); noise.stop(time + 0.08);

        const osc = context.createOscillator(); osc.type = 'triangle';
        const oscGain = context.createGain();
        osc.connect(oscGain); oscGain.connect(destination);
        osc.frequency.value = 100;
        
        oscGain.gain.setValueAtTime(0, time);
        oscGain.gain.linearRampToValueAtTime(0.3, time + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        osc.start(time); osc.stop(time + 0.05);
        break;
      }
      case 'hat': {
        const noise = context.createBufferSource();
        const bufferSize = context.sampleRate * 0.1;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const noiseFilter = context.createBiquadFilter(); 
        noiseFilter.type = 'highpass'; 
        noiseFilter.frequency.value = 6000 + (tone * 3000);
        noise.connect(noiseFilter);
        const noiseGain = context.createGain();
        noiseFilter.connect(noiseGain); noiseGain.connect(destination);
        
        noiseGain.gain.setValueAtTime(0, time);
        noiseGain.gain.linearRampToValueAtTime(0.2, time + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
        noise.start(time); noise.stop(time + 0.03);
        break;
      }
    }
  }
}

export const audioService = new AudioEngine();