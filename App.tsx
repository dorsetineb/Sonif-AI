import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { EffectsPanel } from './components/EffectsPanel';
import { BassEffectsPanel } from './components/BassEffectsPanel';
import { DrumEffectsPanel } from './components/DrumEffectsPanel';
import { audioService } from './services/audioService';
import type { Note, Waveform, EffectsState, Composition, DrumNote, DrumSample, BassEffectsState, DrumEffectsState } from './types';
import { PITCH_NAMES, PITCHES, NOTE_HEIGHT, NOTE_FIXED_DURATION, BASS_PITCHES, BASS_PITCH_NAMES, DRUM_SAMPLES, DRUM_SAMPLE_NAMES, DRUM_NOTE_HEIGHT, WAVEFORM_CONFIG } from './constants';

const TrackHeader: React.FC<{ title: string; isOpen: boolean; onToggle: () => void; }> = ({ title, isOpen, onToggle }) => (
  <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-t-md transition-colors focus:outline-none">
    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
    <h3 className="font-bold text-gray-200">{title}</h3>
  </button>
);

const WaveformIcon: React.FC<{ type: Waveform }> = ({ type }) => {
  const path = {
    sine: 'M 0 12 C 4 0, 8 24, 12 12 S 20 0, 24 12',
    square: 'M 0 6 H 12 V 18 H 24',
    sawtooth: 'M 0 24 L 12 0 L 24 24 Z',
    triangle: 'M 0 18 L 12 6 L 24 18 Z',
    pulse: 'M 0 6 H 6 V 18 H 12 V 6 H 18 V 18 H 24',
    organ: 'M 2 18 V 10 M 6 18 V 6 M 10 18 V 12 M 14 18 V 8 M 18 18 V 14 M 22 18 V 11',
  }[type];
  const isFilled = type === 'sawtooth' || type === 'triangle';
  return <svg width="24" height="24" viewBox="0 0 24 24" fill={isFilled ? "currentColor": "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
};

const App: React.FC = () => {
  const [composition, setComposition] = useState<Composition>({ melody: [], bass: [], drums: [] });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [waveform, setWaveform] = useState<Waveform>('square');
  const [duration, setDuration] = useState<number>(1);
  const [openTracks, setOpenTracks] = useState({ melody: true, bass: true, drums: true });
  
  // Panel visibility
  const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(false);
  const [isBassEffectsPanelOpen, setIsBassEffectsPanelOpen] = useState(false);
  const [isDrumEffectsPanelOpen, setIsDrumEffectsPanelOpen] = useState(false);

  // Track parameters
  const [melodyVolume, setMelodyVolume] = useState(0.8);
  const [bassWeight, setBassWeight] = useState(0.5);
  const [drumTone, setDrumTone] = useState(0.5);
  const [bassVolume, setBassVolume] = useState(0.8);
  const [drumVolume, setDrumVolume] = useState(0.8);

  // Effects states
  const [effects, setEffects] = useState<EffectsState>({
    distortion: { active: false, drive: 0.5, tone: 2500, output: 0.5 },
    panner: { active: false, pan: 0 },
    phaser: { active: false, frequency: 1.2, depth: 500, feedback: 0.5 },
    flanger: { active: false, delay: 3, depth: 1, feedback: 0.5, rate: 1.5 },
    chorus: { active: false, rate: 1.5, depth: 0.5, delay: 4 },
    tremolo: { active: false, frequency: 5, depth: 0.6 },
    reverb: { active: false, decay: 1.5, wet: 0.5 },
    delay: { active: false, time: 0.25, feedback: 0.3 },
  });
  
  const [bassEffects, setBassEffects] = useState<BassEffectsState>({
    reverb: { active: false, decay: 1, wet: 0.3 },
    distortion: { active: false, drive: 0.5 },
    compressor: { active: false, threshold: -24, ratio: 12, attack: 0.003, release: 0.25 },
    chorus: { active: false, rate: 1.5, depth: 0.5, delay: 4 },
  });

  const [drumEffects, setDrumEffects] = useState<DrumEffectsState>({
    delay: { active: false, time: 0.25, feedback: 0.3 },
    reverb: { active: false, decay: 1, wet: 0.3 },
    compressor: { active: false, threshold: -24, ratio: 12, attack: 0.003, release: 0.25 },
    filter: { active: false, frequency: 1200, q: 1 },
  });
  
  const animationFrameId = useRef<number | null>(null);
  const loopStartTimeRef = useRef<number>(0);

  const handlePreviewNote = useCallback((track: keyof Composition, rowIndex: number) => {
    switch (track) {
      case 'melody': audioService.playPreviewNote({ pitch: PITCHES[rowIndex], waveform }, effects); break;
      case 'bass': audioService.playPreviewBassNote(BASS_PITCHES[rowIndex]); break;
      case 'drums': audioService.playPreviewDrumSample(DRUM_SAMPLES[rowIndex]); break;
    }
  }, [waveform, effects]);

  const handlePreviewWaveform = useCallback((previewWaveform: Waveform) => {
    const previewPitch = PITCHES[Math.floor(PITCHES.length / 2)];
    audioService.playPreviewNote({ pitch: previewPitch, waveform: previewWaveform }, effects);
  }, [effects]);

  const handleStop = useCallback(() => {
    audioService.stopAll();
    setIsPlaying(false);
    setPlaybackPosition(0);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  const handleAddNote = useCallback((track: keyof Composition, time: number, rowIndex: number) => {
    if (time >= duration) return;
    
    const id = `${Date.now()}-${Math.random()}`;
    let newNote: Note | DrumNote;
    
    if (track === 'melody' || track === 'bass') {
      const pitches = track === 'melody' ? PITCHES : BASS_PITCHES;
      const pitch = pitches[rowIndex];
      const isDuplicate = composition[track].some(note => note.pitch === pitch && Math.abs(note.time - time) < 0.001);
      if (isDuplicate) return;
      newNote = { id, time, pitch, duration: NOTE_FIXED_DURATION, waveform: track === 'melody' ? waveform : 'sawtooth' };
    } else { // drums
      const sample = DRUM_SAMPLES[rowIndex];
      const isDuplicate = composition.drums.some(note => note.sample === sample && Math.abs(note.time - time) < 0.001);
      if (isDuplicate) return;
      newNote = { id, time, sample, duration: NOTE_FIXED_DURATION };
    }
    
    setComposition(prev => ({
        ...prev,
        [track]: [...prev[track], newNote].sort((a,b) => a.time - b.time) as any
    }));

  }, [composition, waveform, duration]);

  const handleRemoveNote = useCallback((noteId: string) => {
    setComposition(prev => {
      const newMelody = prev.melody.filter(n => n.id !== noteId);
      if (newMelody.length !== prev.melody.length) return { ...prev, melody: newMelody };

      const newBass = prev.bass.filter(n => n.id !== noteId);
      if (newBass.length !== prev.bass.length) return { ...prev, bass: newBass };

      const newDrums = prev.drums.filter(n => n.id !== noteId);
      return { ...prev, drums: newDrums };
    });
  }, []);
  
  const handlePlay = useCallback(() => {
    const hasNotes = composition.melody.length > 0 || composition.bass.length > 0 || composition.drums.length > 0;
    if (!hasNotes) return;
    audioService.initAudioContext().then(() => {
      setIsPlaying(true);
    });
  }, [composition]);
  
  const handleSetDuration = useCallback((newDuration: number) => {
    handleStop();
    setDuration(newDuration);
    setComposition(prev => ({
        melody: prev.melody.filter(n => n.time < newDuration),
        bass: prev.bass.filter(n => n.time < newDuration),
        drums: prev.drums.filter(n => n.time < newDuration),
    }));
  }, [handleStop]);

  const playbackLoop = useCallback((currentTime: number) => {
    if (loopStartTimeRef.current === 0) {
      loopStartTimeRef.current = currentTime;
      audioService.playComposition(composition, effects, bassEffects, drumEffects);
    }

    let elapsed = currentTime - loopStartTimeRef.current;
    
    if (elapsed >= duration * 1000) {
      if (isLooping) {
        const loopsPassed = Math.floor(elapsed / (duration * 1000));
        loopStartTimeRef.current += loopsPassed * duration * 1000;
        elapsed = currentTime - loopStartTimeRef.current;
        audioService.playComposition(composition, effects, bassEffects, drumEffects);
      } else {
        handleStop();
        return;
      }
    }

    const progress = elapsed / (duration * 1000);
    setPlaybackPosition(progress);
    animationFrameId.current = requestAnimationFrame(playbackLoop);
  }, [composition, isLooping, handleStop, duration, effects, bassEffects, drumEffects]);

  useEffect(() => {
    if (isPlaying) {
      loopStartTimeRef.current = 0;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(playbackLoop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, playbackLoop]);
  
  const handleToggleLoop = useCallback(() => setIsLooping(prev => !prev), []);

  const handleClear = useCallback(() => {
    handleStop();
    setComposition({ melody: [], bass: [], drums: [] });
  }, [handleStop]);

  const handleExport = useCallback(async () => {
    const hasNotes = composition.melody.length > 0 || composition.bass.length > 0 || composition.drums.length > 0;
    if (!hasNotes) return;
    setIsExporting(true);
    try {
      await audioService.initAudioContext();
      await audioService.exportToWav(composition, duration, effects, bassEffects, drumEffects, { melodyVolume, bassVolume, bassWeight, drumVolume, drumTone });
    } catch (error) {
      console.error("Failed to export WAV:", error);
    } finally {
      setIsExporting(false);
    }
  }, [composition, effects, bassEffects, drumEffects, duration, melodyVolume, bassVolume, bassWeight, drumVolume, drumTone]);
  
  useEffect(() => { audioService.updateEffects(effects); }, [effects]);
  useEffect(() => { audioService.updateBassEffects(bassEffects); }, [bassEffects]);
  useEffect(() => { audioService.updateDrumEffects(drumEffects); }, [drumEffects]);
  useEffect(() => { audioService.setMelodyVolume(melodyVolume); }, [melodyVolume]);
  useEffect(() => { audioService.setBassVolume(bassVolume); }, [bassVolume]);
  useEffect(() => { audioService.setDrumVolume(drumVolume); }, [drumVolume]);
  useEffect(() => { audioService.setBassWeight(bassWeight); }, [bassWeight]);
  useEffect(() => { audioService.setDrumTone(drumTone); }, [drumTone]);

  
  useEffect(() => { return () => { handleStop(); } }, [handleStop]);
  
  const getMelodyNoteStyle = useCallback((note: Note | DrumNote) => {
    const waveform = (note as Note).waveform;
    switch (waveform) {
      case 'sine': return { className: 'bg-cyan-400', glowColor: '#22d3ee' };
      case 'square': return { className: 'bg-purple-400', glowColor: '#c084fc' };
      case 'sawtooth': return { className: 'bg-yellow-400', glowColor: '#facc15' };
      case 'triangle': return { className: 'bg-emerald-400', glowColor: '#34d399' };
      case 'pulse': return { className: 'bg-rose-400', glowColor: '#fb7185' };
      case 'organ': return { className: 'bg-amber-500', glowColor: '#f59e0b' };
      default: return { className: 'bg-gray-400', glowColor: '#9ca3af' };
    }
  }, []);

  const getBassNoteStyle = useCallback(() => ({ className: 'bg-blue-500', glowColor: '#3b82f6' }), []);

  const getDrumNoteStyle = useCallback((note: Note | DrumNote) => {
    const sample = (note as DrumNote).sample;
    switch(sample) {
      case 'kick': return { className: 'bg-orange-500', glowColor: '#f97316' };
      case 'snare': return { className: 'bg-teal-400', glowColor: '#2dd4bf' };
      case 'hat': return { className: 'bg-pink-500', glowColor: '#ec4899' };
      default: return { className: 'bg-gray-400', glowColor: '#9ca3af' };
    }
  }, []);

  const EffectsButton: React.FC<{onClick: () => void}> = ({onClick}) => (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75" title="Efeitos">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
      Efeitos
    </button>
  )

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      <div className="px-4 pt-4">
        <Controls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onStop={handleStop}
          onClear={handleClear}
          onExport={handleExport}
          isExporting={isExporting}
          isLooping={isLooping}
          onToggleLoop={handleToggleLoop}
          duration={duration}
          onSetDuration={handleSetDuration}
        />
      </div>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 flex flex-col min-h-0 space-y-3 overflow-y-auto">
        {/* Melody Track */}
        <div className='flex flex-col'>
            <TrackHeader title="Melodia" isOpen={openTracks.melody} onToggle={() => setOpenTracks(p => ({...p, melody: !p.melody}))} />
            {openTracks.melody && (
              <div className="flex flex-row gap-4 p-2 bg-gray-800 rounded-b-md">
                <div className="flex-grow min-w-0 h-80">
                  <Timeline
                    notes={composition.melody}
                    onAddNote={(time, rowIndex) => handleAddNote('melody', time, rowIndex)}
                    onPreviewNote={(rowIndex) => handlePreviewNote('melody', rowIndex)}
                    onRemoveNote={handleRemoveNote}
                    playbackPosition={playbackPosition}
                    isPlaying={isPlaying}
                    duration={duration}
                    noteHeight={NOTE_HEIGHT}
                    rows={PITCHES}
                    rowLabels={PITCH_NAMES}
                    getNoteStyle={getMelodyNoteStyle}
                  />
                </div>
                <div className="w-44 flex-shrink-0 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Forma de Onda</h4>
                    <div className="grid grid-cols-3 gap-1 bg-gray-700 rounded-lg p-1">
                    { (Object.keys(WAVEFORM_CONFIG) as Waveform[]).map((w) => (
                      <button
                        key={w}
                        onClick={() => { setWaveform(w); handlePreviewWaveform(w); }}
                        className={`p-2 rounded-md transition-colors ${waveform === w ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
                        title={WAVEFORM_CONFIG[w].name}
                      > <WaveformIcon type={w} /> </button>
                    ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="melody-volume" className="text-sm font-semibold text-gray-300">Volume</label>
                    <input id="melody-volume" type="range" min="0" max="1.2" step="0.01" value={melodyVolume} onChange={e => setMelodyVolume(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Processamento</h4>
                    <EffectsButton onClick={() => setIsEffectsPanelOpen(true)} />
                  </div>
                </div>
              </div>
            )}
        </div>
         {/* Bass Track */}
        <div className='flex flex-col'>
            <TrackHeader title="Baixo" isOpen={openTracks.bass} onToggle={() => setOpenTracks(p => ({...p, bass: !p.bass}))} />
            {openTracks.bass && (
              <div className="flex flex-row gap-4 p-2 bg-gray-800 rounded-b-md">
                <div className="flex-grow min-w-0 h-48">
                   <Timeline
                    notes={composition.bass}
                    onAddNote={(time, rowIndex) => handleAddNote('bass', time, rowIndex)}
                    onPreviewNote={(rowIndex) => handlePreviewNote('bass',rowIndex)}
                    onRemoveNote={handleRemoveNote}
                    playbackPosition={playbackPosition}
                    isPlaying={isPlaying}
                    duration={duration}
                    noteHeight={NOTE_HEIGHT}
                    rows={BASS_PITCHES}
                    rowLabels={BASS_PITCH_NAMES}
                    getNoteStyle={getBassNoteStyle}
                  />
                </div>
                <div className="w-44 flex-shrink-0 flex flex-col justify-start gap-4">
                  <div>
                    <label htmlFor="bass-weight" className="text-sm font-semibold text-gray-300">Peso</label>
                    <input id="bass-weight" type="range" min="0" max="1" step="0.01" value={bassWeight} onChange={e => setBassWeight(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                  </div>
                  <div>
                    <label htmlFor="bass-volume" className="text-sm font-semibold text-gray-300">Volume</label>
                    <input id="bass-volume" type="range" min="0" max="1.2" step="0.01" value={bassVolume} onChange={e => setBassVolume(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                  </div>
                   <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Processamento</h4>
                    <EffectsButton onClick={() => setIsBassEffectsPanelOpen(true)} />
                  </div>
                </div>
              </div>
            )}
        </div>
        {/* Drums Track */}
        <div className='flex flex-col'>
            <TrackHeader title="Bateria" isOpen={openTracks.drums} onToggle={() => setOpenTracks(p => ({...p, drums: !p.drums}))} />
            {openTracks.drums && (
              <div className="flex flex-row gap-4 p-2 bg-gray-800 rounded-b-md">
                <div className="flex-grow min-w-0 h-32">
                   <Timeline
                    notes={composition.drums}
                    onAddNote={(time, rowIndex) => handleAddNote('drums', time, rowIndex)}
                    onPreviewNote={(rowIndex) => handlePreviewNote('drums', rowIndex)}
                    onRemoveNote={handleRemoveNote}
                    playbackPosition={playbackPosition}
                    isPlaying={isPlaying}
                    duration={duration}
                    noteHeight={DRUM_NOTE_HEIGHT}
                    rows={DRUM_SAMPLES}
                    rowLabels={DRUM_SAMPLE_NAMES}
                    getNoteStyle={getDrumNoteStyle}
                  />
                </div>
                 <div className="w-44 flex-shrink-0 flex flex-col justify-start gap-4">
                    <div>
                        <label htmlFor="drum-tone" className="text-sm font-semibold text-gray-300">Tom</label>
                        <input id="drum-tone" type="range" min="0" max="1" step="0.01" value={drumTone} onChange={e => setDrumTone(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="drum-volume" className="text-sm font-semibold text-gray-300">Volume</label>
                        <input id="drum-volume" type="range" min="0" max="1.2" step="0.01" value={drumVolume} onChange={e => setDrumVolume(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Processamento</h4>
                      <EffectsButton onClick={() => setIsDrumEffectsPanelOpen(true)} />
                    </div>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Panel Area */}
      <EffectsPanel effects={effects} setEffects={setEffects} isPanelOpen={isEffectsPanelOpen} onClose={() => setIsEffectsPanelOpen(false)} />
      <BassEffectsPanel effects={bassEffects} setEffects={setBassEffects} isPanelOpen={isBassEffectsPanelOpen} onClose={() => setIsBassEffectsPanelOpen(false)} />
      <DrumEffectsPanel effects={drumEffects} setEffects={setDrumEffects} isPanelOpen={isDrumEffectsPanelOpen} onClose={() => setIsDrumEffectsPanelOpen(false)} />
    </div>
  );
};

export default App;