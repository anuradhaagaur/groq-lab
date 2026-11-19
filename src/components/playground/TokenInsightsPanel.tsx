import React, { useState } from 'react';
import { ResponseMetrics, PromptClassificationType } from '../../types';
import { Activity, ChevronDown, ChevronUp, Cpu, Gauge, Clock, Hash, Zap } from 'lucide-react';

interface TokenInsightsPanelProps {
  metrics?: ResponseMetrics;
  promptType?: PromptClassificationType;
}

export const TokenInsightsPanel: React.FC<TokenInsightsPanelProps> = ({ metrics, promptType }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!metrics) return null;

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'Unavailable';
    return String(val);
  };

  return (
    <div className="mt-2.5 border border-lab-border rounded-lg bg-[#0a0d14] overflow-hidden text-xs font-mono">
      {/* Collapsible Trigger Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-[#10141f] hover:bg-[#151a29] transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-lab-muted">
          <Activity className="w-3.5 h-3.5 text-groq-green" />
          <span className="font-semibold text-lab-text">Response Telemetry</span>
          {metrics.tokensPerSecond && (
            <span className="flex items-center gap-1 text-[11px] text-groq-green font-semibold">
              <Zap className="w-3 h-3" />
              {metrics.tokensPerSecond} tok/s
            </span>
          )}
          {metrics.latencyMs && (
            <span className="text-[11px] text-lab-dim hidden sm:inline">
              • {metrics.latencyMs}ms
            </span>
          )}
          {metrics.totalTokens && (
            <span className="text-[11px] text-lab-dim hidden sm:inline">
              • {metrics.totalTokens} tokens
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-lab-dim">
          <span>{isOpen ? 'Hide Insights' : 'Inspect Metadata'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Grid */}
      {isOpen && (
        <div className="p-3 border-t border-lab-borderSubtle bg-lab-panel/60 space-y-3">
          {/* Main Metrics 4-Col Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-lab-bg rounded border border-lab-borderSubtle">
              <div className="flex items-center gap-1 text-[10px] text-lab-dim uppercase tracking-wider mb-1">
                <Hash className="w-3 h-3 text-cyan-400" /> Prompt Tokens
              </div>
              <div className="text-sm font-semibold text-lab-text">
                {formatValue(metrics.promptTokens)}
              </div>
            </div>

            <div className="p-2.5 bg-lab-bg rounded border border-lab-borderSubtle">
              <div className="flex items-center gap-1 text-[10px] text-lab-dim uppercase tracking-wider mb-1">
                <Hash className="w-3 h-3 text-groq-green" /> Output Tokens
              </div>
              <div className="text-sm font-semibold text-groq-green">
                {formatValue(metrics.completionTokens)}
              </div>
            </div>

            <div className="p-2.5 bg-lab-bg rounded border border-lab-borderSubtle">
              <div className="flex items-center gap-1 text-[10px] text-lab-dim uppercase tracking-wider mb-1">
                <Gauge className="w-3 h-3 text-purple-400" /> Total Tokens
              </div>
              <div className="text-sm font-semibold text-lab-text">
                {formatValue(metrics.totalTokens)}
              </div>
            </div>

            <div className="p-2.5 bg-lab-bg rounded border border-lab-borderSubtle">
              <div className="flex items-center gap-1 text-[10px] text-lab-dim uppercase tracking-wider mb-1">
                <Clock className="w-3 h-3 text-amber-400" /> Latency
              </div>
              <div className="text-sm font-semibold text-lab-text">
                {metrics.latencyMs ? `${metrics.latencyMs} ms` : 'Unavailable'}
              </div>
            </div>
          </div>

          {/* Model & Parameters Table */}
          <div className="p-2.5 bg-lab-bg rounded border border-lab-borderSubtle">
            <div className="text-[10px] uppercase tracking-wider text-lab-dim mb-2 font-sans font-medium">
              Generation Parameter Snapshot
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-[11px]">
              <div>
                <span className="text-lab-dim">Model: </span>
                <span className="text-lab-text font-medium">{metrics.model}</span>
              </div>
              <div>
                <span className="text-lab-dim">Temperature: </span>
                <span className="text-lab-text">{formatValue(metrics.temperature)}</span>
              </div>
              <div>
                <span className="text-lab-dim">Max Tokens: </span>
                <span className="text-lab-text">{formatValue(metrics.maxTokens)}</span>
              </div>
              <div>
                <span className="text-lab-dim">Top-P: </span>
                <span className="text-lab-text">{formatValue(metrics.topP)}</span>
              </div>
              <div>
                <span className="text-lab-dim">Freq Penalty: </span>
                <span className="text-lab-text">{formatValue(metrics.frequencyPenalty)}</span>
              </div>
              <div>
                <span className="text-lab-dim">Pres Penalty: </span>
                <span className="text-lab-text">{formatValue(metrics.presencePenalty)}</span>
              </div>
              {metrics.queueTimeMs !== undefined && metrics.queueTimeMs !== null && (
                <div>
                  <span className="text-lab-dim">Queue Time: </span>
                  <span className="text-lab-text">{metrics.queueTimeMs} ms</span>
                </div>
              )}
              {promptType && (
                <div>
                  <span className="text-lab-dim">Prompt Technique: </span>
                  <span className="text-groq-green font-semibold">{promptType}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

