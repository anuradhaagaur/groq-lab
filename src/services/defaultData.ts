import { GroqModel, SavedPrompt } from '../types';

export const DEFAULT_GROQ_MODELS: GroqModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    developer: 'Meta',
    contextWindow: 131072,
    maxOutputTokens: 32768,
    description: 'Most versatile open weights model. Flagship capabilities in reasoning, coding, and multilingual tasks.',
    speed: '~300 tps',
    category: 'versatile',
    supportsSystemPrompt: true,
    supportsStreaming: true,
    supportsTopP: true,
    supportsPenalties: true,
    isAvailable: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    developer: 'Meta',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    description: 'Blazing fast inference (~800+ tokens/sec). Ideal for real-time applications, summarization, and lightweight tasks.',
    speed: '~800 tps',
    category: 'speed',
    supportsSystemPrompt: true,
    supportsStreaming: true,
    supportsTopP: true,
    supportsPenalties: true,
    isAvailable: true,
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    developer: 'DeepSeek / Meta',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    description: 'Deep reasoning distillation model with step-by-step thinking capability. Excellent for math, science, and formal proofs.',
    speed: '~280 tps',
    category: 'reasoning',
    supportsSystemPrompt: true,
    supportsStreaming: true,
    supportsTopP: true,
    supportsPenalties: false,
    isAvailable: true,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (MoE)',
    developer: 'Mistral AI',
    contextWindow: 32768,
    maxOutputTokens: 4096,
    description: 'Mixture of Experts architecture. High throughput and strong coding performance with 32k context.',
    speed: '~500 tps',
    category: 'versatile',
    supportsSystemPrompt: true,
    supportsStreaming: true,
    supportsTopP: true,
    supportsPenalties: true,
    isAvailable: true,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B IT',
    developer: 'Google',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    description: 'Google instruction-tuned 9B model. High accuracy per parameter with efficient memory footprint.',
    speed: '~600 tps',
    category: 'speed',
    supportsSystemPrompt: true,
    supportsStreaming: true,
    supportsTopP: true,
    supportsPenalties: true,
    isAvailable: true,
  },
  {
    id: 'llama-guard-3-8b',
    name: 'Llama Guard 3 8B',
    developer: 'Meta',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    description: 'Safety classification model designed to detect harmful, policy-violating, or unsafe input/output prompts.',
    speed: '~750 tps',
    category: 'safety',
    supportsSystemPrompt: false,
    supportsStreaming: true,
    supportsTopP: false,
    supportsPenalties: false,
    isAvailable: true,
  },
];

export interface SystemPromptPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'default',
    name: 'Helpful AI Assistant',
    description: 'Balanced, thoughtful, and articulate assistant.',
    prompt: 'You are a helpful, accurate, and concise AI assistant powered by Groq high-speed inference. Provide clear, direct answers with precision.',
  },
  {
    id: 'senior-engineer',
    name: 'Senior Systems Architect',
    description: 'Focuses on production architecture, edge cases, and maintainable code.',
    prompt: 'You are a Principal Software Architect. Focus on robust, production-grade solutions, low latency, maintainability, type safety, and error handling. Explain architectural tradeoffs with clarity.',
  },
  {
    id: 'json-extractor',
    name: 'Strict JSON Extractor',
    description: 'Outputs only valid, sanitized JSON matching requested schemas.',
    prompt: 'You are a strict data extraction engine. You MUST output ONLY valid JSON without any markdown fencing, preamble, or conversational filler. Strictly conform to the requested schema.',
  },
  {
    id: 'concise-analyst',
    name: 'Concise Technical Analyst',
    description: 'Ultra-concise, high signal-to-noise ratio analysis.',
    prompt: 'You are a ruthless technical analyst. Provide high-density, low-fluff answers. Use bullet points, bold key terms, and omit polite pleasantries.',
  },
  {
    id: 'socratic-debugger',
    name: 'Socratic Code Mentor',
    description: 'Guides problem-solving through targeted questions and hints.',
    prompt: 'You are a Socratic programming mentor. Instead of writing the complete answer immediately, guide the developer by pointing out root causes and asking targeted diagnostic questions.',
  },
];

