import React from 'react';
import { GroqModel, ActiveTab } from '../../types';
import {
  Menu,
  SlidersHorizontal,
  KeyRound,
  Trash2,
  Cpu,
  Zap,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  currentModel: GroqModel | undefined;
  hasApiKey: boolean;
  apiKeyStorageType: 'session' | 'local' | null;
  onOpenApiKeyModal: () => void;
  onClearConversation: () => void;
  onExportConversation: () => void;
  onToggleSidebarMobile: () => void;
  onToggleControlPanelMobile: () => void;
  onToggleControlPanelDesktop: () => void;
  isControlPanelOpen: boolean;
  messageCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentModel,
  hasApiKey,
  apiKeyStorageType,
  onOpenApiKeyModal,
  onClearConversation,
  onExportConversation,
  onToggleSidebarMobile,
  onToggleControlPanelMobile,
  onToggleControlPanelDesktop,
  isControlPanelOpen,
  messageCount,
}) => {
  const tabTitles = {
    playground: 'Playground',
    'prompt-lab': 'Prompt Lab (Few-Shot Studio)',
    comparison: 'Model Arena (Side-by-Side Comparison)',
    library: 'Prompt Library',
  };

  return (
    <header className="h-14 border-b border-lab-border bg-[#0b0e15]/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shrink-0 z-10">
      {/* Left: Mobile Menu & Current Tab Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="p-1.5 text-lab-muted hover:text-lab-text rounded-lg hover:bg-white/5 md:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-xs sm:text-sm font-semibold text-lab-text tracking-tight font-sans">
            {tabTitles[activeTab]}
          </h1>

          {currentModel && activeTab === 'playground' && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-lab-panel border border-lab-border text-[11px] font-mono text-lab-muted">
              <Cpu className="w-3 h-3 text-groq-green" />
              <span>{currentModel.name}</span>
              <span className="text-groq-green">• {currentModel.speed}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions, API Key Pill, Parameters Studio Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Clear and Export buttons for playground */}
        {activeTab === 'playground' && messageCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={onExportConversation}
              className="p-1.5 text-lab-dim hover:text-lab-text rounded-lg hover:bg-white/5 transition-colors hidden sm:flex"
              title="Export Conversation (Markdown)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClearConversation}
              className="p-1.5 text-lab-dim hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* API Key Connection Pill */}
        <button
          onClick={onOpenApiKeyModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
            hasApiKey
              ? 'bg-groq-green/10 text-groq-green border-groq-green/30 hover:bg-groq-green/20'
              : 'bg-red-950/40 text-red-300 border-red-800/50 hover:bg-red-900/40 animate-pulse'
          }`}
          title={hasApiKey ? `Connected via ${apiKeyStorageType} storage` : 'Connect your Groq API key'}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="font-medium hidden sm:inline">
            {hasApiKey ? 'Groq API Connected' : 'Connect API Key'}
          </span>
          <span className="sm:hidden font-medium">{hasApiKey ? 'Connected' : 'API Key'}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-groq-green' : 'bg-red-400'}`}
          />
        </button>

        {/* Control Panel Toggle (Desktop) */}
        {activeTab === 'playground' && (
          <>
            <button
              onClick={onToggleControlPanelDesktop}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                isControlPanelOpen
                  ? 'bg-lab-elevated text-lab-text border-lab-border'
                  : 'text-lab-muted hover:text-lab-text border-transparent hover:bg-white/5'
              }`}
              title="Toggle Parameters Studio"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-groq-green" />
              <span>Studio</span>
            </button>

            {/* Control Panel Toggle (Mobile) */}
            <button
              onClick={onToggleControlPanelMobile}
              className="p-1.5 text-lab-muted hover:text-lab-text rounded-lg hover:bg-white/5 lg:hidden"
              title="Toggle Parameters Studio"
            >
              <SlidersHorizontal className="w-4 h-4 text-groq-green" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

