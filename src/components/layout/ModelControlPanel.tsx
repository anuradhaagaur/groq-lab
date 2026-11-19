import React, { useState } from 'react';
import { GenerationParams, GroqModel } from '../../types';
import { SliderControl } from '../common/SliderControl';
import { Tooltip } from '../common/Tooltip';
import { SYSTEM_PROMPT_PRESETS } from '../../services/defaultData';
import { DEFAULT_PARAMETERS } from '../../services/storage';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Cpu,
  Bookmark,
  Check,
  X,
  Radio,
  Layers,
} from 'lucide-react';

interface ModelControlPanelProps {
  models: GroqModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  params: GenerationParams;
  onChangeParams: (newParams: GenerationParams) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const ModelControlPanel: React.FC<ModelControlPanelProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  params,
  onChangeParams,
  isOpen,
  onToggle,
  isMobile = false,
}) => {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(true);
  const [customPresetName, setCustomPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetSavedFeedback, setPresetSavedFeedback] = useState(false);

  // Active Model Info
  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleParamChange = <K extends keyof GenerationParams>(key: K, val: GenerationParams[K]) => {
    onChangeParams({
      ...params,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChangeParams({
      ...DEFAULT_PARAMETERS,
      systemPrompt: params.systemPrompt, // keep system prompt or reset? user can reset system prompt separately
    });
  };

  const handleSaveCustomPreset = () => {
    if (!customPresetName.trim() || !params.systemPrompt.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('groq_lab_custom_presets') || '[]');
      existing.push({
        id: `preset-${Date.now()}`,
        name: customPresetName.trim(),
        description: 'Custom user-saved preset',
        prompt: params.systemPrompt,
      });
      localStorage.setItem('groq_lab_custom_presets', JSON.stringify(existing));
      setPresetSavedFeedback(true);
      setTimeout(() => {
        setPresetSavedFeedback(false);
        setShowSavePreset(false);
        setCustomPresetName('');
      }, 1500);
    } catch {
      // Ignore
    }
  };

  if (!isOpen && !isMobile) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 px-2 border-l border-lab-border bg-lab-panel/70 w-12 shrink-0">
        <button
          onClick={onToggle}
          className="p-2 text-lab-muted hover:text-lab-text rounded-lg hover:bg-white/5 transition-colors"
          title="Open Model Control Studio"
        >
          <SlidersHorizontal className="w-5 h-5 text-groq-green" />
        </button>
        <div className="mt-8 [writing-mode:vertical-rl] text-xs font-mono text-lab-dim tracking-wider uppercase select-none">
          Parameters Studio
        </div>
      </div>
    );
  }

  const modelLimit = activeModel?.maxOutputTokens || 8192;

  return (
    <aside
      className={`flex flex-col bg-lab-panel border-l border-lab-border h-full overflow-hidden transition-all duration-200 z-20 ${
        isMobile ? 'w-full' : 'w-80 shrink-0'
      }`}
    >
      {/* Studio Header */}
      <div className="flex items-center justify-between p-4 border-b border-lab-borderSubtle bg-lab-panel/90">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-groq-green" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-lab-text">
            Control Studio
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
            title="Reset all parameters to default"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          {!isMobile && (
            <button
              onClick={onToggle}
              className="p-1 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
              title="Collapse studio"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Parameters Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs">
        {/* Model Selector Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-lab-muted">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold">
              <Cpu className="w-3.5 h-3.5 text-groq-green" /> Model Selection
            </span>
            <span className="text-[10px] font-mono text-groq-green bg-groq-green/10 px-1.5 py-0.5 rounded">
              {activeModel?.speed || 'High Speed'}
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedModelId}
              onChange={(e) => onSelectModel(e.target.value)}
              className="w-full px-3 py-2.5 bg-lab-bg border border-lab-border rounded-lg text-xs font-mono text-lab-text appearance-none focus:outline-none focus:border-groq-green/70 transition-colors pr-8 cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-lab-panel text-lab-text">
                  {m.name} ({m.developer})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lab-dim pointer-events-none" />
          </div>

          {/* Model Specs Pill */}
          {activeModel && (
            <div className="p-2.5 bg-lab-bg/60 border border-lab-borderSubtle rounded-lg text-[11px] text-lab-muted space-y-1">
              <p className="leading-snug">{activeModel.description}</p>
              <div className="flex items-center justify-between font-mono text-[10px] text-lab-dim pt-1 border-t border-lab-borderSubtle">
                <span>Context: {Math.round(activeModel.contextWindow / 1024)}k tokens</span>
                <span>Max Output: {activeModel.maxOutputTokens}</span>
              </div>
            </div>
          )}
        </div>

        {/* Streaming Mode Toggle */}
        <div className="p-3 bg-lab-bg border border-lab-border rounded-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-medium text-lab-text">
              <Zap className="w-3.5 h-3.5 text-groq-green" />
              <span>Real-time Streaming</span>
              <Tooltip content="Streams completion tokens via SSE as they are generated by Groq LPUs in real time." />
            </div>
            <p className="text-[10px] text-lab-dim mt-0.5">Recommended for instant responsiveness</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={params.stream}
              onChange={(e) => handleParamChange('stream', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-lab-panel peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-groq-green"></div>
          </label>
        </div>

        {/* Sliders: Temperature, Max Tokens, Top-P */}
        <div className="space-y-4 pt-1 border-t border-lab-borderSubtle">
          <SliderControl
            label="Temperature"
            value={params.temperature}
            min={0}
            max={2}
            step={0.1}
            tooltip="Controls randomness. Lower values (e.g. 0.2) produce deterministic, factual answers. Higher values (e.g. 1.2) encourage creative, varied phrasing."
            onChange={(val) => handleParamChange('temperature', val)}
          />

          <SliderControl
            label="Max Output Tokens"
            value={params.maxTokens}
            min={64}
            max={modelLimit}
            step={64}
            unit="tokens"
            tooltip={`Specifies the upper ceiling on generated tokens (up to ${modelLimit} for this model). This limits maximum length, but does not force the model to output this exact number.`}
            onChange={(val) => handleParamChange('maxTokens', val)}
          />

          <SliderControl
            label="Top-P (Nucleus Sampling)"
            value={params.topP}
            min={0}
            max={1}
            step={0.05}
            disabled={!activeModel?.supportsTopP}
            disabledReason="Selected model does not support Top-P adjustments."
            tooltip="Alternative to temperature. The model considers only the tokens comprising the top p probability mass. 0.1 means only top 10% likely tokens are considered."
            onChange={(val) => handleParamChange('topP', val)}
          />
        </div>

        {/* Advanced Penalties (Frequency & Presence) */}
        <div className="space-y-4 pt-3 border-t border-lab-borderSubtle">
          <div className="text-[11px] font-semibold text-lab-dim uppercase tracking-wider">
            Token Penalty Modifiers
          </div>

          <SliderControl
            label="Frequency Penalty"
            value={params.frequencyPenalty}
            min={0}
            max={2}
            step={0.1}
            disabled={!activeModel?.supportsPenalties}
            disabledReason="Selected model architecture does not support frequency penalty."
            tooltip="Positive values penalize tokens based on their frequency in the text so far, decreasing verbatim repetitions."
            onChange={(val) => handleParamChange('frequencyPenalty', val)}
          />

          <SliderControl
            label="Presence Penalty"
            value={params.presencePenalty}
            min={0}
            max={2}
            step={0.1}
            disabled={!activeModel?.supportsPenalties}
            disabledReason="Selected model architecture does not support presence penalty."
            tooltip="Positive values penalize tokens based on whether they appear in the text at all, encouraging the model to introduce new topics."
            onChange={(val) => handleParamChange('presencePenalty', val)}
          />
        </div>

        {/* System Prompt Section */}
        <div className="pt-3 border-t border-lab-borderSubtle space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lab-muted hover:text-lab-text transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-groq-green" />
              <span>System Prompt</span>
              {isSystemPromptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {params.systemPrompt && (
              <button
                onClick={() => handleParamChange('systemPrompt', '')}
                className="text-[10px] font-mono text-lab-dim hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {isSystemPromptOpen && (
            <div className="space-y-2">
              {/* Preset Selector */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-lab-dim mb-1">
                  System Presets
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {SYSTEM_PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleParamChange('systemPrompt', preset.prompt)}
                      className={`text-left px-2.5 py-1.5 rounded text-[11px] border transition-all ${
                        params.systemPrompt === preset.prompt
                          ? 'bg-groq-green/10 border-groq-green/40 text-groq-green font-medium'
                          : 'bg-lab-bg/40 border-lab-borderSubtle text-lab-muted hover:text-lab-text hover:bg-lab-bg'
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-[10px] opacity-70 truncate">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={params.systemPrompt}
                  disabled={!activeModel?.supportsSystemPrompt}
                  onChange={(e) => handleParamChange('systemPrompt', e.target.value)}
                  placeholder={
                    activeModel?.supportsSystemPrompt
                      ? 'Define behavioral constraints, persona, and directives...'
                      : 'This safety/classifier model does not accept system messages.'
                  }
                  className="w-full p-2.5 bg-lab-bg border border-lab-border rounded-lg text-xs font-mono text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/70 transition-colors resize-y leading-relaxed disabled:opacity-40"
                />
              </div>

              {/* Preset actions */}
              <div className="flex items-center justify-between text-[11px]">
                <button
                  onClick={() => handleParamChange('systemPrompt', SYSTEM_PROMPT_PRESETS[0].prompt)}
                  className="text-lab-dim hover:text-lab-text transition-colors"
                >
                  Reset to Default
                </button>

                <button
                  onClick={() => setShowSavePreset(!showSavePreset)}
                  className="flex items-center gap-1 text-groq-green hover:underline"
                >
                  <Bookmark className="w-3 h-3" />
                  Save as Preset
                </button>
              </div>

              {/* Save Preset Input Bar */}
              {showSavePreset && (
                <div className="p-2 bg-lab-bg border border-lab-border rounded space-y-1.5">
                  <input
                    type="text"
                    value={customPresetName}
                    onChange={(e) => setCustomPresetName(e.target.value)}
                    placeholder="Preset title (e.g. Code Reviewer)..."
                    className="w-full px-2 py-1 bg-lab-panel border border-lab-border rounded text-xs text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setShowSavePreset(false)}
                      className="px-2 py-0.5 text-[10px] text-lab-dim rounded hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCustomPreset}
                      disabled={!customPresetName.trim()}
                      className="px-2 py-0.5 text-[10px] bg-groq-green text-black font-semibold rounded hover:bg-groq-greenHover disabled:opacity-50"
                    >
                      {presetSavedFeedback ? 'Saved!' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

