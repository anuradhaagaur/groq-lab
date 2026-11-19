import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveTab,
  ChatMessage,
  Conversation,
  GenerationParams,
  GroqModel,
  SavedPrompt,
} from './types';
import { DEFAULT_GROQ_MODELS } from './services/defaultData';
import {
  clearStoredApiKey,
  getActiveConversationId,
  getSavedModelId,
  getStoredApiKey,
  loadConversations,
  loadSavedPrompts,
  saveApiKey,
  saveConversations,
  saveModelId,
  saveUserPrompts,
  setActiveConversationId,
  DEFAULT_PARAMETERS,
} from './services/storage';
import { sendChatCompletion, validateApiKey } from './services/groqClient';
import { analyzePrompt } from './services/promptAnalyzer';

// Components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ModelControlPanel } from './components/layout/ModelControlPanel';
import { PlaygroundView } from './components/playground/PlaygroundView';
import { PromptLabView } from './components/promptLab/PromptLabView';
import { ModelComparisonView } from './components/modelComparison/ModelComparisonView';
import { ApiKeyModal } from './components/apiKey/ApiKeyModal';
import { SavedPromptsModal } from './components/savedPrompts/SavedPromptsModal';
import { TokenCollisionIntro } from './components/intro/TokenCollisionIntro';

