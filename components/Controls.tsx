import React from 'react';

interface ControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
  isExporting: boolean;
  isLooping: boolean;
  onToggleLoop: () => void;
  duration: number;
  onSetDuration: (duration: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying, onPlay, onStop, onClear, onExport, isExporting, isLooping, onToggleLoop, duration, onSetDuration
}) => {
  const durations = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-5xl mx-auto">
      {/* Playback Controls */}
      <div className="flex items-center space-x-1 bg-gray-700/80 rounded-full p-1 shadow-md border border-gray-600/50">
        {!isPlaying ? (
          <button onClick={onPlay} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transform transition-all duration-150 ease-in-out hover:scale-110 active:scale-100" title="Tocar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        ) : (
          <button onClick={onStop} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transform transition-all duration-150 ease-in-out hover:scale-110 active:scale-100" title="Parar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
          </button>
        )}
        <button 
          onClick={onToggleLoop}
          className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-75 transform transition-all duration-150 ease-in-out hover:scale-110 active:scale-100 ${isLooping ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400' : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'}`}
          title="Repetir"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
        <button onClick={onClear} className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transform transition-all duration-150 ease-in-out hover:scale-110 active:scale-100" title="Limpar Linha do Tempo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
        <button 
          onClick={onExport}
          disabled={isExporting || isPlaying}
          className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-indigo-400 disabled:cursor-not-allowed transform transition-all duration-150 ease-in-out hover:scale-110 active:scale-100 disabled:hover:scale-100"
          title="Exportar como WAV"
        >
          {isExporting ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          )}
        </button>
      </div>

      {/* Duration Control */}
      <div className="flex items-center space-x-2 bg-gray-700/80 rounded-lg p-1 shadow-md border border-gray-600/50">
        <span className="text-gray-300 font-medium px-2 text-sm">Duração</span>
        {durations.map(d => (
            <button key={d} onClick={() => onSetDuration(d)} className={`px-3 py-1.5 text-sm rounded-md font-semibold transform transition-all duration-150 ease-in-out active:scale-95 ${duration === d ? 'bg-indigo-500 text-white scale-105 shadow-lg hover:scale-110' : 'text-gray-400 hover:bg-gray-600 hover:scale-105'}`}>
                {d}s
            </button>
        ))}
      </div>
    </div>
  );
};
