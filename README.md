# Sentinel — Enterprise SEO & Compliance Intelligence Platform

> The all-in-one compliance monitoring dashboard for portfolio managers, holding companies, and agencies managing multiple company websites under German and EU law.

Sentinel runs entirely on your local machine. No cloud subscriptions, no data leaving your network, no recurring fees. One installation, unlimited companies, full control.

---

## Why Sentinel

Managing a portfolio of company websites means staying on top of SEO health, legal compliance (Impressum, Datenschutz, AGB, Cookie-Banner), and data integrity across every entity. Sentinel automates this entire workflow into a single executive dashboard.

| Challenge | How Sentinel Solves It |
|---|---|
| Manually checking each website for legal pages | Automated scanning detects Impressum, Privacy Policy, AGB, Cookie Banner |
| Outdated company details on live websites | Discrepancy detection compares your records against live Impressum data |
| No overview of SEO health across the portfolio | Portfolio-wide scoring with Meta, Content, Technical, and Legal dimensions |
| Fixing issues requires briefing developers | One-click Fix Prompt generates a complete AI-ready instruction set |
| Scattered company documents | Built-in document management per company |
| Compliance audits take days | Full portfolio scan in minutes with exportable results |

---

## Features

**Portfolio Management** — Add and manage companies with full registration details: Handelsregisternummer, Rechtsform, Registergericht, Adresse, Geschaeftsfuehrer, USt-IdNr., Stammkapital, and more.

**Automated Website Scanning** — Puppeteer-based crawler checks meta tags, heading structure, page speed, HTTPS, structured data, and all legal compliance pages. Scores four dimensions: Meta, Content, Technical, Legal.

**Legal Compliance (German Law Focus)** — Detects Impressum (with completeness scoring), Datenschutzerklaerung, AGB, and Cookie-Banner with granular checks for reject-all, granular choices, and necessary-only options.

**Discrepancy Detection** — Compares stored company details against live website Impressum data. Flags mismatches in company name, address, directors, registration number, VAT, email, phone, jurisdiction, and company type. Severity levels: CRITICAL, WARNING, INFO.

**Auto-Learn** — Automatically populates empty company detail fields from scanned Impressum pages. Never overwrites existing data.

**Fix Prompt Generator** — One-click generates a comprehensive prompt containing all issues, company context, severity levels, and fix instructions. Copy and paste directly into any AI agent to fix everything at once.

**Document Management** — Upload and categorize documents per company: incorporation, governance, tax, legal, financial, other.

**Bilingual Interface** — Full German/English interface with one-click toggle. German default, 150+ translation keys. Language preference persists across sessions.

**Demo Companies** — Two pre-seeded German companies with realistic scan results, discrepancies, and documents for immediate exploration.

---

## Requirements

- **Node.js 18+** (download from https://nodejs.org)
- Any macOS, Linux, or Windows machine

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/jackagent/seo-optimizer-local.git
cd seo-optimizer-local

# 2. Install dependencies
npm install

# 3. Initialize the database
npm run setup

# 4. Seed demo companies (recommended for first run)
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser. Two demo companies are ready to explore.

---

## Usage

1. **Explore the demo** — Meridian Ventures GmbH (Score 68, 8 issues, 1 discrepancy) and NovaTech Solutions UG (Score 87, fully compliant) demonstrate all features
2. **Add your companies** — Enter company name and website URL, optionally sector and hosting platform
3. **Scan** — Single company or entire portfolio at once
4. **Review** — Check scores, issues, legal compliance status, and discrepancies
5. **Fix** — Generate AI fix prompts and copy to your preferred AI agent
6. **Document** — Upload and categorize company documents
7. **Monitor** — Red alerts when database and website data diverge

---

## OpenClaw / Manus Skill Installation

Sentinel works as a Manus/OpenClaw skill. After installation, the agent can start the server, interact with the API, and open the dashboard in the browser.

```bash
# The skill auto-installs via OpenClaw
cd ~/.openclaw/workspace/skills/sentinel-seo-compliance && npm install && npm run setup && npm run seed && npm start
```

See `SKILL.md` for the full API reference and agent integration guide.

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the server (default port 3000) |
| `npm run setup` | Initialize the SQLite database |
| `npm run seed` | Seed two demo companies with sample data |
| `npm run reset` | Delete all data and reinitialize with demo data |

---

## Configuration

Set the `PORT` environment variable to change the default port:

```bash
PORT=8080 npm start
```

---

## Data Storage

All data stays on your machine. The SQLite database is stored at `data/seo-optimizer.db`. Uploaded documents are saved in `data/uploads/`. No external services, no telemetry, no data transmission.

---

## File Structure

```
sentinel-seo-compliance/
  server/
    index.js          — Express server with all API routes
    db.js             — SQLite database helpers
    scanner.js        — Puppeteer-based website scanner
    discrepancy.js    — Discrepancy detection engine
    setup-db.js       — Database initialization
    seed-demo.js      — Demo company seeder
  public/
    index.html        — Single-page app shell
    css/style.css     — Executive dark-theme dashboard
    js/app.js         — Frontend application (SPA routing, i18n)
    js/i18n.js        — German/English translations (150+ keys)
  data/               — Created on first run (gitignored)
    seo-optimizer.db  — SQLite database
    uploads/          — Uploaded documents
  SKILL.md            — OpenClaw/Manus agent integration guide
```

---

## Technical Notes

- Scanning uses Puppeteer (headless Chrome). First scan may download Chromium automatically.
- Scans run sequentially to avoid resource conflicts on local machines.
- The discrepancy detector uses fuzzy matching to compare stored details against live Impressum data.
- Auto-learn only fills empty fields and never overwrites existing values.
- The Fix Prompt includes company context, all issues with severity, and specific fix instructions.

---

## License

Proprietary. All rights reserved by EX Venture.
