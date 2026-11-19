# GROQ LAB — Interactive LLM Playground

**GROQ LAB** is a high-performance AI experimentation playground powered by the Groq API and ultra-low latency LPU inference.

Designed for AI engineers, researchers, and prompt designers, GROQ LAB bridges the gap between chat consoles and formal prompt engineering environments. It gives you complete control over generation parameters, live telemetry on token throughput, side-by-side model arena benchmarking, and an automated structural **Prompt Type Analyzer** (Zero-shot, One-shot, and Few-shot).

---

## Key Features

### 1. Bring Your Own Key (BYOK) Architecture
- Connect your personal Groq API key securely (`gsk_...`).
- Choose between **Session Storage** (cleared automatically when the browser tab is closed) or **Local Persistence** (opt-in storage across sessions).
- Direct browser-to-API inference (`api.groq.com/openai/v1`): your key is never proxied, logged, or sent to any intermediary server.
- Key disconnect and wipe option available at any time.

### 2. Dynamic Model Support
- Dynamic discovery of active Groq models via `/openai/v1/models` with curated metadata fallbacks:
  - **Llama 3.3 70B Versatile** (Meta, 128k context)
  - **Llama 3.1 8B Instant** (Meta, ~800+ tokens/sec)
  - **DeepSeek R1 Distill Llama 70B** (DeepSeek/Meta, deep reasoning)
  - **Mixtral 8x7B 32k** (Mistral AI, MoE)
  - **Gemma 2 9B IT** (Google)
  - **Llama Guard 3 8B** (Safety evaluation)

### 3. Model Control Studio
- **Temperature** (0.0 to 2.0 with live numeric stepper and impact guidance)
- **Max Output Tokens** (model-tailored limits up to 32k tokens)
- **Top-P (Nucleus Sampling)**
- **Frequency & Presence Penalties** (automatically enabled/disabled based on model support)
- **Real-Time Streaming Toggle** (instant Server-Sent Events)
- **Expandable System Prompt Editor** with 5 pre-configured personas (Senior Architect, Strict JSON Extractor, Concise Technical Analyst, Socratic Debugger, Balanced Assistant) and custom preset saving.

### 4. Structural Prompt Type Analyzer
Automatically inspects the syntactic structure of prompt context and classifies it into:
- **ZERO-SHOT**: Task instructions with no worked demonstrations.
- **ONE-SHOT**: Exactly one worked input-output demonstration.
- **FEW-SHOT**: Two or more worked demonstrations conditioning the model.
- **UNCLEAR**: Ambiguous cues or incomplete examples.

*Click the badge on any assistant response to open the **Prompt Engineering Inspector**, revealing extracted input-output snippets, matching patterns, and engineering recommendations.*

### 5. Prompt Lab (Few-Shot Studio)
- Dedicated workspace to construct and test Zero-shot, One-shot, and Few-shot prompts.
- Interactive demonstration cards with dynamic input/output blocks.
- Real-time constructed prompt preview and instant token estimation.
- Direct execution and "Transfer to Playground" integration.

### 6. Model Arena (Side-by-Side Benchmark)
- Dispatch identical prompts simultaneously to two models (e.g. `llama-3.3-70b-versatile` vs `llama-3.1-8b-instant`).
- Side-by-side real-time streaming.
- Head-to-head metrics scorecard: Latency (ms), Throughput (tok/s), and Token totals.
- Isolated error boundaries so failure in one model does not disrupt the other.

### 7. Real Token Telemetry & Insights
- Collapsible response telemetry below every assistant message.
- Prompt tokens, output completion tokens, total tokens, throughput (tokens/sec), and latency (ms) derived directly from official Groq API usage headers.
- Snapshot of parameters used for generation.

### 8. Prompt Library & Conversation Management
- Curated starter prompts across 7 domains: Summarization, Classification, Coding, Brainstorming, Reasoning, and Data Extraction.
- Create, edit, tag, search, and delete custom prompts.
- Full local conversation history with inline renaming, search, clear, and Markdown export.

---

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS with dark developer-console palette
- **Animations:** Framer Motion (with `prefers-reduced-motion` compliance)
- **Icons:** Lucide React
- **Markdown & Code:** React Markdown, remark-gfm, custom code block syntax renderer
- **API:** Official Groq API / Server-Sent Events (SSE) streaming

---

## Getting Started Locally

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- A Groq API Key from [console.groq.com/keys](https://console.groq.com/keys)

### Installation

```bash
# Clone the repository
git clone <repo-url> groq-lab
cd groq-lab

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## Deployment to Vercel

GROQ LAB is configured for instant deployment on Vercel:

1. Push your code to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
3. Select this repository.
4. Framework Preset will auto-detect as **Vite**.
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy**.

*No server environment variables are mandatory because users connect their own Groq API keys via the BYOK workflow.*

---

## Security & BYOK Architecture

- **Zero Server Proxying:** Requests are sent directly from the client's browser to `https://api.groq.com/openai/v1`.
- **No Hardcoded Keys:** GROQ LAB contains no embedded credentials or telemetry backdoors.
- **Local Sandbox:** API keys are stored only in client-side `sessionStorage` or opted-in `localStorage`. You can disconnect and wipe your key at any time with one click.

