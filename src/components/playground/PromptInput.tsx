import React, { useRef, useEffect, useState } from 'react';
import { CornerDownLeft, Square, X, Layers } from 'lucide-react';
import { estimateTokens } from '../../services/promptAnalyzer';

interface PromptInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onClear: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  disabledPlaceholder?: string;
  onOpenPromptLab?: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  onStop,
  onClear,
  isGenerating,
  disabled = false,
  disabledPlaceholder,
  onOpenPromptLab,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevGeneratingRef = useRef(isGenerating);

  // Auto-resize textarea height up to 260px
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const newHeight = Math.min(el.scrollHeight, 260);
      el.style.height = `${Math.max(newHeight, 48)}px`;
    }
  }, [value]);

  // Flash "GENERATION COMPLETE" when streaming finishes
  useEffect(() => {
    if (prevGeneratingRef.current && !isGenerating) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2400);
      return () => clearTimeout(timer);
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const estimatedTokens = estimateTokens(value);

  // Compute segmented token meter (8 segments)
  const maxMeterTokens = 1000;
  const filledSegments = Math.min(8, Math.ceil((estimatedTokens / maxMeterTokens) * 8));

  // Determine dynamic console status text
  const getStatusText = (): { label: string; activeColor: string } => {
    if (isGenerating) {
      return { label: 'GENERATING RESPONSE', activeColor: 'text-[#00F5A0]' };
    }
    if (justCompleted) {
      return { label: 'GENERATION COMPLETE', activeColor: 'text-cyan-400' };
    }
    if (value.trim().length > 0) {
      return { label: 'PROMPT DETECTED', activeColor: 'text-[#00F5A0]' };
    }
    if (isFocused) {
      return { label: 'INPUT ACTIVE', activeColor: 'text-[#00F5A0]' };
    }
    return { label: 'READY', activeColor: 'text-zinc-500' };
  };

  const currentStatus = getStatusText();

  return (
    <div className="relative border-t border-lab-border bg-[#07090e]/95 backdrop-blur-xl p-3 sm:p-4 z-10 select-none">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Main Command Console Container */}
        <div
          className={`relative flex flex-col rounded-xl border bg-[#0b0e16] transition-all duration-300 ${
            isGenerating
              ? 'border-[#00F5A0]/50 shadow-[0_0_24px_rgba(0,245,160,0.12)]'
              : isFocused
              ? 'border-[#00F5A0]/60 shadow-[0_0_20px_rgba(0,245,160,0.08)]'
              : 'border-[#1e2433] hover:border-[#2a3246]'
          }`}
        >
          {/* Futuristic Technical Corner Accents (Illuminated on Focus/Generation) */}
          <div
            className={`absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 rounded-tl-[4px] pointer-events-none transition-colors duration-300 ${
              isFocused || isGenerating ? 'border-[#00F5A0]' : 'border-transparent'
            }`}
          />
          <div
            className={`absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 rounded-tr-[4px] pointer-events-none transition-colors duration-300 ${
              isFocused || isGenerating ? 'border-[#00F5A0]' : 'border-transparent'
            }`}
          />
          <div
            className={`absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 rounded-bl-[4px] pointer-events-none transition-colors duration-300 ${
              isFocused || isGenerating ? 'border-[#00F5A0]' : 'border-transparent'
            }`}
          />
          <div
            className={`absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 rounded-br-[4px] pointer-events-none transition-colors duration-300 ${
              isFocused || isGenerating ? 'border-[#00F5A0]' : 'border-transparent'
            }`}
          />

          {/* Top Status Banner */}
          <div className="flex items-center justify-between px-3.5 pt-2 pb-1 text-[10px] font-mono text-zinc-500 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isGenerating
                    ? 'bg-[#00F5A0] animate-ping'
                    : isFocused || value.length > 0
                    ? 'bg-[#00F5A0]'
                    : 'bg-zinc-600'
                }`}
              />
              <span className={`tracking-wider font-semibold transition-colors ${currentStatus.activeColor}`}>
                {currentStatus.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-zinc-500">
              <span className="hidden sm:inline">GROQ LPU CORE // DIRECT INFERENCE</span>
              {onOpenPromptLab && (
                <button
                  type="button"
                  onClick={onOpenPromptLab}
                  className="flex items-center gap-1 text-zinc-400 hover:text-[#00F5A0] transition-colors"
                  title="Open Prompt Lab Studio"
                >
                  <Layers className="w-3 h-3" />
                  <span className="hidden sm:inline">Prompt Lab</span>
                </button>
              )}
            </div>
          </div>

          {/* Prompt Input Row (Terminal Symbol + Expanding Textarea) */}
          <div className="flex items-start px-3.5 py-2.5 gap-2.5">
            {/* Terminal Command Prompt Marker */}
            <div className="pt-0.5 select-none text-xs font-mono font-bold text-[#00F5A0] shrink-0 opacity-80">
              &gt;_
            </div>

            <textarea
              ref={textareaRef}
              rows={2}
              value={value}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled
                  ? disabledPlaceholder || 'Connect your Groq API key (above) to begin inference...'
                  : 'Enter a prompt to begin an inference...'
              }
              className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none custom-scrollbar font-sans disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed select-text"
            />
          </div>

          {/* Console Toolbar */}
          <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/[0.04] bg-[#080b11]/60 text-[11px] font-mono text-zinc-500 rounded-b-xl">
            {/* Left: Metadata & Segmented Token Meter */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                PROMPT
              </span>

              <span className="hidden sm:inline">•</span>

              <span className="text-zinc-400">{value.length} CHARS</span>

              <span>•</span>

              {/* Segmented Token Meter */}
              <div
                className="flex items-center gap-1.5 text-zinc-400"
                title={`Estimated ~${estimatedTokens} tokens for this prompt`}
              >
                <div className="flex items-center gap-0.5 select-none font-mono text-[9px] text-[#00F5A0]">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <span
                      key={i}
                      className={`inline-block w-1.5 h-2 rounded-[1px] transition-colors ${
                        i < filledSegments
                          ? 'bg-[#00F5A0]'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <span>~{estimatedTokens} tok (est.)</span>
              </div>

              {value.length > 0 && !isGenerating && (
                <button
                  type="button"
                  onClick={onClear}
                  className="flex items-center gap-0.5 text-zinc-500 hover:text-red-400 transition-colors ml-1 text-[10px]"
                  title="Clear input"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Right: Enter Shortcut & Action Button */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-zinc-500 font-mono opacity-80">
                ↵ Enter to run
              </span>

              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/70 border border-red-800/60 text-red-300 font-semibold text-xs rounded-lg hover:bg-red-900/80 transition-all cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={disabled || !value.trim()}
                  onClick={onSubmit}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00F5A0] text-black font-semibold text-xs rounded-lg hover:bg-[#00dc8b] hover:shadow-[0_0_12px_rgba(0,245,160,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all cursor-pointer shadow-sm shadow-[#00F5A0]/20"
                >
                  <span>Run</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
