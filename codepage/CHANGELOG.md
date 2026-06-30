# Changelog

All notable changes to CodePage are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-27

### Added

- Initial public release
- AI code generation via LLM (multi-provider: DeepSeek, OpenAI, MoonShot, etc.)
- Live preview for generated HTML
- Visual editor with structure/style/script split
- Multi-format support: HTML, React (JSX), Vue 3 (SFC)
- Project management (CRUD for projects and pages)
- Generation history with auto-cleanup
- Quick-start templates (Dark Login, Responsive Nav, Product Card, etc.)
- Style tags (Dark, Responsive, Tailwind, Animated)
- Code tools: format, minify, copy, download
- Multi-view preview: desktop and mobile
- Settings panel with provider presets
- Docker support for production deployment
- SQLite database (zero external dependencies)
- MIT License

### Changed in 1.0.0

- **Config persistence**: LLM configuration is now persisted to `server/prisma/llm-config.json` across server restarts
- **Configurable history limit**: `HISTORY_MAX` env var controls max history entries (default 200)
- **User preferences**: Default format, preview mode, and editor tab are persisted via localStorage
- **Template import/export**: Export templates as JSON, import from JSON (built-in and custom)
- **Custom templates**: User-imported templates stored in localStorage, merged with built-in templates
- **AbortController**: Generation requests can be cancelled mid-flight with a red Cancel button
- **Retry button**: When generation fails, a Retry button appears to quickly re-attempt with the same prompt
- **GitHub templates**: Bug report and feature request issue templates
- **CONTRIBUTING.md**: Contribution guidelines for the open-source community
- **CHANGELOG.md**: Version history tracking
- **Comprehensive README**: Usage guide, FAQ, API reference, project structure documentation
- AI code generation via LLM (multi-provider: DeepSeek, OpenAI, MoonShot, etc.)
- Live preview for generated HTML
- Visual editor with structure/style/script split
- Multi-format support: HTML, React (JSX), Vue 3 (SFC)
- Project management (CRUD for projects and pages)
- Generation history with auto-cleanup
- Quick-start templates (Dark Login, Responsive Nav, Product Card, etc.)
- Style tags (Dark, Responsive, Tailwind, Animated)
- Code tools: format, minify, copy, download
- Multi-view preview: desktop and mobile
- Settings panel with provider presets
- Docker support for production deployment
- SQLite database (zero external dependencies)
- MIT License
