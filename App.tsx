import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { EffectsPanel } from './components/EffectsPanel';
import { audioService } from './services/audioService';
import type { Note, Waveform, EffectsState } from './types';
import { PITCH_NAMES, NOTE_HEIGHT } from './constants';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [waveform, setWaveform] = useState<Waveform>('square');
  const [duration, setDuration] = useState<number>(1);
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
    // CRITICAL FIX: Initialize/resume AudioContext on user gesture to comply with browser autoplay policies.
    // This is the main fix for the "no sound" bug.
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
      await audioService.initAudioContext(); // Ensure context exists for export
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
  
  // Cleanup effect to stop sound on component unmount
  useEffect(() => {
    return () => {
      handleStop();
    }
  }, [handleStop]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Sonif-AI
        </h1>
        <p className="text-gray-500 text-sm mt-4">Click on the grid to add a note. Click a note to remove it.</p>
      </header>
      <main className="flex flex-col items-center space-y-6 w-full">
        <Controls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onStop={handleStop}
          onClear={handleClear}
          onExport={handleExport}
          isExporting={isExporting}
          waveform={waveform}
          setWaveform={setWaveform}
          isLooping={isLooping}
          onToggleLoop={handleToggleLoop}
          duration={duration}
          onSetDuration={handleSetDuration}
        />
        <div className="w-full max-w-5xl">
            <div className="flex flex-row items-start space-x-2">
                <div className="flex flex-col text-right pr-2 pt-1.5 flex-shrink-0" style={{height: PITCH_NAMES.length * NOTE_HEIGHT}}>
                    {PITCH_NAMES.map((name, index) => (
                        <div key={index} className="text-gray-400 text-xs font-mono select-none" style={{height: NOTE_HEIGHT, lineHeight: `${NOTE_HEIGHT}px`}}>
                            {name}
                        </div>
                    ))}
                </div>
                <Timeline
                  notes={notes}
                  onAddNote={handleAddNote}
                  onRemoveNote={handleRemoveNote}
                  playbackPosition={playbackPosition}
                  isPlaying={isPlaying}
                  duration={duration}
                />
            </div>
        </div>
        <EffectsPanel effects={effects} setEffects={setEffects} />
      </main>
    </div>
  );
};

export default App;