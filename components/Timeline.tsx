import React, { useRef } from 'react';
import type { Note } from '../types';
import { PITCHES, GRID_COLUMNS_PER_SECOND, NOTE_FIXED_DURATION } from '../constants';

interface TimelineProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onRemoveNote: (noteId: string) => void;
  onPreviewNote: (pitch: number) => void;
  playbackPosition: number; // 0 to 1
  isPlaying: boolean;
  duration: number; // in seconds
  noteHeight: number;
}

export const Timeline: React.FC<TimelineProps> = ({ notes, onAddNote, onRemoveNote, onPreviewNote, playbackPosition, isPlaying, duration, noteHeight }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const gridColumns = duration * GRID_COLUMNS_PER_SECOND;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || noteHeight <= 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colIndex = Math.floor(x / (rect.width / gridColumns));
    const time = colIndex * NOTE_FIXED_DURATION;
    
    const pitchIndex = Math.floor(y / noteHeight);
    const pitch = PITCHES[pitchIndex];

    if (pitch && time < duration) {
      onPreviewNote(pitch);
      onAddNote({ time, pitch, duration: NOTE_FIXED_DURATION, waveform: 'sine' }); // App will override waveform
    }
  };

  const noteColor = (waveform: Note['waveform']) => {
    switch (waveform) {
      case 'sine': return 'bg-cyan-400';
      case 'square': return 'bg-purple-400';
      case 'sawtooth': return 'bg-yellow-400';
      case 'triangle': return 'bg-emerald-400';
      case 'pulse': return 'bg-rose-400';
      default: return 'bg-gray-400';
    }
  };
  
  const getGlowColor = (waveform: Note['waveform']) => {
    switch (waveform) {
      case 'sine': return '#22d3ee'; // cyan-400
      case 'square': return '#c084fc'; // purple-400
      case 'sawtooth': return '#facc15'; // yellow-400
      case 'triangle': return '#34d399'; // emerald-400
      case 'pulse': return '#fb7185'; // rose-400
      default: return '#9ca3af'; // gray-400
    }
  };

  return (
    <div className="relative bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden select-none w-full h-full"
      ref={timelineRef}
      onClick={handleClick}
    >
      {/* Grid Lines */}
      {PITCHES.map((_, index) => (
        <div key={`row-${index}`} className="absolute w-full border-t border-gray-700/50" style={{ top: (index + 1) * noteHeight, left: 0 }} />
      ))}
      {Array.from({ length: gridColumns - 1 }).map((_, index) => (
        <div 
          key={`col-${index}`} 
          className="absolute h-full border-l border-gray-700/50" 
          style={{ 
            left: `${((index + 1) / gridColumns) * 100}%`,
            top: 0, 
            opacity: (index + 1) % GRID_COLUMNS_PER_SECOND === 0 ? 0.8 : 0.4 
          }} 
        />
      ))}

      {/* Notes */}
      {notes.map(note => {
        const left = (note.time / duration) * 100;
        const width = (note.duration / duration) * 100;
        const pitchIndex = PITCHES.findIndex(p => p === note.pitch);
        const top = pitchIndex * noteHeight;
        
        const noteStartTime = note.time / duration;
        const noteEndTime = (note.time + note.duration) / duration;
        const isActive = isPlaying && playbackPosition >= noteStartTime && playbackPosition < noteEndTime;
        
        // FIX: Cast style object to React.CSSProperties to allow for CSS custom properties.
        const style = {
          left: `${left}%`,
          top: `${top}px`,
          width: `${width}%`,
          height: `${noteHeight}px`,
          '--glow-color': getGlowColor(note.waveform),
        } as React.CSSProperties;

        return (
          <div
            key={note.id}
            onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); }}
            className={`note absolute cursor-pointer ${noteColor(note.waveform)} border-r border-gray-900/50 ${isActive ? 'note-active' : ''}`}
            style={style}
            title={`Tempo: ${note.time.toFixed(2)}s, Tom: ${note.pitch.toFixed(0)}Hz`}
          />
        );
      })}
      
      {/* Playback Cursor */}
      {isPlaying && (
         <div className="absolute top-0 w-0.5 bg-red-500/80 h-full"
            style={{ left: `${playbackPosition * 100}%` }}
         />
      )}
    </div>
  );
};