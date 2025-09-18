import React, { useRef } from 'react';
import type { Note, DrumNote } from '../types';
import { GRID_COLUMNS_PER_SECOND, NOTE_FIXED_DURATION } from '../constants';

interface TimelineProps {
  notes: (Note | DrumNote)[];
  onAddNote: (time: number, rowIndex: number) => void;
  onRemoveNote: (noteId: string) => void;
  onPreviewNote: (rowIndex: number) => void;
  playbackPosition: number; // 0 to 1
  isPlaying: boolean;
  duration: number; // in seconds
  noteHeight: number;
  rows: (number | string)[]; // Can be PITCHES, BASS_PITCHES, or DRUM_SAMPLES
  rowLabels: string[];
  getNoteStyle: (note: Note | DrumNote) => { className: string; glowColor: string };
}

const isMelodicNote = (note: Note | DrumNote): note is Note => 'pitch' in note;

export const Timeline: React.FC<TimelineProps> = ({ 
  notes, onAddNote, onRemoveNote, onPreviewNote, playbackPosition, isPlaying, duration, 
  noteHeight, rows, rowLabels, getNoteStyle 
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const gridColumns = duration * GRID_COLUMNS_PER_SECOND;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || noteHeight <= 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colIndex = Math.floor(x / (rect.width / gridColumns));
    const time = colIndex * NOTE_FIXED_DURATION;
    
    const rowIndex = Math.floor(y / noteHeight);

    if (rowIndex >= 0 && rowIndex < rowLabels.length && time < duration) {
      onPreviewNote(rowIndex);
      onAddNote(time, rowIndex);
    }
  };

  return (
    <div className="relative bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden select-none w-full h-full"
      ref={timelineRef}
      onClick={handleClick}
    >
      {/* Grid Lines */}
      {rowLabels.map((_, index) => (
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
      <div className='absolute left-0 top-0 w-full h-full flex flex-col'>
        {rowLabels.map((name, index) => (
            <div key={index} className="text-gray-400 text-xs font-mono select-none flex items-center pl-2" style={{height: noteHeight, lineHeight: `${noteHeight}px`}}>
                {name}
            </div>
        ))}
      </div>


      {/* Notes */}
      {notes.map(note => {
        const left = (note.time / duration) * 100;
        const width = (note.duration / duration) * 100;

        const noteValue = isMelodicNote(note) ? note.pitch : note.sample;
        const rowIndex = rows.findIndex(r => r === noteValue);
        if (rowIndex === -1) return null;

        const top = rowIndex * noteHeight;
        
        const noteStartTime = note.time / duration;
        const noteEndTime = (note.time + note.duration) / duration;
        const isActive = isPlaying && playbackPosition >= noteStartTime && playbackPosition < noteEndTime;
        
        const { className, glowColor } = getNoteStyle(note);
        const style = {
          left: `${left}%`,
          top: `${top}px`,
          width: `${width}%`,
          height: `${noteHeight}px`,
          '--glow-color': glowColor,
        } as React.CSSProperties;

        return (
          <div
            key={note.id}
            onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); }}
            className={`note absolute cursor-pointer ${className} border-r border-gray-900/50 ${isActive ? 'note-active' : ''}`}
            style={style}
          />
        );
      })}
      
      {/* Playback Cursor */}
      {isPlaying && (
         <div className="absolute top-0 w-0.5 bg-red-500/80 h-full z-10"
            style={{ left: `${playbackPosition * 100}%` }}
         />
      )}
    </div>
  );
};
