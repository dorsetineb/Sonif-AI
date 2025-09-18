import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}

export const ToggleSwitch: React.FC<SwitchProps> = ({ checked, onChange, label, id }) => (
  <label htmlFor={id} className="flex items-center cursor-pointer">
    <div className="relative">
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-14 h-8 rounded-full transition ${checked ? 'bg-indigo-500' : 'bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
    </div>
    <div className="ml-3 text-gray-300 font-medium">{label}</div>
  </label>
);

export const EffectControl: React.FC<{ children: React.ReactNode, title: string, active: boolean, onToggle: (active: boolean) => void, id: string }> = ({ children, title, active, onToggle, id }) => (
  <div className="space-y-3 p-3 bg-gray-700/50 rounded-md">
    <ToggleSwitch
      id={id}
      label={title}
      checked={active}
      onChange={onToggle}
    />
    <div className={`space-y-2 transition-opacity ${active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      {children}
    </div>
  </div>
);

export const RangeInput: React.FC<{ label: string, value: number, onChange: (val: number) => void, min: number, max: number, step: number, displayValue?: string }> = 
  ({ label, value, onChange, displayValue, ...props }) => (
    <>
      <label className="text-sm text-gray-400 block">{label}: {displayValue ?? value.toFixed(2)}</label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        {...props}
      />
    </>
);