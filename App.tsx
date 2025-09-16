import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { EffectsPanel } from './components/EffectsPanel';
import { audioService } from './services/audioService';
import type { Note, Waveform, EffectsState } from './types';
import { PITCH_NAMES, PITCHES, NOTE_HEIGHT as FALLBACK_NOTE_HEIGHT } from './constants';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [waveform, setWaveform] = useState<Waveform>('square');
  const [duration, setDuration] = useState<number>(1);
  const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(false);
  const [noteHeight, setNoteHeight] = useState(FALLBACK_NOTE_HEIGHT);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const element = timelineContainerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(() => {
      if (element.offsetHeight > 0) {
        setNoteHeight(element.offsetHeight / PITCHES.length);
      }
    });

    resizeObserver.observe(element);
    // Set initial height
    if (element.offsetHeight > 0) {
        setNoteHeight(element.offsetHeight / PITCHES.length);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handlePreviewNote = useCallback((pitch: number) => {
    audioService.playPreviewNote({ pitch, waveform }, effects);
  }, [waveform, effects]);

  const handlePreviewWaveform = useCallback((previewWaveform: Waveform) => {
    const previewPitch = PITCHES[Math.floor(PITCHES.length / 2)]; // A central pitch for consistency
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

  const handleAddNote = useCallback((newNote: Omit<Note, 'id'>) => {
    if (newNote.time >= duration) return;
    const isDuplicate = notes.some(note => 
        note.pitch === newNote.pitch && Math.abs(note.time - newNote.time) < 0.001
    );
    if (isDuplicate) return;
    const noteWithSettings: Note = {
      ...newNote,
      id: `${Date.now()}-${Math.random()}`,
      waveform: waveform,
    };
    setNotes(prevNotes => [...prevNotes, noteWithSettings].sort((a,b) => a.time - b.time));
  }, [notes, waveform, duration]);

  const handleRemoveNote = useCallback((noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  }, []);
  
  const handlePlay = useCallback(() => {
    if (notes.length === 0) return;
    audioService.initAudioContext().then(() => {
      setIsPlaying(true);
    });
  }, [notes]);
  
  const handleSetDuration = useCallback((newDuration: number) => {
    handleStop();
    setDuration(newDuration);
    setNotes(prev => prev.filter(n => n.time < newDuration));
  }, [handleStop]);

  const playbackLoop = useCallback((currentTime: number) => {
    if (loopStartTimeRef.current === 0) {
      loopStartTimeRef.current = currentTime;
      if(notes.length > 0) audioService.playNotes(notes, effects);
    }

    let elapsed = currentTime - loopStartTimeRef.current;
    
    if (elapsed >= duration * 1000) {
      if (isLooping) {
        const loopsPassed = Math.floor(elapsed / (duration * 1000));
        loopStartTimeRef.current += loopsPassed * duration * 1000;
        elapsed = currentTime - loopStartTimeRef.current;
        if(notes.length > 0) audioService.playNotes(notes, effects);
      } else {
        handleStop();
        return;
      }
    }

    const progress = elapsed / (duration * 1000);
    setPlaybackPosition(progress);
    animationFrameId.current = requestAnimationFrame(playbackLoop);
  }, [notes, isLooping, handleStop, duration, effects]);

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
    setNotes([]);
  }, [handleStop]);

  const handleExport = useCallback(async () => {
    if (notes.length === 0) return;
    setIsExporting(true);
    try {
      await audioService.initAudioContext();
      await audioService.exportToWav(notes, duration, effects);
    } catch (error) {
      console.error("Failed to export WAV:", error);
    } finally {
      setIsExporting(false);
    }
  }, [notes, effects, duration]);
  
  useEffect(() => {
    audioService.updateEffects(effects);
  }, [effects]);
  
  useEffect(() => {
    return () => {
      handleStop();
    }
  }, [handleStop]);

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

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 flex flex-col min-h-0">
        <div ref={timelineContainerRef} className="flex flex-row items-start space-x-2 h-full">
            {noteHeight > 0 && (
              <>
                <div className="flex flex-col text-right pr-2 flex-shrink-0" style={{paddingTop: noteHeight > 2 ? '0.375rem' : 0}}>
                    {PITCH_NAMES.map((name, index) => (
                        <div key={index} className="text-gray-400 text-xs font-mono select-none" style={{height: noteHeight, lineHeight: `${noteHeight}px`}}>
                            {name}
                        </div>
                    ))}
                </div>
                <Timeline
                  notes={notes}
                  onAddNote={handleAddNote}
                  onPreviewNote={handlePreviewNote}
                  onRemoveNote={handleRemoveNote}
                  playbackPosition={playbackPosition}
                  isPlaying={isPlaying}
                  duration={duration}
                  noteHeight={noteHeight}
                />
              </>
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