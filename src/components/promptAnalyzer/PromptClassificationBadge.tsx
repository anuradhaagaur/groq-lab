import React, { useState } from 'react';
import { PromptAnalysisResult } from '../../types';
import { Sparkles, Layers, FileCode2, HelpCircle, ChevronRight } from 'lucide-react';
import { PromptAnalysisModal } from './PromptAnalysisModal';

interface PromptClassificationBadgeProps {
  analysis?: PromptAnalysisResult;
}

export const PromptClassificationBadge: React.FC<PromptClassificationBadgeProps> = ({ analysis }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!analysis) return null;

  const { type, exampleCount } = analysis;

  const badgeStyles = {
    'ZERO-SHOT': {
      bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40',
      icon: Sparkles,
      label: 'ZERO-SHOT',
      sub: 'No worked examples',
    },
    'ONE-SHOT': {
      bg: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40 hover:bg-cyan-900/40',
      icon: FileCode2,
      label: 'ONE-SHOT',
      sub: '1 worked demonstration',
    },
    'FEW-SHOT': {
      bg: 'bg-purple-950/40 text-purple-300 border-purple-800/40 hover:bg-purple-900/40',
      icon: Layers,
      label: `FEW-SHOT (${exampleCount})`,
      sub: `${exampleCount} demonstrations`,
    },
    'UNCLEAR': {
      bg: 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/40',
      icon: HelpCircle,
      label: 'UNCLEAR',
      sub: 'Ambiguous examples',
    },
  }[type] || {
    bg: 'bg-lab-panel text-lab-muted border-lab-border hover:bg-white/5',
    icon: Sparkles,
    label: type,
    sub: '',
  };

  const Icon = badgeStyles.icon;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md border transition-all cursor-pointer group ${badgeStyles.bg}`}
        title="Click to inspect prompt engineering analysis"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="font-semibold tracking-wide">{badgeStyles.label}</span>
        <span className="text-[11px] opacity-75 hidden sm:inline">• {badgeStyles.sub}</span>
        <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>

      <PromptAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysis={analysis}
      />
    </>
  );
};

