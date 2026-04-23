# Changelog

All notable changes to Sentinel are documented in this file.

---

## [3.1.0] — 2026-04-23

### Added

- **Multi-Provider AI Integration** — Pre-configured support for Kimi (Moonshot AI) and OpenAI. One-click provider switching in Settings with auto-filled URLs and model dropdowns.

- **Kimi (Moonshot AI)** as recommended text provider — Free tier available at platform.kimi.ai. Models: kimi-k2.5, moonshot-v1-128k, moonshot-v1-32k, moonshot-v1-8k.

- **OpenAI** with DALL-E image generation — GPT models for text, DALL-E 3 for article hero images. Models: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo.

- **Custom provider support** — Any OpenAI-compatible endpoint (Ollama, LM Studio, Azure, Groq, Together AI, etc.)

- **Provider-aware Settings UI** — Three provider buttons with auto-fill, model dropdown with provider-specific options, custom model input, provider hints with signup links.

- **Separate image generation config** — Use one provider for text (e.g., Kimi) and another for images (e.g., OpenAI DALL-E). Image API key falls back to text API key if not set.

- **Connection test with provider info** — Test button now shows provider name and model in success message.

- **New API endpoint** — `GET /api/providers` returns all available provider presets with models, URLs, and capabilities.

### Changed

- Settings API now masks API keys (shows first 8 + last 4 chars) instead of full masking
- Settings PUT endpoint skips masked API key values to prevent overwriting with masked strings
- LLM module refactored with provider presets, auto-detection, and separate image generation config

---

## [3.0.0] — 2026-04-23

### Added

- **YouTube SEO Analyzer** — Analyze any YouTube video for SEO performance. Fetches real-time data (views, likes, comments, tags, thumbnail, duration, publish date). Scores title optimization, description quality, tag coverage, and engagement metrics. Results stored for comparison over time. No API key required.

- **Article Generator with AI Image Generation** — Generate SEO-optimized articles powered by any OpenAI-compatible API. Configurable topic, keywords, tone (professional, casual, academic, persuasive, informative), language (DE/EN), and word count (500-5000). Each article includes an AI-generated hero image. Articles stored in database with full content, meta description, and SEO score.

- **Social Media Outreach Bot** — Generate professional outreach campaigns for LinkedIn, Twitter/X, Instagram, Facebook, and Email. Each campaign includes a primary message, 3 follow-up variations, 5 engaging hooks, and platform-specific hashtag suggestions. Respects platform character limits and formatting conventions.

- **Settings Page** — Configure OpenAI-compatible API credentials (API key, base URL, model, image API key, image base URL) with connection testing. Settings stored securely in local SQLite database.

- **4 new database tables** — youtube_analyses, articles, outreach_campaigns, settings

- **15+ new API endpoints** — Full CRUD for YouTube analyses, articles, outreach campaigns, and settings management

- **50+ new i18n translation keys** — All new features fully translated in German and English

### Fixed

- Company cards now correctly display scores from latest scan data
- Portfolio grid and companies list use correct data source for scan results
- YouTube detail view uses polling to wait for analysis completion
- Outreach detail view correctly renders campaign data from database columns
- Settings page correctly maps frontend field names to backend database keys
- Sidebar section labels properly translate when switching languages

### Changed

- Database schema expanded from 4 to 8 tables
- SKILL.md rewritten with all new API endpoints and agent workflows
- README.md expanded with full documentation for all new features

---

## [2.1.0] — 2026-04-22

### Fixed

- **CRITICAL:** Server no longer crashes during website scans (SQL quoting bug in createScan)
- **CRITICAL:** Global error handler prevents any unhandled exception from killing the server
- Improved API error responses with proper try/catch on every endpoint
- Fixed Content-Type header handling for multipart form uploads (document upload)
- Fixed updateCompany to support partial updates (no longer requires all fields)

### Added

- Cross-platform Puppeteer launch configuration (macOS Mac Mini M1/M2/M4, Linux, Windows)
- macOS Gatekeeper troubleshooting in README and SKILL.md
- Cross-platform `npm run reset` script
- `npm run dev` alias for `npm start`
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers
- Scan failures gracefully recorded as `status: 'failed'` instead of crashing

### Improved

- README with Mac Mini specific setup instructions
- SKILL.md with troubleshooting section and macOS notes
- Better console logging with `[Scan]`, `[Auto-Learn]`, `[API Error]` prefixes

---

## [2.0.0] — 2026-04-22

### Added

- **Bilingual Interface (DE/EN)** — Full German/English interface with one-click toggle. German is default. 150+ translation keys. Language preference persists in localStorage.

- **Demo Companies** — Two pre-seeded German companies with realistic scan results, discrepancies, and documents. Meridian Ventures GmbH (Score 68, 8 issues) and NovaTech Solutions UG (Score 87, fully compliant).

- **Seed Script** — `npm run seed` loads demo data. `npm run reset` reinitializes with fresh demo companies.

- **Seed API Endpoint** — `POST /api/seed-demo` for frontend-triggered demo data creation.

### Changed

- README rewritten as comprehensive product page
- SKILL.md rewritten for OpenClaw/Manus agent integration

---

## [1.0.0] — 2026-04-20

### Added

- **Portfolio Dashboard** — Executive dark-theme dashboard with portfolio statistics, company cards with score rings, and discrepancy alert banners.
- **Automated Website Scanning** — Puppeteer-based crawler evaluating Meta, Content, Technical, and Legal dimensions (each 0-100).
- **Legal Compliance Detection** — Impressum (with completeness scoring), Datenschutzerklaerung, AGB, and Cookie-Banner detection.
- **Discrepancy Detection** — Fuzzy matching of stored company details against live Impressum data with CRITICAL/WARNING/INFO severity.
- **Auto-Learn** — Automatically populates empty company fields from scanned Impressum pages.
- **Fix Prompt Generator** — One-click AI-ready prompt generation with all issues and fix instructions.
- **Document Management** — Upload and categorize documents per company.
- **Company Details Management** — Full CRUD for registration details.
- **Portfolio-Wide Scanning** — Scan all companies at once.
- **SPA Architecture** — Single-page application with client-side routing.
- **SQLite Storage** — All data stored locally in a single file.
