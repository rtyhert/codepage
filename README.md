# ✦ CodePage  
**Turn your ideas into privately deployed code.**

CodePage is an open‑source, AI‑powered full‑stack page builder that converts natural language into production‑ready **HTML, React JSX, or Vue 3 SFC** — instantly. Unlike cloud‑only tools, CodePage keeps your code and data **100% local**, with optional Ollama support for offline use.

**Why CodePage?**  
Because AI‑generated code should be *reliable*, *editable*, and *yours*. We don't just generate—we **validate and auto‑heal**. Every output runs through a static check (HTML tag balance, CSS brace matching, JS parenthesis validation) and, if needed, the AI fixes it automatically. No more "looks good but breaks on run."

**Go beyond pages.**  
The built‑in **Agentic Orchestrator** plans, schemas, builds backends, crafts frontends, and integrates everything—all in a five‑stage pipeline (Planner → Schema → Backend → Frontend → Integrator). You get a full‑stack project from a single sentence, with real‑time progress updates.

**Designed for developers, built for privacy.**  
- 🧩 **Three outputs** – HTML, React, or Vue, with live preview and visual editing.  
- 🔒 **Data stays local** – works with OpenAI‑compatible APIs *or* Ollama (no keys required).  
- 📦 **Project management** – group pages, drag‑and‑drop, history snapshots, template import/export.  
- 🌐 **Bilingual UI** – Chinese / English, switch instantly.  
- 🐳 **Zero‑hassle setup** – one‑click scripts (Windows/Linux/macOS) and Docker compose included.

**Tech stack:** React 19 + Vite + TypeScript (frontend), Express + Prisma + SQLite (backend), with 13+ LLM providers pre‑integrated (DeepSeek, OpenAI, Moonshot, Qwen, GLM, MiniMax, Ollama, and more).

**MIT licensed** – free to use, modify, and deploy anywhere.

👉 Get started in 30 seconds:  
```bash
git clone https://github.com/your-org/codepage
cd codepage && bash scripts/setup.sh   # or .\scripts\setup.ps1 on Windows
npm run dev
