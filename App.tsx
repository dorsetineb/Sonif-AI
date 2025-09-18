import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { EffectsPanel } from './components/EffectsPanel';
import { audioService } from './services/audioService';
import type { Note, Waveform, EffectsState, Composition, DrumNote, DrumSample } from './types';
import { PITCH_NAMES, PITCHES, NOTE_HEIGHT, NOTE_FIXED_DURATION, BASS_PITCHES, BASS_PITCH_NAMES, DRUM_SAMPLES, DRUM_SAMPLE_NAMES, DRUM_NOTE_HEIGHT } from './constants';

const TrackHeader: React.FC<{ title: string; isOpen: boolean; onToggle: () => void }> = ({ title, isOpen, onToggle }) => (
  <button onClick={onToggle} className="w-full flex items-center justify-between px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-t-md transition-colors">
    <h3 className="font-bold text-gray-200">{title}</h3>
    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </button>
);


const App: React.FC = () => {
  const [composition, setComposition] = useState<Composition>({ melody: [], bass: [], drums: [] });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [waveform, setWaveform] = useState<Waveform>('square');
  const [duration, setDuration] = useState<number>(1);
  const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(false);
  const [openTracks, setOpenTracks] = useState({ melody: true, bass: true, drums: true });

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
      audioService.playComposition(composition, effects);
    }

    let elapsed = currentTime - loopStartTimeRef.current;
    
    if (elapsed >= duration * 1000) {
      if (isLooping) {
        const loopsPassed = Math.floor(elapsed / (duration * 1000));
        loopStartTimeRef.current += loopsPassed * duration * 1000;
        elapsed = currentTime - loopStartTimeRef.current;
        audioService.playComposition(composition, effects);
      } else {
        handleStop();
        return;
      }
    }

    const progress = elapsed / (duration * 1000);
    setPlaybackPosition(progress);
    animationFrameId.current = requestAnimationFrame(playbackLoop);
  }, [composition, isLooping, handleStop, duration, effects]);

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
      await audioService.exportToWav(composition, duration, effects);
    } catch (error) {
      console.error("Failed to export WAV:", error);
    } finally {
      setIsExporting(false);
    }
  }, [composition, effects, duration]);
  
  useEffect(() => {
    audioService.updateEffects(effects);
  }, [effects]);
  
  useEffect(() => {
    return () => {
      handleStop();
    }
  }, [handleStop]);
  
  const getMelodyNoteStyle = useCallback((note: Note | DrumNote) => {
    const waveform = (note as Note).waveform;
    switch (waveform) {
      case 'sine': return { className: 'bg-cyan-400', glowColor: '#22d3ee' };
      case 'square': return { className: 'bg-purple-400', glowColor: '#c084fc' };
      case 'sawtooth': return { className: 'bg-yellow-400', glowColor: '#facc15' };
      case 'triangle': return { className: 'bg-emerald-400', glowColor: '#34d399' };
      case 'pulse': return { className: 'bg-rose-400', glowColor: '#fb7185' };
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
          waveform={waveform}
          setWaveform={setWaveform}
          onPreviewWaveform={handlePreviewWaveform}
          isLooping={isLooping}
          onToggleLoop={handleToggleLoop}
          duration={duration}
          onSetDuration={handleSetDuration}
          onToggleEffectsPanel={() => setIsEffectsPanelOpen(prev => !prev)}
        />
      </div>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 flex flex-col min-h-0 space-y-4">
        {/* Melody Track */}
        <div className='flex flex-col'>
            <TrackHeader title="Melodia" isOpen={openTracks.melody} onToggle={() => setOpenTracks(p => ({...p, melody: !p.melody}))} />
            {openTracks.melody && (
              <div className="h-80">
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
            )}
        </div>
         {/* Bass Track */}
        <div className='flex flex-col'>
            <TrackHeader title="Baixo" isOpen={openTracks.bass} onToggle={() => setOpenTracks(p => ({...p, bass: !p.bass}))} />
            {openTracks.bass && (
              <div className="h-48">
                 <Timeline
                  notes={composition.bass}
                  onAddNote={(time, rowIndex) => handleAddNote('bass', time, rowIndex)}
                  onPreviewNote={(rowIndex) => handlePreviewNote('bass', rowIndex)}
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
            )}
        </div>
        {/* Drums Track */}
        <div className='flex flex-col'>
            <TrackHeader title="Bateria" isOpen={openTracks.drums} onToggle={() => setOpenTracks(p => ({...p, drums: !p.drums}))} />
            {openTracks.drums && (
              <div className="h-32">
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
            )}
        </div>
      </main>

      {/* Effects Panel Area */}
      {isEffectsPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20" 
          onClick={() => setIsEffectsPanelOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm md:max-w-md lg:max-w-lg bg-gray-800 shadow-2xl z-30 transition-transform duration-300 ease-in-out transform ${
            isEffectsPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <EffectsPanel effects={effects} setEffects={setEffects} onClose={() => setIsEffectsPanelOpen(false)} />
      </div>
    </div>
  );
};

export default App;
