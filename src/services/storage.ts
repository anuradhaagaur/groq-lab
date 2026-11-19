import { Conversation, GenerationParams, SavedPrompt } from '../types';
import { STARTER_PROMPTS } from './defaultData';

const STORAGE_KEYS = {
  API_KEY_LOCAL: 'groq_lab_api_key_local',
  API_KEY_SESSION: 'groq_lab_api_key_session',
  API_STORAGE_TYPE: 'groq_lab_key_storage_type',
  CONVERSATIONS: 'groq_lab_conversations_v1',
  SAVED_PROMPTS: 'groq_lab_saved_prompts_v1',
  ACTIVE_CONVERSATION_ID: 'groq_lab_active_conv_id',
  DEFAULT_PARAMS: 'groq_lab_default_params_v1',
  SELECTED_MODEL: 'groq_lab_selected_model_v1',
};

export const DEFAULT_PARAMETERS: GenerationParams = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  stream: true,
  systemPrompt: 'You are a helpful, accurate, and concise AI assistant powered by Groq high-speed inference. Provide clear, direct answers with precision.',
};

// API Key Storage & BYOK Management
export function getStoredApiKey(): { key: string | null; type: 'session' | 'local' | null } {
  try {
    const sessionKey = sessionStorage.getItem(STORAGE_KEYS.API_KEY_SESSION);
    if (sessionKey) {
      return { key: sessionKey, type: 'session' };
    }

    const localKey = localStorage.getItem(STORAGE_KEYS.API_KEY_LOCAL);
    if (localKey) {
      return { key: localKey, type: 'local' };
    }
  } catch (err) {
    console.warn('Storage read error:', err);
  }
  return { key: null, type: null };
}

export function saveApiKey(key: string, persistLocal: boolean): void {
  try {
    const trimmed = key.trim();
    if (persistLocal) {
      localStorage.setItem(STORAGE_KEYS.API_KEY_LOCAL, trimmed);
      localStorage.setItem(STORAGE_KEYS.API_STORAGE_TYPE, 'local');
      sessionStorage.removeItem(STORAGE_KEYS.API_KEY_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.API_KEY_SESSION, trimmed);
      localStorage.removeItem(STORAGE_KEYS.API_KEY_LOCAL);
      localStorage.setItem(STORAGE_KEYS.API_STORAGE_TYPE, 'session');
    }
  } catch (err) {
    console.error('Failed to save API key to storage:', err);
  }
}

export function clearStoredApiKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.API_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEYS.API_KEY_LOCAL);
    localStorage.removeItem(STORAGE_KEYS.API_STORAGE_TYPE);
  } catch (err) {
    console.warn('Failed to clear API key:', err);
  }
}

// Conversations Management
export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load conversations from localStorage:', err);
  }
  return [];
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations:', err);
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    }
  } catch {
    // Ignore storage quota
  }
}

// Saved Prompts Management
export function loadSavedPrompts(): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PROMPTS);
    if (raw) {
      const userPrompts: SavedPrompt[] = JSON.parse(raw);
      // Merge with default starter prompts, avoiding duplicates by id
      const userIds = new Set(userPrompts.map(p => p.id));
      const filteredStarters = STARTER_PROMPTS.filter(p => !userIds.has(p.id));
      return [...userPrompts, ...filteredStarters];
    }
  } catch (err) {
    console.warn('Failed to load saved prompts:', err);
  }
  return [...STARTER_PROMPTS];
}

export function saveUserPrompts(prompts: SavedPrompt[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_PROMPTS, JSON.stringify(prompts));
  } catch (err) {
    console.error('Failed to persist saved prompts:', err);
  }
}

// Selected Model Preference
export function getSavedModelId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'llama-3.3-70b-versatile';
  } catch {
    return 'llama-3.3-70b-versatile';
  }
}

export function saveModelId(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  } catch {
    // Ignore
  }
}

