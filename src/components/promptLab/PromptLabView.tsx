import React, { useState, useMemo } from 'react';
import { GenerationParams, GroqModel, PromptLabExample, ResponseMetrics } from '../../types';
import { analyzePrompt, estimateTokens } from '../../services/promptAnalyzer';
import { sendChatCompletion } from '../../services/groqClient';
import { PromptClassificationBadge } from '../promptAnalyzer/PromptClassificationBadge';
import { TokenInsightsPanel } from '../playground/TokenInsightsPanel';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Square,
  ArrowRight,
  Eye,
  CheckCircle2,
  Cpu,
  RotateCcw,
  SendHorizontal,
} from 'lucide-react';

interface PromptLabViewProps {
  models: GroqModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  apiKey: string | null;
  params: GenerationParams;
  onTransferToPlayground: (prompt: string, systemPrompt: string) => void;
}

export const PromptLabView: React.FC<PromptLabViewProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  apiKey,
  params,
  onTransferToPlayground,
}) => {
  const [mode, setMode] = useState<'zero-shot' | 'one-shot' | 'few-shot'>('few-shot');
  const [systemInstruction, setSystemInstruction] = useState(
    'You are an expert NLP data annotator. Follow the exact demonstration pattern.'
  );
  const [taskInstruction, setTaskInstruction] = useState(
    'Classify the feedback into Sentiment (Positive, Neutral, Negative) and determine the Key Topic.'
  );

  const [examples, setExamples] = useState<PromptLabExample[]>([
    {
      id: 'ex-1',
      input: 'The checkout page loaded in 200ms and Apple Pay was completely frictionless!',
      output: 'Sentiment: Positive\nKey Topic: Checkout Performance',
    },
    {
      id: 'ex-2',
      input: 'The package arrived 4 days late and the outer box was soaked in water.',
      output: 'Sentiment: Negative\nKey Topic: Delivery Delay & Packaging',
    },
  ]);

  const [targetInput, setTargetInput] = useState(
    'Customer support answered my ticket in 2 minutes, but could not issue the refund directly without escalation.'
  );

  // Execution state
  const [responseContent, setResponseContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState<ResponseMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Active examples based on mode
  const activeExamples = useMemo(() => {
    if (mode === 'zero-shot') return [];
    if (mode === 'one-shot') return examples.slice(0, 1);
    return examples;
  }, [mode, examples]);

  // Construct the full prompt payload
  const constructedPrompt = useMemo(() => {
    let text = `${taskInstruction.trim()}\n\n`;

    if (activeExamples.length > 0) {
      activeExamples.forEach((ex, idx) => {
        text += `Example ${idx + 1}:\nInput: ${ex.input.trim()}\nOutput: ${ex.output.trim()}\n\n`;
      });
    }

    if (targetInput.trim()) {
      text += `New input:\nInput: ${targetInput.trim()}\nOutput:`;
    }

    return text.trim();
  }, [taskInstruction, activeExamples, targetInput]);

  // Live prompt analysis of the constructed prompt
  const liveAnalysis = useMemo(() => {
    return analyzePrompt(constructedPrompt, systemInstruction);
  }, [constructedPrompt, systemInstruction]);

  // Handlers for examples
  const addExample = () => {
    const newEx: PromptLabExample = {
      id: `ex-${Date.now()}`,
      input: '',
      output: '',
    };
    setExamples([...examples, newEx]);
    if (mode === 'zero-shot') setMode('one-shot');
    else if (mode === 'one-shot' && examples.length >= 1) setMode('few-shot');
  };

  const removeExample = (id: string) => {
    const filtered = examples.filter((e) => e.id !== id);
    setExamples(filtered);
    if (filtered.length === 0) setMode('zero-shot');
    else if (filtered.length === 1 && mode === 'few-shot') setMode('one-shot');
  };

  const updateExample = (id: string, field: 'input' | 'output', val: string) => {
    setExamples(examples.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  // Run the prompt through Groq API
  const handleRun = async () => {
    if (!apiKey) {
      setError('Please connect your Groq API key first in API Settings.');
      return;
    }

    setIsGenerating(true);
    setResponseContent('');
    setError(null);
    setMetrics(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const messages = [{ role: 'user' as const, content: constructedPrompt }];
      const runParams = {
        ...params,
        systemPrompt: systemInstruction,
      };

      const result = await sendChatCompletion(
        apiKey,
        selectedModelId,
        messages,
        runParams,
        {
          onChunk: (chunk) => setResponseContent((prev) => prev + chunk),
          signal: controller.signal,
        }
      );

      setResponseContent(result.content);
      setMetrics(result.metrics);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Prompt execution failed');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-lab-bg">
      {/* Left Column: Prompt Construction Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-lab-border custom-scrollbar">
        {/* Lab Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-lab-borderSubtle">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-groq-green" />
              <h2 className="text-base font-bold text-lab-text">Prompt Engineering Studio</h2>
            </div>
            <p className="text-xs text-lab-muted mt-0.5">
              Structure, test, and benchmark Zero-shot vs One-shot vs Few-shot prompts.
            </p>
          </div>

          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-lab-dim" />
            <select
              value={selectedModelId}
              onChange={(e) => onSelectModel(e.target.value)}
              className="px-2.5 py-1.5 bg-lab-panel border border-lab-border rounded-lg text-xs font-mono text-lab-text focus:outline-none focus:border-groq-green cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 p-1 bg-lab-panel border border-lab-border rounded-xl">
          <button
            onClick={() => setMode('zero-shot')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === 'zero-shot'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm'
                : 'text-lab-muted hover:text-lab-text'
            }`}
          >
            Zero-Shot (0 Examples)
          </button>
          <button
            onClick={() => {
              setMode('one-shot');
              if (examples.length === 0) addExample();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === 'one-shot'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-lab-muted hover:text-lab-text'
            }`}
          >
            One-Shot (1 Example)
          </button>
          <button
            onClick={() => {
              setMode('few-shot');
              if (examples.length < 2) addExample();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === 'few-shot'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-sm'
                : 'text-lab-muted hover:text-lab-text'
            }`}
          >
            Few-Shot (2+ Examples)
          </button>
        </div>

        {/* System Instruction Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-lab-muted uppercase tracking-wider">
            System Instruction
          </label>
          <textarea
            rows={2}
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            placeholder="High-level persona or rule constraints..."
            className="w-full p-2.5 bg-lab-panel border border-lab-border rounded-lg text-xs font-mono text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/70 transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Task Instruction Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-lab-muted uppercase tracking-wider">
            Task Instruction
          </label>
          <textarea
            rows={2}
            value={taskInstruction}
            onChange={(e) => setTaskInstruction(e.target.value)}
            placeholder="e.g. Classify customer feedback as positive or negative..."
            className="w-full p-2.5 bg-lab-panel border border-lab-border rounded-lg text-xs font-mono text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/70 transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Worked Examples Manager (One-Shot & Few-Shot) */}
        {mode !== 'zero-shot' && (
          <div className="space-y-3 pt-2 border-t border-lab-borderSubtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-lab-muted uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-groq-green" />
                <span>
                  Worked Examples ({activeExamples.length}{' '}
                  {activeExamples.length === 1 ? 'Example' : 'Examples'})
                </span>
              </div>

              {mode === 'few-shot' && (
                <button
                  onClick={addExample}
                  className="flex items-center gap-1 px-2.5 py-1 bg-lab-panel hover:bg-lab-elevated border border-lab-border text-xs text-groq-green rounded-lg transition-colors font-mono"
                >
                  <Plus className="w-3 h-3" />
                  Add Example
                </button>
              )}
            </div>

            <div className="space-y-3">
              {activeExamples.map((ex, index) => (
                <div
                  key={ex.id}
                  className="p-3.5 bg-lab-panel/70 border border-lab-border rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-lab-muted">
                    <span className="font-semibold text-groq-green">Demonstration #{index + 1}</span>
                    {activeExamples.length > 1 && (
                      <button
                        onClick={() => removeExample(ex.id)}
                        className="text-lab-dim hover:text-red-400 transition-colors"
                        title="Remove example"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-[10px] text-lab-dim uppercase block">Sample Input</label>
                      <textarea
                        rows={3}
                        value={ex.input}
                        onChange={(e) => updateExample(ex.id, 'input', e.target.value)}
                        placeholder="Input demonstration..."
                        className="w-full p-2 bg-lab-bg border border-lab-borderSubtle rounded text-xs text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-groq-green/80 uppercase block">Expected Output</label>
                      <textarea
                        rows={3}
                        value={ex.output}
                        onChange={(e) => updateExample(ex.id, 'output', e.target.value)}
                        placeholder="Output demonstration..."
                        className="w-full p-2 bg-groq-green/5 border border-groq-green/20 rounded text-xs text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Test Input */}
        <div className="space-y-1.5 pt-2 border-t border-lab-borderSubtle">
          <label className="block text-xs font-semibold text-lab-muted uppercase tracking-wider">
            Test Input (New Query)
          </label>
          <textarea
            rows={3}
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="The target data or query to classify/transform..."
            className="w-full p-2.5 bg-lab-panel border border-lab-border rounded-lg text-xs font-mono text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/70 transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => onTransferToPlayground(constructedPrompt, systemInstruction)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-lab-muted hover:text-lab-text rounded-lg border border-lab-border hover:bg-white/5 transition-colors font-mono"
            title="Transfer crafted prompt to Playground"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Send to Playground
          </button>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-950/70 border border-red-800/60 text-red-300 font-semibold text-xs rounded-lg hover:bg-red-900/80 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Execution
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!constructedPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-groq-green text-black font-semibold text-xs rounded-lg hover:bg-groq-greenHover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-groq-green/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Prompt
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live Prompt Preview & Output Console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-lab-panel/40">
        {/* Preview Header & Live Analyzer Badge */}
        <div className="p-4 border-b border-lab-borderSubtle bg-lab-panel/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-lab-text uppercase tracking-wider font-mono">
              Constructed Payload & Live Analysis
            </span>
          </div>

          <PromptClassificationBadge analysis={liveAnalysis} />
        </div>

        {/* Scrollable Preview & Output Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Assembled Prompt Card */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-lab-dim">
              <span>Final Assembled Text Sent to Model:</span>
              <span>~{estimateTokens(constructedPrompt)} tokens (est.)</span>
            </div>
            <div className="p-3 bg-lab-bg rounded-lg border border-lab-border font-mono text-xs text-lab-text whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed selection:bg-groq-green/20">
              {constructedPrompt}
            </div>
          </div>

          {/* Model Output Console */}
          <div className="space-y-2 pt-2 border-t border-lab-borderSubtle">
            <div className="flex items-center justify-between text-xs font-mono text-lab-muted">
              <span className="font-semibold text-lab-text uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-groq-green" /> Model Response Output
              </span>
              {isGenerating && (
                <span className="text-groq-green flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-groq-green animate-ping" />
                  Generating...
                </span>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300 font-mono">
                {error}
              </div>
            )}

            <div className="min-h-40 p-4 bg-lab-bg rounded-lg border border-lab-border font-mono text-xs text-lab-text leading-relaxed whitespace-pre-wrap">
              {responseContent ? (
                <>
                  {responseContent}
                  {isGenerating && (
                    <span className="inline-block w-2 h-3.5 ml-1 bg-groq-green animate-stream-cursor" />
                  )}
                </>
              ) : (
                <span className="text-lab-dim italic">
                  Press "Run Prompt" to execute this structured prompt on Groq LPUs...
                </span>
              )}
            </div>

            {/* Token Metrics */}
            {metrics && (
              <TokenInsightsPanel metrics={metrics} promptType={liveAnalysis.type} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

