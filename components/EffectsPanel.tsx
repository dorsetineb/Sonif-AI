import React from 'react';
import type { EffectsState } from '../types';
import { EffectControl, RangeInput } from './UI';

interface EffectsPanelProps {
  effects: EffectsState;
  setEffects: React.Dispatch<React.SetStateAction<EffectsState>>;
  isPanelOpen: boolean;
  onClose: () => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ effects, setEffects, isPanelOpen, onClose }) => {
  const handleEffectChange = <K extends keyof EffectsState>(effectName: K, value: Partial<EffectsState[K]>) => {
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
            className={`fixed top-0 right-0 h-full w-full max-w-sm md:max-w-md lg:max-w-lg bg-gray-800 shadow-2xl z-30 transition-transform duration-300 ease-in-out transform ${
                isPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
            <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Painel de Efeitos (Melodia)</h2>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </header>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                <EffectControl id="melody-distortion" title="Distorção" active={effects.distortion.active} onToggle={(active) => handleEffectChange('distortion', { active })}>
                <RangeInput label="Drive" value={effects.distortion.drive} onChange={(drive) => handleEffectChange('distortion', { drive })} min={0} max={1} step={0.01} />
                <RangeInput label="Tom" value={effects.distortion.tone} onChange={(tone) => handleEffectChange('distortion', { tone })} min={200} max={5000} step={10} displayValue={`${effects.distortion.tone.toFixed(0)} Hz`} />
                <RangeInput label="Saída" value={effects.distortion.output} onChange={(output) => handleEffectChange('distortion', { output })} min={0} max={1} step={0.01} />
                </EffectControl>
                
                <EffectControl id="melody-panner" title="Panorâmico" active={effects.panner.active} onToggle={(active) => handleEffectChange('panner', { active })}>
                <RangeInput label="Pan" value={effects.panner.pan} onChange={(pan) => handleEffectChange('panner', { pan })} min={-1} max={1} step={0.01} />
                </EffectControl>

                <EffectControl id="melody-phaser" title="Phaser" active={effects.phaser.active} onToggle={(active) => handleEffectChange('phaser', { active })}>
                <RangeInput label="Velocidade" value={effects.phaser.frequency} onChange={(frequency) => handleEffectChange('phaser', { frequency })} min={0.5} max={10} step={0.1} displayValue={`${effects.phaser.frequency.toFixed(1)} Hz`} />
                <RangeInput label="Profundidade" value={effects.phaser.depth} onChange={(depth) => handleEffectChange('phaser', { depth })} min={100} max={1500} step={10} />
                <RangeInput label="Feedback" value={effects.phaser.feedback} onChange={(feedback) => handleEffectChange('phaser', { feedback })} min={0} max={0.8} step={0.01} />
                </EffectControl>
                
                <EffectControl id="melody-flanger" title="Flanger" active={effects.flanger.active} onToggle={(active) => handleEffectChange('flanger', { active })}>
                <RangeInput label="Atraso" value={effects.flanger.delay} onChange={(delay) => handleEffectChange('flanger', { delay })} min={0} max={10} step={0.1} displayValue={`${effects.flanger.delay.toFixed(1)}ms`} />
                <RangeInput label="Profundidade" value={effects.flanger.depth} onChange={(depth) => handleEffectChange('flanger', { depth })} min={0} max={2} step={0.1} displayValue={`${effects.flanger.depth.toFixed(1)}ms`} />
                <RangeInput label="Feedback" value={effects.flanger.feedback} onChange={(feedback) => handleEffectChange('flanger', { feedback })} min={0} max={0.8} step={0.01} />
                <RangeInput label="Velocidade" value={effects.flanger.rate} onChange={(rate) => handleEffectChange('flanger', { rate })} min={0.1} max={5} step={0.1} displayValue={`${effects.flanger.rate.toFixed(1)} Hz`} />
                </EffectControl>
                
                <EffectControl id="melody-chorus" title="Chorus" active={effects.chorus.active} onToggle={(active) => handleEffectChange('chorus', { active })}>
                <RangeInput label="Velocidade" value={effects.chorus.rate} onChange={(rate) => handleEffectChange('chorus', { rate })} min={0.1} max={8} step={0.1} />
                <RangeInput label="Profundidade" value={effects.chorus.depth} onChange={(depth) => handleEffectChange('chorus', { depth })} min={0} max={1} step={0.01} />
                </EffectControl>

                <EffectControl id="melody-tremolo" title="Tremolo" active={effects.tremolo.active} onToggle={(active) => handleEffectChange('tremolo', { active })}>
                <RangeInput label="Frequência" value={effects.tremolo.frequency} onChange={(frequency) => handleEffectChange('tremolo', { frequency })} min={0.1} max={20} step={0.1} />
                <RangeInput label="Profundidade" value={effects.tremolo.depth} onChange={(depth) => handleEffectChange('tremolo', { depth })} min={0} max={1} step={0.01} />
                </EffectControl>
                
                <EffectControl id="melody-delay" title="Atraso" active={effects.delay.active} onToggle={(active) => handleEffectChange('delay', { active })}>
                <RangeInput label="Tempo" value={effects.delay.time} onChange={(time) => handleEffectChange('delay', { time })} min={0.01} max={1} step={0.01} />
                <RangeInput label="Feedback" value={effects.delay.feedback} onChange={(feedback) => handleEffectChange('delay', { feedback })} min={0} max={0.8} step={0.01} />
                </EffectControl>

                <EffectControl id="melody-reverb" title="Reverberação" active={effects.reverb.active} onToggle={(active) => handleEffectChange('reverb', { active })}>
                <RangeInput label="Decaimento" value={effects.reverb.decay} onChange={(decay) => handleEffectChange('reverb', { decay })} min={0.1} max={5} step={0.1} />
                <RangeInput label="Nível do Efeito" value={effects.reverb.wet} onChange={(wet) => handleEffectChange('reverb', { wet })} min={0} max={1} step={0.01} />
                </EffectControl>
            </div>
            </div>
        </div>
    </>
  );
};