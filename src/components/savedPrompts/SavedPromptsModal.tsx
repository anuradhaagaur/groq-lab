import React, { useState } from 'react';
import { PromptCategory, SavedPrompt } from '../../types';
import { Modal } from '../common/Modal';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  SendHorizontal,
  Tag,
  Filter,
} from 'lucide-react';

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: SavedPrompt[];
  onLoadPrompt: (prompt: SavedPrompt) => void;
  onSavePrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string) => void;
}

export const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  savedPrompts,
  onLoadPrompt,
  onSavePrompt,
  onDeletePrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New / Edit prompt state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<PromptCategory>('custom');
  const [formSystem, setFormSystem] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formTags, setFormTags] = useState('');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'summarization', label: 'Summarization' },
    { id: 'classification', label: 'Classification' },
    { id: 'coding', label: 'Coding' },
    { id: 'reasoning', label: 'Reasoning' },
    { id: 'extraction', label: 'Data Extraction' },
    { id: 'brainstorming', label: 'Brainstorming' },
    { id: 'writing', label: 'Writing' },
    { id: 'custom', label: 'Custom' },
  ];

  const filteredPrompts = savedPrompts.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore
    }
  };

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('custom');
    setFormSystem('');
    setFormUser('');
    setFormTags('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (prompt: SavedPrompt) => {
    setEditingId(prompt.id);
    setFormTitle(prompt.title);
    setFormDesc(prompt.description);
    setFormCategory(prompt.category);
    setFormSystem(prompt.systemPrompt);
    setFormUser(prompt.userPrompt);
    setFormTags(prompt.tags.join(', '));
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUser.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newPrompt: SavedPrompt = {
      id: editingId || `prompt-${Date.now()}`,
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: formCategory,
      systemPrompt: formSystem.trim(),
      userPrompt: formUser.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['Custom'],
      createdAt: Date.now(),
      isPreset: false,
    };

    onSavePrompt(newPrompt);
    setIsFormOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prompt Engineering Library"
      subtitle="Curated starter prompts and your custom saved templates"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lab-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or tags..."
              className="w-full pl-9 pr-3 py-2 bg-lab-panel border border-lab-border rounded-lg text-xs text-lab-text placeholder-lab-dim focus:outline-none focus:border-groq-green"
            />
          </div>

          <button
            onClick={handleOpenCreateForm}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-groq-green text-black font-semibold text-xs rounded-lg hover:bg-groq-greenHover transition-all shrink-0 font-mono shadow-sm shadow-groq-green/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Prompt
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-groq-green/15 text-groq-green border-groq-green/40 font-semibold'
                  : 'bg-lab-panel text-lab-muted border-lab-borderSubtle hover:text-lab-text hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Form Drawer (Create / Edit) */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveForm}
            className="p-4 bg-lab-panel border border-groq-green/40 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-groq-green uppercase tracking-wider font-mono">
                {editingId ? 'Edit Prompt Template' : 'New Prompt Template'}
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs text-lab-dim hover:text-lab-text"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-lab-dim uppercase text-[10px]">Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Support Ticket Sentiment Extractor"
                  className="w-full p-2 bg-lab-bg border border-lab-border rounded text-xs text-lab-text focus:outline-none focus:border-groq-green"
                />
              </div>

              <div className="space-y-1">
                <label className="text-lab-dim uppercase text-[10px]">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PromptCategory)}
                  className="w-full p-2 bg-lab-bg border border-lab-border rounded text-xs text-lab-text focus:outline-none focus:border-groq-green cursor-pointer"
                >
                  <option value="classification">Classification</option>
                  <option value="summarization">Summarization</option>
                  <option value="coding">Coding</option>
                  <option value="reasoning">Reasoning</option>
                  <option value="extraction">Data Extraction</option>
                  <option value="brainstorming">Brainstorming</option>
                  <option value="writing">Writing</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-lab-dim uppercase text-[10px]">Description</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief summary of what this prompt accomplishes..."
                className="w-full p-2 bg-lab-bg border border-lab-border rounded text-xs text-lab-text focus:outline-none focus:border-groq-green"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-lab-dim uppercase text-[10px]">System Prompt (Optional)</label>
              <textarea
                rows={2}
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value)}
                placeholder="Directives or constraints..."
                className="w-full p-2 bg-lab-bg border border-lab-border rounded text-xs font-mono text-lab-text focus:outline-none focus:border-groq-green"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-lab-dim uppercase text-[10px]">User Prompt / Worked Examples *</label>
              <textarea
                rows={4}
                required
                value={formUser}
                onChange={(e) => setFormUser(e.target.value)}
                placeholder="The actual prompt text, including any Zero-shot instructions or Few-shot demonstrations..."
                className="w-full p-2 bg-lab-bg border border-lab-border rounded text-xs font-mono text-lab-text focus:outline-none focus:border-groq-green"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-lab-dim uppercase text-[10px]">Tags (Comma separated)</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="Few-Shot, JSON, Production, NLP"
                className="w-full p-2 bg-lab-bg border border-lab-border rounded text-xs text-lab-text focus:outline-none focus:border-groq-green"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 text-xs text-lab-muted rounded hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-groq-green text-black font-semibold text-xs rounded hover:bg-groq-greenHover"
              >
                Save Prompt
              </button>
            </div>
          </form>
        )}

        {/* Prompts Cards List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
          {filteredPrompts.length === 0 ? (
            <div className="p-8 text-center text-lab-dim text-xs">
              No prompts match your filter criteria.
            </div>
          ) : (
            filteredPrompts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-lab-panel/70 border border-lab-border hover:border-lab-borderBright rounded-xl space-y-3 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-semibold text-lab-text">{p.title}</h4>
                      {p.promptType && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lab-bg text-groq-green border border-groq-green/20">
                          {p.promptType}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-lab-bg text-lab-dim border border-lab-borderSubtle">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-lab-muted leading-relaxed">{p.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyPrompt(p.id, p.userPrompt)}
                      className="p-1.5 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
                      title="Copy prompt text"
                    >
                      {copiedId === p.id ? (
                        <Check className="w-4 h-4 text-groq-green" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {!p.isPreset && (
                      <>
                        <button
                          onClick={() => handleOpenEditForm(p)}
                          className="p-1.5 text-lab-dim hover:text-lab-text rounded hover:bg-white/5 transition-colors"
                          title="Edit prompt"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePrompt(p.id)}
                          className="p-1.5 text-lab-dim hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                          title="Delete prompt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        onLoadPrompt(p);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-groq-green/15 text-groq-green border border-groq-green/30 hover:bg-groq-green hover:text-black font-semibold text-xs rounded-lg transition-all ml-1 font-mono"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      Load
                    </button>
                  </div>
                </div>

                {/* Prompt Snippet Preview */}
                <div className="p-2.5 bg-lab-bg/80 rounded border border-lab-borderSubtle font-mono text-[11px] text-lab-text/90 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                  {p.userPrompt}
                </div>

                {/* Tags */}
                {p.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-lab-dim font-mono">
                    <Tag className="w-3 h-3" />
                    {p.tags.map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-lab-bg border border-lab-borderSubtle">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

