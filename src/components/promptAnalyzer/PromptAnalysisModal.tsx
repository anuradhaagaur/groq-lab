import React from 'react';
import { PromptAnalysisResult } from '../../types';
import { Modal } from '../common/Modal';
import { Sparkles, Layers, FileCode2, HelpCircle, CheckCircle2, Info, Lightbulb } from 'lucide-react';

interface PromptAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: PromptAnalysisResult;
}

export const PromptAnalysisModal: React.FC<PromptAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const { type, exampleCount, headline, reasoning, detectedExamples, structuralPatternsDetected, recommendation } = analysis;

  const typeConfig = {
    'ZERO-SHOT': {
      icon: Sparkles,
      color: 'text-emerald-400',
      badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
      definition: 'The prompt gives the model an instruction or task without any worked demonstrations of the expected output.',
    },
    'ONE-SHOT': {
      icon: FileCode2,
      color: 'text-cyan-300',
      badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
      definition: 'The prompt includes exactly one worked input-output demonstration guiding the model on desired format and reasoning.',
    },
    'FEW-SHOT': {
      icon: Layers,
      color: 'text-purple-300',
      badge: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
      definition: 'The prompt provides two or more worked input-output demonstrations, establishing a rigorous in-context pattern for the model.',
    },
    'UNCLEAR': {
      icon: HelpCircle,
      color: 'text-amber-300',
      badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      definition: 'The prompt contains references to examples or sample cues, but lacks complete, verified input-output demonstration pairs.',
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prompt Engineering Inspector"
      subtitle="Structural analysis of prompting technique detected in the prompt context"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Classification Overview Card */}
        <div className="p-4 bg-lab-panel border border-lab-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${typeConfig.color}`} />
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${typeConfig.badge}`}>
                {type}
              </span>
            </div>
            <div className="text-xs font-mono text-lab-muted">
              Detected Examples: <span className="font-semibold text-lab-text">{exampleCount}</span>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-lab-text">{headline}</h4>
          <p className="text-xs text-lab-muted leading-relaxed">{reasoning}</p>

          <div className="pt-2 border-t border-lab-borderSubtle text-[11px] text-lab-dim">
            <span className="font-medium text-lab-muted">Formal Definition: </span>
            {typeConfig.definition}
          </div>
        </div>

        {/* Structural Patterns Detected */}
        {structuralPatternsDetected.length > 0 && (
          <div className="p-3 bg-lab-bg border border-lab-border rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lab-muted uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-groq-green" />
              Structural Patterns Detected
            </div>
            <div className="flex flex-wrap gap-2">
              {structuralPatternsDetected.map((p, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-lab-panel border border-lab-borderSubtle text-xs text-lab-text font-mono rounded"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detected Examples Breakdown */}
        {detectedExamples.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lab-muted uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-lab-dim" />
              Extracted In-Context Demonstrations ({detectedExamples.length})
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {detectedExamples.map((ex, index) => (
                <div
                  key={index}
                  className="p-3 bg-[#0c0f17] border border-lab-border rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-lab-dim">
                    <span className="text-groq-green font-semibold">{ex.label || `Demonstration #${index + 1}`}</span>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div className="p-2 bg-lab-panel rounded border border-lab-borderSubtle">
                      <span className="text-lab-dim text-[10px] block uppercase font-sans">Input:</span>
                      <p className="text-lab-text text-[11px] whitespace-pre-wrap">{ex.input}</p>
                    </div>

                    <div className="p-2 bg-groq-green/5 rounded border border-groq-green/20">
                      <span className="text-groq-green/80 text-[10px] block uppercase font-sans">Demonstrated Output:</span>
                      <p className="text-lab-text text-[11px] whitespace-pre-wrap">{ex.output}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Engineering Recommendation */}
        {recommendation && (
          <div className="flex items-start gap-3 p-3.5 bg-lab-highlight/40 border border-lab-border rounded-xl text-xs">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-semibold text-lab-text">Prompt Engineering Recommendation</span>
              <p className="text-lab-muted leading-relaxed">{recommendation}</p>
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="flex items-start gap-2.5 p-3 bg-lab-bg rounded-lg border border-lab-borderSubtle text-[11px] text-lab-dim">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-lab-muted" />
          <p className="leading-relaxed">
            The GROQ LAB analyzer evaluates prompt semantics and syntactic pairs (e.g. <code className="text-lab-text font-mono">Input → Output</code>, <code className="text-lab-text font-mono">Q: → A:</code>) while ignoring plain conversational questions, code snippets, and requirement lists.
          </p>
        </div>
      </div>
    </Modal>
  );
};

