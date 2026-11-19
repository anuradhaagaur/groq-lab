import React, { useState, useRef } from 'react';
import { GroqModel, GenerationParams, ResponseMetrics } from '../../types';
import { sendChatCompletion } from '../../services/groqClient';
import { TokenInsightsPanel } from '../playground/TokenInsightsPanel';
import {
  GitCompare,
  Play,
  Square,
  Zap,
  Clock,
  Gauge,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ModelComparisonViewProps {
  models: GroqModel[];
  apiKey: string | null;
  params: GenerationParams;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  models,
  apiKey,
  params,
}) => {
  const [modelA, setModelA] = useState<string>(
    models[0]?.id || 'llama-3.3-70b-versatile'
  );
  const [modelB, setModelB] = useState<string>(
    models[1]?.id || 'llama-3.1-8b-instant'
  );

  const [prompt, setPrompt] = useState<string>(
    'Explain the fundamental difference between speculative decoding and standard autoregressive token generation. Include a concise summary table of tradeoffs.'
  );

  // States for Model A
  const [responseA, setResponseA] = useState('');
  const [metricsA, setMetricsA] = useState<ResponseMetrics | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [isGeneratingA, setIsGeneratingA] = useState(false);

  // States for Model B
  const [responseB, setResponseB] = useState('');
  const [metricsB, setMetricsB] = useState<ResponseMetrics | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [isGeneratingB, setIsGeneratingB] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const isGenerating = isGeneratingA || isGeneratingB;

  const modelAObj = models.find((m) => m.id === modelA) || models[0];
  const modelBObj = models.find((m) => m.id === modelB) || models[1];

  const handleRunComparison = async () => {
    if (!apiKey) {
      setErrorA('Groq API Key not connected.');
      setErrorB('Groq API Key not connected.');
      return;
    }

    if (!prompt.trim()) return;

    // Reset responses & errors
    setResponseA('');
    setResponseB('');
    setErrorA(null);
    setErrorB(null);
    setMetricsA(null);
    setMetricsB(null);

    setIsGeneratingA(true);
    setIsGeneratingB(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const messages = [{ role: 'user' as const, content: prompt.trim() }];

    // Run Model A
    const runA = sendChatCompletion(
      apiKey,
      modelA,
      messages,
      params,
      {
        onChunk: (chunk) => setResponseA((prev) => prev + chunk),
        signal: controller.signal,
      }
    )
      .then((res) => {
        setResponseA(res.content);
        setMetricsA(res.metrics);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setErrorA(err.message || 'Model A execution failed');
        }
      })
      .finally(() => setIsGeneratingA(false));

    // Run Model B
    const runB = sendChatCompletion(
      apiKey,
      modelB,
      messages,
      params,
      {
        onChunk: (chunk) => setResponseB((prev) => prev + chunk),
        signal: controller.signal,
      }
    )
      .then((res) => {
        setResponseB(res.content);
        setMetricsB(res.metrics);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setErrorB(err.message || 'Model B execution failed');
        }
      })
      .finally(() => setIsGeneratingB(false));

    await Promise.allSettled([runA, runB]);
    abortControllerRef.current = null;
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-lab-bg">
      {/* Top Header & Model Selectors */}
      <div className="p-4 sm:p-5 border-b border-lab-border bg-[#0d1018] space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-groq-green" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-lab-text">
                Model Arena (Side-by-Side Benchmark)
              </h2>
              <p className="text-xs text-lab-muted">
                Dispatch an identical prompt to two Groq models simultaneously to compare latency, throughput, and reasoning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-lg hover:bg-red-900 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Arena
              </button>
            ) : (
              <button
                onClick={handleRunComparison}
                disabled={!prompt.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-groq-green text-black text-xs font-semibold rounded-lg hover:bg-groq-greenHover disabled:opacity-40 transition-all shadow-md shadow-groq-green/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Benchmark
              </button>
            )}
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-lab-dim">
            <span>Shared Evaluation Prompt:</span>
            <span>Temperature: {params.temperature} • Max Tokens: {params.maxTokens}</span>
          </div>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a benchmark query or task instruction..."
            className="w-full p-2.5 bg-lab-panel border border-lab-border rounded-lg text-xs font-sans text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/70 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Head-to-Head Comparison Metrics Card (When both finish) */}
      {metricsA && metricsB && (
        <div className="px-4 py-2.5 bg-[#121724] border-b border-lab-border text-xs font-mono flex items-center justify-around flex-wrap gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-lab-dim">Speed Winner: </span>
            <span className="text-groq-green font-bold">
              {(metricsA.latencyMs || 0) < (metricsB.latencyMs || 0) ? modelAObj.name : modelBObj.name}
            </span>
            <span className="text-lab-dim text-[11px]">
              (
              {Math.abs((metricsA.latencyMs || 0) - (metricsB.latencyMs || 0))}ms faster)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-lab-dim">Throughput: </span>
            <span className="text-lab-text">
              {metricsA.tokensPerSecond || 'N/A'} tok/s vs {metricsB.tokensPerSecond || 'N/A'} tok/s
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-lab-dim">Output Tokens: </span>
            <span className="text-lab-text">
              {metricsA.completionTokens || 'N/A'} vs {metricsB.completionTokens || 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Side-by-Side Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-lab-border overflow-hidden">
        {/* Model A Column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-lab-panel/30">
          {/* Header A */}
          <div className="p-3 bg-lab-panel border-b border-lab-borderSubtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 font-mono">MODEL A:</span>
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="px-2 py-1 bg-lab-bg border border-lab-border rounded text-xs font-mono text-lab-text focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {isGeneratingA && (
              <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Streaming...
              </span>
            )}
          </div>

          {/* Response Output A */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
            {errorA && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorA}</span>
              </div>
            )}

            <div className="font-mono text-xs text-lab-text leading-relaxed whitespace-pre-wrap">
              {responseA ? (
                <>
                  {responseA}
                  {isGeneratingA && (
                    <span className="inline-block w-2 h-3.5 ml-1 bg-cyan-400 animate-stream-cursor" />
                  )}
                </>
              ) : (
                <span className="text-lab-dim italic">Awaiting benchmark execution...</span>
              )}
            </div>

            {metricsA && <TokenInsightsPanel metrics={metricsA} />}
          </div>
        </div>

        {/* Model B Column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-lab-panel/30">
          {/* Header B */}
          <div className="p-3 bg-lab-panel border-b border-lab-borderSubtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-groq-green font-mono">MODEL B:</span>
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="px-2 py-1 bg-lab-bg border border-lab-border rounded text-xs font-mono text-lab-text focus:outline-none focus:border-groq-green cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {isGeneratingB && (
              <span className="text-[11px] text-groq-green font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-groq-green animate-ping" />
                Streaming...
              </span>
            )}
          </div>

          {/* Response Output B */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
            {errorB && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorB}</span>
              </div>
            )}

            <div className="font-mono text-xs text-lab-text leading-relaxed whitespace-pre-wrap">
              {responseB ? (
                <>
                  {responseB}
                  {isGeneratingB && (
                    <span className="inline-block w-2 h-3.5 ml-1 bg-groq-green animate-stream-cursor" />
                  )}
                </>
              ) : (
                <span className="text-lab-dim italic">Awaiting benchmark execution...</span>
              )}
            </div>

            {metricsB && <TokenInsightsPanel metrics={metricsB} />}
          </div>
        </div>
      </div>
    </div>
  );
};

