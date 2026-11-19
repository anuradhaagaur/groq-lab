import { ChatMessage, GenerationParams, GroqModel, ResponseMetrics } from '../types';
import { DEFAULT_GROQ_MODELS } from './defaultData';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export interface CompletionCallbacks {
  onChunk: (chunk: string) => void;
  onUsage?: (usage: { promptTokens: number; completionTokens: number; totalTokens: number; queueTimeMs?: number }) => void;
  signal?: AbortSignal;
}

export interface CompletionResult {
  content: string;
  metrics: ResponseMetrics;
}

/**
 * Validates the Groq API key by calling the models endpoint.
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; models: GroqModel[]; error?: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { valid: false, models: [], error: 'API key cannot be empty' };
  }

  try {
    const response = await fetch(`${GROQ_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${trimmed}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      return { valid: false, models: [], error: 'Invalid Groq API key. Please check your credentials at console.groq.com' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `API error (${response.status}): ${response.statusText}`;
      return { valid: false, models: [], error: message };
    }

    const data = await response.json();
    const fetchedModels: GroqModel[] = [];

    if (data && Array.isArray(data.data)) {
      // Map API models, matching metadata from DEFAULT_GROQ_MODELS where possible
      data.data.forEach((m: { id: string; context_window?: number }) => {
        const defaultMatch = DEFAULT_GROQ_MODELS.find(d => d.id === m.id);
        if (defaultMatch) {
          fetchedModels.push({
            ...defaultMatch,
            contextWindow: m.context_window || defaultMatch.contextWindow,
            isAvailable: true,
          });
        } else {
          // Dynamic model from API not in our static table
          const id = m.id;
          const isLlama = id.includes('llama');
          const isGemma = id.includes('gemma');
          const isMixtral = id.includes('mixtral');
          const isDeepseek = id.includes('deepseek');

          fetchedModels.push({
            id: m.id,
            name: formatModelName(m.id),
            developer: isLlama ? 'Meta' : isGemma ? 'Google' : isMixtral ? 'Mistral' : isDeepseek ? 'DeepSeek' : 'Groq Community',
            contextWindow: m.context_window || 8192,
            maxOutputTokens: 4096,
            description: `Dynamic Groq model: ${m.id}`,
            speed: '~400 tps',
            category: isDeepseek ? 'reasoning' : 'versatile',
            supportsSystemPrompt: !id.includes('guard'),
            supportsStreaming: true,
            supportsTopP: true,
            supportsPenalties: !id.includes('guard') && !id.includes('r1'),
            isAvailable: true,
          });
        }
      });
    }

    // Sort models with flagship models first
    fetchedModels.sort((a, b) => {
      const priorityOrder = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768'];
      const aIdx = priorityOrder.indexOf(a.id);
      const bIdx = priorityOrder.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      valid: true,
      models: fetchedModels.length > 0 ? fetchedModels : DEFAULT_GROQ_MODELS,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network request failed';
    return {
      valid: false,
      models: [],
      error: `Connection error: ${errorMsg}. Please verify your network connection.`,
    };
  }
}

function formatModelName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Execute a Chat Completion request to Groq API.
 * Supports real-time Server-Sent Events (SSE) streaming with usage reporting.
 */
export async function sendChatCompletion(
  apiKey: string,
  modelId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  params: GenerationParams,
  callbacks?: CompletionCallbacks
): Promise<CompletionResult> {
  const startTime = performance.now();
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    throw new Error('Groq API Key is missing. Please connect your API key.');
  }

  // Build the message payload
  const formattedMessages: Array<{ role: string; content: string }> = [];

  // Add system prompt if model supports it and prompt is provided
  if (params.systemPrompt && params.systemPrompt.trim()) {
    formattedMessages.push({
      role: 'system',
      content: params.systemPrompt.trim(),
    });
  }

  // Append user & assistant messages
  formattedMessages.push(...messages);

  const requestBody: Record<string, unknown> = {
    model: modelId,
    messages: formattedMessages,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    top_p: params.topP,
    stream: params.stream,
  };

  // Penalties are supported on specific models
  if (params.frequencyPenalty !== 0) {
    requestBody.frequency_penalty = params.frequencyPenalty;
  }
  if (params.presencePenalty !== 0) {
    requestBody.presence_penalty = params.presencePenalty;
  }

  // Request token usage in streaming chunks if supported
  if (params.stream) {
    requestBody.stream_options = { include_usage: true };
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: callbacks?.signal,
  });

  if (!response.ok) {
    let errorDetail = `API Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // Fallback to response.statusText
    }

    if (response.status === 401) {
      throw new Error(`Authentication failed (401): ${errorDetail}`);
    } else if (response.status === 429) {
      throw new Error(`Rate limit exceeded (429): ${errorDetail}. Please wait before submitting more requests.`);
    } else if (response.status === 400) {
      throw new Error(`Invalid request parameters (400): ${errorDetail}`);
    } else {
      throw new Error(errorDetail);
    }
  }

  let finalContent = '';
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  let totalTokens: number | null = null;
  let queueTimeMs: number | null = null;

  if (params.stream && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;

          if (trimmedLine === 'data: [DONE]') {
            break;
          }

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);
            try {
              const parsed = JSON.parse(dataStr);

              // Check for token usage block (often in final stream chunk)
              if (parsed.usage) {
                promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
                completionTokens = parsed.usage.completion_tokens ?? completionTokens;
                totalTokens = parsed.usage.total_tokens ?? totalTokens;
                if (parsed.usage.queue_time) {
                  queueTimeMs = Math.round(parsed.usage.queue_time * 1000);
                }

                if (callbacks?.onUsage && promptTokens && completionTokens) {
                  callbacks.onUsage({
                    promptTokens,
                    completionTokens,
                    totalTokens: totalTokens || promptTokens + completionTokens,
                    queueTimeMs: queueTimeMs || undefined,
                  });
                }
              }

              // Extract text delta
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                finalContent += deltaContent;
                if (callbacks?.onChunk) {
                  callbacks.onChunk(deltaContent);
                }
              }
            } catch {
              // Ignore partial JSON parsing chunk
            }
          }
        }
      }
    } catch (readErr: unknown) {
      if ((readErr as { name?: string })?.name === 'AbortError') {
        // User aborted streaming
        // We still return whatever content was collected so far
      } else {
        throw readErr;
      }
    }
  } else {
    // Non-streaming response
    const json = await response.json();
    finalContent = json.choices?.[0]?.message?.content || '';

    if (json.usage) {
      promptTokens = json.usage.prompt_tokens ?? null;
      completionTokens = json.usage.completion_tokens ?? null;
      totalTokens = json.usage.total_tokens ?? null;
      if (json.usage.queue_time) {
        queueTimeMs = Math.round(json.usage.queue_time * 1000);
      }
    }
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  let tokensPerSecond: number | null = null;
  if (completionTokens && latencyMs > 0) {
    tokensPerSecond = Math.round((completionTokens / (latencyMs / 1000)) * 10) / 10;
  }

  const metrics: ResponseMetrics = {
    promptTokens,
    completionTokens,
    totalTokens: totalTokens || (promptTokens && completionTokens ? promptTokens + completionTokens : null),
    tokensPerSecond,
    latencyMs,
    queueTimeMs,
    model: modelId,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    topP: params.topP,
    frequencyPenalty: params.frequencyPenalty,
    presencePenalty: params.presencePenalty,
  };

  return {
    content: finalContent,
    metrics,
  };
}

