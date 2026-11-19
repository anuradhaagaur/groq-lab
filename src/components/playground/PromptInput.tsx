import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, X, CornerDownLeft } from 'lucide-react';
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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height up to 260px
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const newHeight = Math.min(el.scrollHeight, 260);
      el.style.height = `${Math.max(newHeight, 52)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const estimatedTokens = estimateTokens(value);

  return (
    <div className="relative border-t border-lab-border bg-[#0b0e14]/90 backdrop-blur-md p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Main Input Box */}
        <div
          className={`relative flex flex-col rounded-xl border bg-lab-panel transition-all ${
            isGenerating
              ? 'border-groq-green/40 shadow-sm shadow-groq-green/5'
              : 'border-lab-border focus-within:border-groq-green/60 focus-within:ring-1 focus-within:ring-groq-green/30'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? disabledPlaceholder || 'Connect your Groq API key to start prompting...' : 'Message Groq LPU (Enter to send, Shift+Enter for newline)...'}
            className="w-full px-3.5 py-3 bg-transparent text-xs sm:text-[13px] text-lab-text placeholder-lab-dim resize-none focus:outline-none custom-scrollbar font-sans disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
          />

          {/* Bottom Bar: Character count, Token estimate, and Send/Stop buttons */}
          <div className="flex items-center justify-between px-3.5 py-2 border-t border-lab-borderSubtle bg-lab-bg/40 text-[11px] font-mono text-lab-dim">
            <div className="flex items-center gap-3">
              <span>{value.length} chars</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-lab-muted" title="Estimated prompt token length">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                ~{estimatedTokens} tokens (est.)
              </span>
              {value.length > 0 && !isGenerating && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-0.5 text-lab-dim hover:text-red-400 transition-colors ml-1"
                  title="Clear input"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-lab-dim opacity-70">
                ↵ Enter to run
              </span>

              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/70 border border-red-800/60 text-red-300 font-semibold text-xs rounded-lg hover:bg-red-900/80 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  disabled={disabled || !value.trim()}
                  onClick={onSubmit}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-groq-green text-black font-semibold text-xs rounded-lg hover:bg-groq-greenHover disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-groq-green/20"
                >
                  <span>Send</span>
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

