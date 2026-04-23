# Changelog

All notable changes to Sentinel are documented in this file.

---

## [2.1.0] — 2026-04-22

### Fixed

- **CRITICAL:** Server no longer crashes during website scans (SQL quoting bug in createScan)
- **CRITICAL:** Global error handler prevents any unhandled exception from killing the server
- Improved API error responses with proper try/catch on every endpoint
- Fixed Content-Type header handling for multipart form uploads (document upload)

### Added

- Cross-platform Puppeteer launch configuration (macOS Mac Mini M1/M2/M4, Linux, Windows)
- macOS Gatekeeper troubleshooting in README and SKILL.md
- Cross-platform `npm run reset` script (no longer requires Unix `rm -rf`)
- `npm run dev` alias for `npm start`
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers
- Scan failures are now gracefully recorded as `status: 'failed'` instead of crashing

### Improved

- README with Mac Mini specific setup instructions
- SKILL.md with troubleshooting section and macOS notes
- Better console logging with `[Scan]`, `[Auto-Learn]`, `[API Error]` prefixes

---

## [2.0.0] — 2026-04-22

### Added

- **Bilingual Interface (DE/EN)** — Full German/English interface with one-click toggle in the sidebar footer. German is the default language. Over 150 translation keys cover every label, button, tab, modal, and message. Language preference persists in localStorage across sessions.

- **Demo Companies** — Two pre-seeded German companies with realistic scan results, discrepancies, and documents for immediate exploration after installation. Meridian Ventures GmbH (Score 68, 8 issues, 1 discrepancy) and NovaTech Solutions UG (Score 87, fully compliant).

- **Seed Script** — `npm run seed` loads demo data. `npm run reset` deletes all data and reinitializes with fresh demo companies.

- **Seed API Endpoint** — `POST /api/seed-demo` allows triggering demo data creation from the frontend.

### Changed

- README rewritten as a comprehensive product page with full API reference, database schema documentation, troubleshooting guide, and usage instructions.
- SKILL.md rewritten for OpenClaw/Manus agent integration with proper frontmatter, setup commands, and API reference.

---

## [1.0.0] — 2026-04-20

### Added

- **Portfolio Dashboard** — Executive dark-theme dashboard showing portfolio-wide statistics, company cards with score rings, and discrepancy alert banners.

- **Automated Website Scanning** — Puppeteer-based crawler evaluating four dimensions: Meta, Content, Technical, and Legal. Each scored 0-100 with weighted overall score.

- **Legal Compliance Detection** — Automated detection of Impressum (with completeness scoring), Datenschutzerklaerung, AGB, and Cookie-Banner (with granular checks for reject-all, granular choices, and necessary-only options).

- **Discrepancy Detection** — Compares stored company details against live Impressum data using fuzzy matching. Flags mismatches in company name, address, directors, registration number, VAT, email, phone, jurisdiction, and company type with CRITICAL/WARNING/INFO severity levels.

- **Auto-Learn** — Automatically populates empty company detail fields from scanned Impressum pages. Never overwrites existing data.

- **Fix Prompt Generator** — One-click generation of comprehensive AI-ready prompts containing all issues, company context, severity levels, and specific fix instructions.

- **Document Management** — Upload and categorize documents per company with categories: incorporation, governance, tax, legal, financial, other.

- **Company Details Management** — Full CRUD for company registration details: Handelsregisternummer, Rechtsform, Registergericht, Adresse, Geschaeftsfuehrer, USt-IdNr., Stammkapital, and more.

- **Portfolio-Wide Scanning** — Scan all companies at once with sequential processing.

- **SPA Architecture** — Single-page application with client-side routing, no page reloads.

- **SQLite Storage** — All data stored locally in a single SQLite file. No external database required.
