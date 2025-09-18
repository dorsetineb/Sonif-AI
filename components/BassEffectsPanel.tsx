import React from 'react';
import type { BassEffectsState } from '../types';
import { EffectControl, RangeInput } from './UI';

interface BassEffectsPanelProps {
  effects: BassEffectsState;
  setEffects: React.Dispatch<React.SetStateAction<BassEffectsState>>;
  isPanelOpen: boolean;
  onClose: () => void;
}

export const BassEffectsPanel: React.FC<BassEffectsPanelProps> = ({ effects, setEffects, isPanelOpen, onClose }) => {
  const handleEffectChange = <K extends keyof BassEffectsState>(effectName: K, value: Partial<BassEffectsState[K]>) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: { ...prev[effectName], ...value },
    }));
  };

  return (
    <>
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20" 
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-800 shadow-2xl z-30 transition-transform duration-300 ease-in-out transform ${
            isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold text-white">Painel de Efeitos (Baixo)</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </header>
          <div className="p-4 grid grid-cols-1 gap-4 overflow-y-auto">
            <EffectControl id="bass-distortion" title="Distorção" active={effects.distortion.active} onToggle={(active) => handleEffectChange('distortion', { active })}>
              <RangeInput label="Drive" value={effects.distortion.drive} onChange={(drive) => handleEffectChange('distortion', { drive })} min={0} max={1} step={0.01} />
            </EffectControl>

            <EffectControl id="bass-chorus" title="Chorus" active={effects.chorus.active} onToggle={(active) => handleEffectChange('chorus', { active })}>
                <RangeInput label="Velocidade" value={effects.chorus.rate} onChange={(rate) => handleEffectChange('chorus', { rate })} min={0.1} max={8} step={0.1} displayValue={`${effects.chorus.rate.toFixed(1)} Hz`}/>
                <RangeInput label="Profundidade" value={effects.chorus.depth} onChange={(depth) => handleEffectChange('chorus', { depth })} min={0} max={1} step={0.01} />
                <RangeInput label="Atraso" value={effects.chorus.delay} onChange={(delay) => handleEffectChange('chorus', { delay })} min={2} max={20} step={0.1} displayValue={`${effects.chorus.delay.toFixed(1)} ms`} />
            </EffectControl>

            <EffectControl id="bass-compressor" title="Compressor" active={effects.compressor.active} onToggle={(active) => handleEffectChange('compressor', { active })}>
                <RangeInput label="Limiar" value={effects.compressor.threshold} onChange={(threshold) => handleEffectChange('compressor', { threshold })} min={-100} max={0} step={1} displayValue={`${effects.compressor.threshold.toFixed(0)} dB`} />
                <RangeInput label="Ratio" value={effects.compressor.ratio} onChange={(ratio) => handleEffectChange('compressor', { ratio })} min={1} max={20} step={1} displayValue={`${effects.compressor.ratio.toFixed(0)}:1`} />
                <RangeInput label="Ataque" value={effects.compressor.attack} onChange={(attack) => handleEffectChange('compressor', { attack })} min={0.001} max={0.2} step={0.001} displayValue={`${(effects.compressor.attack * 1000).toFixed(1)} ms`} />
                <RangeInput label="Release" value={effects.compressor.release} onChange={(release) => handleEffectChange('compressor', { release })} min={0.01} max={0.5} step={0.01} displayValue={`${(effects.compressor.release * 1000).toFixed(0)} ms`}/>
            </EffectControl>

            <EffectControl id="bass-reverb" title="Reverberação" active={effects.reverb.active} onToggle={(active) => handleEffectChange('reverb', { active })}>
              <RangeInput label="Decaimento" value={effects.reverb.decay} onChange={(decay) => handleEffectChange('reverb', { decay })} min={0.1} max={5} step={0.1} />
              <RangeInput label="Nível do Efeito" value={effects.reverb.wet} onChange={(wet) => handleEffectChange('reverb', { wet })} min={0} max={1} step={0.01} />
            </EffectControl>
          </div>
        </div>
      </div>
    </>
  );
};