export const App: React.FC = () => {
  // --- Intro Cinematic State ---
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('groq_lab_intro_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem('groq_lab_intro_seen', 'true');
    } catch {
      // Ignore
    }
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  // --- API Key & Models State ---
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyStorageType, setApiKeyStorageType] = useState<'session' | 'local' | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [models, setModels] = useState<GroqModel[]>(DEFAULT_GROQ_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>(getSavedModelId());

  // --- Generation Parameters State ---
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMETERS);

  // --- Navigation & UI State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('playground');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);
  const [isControlPanelMobileOpen, setIsControlPanelMobileOpen] = useState(false);
  const [isSavedPromptsModalOpen, setIsSavedPromptsModalOpen] = useState(false);

  // --- Conversations State ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Saved Prompts Library ---
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);

  // AbortController for streaming
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    // 1. Check stored API Key
    const stored = getStoredApiKey();
    if (stored.key) {
      setApiKey(stored.key);
      setApiKeyStorageType(stored.type);
      // Validate and load fresh models
      validateApiKey(stored.key).then((res) => {
        if (res.valid && res.models.length > 0) {
          setModels(res.models);
        }
      });
    }

    // 2. Load conversations
    const loadedConvs = loadConversations();
    if (loadedConvs.length > 0) {
      setConversations(loadedConvs);
      const savedActiveId = getActiveConversationId();
      const match = loadedConvs.find((c) => c.id === savedActiveId);
      if (match) {
        setActiveConvId(match.id);
        setSelectedModelId(match.modelId || getSavedModelId());
        setParams(match.parameters || DEFAULT_PARAMETERS);
      } else {
        setActiveConvId(loadedConvs[0].id);
      }
    } else {
      // Create initial conversation
      const initialConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Experiment',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: getSavedModelId(),
        messages: [],
        parameters: DEFAULT_PARAMETERS,
      };
      setConversations([initialConv]);
      setActiveConvId(initialConv.id);
      saveConversations([initialConv]);
      setActiveConversationId(initialConv.id);
    }

    // 3. Load Saved Prompts Library
    setSavedPrompts(loadSavedPrompts());
  }, []);

  // Sync active conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Helper to update active conversation
  const updateActiveConversation = (updater: (prev: Conversation) => Conversation) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === activeConversationId) {
          return updater(c);
        }
        return c;
      });
      saveConversations(updated);
      return updated;
    });
  };

  // --- Handlers: Conversations ---
  const handleNewConversation = () => {
    // If currently streaming, stop it
    if (isGenerating) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
    }

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Experiment',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: selectedModelId,
      messages: [],
      parameters: params,
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConvId(newConv.id);
    setActiveConversationId(newConv.id);
    saveConversations(updated);
    setPromptInputValue('');
    setActiveTab('playground');
    setIsSidebarMobileOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    if (isGenerating) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
    }
    setActiveConvId(id);
    setActiveConversationId(id);
    const target = conversations.find((c) => c.id === id);
    if (target) {
      setSelectedModelId(target.modelId || selectedModelId);
      if (target.parameters) {
        setParams(target.parameters);
      }
    }
    setIsSidebarMobileOpen(false);
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      saveConversations(updated);
      return updated;
    });
  };

  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter((c) => c.id !== id);
    if (filtered.length === 0) {
      // Create a fresh one
      const fresh: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Experiment',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: selectedModelId,
        messages: [],
        parameters: params,
      };
      setConversations([fresh]);
      setActiveConvId(fresh.id);
      saveConversations([fresh]);
      setActiveConversationId(fresh.id);
    } else {
      setConversations(filtered);
      saveConversations(filtered);
      if (activeConversationId === id) {
        setActiveConvId(filtered[0].id);
        setActiveConversationId(filtered[0].id);
      }
    }
  };

  const handleClearConversation = () => {
    if (confirm('Clear all messages in the current conversation?')) {
      updateActiveConversation((prev) => ({
        ...prev,
        messages: [],
        updatedAt: Date.now(),
      }));
    }
  };

  const handleExportConversation = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;

    let md = `# ${activeConversation.title}\n`;
    md += `*Model:* ${activeConversation.modelId}\n`;
    md += `*Date:* ${new Date(activeConversation.createdAt).toLocaleString()}\n\n---\n\n`;

    activeConversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '### User' : `### Assistant (${msg.modelId || 'Groq'})`;
      md += `${role}\n\n${msg.content}\n\n`;
      if (msg.promptAnalysis) {
        md += `> **Prompt Technique Detected:** ${msg.promptAnalysis.type} (${msg.promptAnalysis.exampleCount} examples)\n\n`;
      }
      if (msg.metrics) {
        md += `*Telemetry: ${msg.metrics.totalTokens || 'N/A'} tokens | ${msg.metrics.latencyMs || 'N/A'}ms | ${msg.metrics.tokensPerSecond || 'N/A'} tok/s*\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Handlers: Model & Parameters ---
  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    saveModelId(modelId);
    updateActiveConversation((prev) => ({
      ...prev,
      modelId,
    }));
  };

  const handleChangeParams = (newParams: GenerationParams) => {
    setParams(newParams);
    updateActiveConversation((prev) => ({
      ...prev,
      parameters: newParams,
    }));
  };

  // --- Handlers: API Key Modal ---
  const handleKeyConnected = (key: string, fetchedModels: GroqModel[], type: 'session' | 'local') => {
    setApiKey(key);
    setApiKeyStorageType(type);
    if (fetchedModels.length > 0) {
      setModels(fetchedModels);
    }
  };

  const handleKeyDisconnected = () => {
    setApiKey(null);
    setApiKeyStorageType(null);
    clearStoredApiKey();
  };

  // --- Handlers: Messaging & Real-Time Streaming ---
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || promptInputValue).trim();
    if (!text) return;

    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    // 1. Analyze prompt structure immediately
    const analysis = analyzePrompt(text, params.systemPrompt);

    // 2. Create User message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Auto-title conversation on first message
    const isFirstMessage = !activeConversation || activeConversation.messages.length === 0;
    const newTitle = isFirstMessage
      ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
      : activeConversation.title;

    // 3. Create Assistant placeholder message
    const assistantMsgId = `msg-${Date.now() + 1}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      modelId: selectedModelId,
      promptAnalysis: analysis,
      status: 'streaming',
    };

    const currentMessages = activeConversation ? activeConversation.messages : [];
    const updatedMessages = [...currentMessages, userMsg, assistantMsg];

    updateActiveConversation((prev) => ({
      ...prev,
      title: newTitle,
      messages: updatedMessages,
      modelId: selectedModelId,
      parameters: params,
      updatedAt: Date.now(),
    }));

    setPromptInputValue('');
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Format context for Groq API
    const context = [...currentMessages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      let accumulatedContent = '';

      const result = await sendChatCompletion(
        apiKey,
        selectedModelId,
        context,
        params,
        {
          onChunk: (chunk) => {
            accumulatedContent += chunk;
            // Update streaming message content in real time
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === activeConversationId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                    ),
                  };
                }
                return c;
              })
            );
          },
          signal: controller.signal,
        }
      );

      // Final update with actual API metrics
      setConversations((prev) => {
        const finalUpdated = prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: result.content,
                      metrics: result.metrics,
                      status: 'complete' as const,
                    }
                  : m
              ),
            };
          }
          return c;
        });
        saveConversations(finalUpdated);
        return finalUpdated;
      });
    } catch (err: unknown) {
      const isAborted = (err as { name?: string })?.name === 'AbortError';
      const errorMsg = err instanceof Error ? err.message : 'Unknown execution error';

      setConversations((prev) => {
        const finalUpdated = prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    status: isAborted ? ('complete' as const) : ('error' as const),
                    error: isAborted ? undefined : errorMsg,
                  };
                }
                return m;
              }),
            };
          }
          return c;
        });
        saveConversations(finalUpdated);
        return finalUpdated;
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleRegenerateLast = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isGenerating) return;

    const msgs = [...activeConversation.messages];
    const lastMsg = msgs[msgs.length - 1];

    if (lastMsg.role === 'assistant') {
      // Find the user prompt preceding this assistant message
      const userPromptMsg = msgs[msgs.length - 2];
      if (userPromptMsg && userPromptMsg.role === 'user') {
        // Pop last assistant message
        msgs.pop();
        updateActiveConversation((prev) => ({
          ...prev,
          messages: msgs,
        }));
        // Re-execute
        handleSendMessage(userPromptMsg.content);
      }
    }
  };

  const handleRetryLast = () => {
    handleRegenerateLast();
  };

  // --- Handlers: Saved Prompts Library ---
  const handleLoadSavedPrompt = (prompt: SavedPrompt) => {
    if (prompt.systemPrompt) {
      setParams((prev) => ({ ...prev, systemPrompt: prompt.systemPrompt }));
    }
    setPromptInputValue(prompt.userPrompt);
    if (prompt.suggestedModel) {
      const exists = models.some((m) => m.id === prompt.suggestedModel);
      if (exists) {
        handleSelectModel(prompt.suggestedModel);
      }
    }
    setActiveTab('playground');
  };

  const handleSavePrompt = (newPrompt: SavedPrompt) => {
    const updated = [newPrompt, ...savedPrompts.filter((p) => p.id !== newPrompt.id)];
    setSavedPrompts(updated);
    saveUserPrompts(updated.filter((p) => !p.isPreset));
  };

  const handleDeletePrompt = (id: string) => {
    const updated = savedPrompts.filter((p) => p.id !== id);
    setSavedPrompts(updated);
    saveUserPrompts(updated.filter((p) => !p.isPreset));
  };

  const handleTransferFromLabToPlayground = (promptText: string, sysPrompt: string) => {
    if (sysPrompt) {
      setParams((prev) => ({ ...prev, systemPrompt: sysPrompt }));
    }
    setPromptInputValue(promptText);
    setActiveTab('playground');
  };

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <>
      {/* Cinematic Token Collision Intro */}
      {showIntro && <TokenCollisionIntro onComplete={handleIntroComplete} />}

      <div
        className={`flex h-screen w-screen overflow-hidden bg-lab-bg text-lab-text select-none transition-all duration-700 ${
          showIntro ? 'opacity-0 scale-[0.98] blur-sm pointer-events-none' : 'opacity-100 scale-100 blur-0'
        }`}
      >
        {/* Left Sidebar (Desktop) */}
        <div className="hidden md:flex h-full">
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onOpenSavedPromptsModal={() => setIsSavedPromptsModalOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onReplayIntro={handleReplayIntro}
          />
        </div>

        {/* Left Sidebar (Mobile Drawer) */}
        {isSidebarMobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsSidebarMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] h-full z-50">
              <Sidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onRenameConversation={handleRenameConversation}
                onDeleteConversation={handleDeleteConversation}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setIsSidebarMobileOpen(false);
                }}
                onOpenApiKeyModal={() => {
                  setIsApiKeyModalOpen(true);
                  setIsSidebarMobileOpen(false);
                }}
                onOpenSavedPromptsModal={() => {
                  setIsSavedPromptsModalOpen(true);
                  setIsSidebarMobileOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => setIsSidebarMobileOpen(false)}
                isMobile={true}
                onReplayIntro={handleReplayIntro}
              />
            </div>
          </div>
        )}

        {/* Center Main Stage */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <Header
            activeTab={activeTab}
            currentModel={currentModel}
            hasApiKey={!!apiKey}
            apiKeyStorageType={apiKeyStorageType}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onClearConversation={handleClearConversation}
            onExportConversation={handleExportConversation}
            onToggleSidebarMobile={() => setIsSidebarMobileOpen(true)}
            onToggleControlPanelMobile={() => setIsControlPanelMobileOpen(true)}
            onToggleControlPanelDesktop={() => setIsControlPanelOpen(!isControlPanelOpen)}
            isControlPanelOpen={isControlPanelOpen}
            messageCount={activeConversation?.messages.length || 0}
            onReplayIntro={handleReplayIntro}
          />

        {/* View Switcher: Playground / Prompt Lab / Model Arena */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'playground' && (
            <PlaygroundView
              messages={activeConversation?.messages || []}
              currentModel={currentModel}
              params={params}
              hasApiKey={!!apiKey}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              promptInputValue={promptInputValue}
              setPromptInputValue={setPromptInputValue}
              onSendMessage={() => handleSendMessage()}
              onStopGeneration={handleStopGeneration}
              onRegenerateLast={handleRegenerateLast}
              onRetryLast={handleRetryLast}
              isGenerating={isGenerating}
              onSelectStarterPrompt={(promptText, sysPrompt) => {
                if (sysPrompt) {
                  setParams((p) => ({ ...p, systemPrompt: sysPrompt }));
                }
                setPromptInputValue(promptText);
              }}
              onOpenPromptLab={() => setActiveTab('prompt-lab')}
            />
          )}

          {activeTab === 'prompt-lab' && (
            <PromptLabView
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={handleSelectModel}
              apiKey={apiKey}
              params={params}
              onTransferToPlayground={handleTransferFromLabToPlayground}
            />
          )}

          {activeTab === 'comparison' && (
            <ModelComparisonView
              models={models}
              apiKey={apiKey}
              params={params}
            />
          )}
        </main>
      </div>

      {/* Right Model Control Studio (Desktop) */}
      {activeTab === 'playground' && (
        <ModelControlPanel
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={handleSelectModel}
          params={params}
          onChangeParams={handleChangeParams}
          isOpen={isControlPanelOpen}
          onToggle={() => setIsControlPanelOpen(!isControlPanelOpen)}
        />
      )}

      {/* Right Model Control Studio (Mobile Drawer) */}
      {isControlPanelMobileOpen && activeTab === 'playground' && (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsControlPanelMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[90vw] h-full z-50">
            <ModelControlPanel
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={handleSelectModel}
              params={params}
              onChangeParams={handleChangeParams}
              isOpen={true}
              onToggle={() => setIsControlPanelMobileOpen(false)}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={apiKey}
        storageType={apiKeyStorageType}
        onKeyConnected={handleKeyConnected}
        onKeyDisconnected={handleKeyDisconnected}
      />

      <SavedPromptsModal
        isOpen={isSavedPromptsModalOpen}
        onClose={() => setIsSavedPromptsModalOpen(false)}
        savedPrompts={savedPrompts}
        onLoadPrompt={handleLoadSavedPrompt}
        onSavePrompt={handleSavePrompt}
        onDeletePrompt={handleDeletePrompt}
      />
      </div>
    </>
  );
};

export default App;

