import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../../types';
import { CodeBlock } from '../common/CodeBlock';
import { PromptClassificationBadge } from '../promptAnalyzer/PromptClassificationBadge';
import { TokenInsightsPanel } from './TokenInsightsPanel';
import { Bot, User, Copy, Check, RotateCw, AlertTriangle } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onRetry?: () => void;
  isLastAssistant?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onRetry,
  isLastAssistant = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy', err);
    }
  };

  return (
    <div
      className={`group py-4 px-3 sm:px-5 transition-colors border-b border-lab-borderSubtle ${
        isUser ? 'bg-transparent' : 'bg-lab-panel/30 hover:bg-lab-panel/50'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3.5">
        {/* Avatar Badge */}
        <div
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-semibold select-none ${
            isUser
              ? 'bg-[#182030] text-lab-muted border border-lab-border'
              : 'bg-groq-green/10 text-groq-green border border-groq-green/30'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lab-text">
                {isUser ? 'User' : message.modelId || 'Groq LPU Engine'}
              </span>
              <span className="text-[10px] text-lab-dim font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              {isStreaming && (
                <span className="flex items-center gap-1 text-[10px] text-groq-green font-mono uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-groq-green animate-ping" />
                  Generating...
                </span>
              )}
            </div>

            {/* Quick Actions (Copy, Regenerate) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-groq-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {!isUser && isLastAssistant && onRegenerate && !isStreaming && (
                <button
                  onClick={onRegenerate}
                  className="p-1 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {isError && (
            <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Inference Error</span>
              </div>
              <p className="text-xs text-red-200/90 font-mono">{message.error || message.content}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-red-900/40 hover:bg-red-800/50 text-red-200 border border-red-700/50 rounded transition-colors"
                >
                  <RotateCw className="w-3 h-3" /> Retry Prompt
                </button>
              )}
            </div>
          )}

          {/* Rendered Text & Markdown */}
          {!isError && (
            <div className="text-xs sm:text-[13px] text-lab-text leading-relaxed break-words markdown-body">
              {isUser ? (
                <div className="whitespace-pre-wrap font-sans text-lab-text/95">{message.content}</div>
              ) : (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !String(children).includes('\n');
                        if (isInline) {
                          return (
                            <code
                              className="px-1.5 py-0.5 rounded bg-lab-panel border border-lab-borderSubtle font-mono text-[11px] text-groq-green"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }
                        return (
                          <CodeBlock
                            language={match ? match[1] : ''}
                            value={String(children).replace(/\n$/, '')}
                          />
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2.5 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="mb-0.5">{children}</li>;
                      },
                      h1({ children }) {
                        return <h1 className="text-base font-bold text-lab-text mt-4 mb-2">{children}</h1>;
                      },
                      h2({ children }) {
                        return <h2 className="text-sm font-bold text-lab-text mt-3.5 mb-1.5">{children}</h2>;
                      },
                      h3({ children }) {
                        return <h3 className="text-xs font-bold text-lab-text mt-3 mb-1">{children}</h3>;
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="border-l-2 border-groq-green/50 pl-3 my-2 text-lab-muted italic">
                            {children}
                          </blockquote>
                        );
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-3 border border-lab-border rounded-lg">
                            <table className="min-w-full divide-y divide-lab-border text-xs text-left">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return <thead className="bg-[#121622] text-lab-muted font-mono">{children}</thead>;
                      },
                      th({ children }) {
                        return <th className="px-3 py-2 font-medium">{children}</th>;
                      },
                      td({ children }) {
                        return <td className="px-3 py-2 border-t border-lab-borderSubtle">{children}</td>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {/* Pulsing Cursor while streaming */}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-groq-green animate-stream-cursor align-middle" />
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer: Prompt Classification Badge & Token Insights (for assistant) */}
          {!isUser && !isError && (
            <div className="pt-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {message.promptAnalysis && (
                  <PromptClassificationBadge analysis={message.promptAnalysis} />
                )}
              </div>

              {message.metrics && (
                <TokenInsightsPanel
                  metrics={message.metrics}
                  promptType={message.promptAnalysis?.type}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

