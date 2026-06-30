# Contributing to CodePage

Thank you for considering contributing to CodePage! We welcome contributions of all kinds: bug fixes, new features, documentation, translations, and template additions.

> **👋 First time here?** Run the project locally in 30 seconds:
> ```bash
> git clone https://github.com/your-org/codepage.git
> cd codepage
> bash scripts/setup.sh    # Linux/macOS — or .\scripts\setup.ps1 on Windows
> npm run dev
> ```
> Then open http://localhost:5173. See [Development Setup](#development-setup) for details.

## Code of Conduct

By participating, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### 1. Reporting Bugs

Open a [Bug Report](https://github.com/your-org/codepage/issues/new?template=bug_report.md) with:
- Clear steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, deployment method)
- LLM provider and model if relevant

### 2. Suggesting Features

Open a [Feature Request](https://github.com/your-org/codepage/issues/new?template=feature_request.md) with:
- The problem you're trying to solve
- Your proposed solution
- Any alternative approaches considered

### 3. Submitting Code Changes

#### Branch Naming

Use descriptive branch names with a prefix:

| Prefix | Purpose |
|--------|---------|
| `fix/` | Bug fixes |
| `feat/` | New features |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring |
| `templates/` | Template additions |

Examples: `fix/history-limit`, `feat/template-export`, `docs/readme-update`

#### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`

Examples:
```
feat: add template import/export
fix: persist LLM config across server restarts
docs: add FAQ section to README
```

#### Pull Request Process

1. Fork the repository and create your branch from `main`
2. Make your changes following the existing code style
3. Test your changes thoroughly
4. Ensure TypeScript compiles without errors
5. Submit a PR with a clear title and description
6. Reference any related issues

### 4. Adding Templates

We welcome community-contributed templates! Templates help other users get started faster.

**Option A: Built-in templates** (included for all users)
Add to the `BUILTIN_TEMPLATES` array in `client/src/utils/helpers.ts`:

```typescript
{ name: 'Your Template', prompt: 'A clear description of what this template generates' }
```

**Option B: Community template (recommended for first-timers)**
1. Use the UI's 📤 Export button to save your template as JSON
2. Open a [Template Submission](https://github.com/your-org/codepage/issues/new?template=template_submission.md) issue
3. Paste the JSON and a screenshot
4. Maintainers will review and add it to `docs/templates/`

**Option C: JSON sharing**
Export templates as JSON from the UI and share in GitHub Discussions.

### 5. Adding a New LLM Provider

LLM providers are configured via the UI presets. Add yours in the `PRESETS` array in `client/src/utils/helpers.ts`:

```typescript
{ name: 'Your Provider', url: 'https://api.provider.com/v1/chat/completions', auth: 'Bearer', model: 'recommended-model' },
```

The server-side adapter in `server/src/utils/llm.ts` supports any OpenAI-compatible API out of the box. If the provider uses a non-standard auth scheme, extend `buildAuthHeaders()` in that file.

### 6. Adding a New Language

1. Create `client/src/locales/{lang}.json` with translated keys following the structure of `en.json`
2. Register it in `client/src/i18n.ts` under the `resources` object
3. Add the language option in `client/src/components/Header.tsx` in the `LANGUAGES` array

## Development Setup

```bash
# Clone and install
git clone https://github.com/your-org/codepage.git
cd codepage

# Option A: One-click script (recommended)
bash scripts/setup.sh          # Linux/macOS
.\scripts\setup.ps1            # Windows PowerShell

# Option B: Manual setup
cd server && npm install && cd ../client && npm install && cd ..
cd server && npx prisma generate && npx prisma db push && cd ..

# Start dev servers
npm run dev
```

## Code Style

- **TypeScript** throughout (strict mode)
- **React 19** with function components and hooks
- **Inline styles** (no CSS-in-JS libraries)
- **Simple class-based store** for state management
- Prefer readability over brevity

## Project Structure

```
codepage/
├── client/          # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/   # UI components
│       ├── stores/       # State management
│       ├── types/        # TypeScript definitions
│       └── utils/        # API client & helpers
├── server/          # Express backend (TypeScript)
│   ├── prisma/      # Database schema & migrations
│   └── src/
│       ├── routes/  # API route handlers
│       └── utils/   # LLM provider adapter
├── docker/          # Container deployment
└── .github/         # Issue templates
```

## Questions?

Open a [Discussion](https://github.com/your-org/codepage/discussions) or ask in your PR comments.
