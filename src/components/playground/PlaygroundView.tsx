import React, { useRef, useEffect } from 'react';
import { ChatMessage, GenerationParams, GroqModel } from '../../types';
import { MessageItem } from './MessageItem';
import { PromptInput } from './PromptInput';
import { AmbientWorkspace } from './AmbientWorkspace';
import { TokenCore } from './TokenCore';
import { Sparkles, ArrowRight, KeyRound } from 'lucide-react';

interface PlaygroundViewProps {
  messages: ChatMessage[];
  currentModel: GroqModel | undefined;
  params: GenerationParams;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  promptInputValue: string;
  setPromptInputValue: (val: string) => void;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onRegenerateLast: () => void;
  onRetryLast: () => void;
  isGenerating: boolean;
  onSelectStarterPrompt: (promptText: string, systemPrompt?: string) => void;
  onOpenPromptLab?: () => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  messages,
  currentModel,
  params,
  hasApiKey,
  onOpenApiKeyModal,
  promptInputValue,
  setPromptInputValue,
  onSendMessage,
  onStopGeneration,
  onRegenerateLast,
  onRetryLast,
  isGenerating,
  onSelectStarterPrompt,
  onOpenPromptLab,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message or stream chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const starterCards = [
    {
      title: 'Few-Shot Sentiment & Action Classifier',
      type: 'FEW-SHOT',
      desc: 'Classify support queries using 4 input-output demonstrations.',
      prompt: `Classify the customer support message into Sentiment (Positive, Neutral, Negative, Urgent) and Action (Refund, BugReport, TechSupport, Escalate).

Input: "I have been locked out of my account for 4 hours and my team cannot deploy our release."
Sentiment: Urgent
Action: Escalate

Input: "The new UI update looks fantastic, thank you team!"
Sentiment: Positive
Action: None

Input: "When I click export to CSV, the table downloads an empty 0kb file."
Sentiment: Negative
Action: BugReport

Input: "Billing charged my credit card twice for this month's renewal!"
Sentiment:`,
    },
    {
      title: 'Distributed Mutex in TypeScript',
      type: 'ZERO-SHOT',
      desc: 'Generate a production-grade Redis lock with safe TTL lease renewal.',
      prompt: `Implement a production-ready Distributed Lock class in TypeScript using ioredis.

Requirements:
1. Safe acquisition with TTL and unique random lock token.
2. Atomic release using a Lua script.
3. Automatic background heartbeat / lease renewal while the callback is executing.`,
    },
    {
      title: 'Counterfactual Physical Reasoning',
      type: 'REASONING',
      desc: 'Deduce effects if the speed of light was reduced to 300 m/s.',
      prompt: `Analyze the following counterfactual scenario with rigorous step-by-step deduction:

Premise: Suppose the speed of light in vacuum was reduced to 300 meters per second (approx the speed of sound today), while human perception and chemical reaction rates remained unchanged.

Deduce the consequences for everyday visual perception, relativistic Doppler shifts, and computer processors.`,
    },
  ];

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-[#07090d]">
      {/* Layered Living Computational Environment */}
      <AmbientWorkspace isGenerating={isGenerating} />

      {/* Scrollable Chat Area */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen with Animated Token Core */
          <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center text-center space-y-6 transition-all duration-500">
            {/* Animated Interactive Token Core */}
            <div className="flex items-center justify-center pt-2">
              <TokenCore />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-lab-text">
                Welcome to <span className="text-[#00F5A0]">GROQ LAB</span>
              </h2>
              <p className="text-xs sm:text-sm text-lab-muted max-w-lg mx-auto leading-relaxed">
                A high-speed LLM experimentation console powered by Groq LPUs. Experiment with Zero-shot, One-shot, and Few-shot prompting, analyze telemetry, and inspect real token performance.
              </p>
            </div>

            {/* API Key Banner if not connected */}
            {!hasApiKey && (
              <div className="w-full max-w-md p-4 bg-[#0e121b]/90 border border-[#00F5A0]/30 rounded-xl space-y-3 text-left shadow-lg shadow-black/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F5A0]">
                  <KeyRound className="w-4 h-4" />
                  Connect Groq API Key to Begin
                </div>
                <p className="text-xs text-lab-muted leading-relaxed">
                  GROQ LAB requires your personal Groq API key for direct, high-throughput inference without server intermediaries.
                </p>
                <button
                  onClick={onOpenApiKeyModal}
                  className="w-full py-2 bg-[#00F5A0] text-black font-semibold text-xs rounded-lg hover:bg-[#00dc8b] transition-all shadow-md shadow-[#00F5A0]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Enter Groq API Key
                </button>
              </div>
            )}

            {/* Quick Starter Templates */}
            <div className="w-full pt-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider text-lab-dim">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Prompt Engineering Starters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {starterCards.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectStarterPrompt(card.prompt)}
                    className="p-3.5 bg-lab-panel/80 border border-lab-border hover:border-[#00F5A0]/40 hover:bg-lab-elevated rounded-xl transition-all group flex flex-col justify-between space-y-3 text-xs backdrop-blur-sm cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lab-bg text-[#00F5A0] border border-[#00F5A0]/20">
                          {card.type}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-lab-dim group-hover:text-[#00F5A0] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h4 className="font-semibold text-lab-text group-hover:text-white">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-lab-muted leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <span className="text-[10px] text-[#00F5A0] font-mono">Click to load prompt →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages Stream */
          <div className="pb-6">
            {messages.map((msg, idx) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onRegenerate={onRegenerateLast}
                onRetry={onRetryLast}
                isLastAssistant={idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Command Console Input Area */}
      <PromptInput
        value={promptInputValue}
        onChange={setPromptInputValue}
        onSubmit={onSendMessage}
        onStop={onStopGeneration}
        onClear={() => setPromptInputValue('')}
        isGenerating={isGenerating}
        disabled={!hasApiKey}
        disabledPlaceholder={!hasApiKey ? 'Connect your Groq API key (above) to start experimenting...' : undefined}
        onOpenPromptLab={onOpenPromptLab}
      />
    </div>
  );
};

