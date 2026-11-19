import React from 'react';
import { Tooltip } from './Tooltip';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tooltip: string;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (val: number) => void;
  unit?: string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  tooltip,
  disabled = false,
  disabledReason,
  onChange,
  unit = '',
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  };

  return (
    <div className={`space-y-1.5 transition-opacity ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-lab-muted">
          <span>{label}</span>
          <Tooltip content={disabled && disabledReason ? `${disabledReason}` : tooltip} />
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={handleInputChange}
            className="w-16 px-1.5 py-0.5 text-right font-mono text-xs bg-lab-panel border border-lab-border rounded text-lab-text focus:outline-none focus:border-groq-green/60 disabled:bg-lab-bg"
          />
          {unit && <span className="text-[10px] text-lab-dim font-mono">{unit}</span>}
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-label={label}
          className="w-full h-1.5 bg-lab-panel rounded-lg appearance-none cursor-pointer accent-groq-green focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono text-lab-dim">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

