import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Lock, ExternalLink, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { GroqModel } from '../../types';
import { validateApiKey } from '../../services/groqClient';
import { clearStoredApiKey, saveApiKey } from '../../services/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string | null;
  storageType: 'session' | 'local' | null;
  onKeyConnected: (key: string, models: GroqModel[], type: 'session' | 'local') => void;
  onKeyDisconnected: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  storageType,
  onKeyConnected,
  onKeyDisconnected,
}) => {
  const [inputKey, setInputKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const [persistLocal, setPersistLocal] = useState(storageType === 'local');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setError('Please enter a valid Groq API key.');
      return;
    }

    if (!trimmed.startsWith('gsk_') && trimmed.length < 20) {
      setError('Groq API keys typically begin with "gsk_". Please verify your key.');
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(null);

    const result = await validateApiKey(trimmed);

    if (result.valid) {
      const chosenType: 'session' | 'local' = persistLocal ? 'local' : 'session';
      saveApiKey(trimmed, persistLocal);
      onKeyConnected(trimmed, result.models, chosenType);
      setSuccess(`Connection verified! Successfully loaded ${result.models.length} Groq models.`);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } else {
      setError(result.error || 'Failed to authenticate with Groq API.');
    }

    setIsValidating(false);
  };

  const handleDisconnect = () => {
    clearStoredApiKey();
    setInputKey('');
    setError(null);
    setSuccess(null);
    onKeyDisconnected();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Groq API Credentials"
      subtitle="Connect your personal API key for high-throughput LPU inference"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3.5 bg-lab-panel/70 border border-lab-border rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-groq-green mt-0.5 shrink-0" />
          <div className="space-y-1 text-lab-muted">
            <p className="text-lab-text font-medium">Bring Your Own Key (BYOK) Architecture</p>
            <p className="leading-relaxed">
              Requests are dispatched directly from your browser to the official Groq API endpoint (<code className="text-groq-green font-mono">api.groq.com/openai/v1</code>). Your key is never proxied through any third-party server or logged.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-lab-muted mb-1.5 uppercase tracking-wider">
              Groq API Key
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-lab-dim">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setError(null);
                }}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-9 pr-10 py-2.5 bg-lab-bg border border-lab-border rounded-lg font-mono text-xs text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green/70 transition-colors"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-lab-dim hover:text-lab-muted transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-lab-dim">
              <span>Must begin with gsk_</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-groq-green hover:underline"
              >
                Get a free API key at Groq Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Storage Mode Toggle */}
          <div className="p-3 bg-lab-bg border border-lab-border rounded-lg space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={persistLocal}
                onChange={(e) => setPersistLocal(e.target.checked)}
                className="w-4 h-4 rounded border-lab-border bg-lab-panel accent-groq-green focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-lab-text font-medium">Persist across browser sessions (localStorage)</span>
            </label>
            <p className="text-[11px] text-lab-dim pl-6 leading-relaxed">
              If unchecked, your key resides only in temporary session storage and will be cleared when you close this browser tab.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-groq-green/10 border border-groq-green/30 rounded-lg text-xs text-groq-green">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            {currentKey ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg border border-red-900/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Disconnect Key
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-lab-muted hover:text-lab-text rounded-lg border border-lab-border hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isValidating || !inputKey.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-groq-green text-black font-semibold text-xs rounded-lg hover:bg-groq-greenHover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-groq-green/10"
              >
                {isValidating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    Verify & Connect
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

