import React, { useState } from 'react';
import { Conversation, ActiveTab } from '../../types';
import {
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  GitCompare,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
  Cpu,
  Layers,
  Terminal,
  Play,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenApiKeyModal: () => void;
  onOpenSavedPromptsModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onReplayIntro?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  activeTab,
  onSelectTab,
  onOpenApiKeyModal,
  onOpenSavedPromptsModal,
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  onReplayIntro,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  if (isCollapsed && !isMobile) {
    return (
      <aside className="w-14 border-r border-lab-border bg-lab-panel/90 flex flex-col items-center py-4 shrink-0 justify-between">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-groq-green/10 text-groq-green border border-groq-green/30 hover:scale-105 transition-all"
            title="Expand sidebar"
          >
            <Terminal className="w-5 h-5" />
          </button>

          <button
            onClick={onNewConversation}
            className="p-2.5 text-lab-muted hover:text-groq-green rounded-lg hover:bg-white/5 transition-colors"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-6 h-[1px] bg-lab-borderSubtle my-1" />

          <button
            onClick={() => onSelectTab('playground')}
            className={`p-2.5 rounded-lg transition-colors ${
              activeTab === 'playground'
                ? 'bg-groq-green/15 text-groq-green border border-groq-green/30'
                : 'text-lab-dim hover:text-lab-text hover:bg-white/5'
            }`}
            title="Playground"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTab('prompt-lab')}
            className={`p-2.5 rounded-lg transition-colors ${
              activeTab === 'prompt-lab'
                ? 'bg-groq-green/15 text-groq-green border border-groq-green/30'
                : 'text-lab-dim hover:text-lab-text hover:bg-white/5'
            }`}
            title="Prompt Lab"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTab('comparison')}
            className={`p-2.5 rounded-lg transition-colors ${
              activeTab === 'comparison'
                ? 'bg-groq-green/15 text-groq-green border border-groq-green/30'
                : 'text-lab-dim hover:text-lab-text hover:bg-white/5'
            }`}
            title="Model Arena"
          >
            <GitCompare className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSavedPromptsModal}
            className="p-2.5 text-lab-dim hover:text-lab-text rounded-lg hover:bg-white/5 transition-colors"
            title="Prompt Library"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="p-2.5 text-lab-dim hover:text-groq-green rounded-lg hover:bg-white/5 transition-colors"
              title="Replay Intro Animation"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenApiKeyModal}
            className="p-2.5 text-lab-dim hover:text-lab-text rounded-lg hover:bg-white/5 transition-colors"
            title="API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`border-r border-lab-border bg-lab-panel flex flex-col h-full overflow-hidden transition-all duration-200 z-20 ${
        isMobile ? 'w-full' : 'w-64 sm:w-72 shrink-0'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-lab-borderSubtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-groq-green/10 border border-groq-green/40 flex items-center justify-center text-groq-green">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm tracking-wider text-lab-text">
                GROQ<span className="text-groq-green">.LAB</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-groq-orange/15 text-groq-orange border border-groq-orange/30">
                LPU
              </span>
            </div>
            <p className="text-[10px] text-lab-dim font-mono">LLM Experiment Studio</p>
          </div>
        </div>

        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Modes Bar */}
      <div className="p-2 border-b border-lab-borderSubtle grid grid-cols-3 gap-1 text-[11px] font-medium">
        <button
          onClick={() => onSelectTab('playground')}
          className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all ${
            activeTab === 'playground'
              ? 'bg-[#182030] text-groq-green font-semibold border border-groq-green/30'
              : 'text-lab-dim hover:text-lab-text hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-1" />
          Playground
        </button>

        <button
          onClick={() => onSelectTab('prompt-lab')}
          className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all ${
            activeTab === 'prompt-lab'
              ? 'bg-[#182030] text-groq-green font-semibold border border-groq-green/30'
              : 'text-lab-dim hover:text-lab-text hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4 mb-1" />
          Prompt Lab
        </button>

        <button
          onClick={() => onSelectTab('comparison')}
          className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all ${
            activeTab === 'comparison'
              ? 'bg-[#182030] text-groq-green font-semibold border border-groq-green/30'
              : 'text-lab-dim hover:text-lab-text hover:bg-white/5'
          }`}
        >
          <GitCompare className="w-4 h-4 mb-1" />
          Arena
        </button>
      </div>

      {/* New Chat & Search */}
      <div className="p-3 space-y-2 border-b border-lab-borderSubtle">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-groq-green text-black font-semibold text-xs rounded-lg hover:bg-groq-greenHover transition-all shadow-sm shadow-groq-green/10"
        >
          <Plus className="w-3.5 h-3.5" />
          New Conversation
        </button>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lab-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-lab-bg border border-lab-border rounded-lg text-xs text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/60 font-sans"
          />
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
        <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-lab-dim">
          Chat History ({filteredConversations.length})
        </div>

        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-lab-dim text-xs">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEditing = conv.id === editingId;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onSelectTab('playground');
                }}
                className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-lab-elevated text-lab-text font-medium border border-lab-border'
                    : 'text-lab-muted hover:text-lab-text hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-groq-green' : 'text-lab-dim group-hover:text-lab-muted'
                    }`}
                  />
                  {isEditing ? (
                    <form
                      onSubmit={(e) => saveRename(conv.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 flex-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveRename(conv.id)}
                        className="w-full px-1.5 py-0.5 bg-lab-bg border border-groq-green rounded text-xs text-lab-text focus:outline-none"
                      />
                      <button type="submit" className="p-0.5 text-groq-green">
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate text-xs">{conv.title}</span>
                  )}
                </div>

                {/* Inline Actions (Rename / Delete) */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRename(conv, e)}
                      className="p-1 text-lab-dim hover:text-lab-text rounded hover:bg-white/10"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="p-1 text-lab-dim hover:text-red-400 rounded hover:bg-white/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-3 border-t border-lab-borderSubtle space-y-1.5 text-xs">
        <button
          onClick={onOpenSavedPromptsModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-lab-bg/60 border border-lab-border text-lab-muted hover:text-lab-text hover:bg-lab-bg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prompt Library</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-lab-panel rounded text-lab-dim">
            Explore
          </span>
        </button>

        <button
          onClick={onOpenApiKeyModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-lab-bg/60 border border-lab-border text-lab-muted hover:text-lab-text hover:bg-lab-bg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-groq-green" />
            <span>API Settings</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-groq-green" />
        </button>

        {onReplayIntro && (
          <button
            onClick={onReplayIntro}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-lab-bg/40 border border-lab-borderSubtle text-lab-dim hover:text-groq-green hover:border-groq-green/30 hover:bg-groq-green/5 transition-all"
            title="Replay cinematic intro animation"
          >
            <div className="flex items-center gap-2">
              <Play className="w-3 h-3 text-groq-green" />
              <span>Replay Intro</span>
            </div>
            <span className="text-[10px] font-mono text-groq-green/80">Cinematic</span>
          </button>
        )}
      </div>
    </aside>
  );
};