export const STARTER_PROMPTS: SavedPrompt[] = [
  {
    id: 'prompt-sentiment-few-shot',
    title: 'Customer Sentiment & Action Classifier',
    description: 'Few-shot classifier extracting sentiment polarity and recommended support team action.',
    category: 'classification',
    systemPrompt: 'You are an automated customer operations classifier. Follow the demonstration format precisely.',
    userPrompt: `Classify the customer support message into Sentiment (Positive, Neutral, Negative, Urgent) and Action (Refund, BugReport, TechSupport, Escalate).

Input: "I have been locked out of my account for 4 hours and my team cannot deploy our release."
Sentiment: Urgent
Action: Escalate

Input: "The new UI update looks fantastic, thank you team!"
Sentiment: Positive
Action: None

Input: "When I click export to CSV, the table downloads an empty 0kb file."
Sentiment: Negative
Action: BugReport

Input: "Could you tell me if you support SAML SSO on the enterprise plan?"
Sentiment: Neutral
Action: TechSupport

Input: "Billing charged my credit card twice for this month's renewal!"
Sentiment:`,
    suggestedModel: 'llama-3.3-70b-versatile',
    promptType: 'FEW-SHOT',
    tags: ['Few-Shot', 'Classification', 'Support', 'NLP'],
    createdAt: Date.now() - 86400000 * 3,
    isPreset: true,
  },
  {
    id: 'prompt-executive-summary',
    title: 'Executive Meeting Memo Summarizer',
    description: 'Zero-shot high-density summarization with key decisions, blockers, and assigned action items.',
    category: 'summarization',
    systemPrompt: 'You are an executive Chief of Staff. Synthesize lengthy transcripts into crisp, decision-oriented summaries.',
    userPrompt: `Please summarize the following product sync into:
1. Executive Summary (max 2 sentences)
2. Decisions Reached
3. Identified Blockers & Risks
4. Action Items (Owner | Deadline | Deliverable)

Meeting Transcript:
"Alex: We reviewed the benchmark numbers for the migration to Groq LPU inference. Latency dropped from 1400ms down to 180ms on the 70B model. Cost per million output tokens is approximately 75% lower than our legacy proprietary provider.
Priya: That is great, but we still need to audit our token counting telemetry and verify rate limit quotas before the general rollout next Tuesday.
Marcus: I've updated the client retry backoff logic to handle 429 status codes gracefully. I will push that PR by end of day today.
Alex: Approved. Marcus owns the retry PR, Priya will finish the quota audit by Friday 3 PM. We will proceed with 10% canary traffic on Monday."`,
    suggestedModel: 'llama-3.1-8b-instant',
    promptType: 'ZERO-SHOT',
    tags: ['Summarization', 'Executive', 'Productivity'],
    createdAt: Date.now() - 86400000 * 2,
    isPreset: true,
  },
  {
    id: 'prompt-distributed-lock',
    title: 'TypeScript Distributed Lock with Redis',
    description: 'Zero-shot coding task generating a production-grade Redlock / Redis mutex with lease renewal.',
    category: 'coding',
    systemPrompt: 'You are an expert distributed systems engineer writing production TypeScript.',
    userPrompt: `Implement a production-ready Distributed Lock class in TypeScript using ioredis.

Requirements:
1. Safe acquisition with TTL and unique random lock token (preventing accidental release by stale holders).
2. Atomic release using a Lua script.
3. Automatic background heartbeat / lease renewal while the protected callback is executing.
4. Comprehensive error handling and clean TypeScript interfaces.`,
    suggestedModel: 'llama-3.3-70b-versatile',
    promptType: 'ZERO-SHOT',
    tags: ['TypeScript', 'Redis', 'Concurrency', 'Distributed Systems'],
    createdAt: Date.now() - 86400000 * 1,
    isPreset: true,
  },
  {
    id: 'prompt-reasoning-counterfactual',
    title: 'Complex Multi-Hop Counterfactual Reasoning',
    description: 'Test model reasoning by altering a historical constraint and evaluating cascades.',
    category: 'reasoning',
    systemPrompt: 'You are a cognitive reasoning engine. Think step-by-step through first-order and second-order causal effects.',
    userPrompt: `Analyze the following counterfactual scenario with rigorous step-by-step deduction:

Premise: Suppose the speed of light in vacuum was reduced to 300 meters per second (approx the speed of sound today), while human perception and chemical reaction rates remained unchanged.

Deduce the consequences for:
1. Everyday visual perception and Doppler shift while walking or driving.
2. Special relativistic effects (time dilation and Lorentz contraction) during standard human locomotion.
3. Computer processor clock speeds and telecommunications.`,
    suggestedModel: 'deepseek-r1-distill-llama-70b',
    promptType: 'ZERO-SHOT',
    tags: ['Reasoning', 'Physics', 'DeepSeek-R1', 'Deduction'],
    createdAt: Date.now() - 43200000,
    isPreset: true,
  },
  {
    id: 'prompt-invoice-extraction',
    title: 'One-Shot Invoice to Structured JSON',
    description: 'One-shot extraction prompt demonstrating receipt parsing into schema-valid JSON.',
    category: 'extraction',
    systemPrompt: 'You are an automated optical data parser. Return only valid JSON adhering to the demonstrated schema.',
    userPrompt: `Extract invoice entities from raw receipt text into JSON format.

Example 1:
Input:
ACME Cloud Services
Invoice #: INV-2024-998
Date: 2024-10-15
Items:
- Compute Instance (t4g.xlarge): $120.00
- Bandwidth (500GB): $45.00
Tax: $13.20
Total: $178.20

Output:
{
  "vendor": "ACME Cloud Services",
  "invoiceNumber": "INV-2024-998",
  "date": "2024-10-15",
  "lineItems": [
    { "description": "Compute Instance (t4g.xlarge)", "amount": 120.00 },
    { "description": "Bandwidth (500GB)", "amount": 45.00 }
  ],
  "tax": 13.20,
  "total": 178.20
}

Now parse this invoice:
Input:
Apex Microelectronics Ltd
Invoice Number: APX-88219
Issued Date: Nov 18, 2024
Charges:
1. 10x Groq LPU PCIe Accelerator Cards @ $1,450.00 each -> $14,500.00
2. Enterprise Rack Enclosure 4U: $1,200.00
Sales Tax (8.25%): $1,295.25
Grand Total: $16,995.25

Output:`,
    suggestedModel: 'llama-3.3-70b-versatile',
    promptType: 'ONE-SHOT',
    tags: ['One-Shot', 'JSON', 'Data Extraction', 'Schema'],
    createdAt: Date.now() - 21600000,
    isPreset: true,
  },
  {
    id: 'prompt-architecture-brainstorm',
    title: 'High-Throughput RAG Architecture Ideation',
    description: 'Brainstorm edge caching, vector quantization, and speculative decoding techniques.',
    category: 'brainstorming',
    systemPrompt: 'You are a staff infrastructure engineer specializing in generative AI inference stacks.',
    userPrompt: `Brainstorm 5 innovative architectural strategies to achieve sub-50ms Time-to-First-Token (TTFT) for a global enterprise RAG system querying over 10 million vector embeddings.

For each strategy, provide:
- Core Mechanism
- Projected Latency Reduction
- Primary Implementation Trade-off or Complexity`,
    suggestedModel: 'llama-3.3-70b-versatile',
    promptType: 'ZERO-SHOT',
    tags: ['Brainstorming', 'RAG', 'Vector Search', 'Architecture'],
    createdAt: Date.now() - 10800000,
    isPreset: true,
  },
];

