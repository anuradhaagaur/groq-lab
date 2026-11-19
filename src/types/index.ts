export type PromptClassificationType = 'ZERO-SHOT' | 'ONE-SHOT' | 'FEW-SHOT' | 'UNCLEAR';

export interface PromptExample {
  input: string;
  output: string;
  rawSnippet?: string;
  label?: string;
}

export interface PromptAnalysisResult {
  type: PromptClassificationType;
  exampleCount: number;
  headline: string;
  reasoning: string;
  detectedExamples: PromptExample[];
  confidence: 'high' | 'medium' | 'low';
  structuralPatternsDetected: string[];
  recommendation?: string;
}

export interface GroqModel {
  id: string;
  name: string;
  developer: string;
  contextWindow: number;
  maxOutputTokens: number;
  description: string;
  speed: string;
  category: 'versatile' | 'speed' | 'reasoning' | 'safety' | 'multimodal';
  supportsSystemPrompt: boolean;
  supportsStreaming: boolean;
  supportsTopP: boolean;
  supportsPenalties: boolean;
  isAvailable?: boolean;
}

export interface GenerationParams {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stream: boolean;
  systemPrompt: string;
}

export interface ResponseMetrics {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  tokensPerSecond: number | null;
  latencyMs: number | null;
  queueTimeMs?: number | null;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: string;
  metrics?: ResponseMetrics;
  promptAnalysis?: PromptAnalysisResult;
  status?: 'streaming' | 'complete' | 'error';
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  messages: ChatMessage[];
  parameters: GenerationParams;
}

export type PromptCategory =
  | 'summarization'
  | 'classification'
  | 'coding'
  | 'brainstorming'
  | 'writing'
  | 'reasoning'
  | 'extraction'
  | 'custom';

export interface SavedPrompt {
  id: string;
  title: string;
  description: string;
  category: PromptCategory;
  systemPrompt: string;
  userPrompt: string;
  suggestedModel?: string;
  promptType?: PromptClassificationType;
  tags: string[];
  createdAt: number;
  isPreset?: boolean;
}

export interface PromptLabExample {
  id: string;
  input: string;
  output: string;
}

export type ActiveTab = 'playground' | 'prompt-lab' | 'comparison' | 'library';

export interface ApiKeyStorageConfig {
  key: string;
  storageType: 'session' | 'local';
  connectedAt: number;
  modelCount?: number;
}

