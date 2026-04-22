<p align="center">
  <h1 align="center">Sentinel</h1>
  <p align="center"><strong>Enterprise SEO & Compliance Intelligence Platform</strong></p>
  <p align="center">
    Protect your portfolio from legal risk. Monitor SEO health, legal compliance, and data integrity across all your company websites — from a single executive dashboard.
  </p>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> · <a href="#features">Features</a> · <a href="#api-reference">API Reference</a> · <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## The Problem

If you manage a portfolio of companies — as a holding, agency, family office, or advisory firm — every single website is a legal liability. In Germany and the EU, a missing Impressum, an outdated privacy policy, or a non-compliant cookie banner can trigger fines and cease-and-desist letters (Abmahnungen) ranging from 5.000 to 25.000 EUR per incident.

Checking each website manually is tedious, error-prone, and impossible to scale. Most portfolio managers have no idea which of their companies are compliant right now.

## The Solution

Sentinel scans every website in your portfolio automatically and delivers a clear, actionable compliance report. It checks SEO health, legal pages (Impressum, Datenschutz, AGB, Cookie-Banner), compares your stored company records against live website data, and generates ready-to-use fix instructions for any AI agent or developer.

Everything runs locally on your machine. No cloud. No subscription. No data leaves your network.

---

## Quick Start

### Prerequisites

You need **Node.js 18 or higher** installed on your machine. Download it from [nodejs.org](https://nodejs.org) if you do not have it yet. Sentinel runs on macOS, Linux, and Windows.

Verify your Node.js version:

```bash
node --version
# Should output v18.x.x or higher
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/jackagent/seo-optimizer-local.git
cd seo-optimizer-local

# 2. Install dependencies
npm install

# 3. Initialize the database
npm run setup

# 4. Load demo companies (recommended for first run)
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser. You will see the dashboard with two pre-loaded demo companies ready to explore.

### What Happens During Installation

The `npm install` command downloads all dependencies, including Puppeteer which ships with a bundled Chromium browser (~170 MB on first install). This is used for website scanning and requires no additional configuration.

The `npm run setup` command creates a local SQLite database at `data/seo-optimizer.db`. All your data stays in this file on your machine.

The `npm run seed` command loads two realistic German demo companies — Meridian Ventures GmbH (Score 68, with issues) and NovaTech Solutions UG (Score 87, fully compliant) — so you can explore every feature immediately.

---

## Features

### Portfolio Dashboard

The home screen shows your entire portfolio at a glance: total companies, average compliance score, critical issues count, and scan activity. Each company appears as a card with a score ring, issue count, and quick-scan button. A red alert banner appears when discrepancies are detected between your records and live websites.

### Automated Website Scanning

Sentinel uses a Puppeteer-based crawler that visits each company website and evaluates four dimensions, each scored 0-100:

| Dimension | What It Checks |
|---|---|
| **Meta** | Title tag, meta description, Open Graph tags, canonical URL, favicon, lang attribute |
| **Content** | Heading structure (H1-H6), image alt text, word count, internal/external link analysis |
| **Technical** | Page load speed, mobile viewport, HTTPS, robots.txt, sitemap.xml, structured data (JSON-LD) |
| **Legal** | Impressum presence and completeness, Datenschutzerklaerung, AGB, Cookie-Banner with granular checks |

The overall score is a weighted average of all four dimensions. Scans can be triggered for a single company or the entire portfolio at once.

### Legal Compliance (German & EU Law Focus)

Sentinel specifically checks for the legal pages required under German and EU law:

| Legal Requirement | Detection Method |
|---|---|
| **Impressum** | Scans for /impressum, /imprint, footer links. Scores completeness (company name, address, directors, registration, VAT, contact) |
| **Datenschutzerklaerung** | Detects /datenschutz, /privacy, /privacy-policy links and pages |
| **AGB** | Detects /agb, /terms, /terms-of-service links and pages |
| **Cookie-Banner** | Detects consent dialogs, checks for reject-all button, granular choices, and necessary-only option |

Each check produces a clear pass/fail result with specific details about what was found or missing.

### Discrepancy Detection

This is Sentinel's most powerful feature. It compares the company details you have stored in the database (Handelsregisternummer, address, directors, VAT number, etc.) against what is actually published on the company's live Impressum page.

Mismatches are flagged with severity levels:

| Severity | Meaning | Example |
|---|---|---|
| **CRITICAL** | Legal risk — data on website contradicts your records | Different company address, wrong director name |
| **WARNING** | Potential issue — data is incomplete or partially different | Missing VAT number on website |
| **INFO** | Minor difference — may be intentional | Slightly different formatting of company name |

A red alert banner on the dashboard immediately shows when discrepancies exist, with a comparison table of database values vs. live website values.

### Auto-Learn

When Sentinel scans a website and finds Impressum data, it can automatically populate empty fields in your company records. For example, if you add a new company and only enter the name and URL, the first scan will attempt to fill in the address, registration number, directors, and VAT number from the Impressum.

Auto-Learn never overwrites existing data. It only fills empty fields.

### Fix Prompt Generator

For every company with issues, Sentinel generates a comprehensive AI-ready prompt that contains:

- Company name, URL, and hosting platform
- All stored company details (registration, address, directors, VAT)
- Every issue found, grouped by severity (Critical, Warning, Info)
- Specific fix instructions for each issue

Copy this prompt and paste it into any AI agent (ChatGPT, Claude, Manus, etc.) to get immediate, actionable fixes for all issues at once.

### Document Management

Upload and categorize documents for each company. Supported categories:

| Category | Examples |
|---|---|
| **Incorporation** | Gesellschaftsvertrag, Handelsregisterauszug |
| **Governance** | Geschaeftsfuehrervertrag, Gesellschafterbeschluss |
| **Tax** | Steuerbescheid, USt-Voranmeldung |
| **Legal** | AGB, Datenschutzerklaerung, Vertraege |
| **Financial** | Jahresabschluss, BWA, Bilanz |
| **Other** | Any other documents |

Files are stored locally in `data/uploads/` and never leave your machine.

### Bilingual Interface (German / English)

The entire interface is available in German (default) and English. A one-click toggle in the sidebar footer switches between languages. Over 150 translation keys cover every label, button, tab, modal, and message. Your language preference is saved in the browser and persists across sessions.

---

## Usage Guide

### Step 1: Explore the Demo

After running `npm run seed`, you have two demo companies:

**Meridian Ventures GmbH** — Score 68/100, 8 issues, 1 discrepancy. This company demonstrates critical problems: missing AGB, missing Cookie-Banner, incomplete Impressum, and a data discrepancy between the database and the live website.

**NovaTech Solutions UG** — Score 87/100, 2 issues, fully compliant. This company shows what a well-configured website looks like, with only minor optimization suggestions.

Click on either company to explore the detail view with its five tabs: Issues, Legal Compliance, Company Info, Documents, and Scan History.

### Step 2: Add Your Companies

Click the **"Unternehmen hinzufuegen"** button (or "Add Company" in English) on the dashboard. Enter:

| Field | Required | Description |
|---|---|---|
| **Company Name** | Yes | Legal name of the company (e.g., "Acme GmbH") |
| **Website URL** | Yes | Full URL including https:// |
| **Sector** | No | Industry sector for categorization |
| **Hosting Platform** | No | Webflow, WordPress, Shopify, etc. (auto-detected during scan) |
| **Description** | No | Internal notes |

### Step 3: Run Your First Scan

Click the scan button on the company card or inside the company detail view. The scan runs in the background and typically takes 15-30 seconds per website. The page updates automatically when the scan completes.

To scan your entire portfolio at once, use the **"Alle scannen"** button on the dashboard.

### Step 4: Review Results

After scanning, review each company's results across the five tabs:

**Issues Tab** — Shows all detected problems sorted by severity. Each issue includes a title, description, and specific fix recommendation.

**Legal Compliance Tab** — Shows pass/fail status for Impressum, Datenschutz, AGB, and Cookie-Banner with detailed sub-checks.

**Company Info Tab** — Shows and lets you edit all stored company details (Handelsregisternummer, Rechtsform, Registergericht, Adresse, Geschaeftsfuehrer, USt-IdNr., etc.).

**Documents Tab** — Upload and manage company documents.

**Scan History Tab** — Shows all previous scans with scores and timestamps.

### Step 5: Fix Issues

Click the **"Fix-Prompt"** button to generate a comprehensive AI-ready prompt. Click **"Kopieren"** to copy it to your clipboard, then paste it into your preferred AI agent for immediate fixes.

### Step 6: Monitor Ongoing

Re-scan periodically to track improvements. The discrepancy detection runs automatically with every scan, alerting you when live website data diverges from your records.

---

## Available Commands

| Command | Description |
|---|---|
| `npm start` | Start the server on port 3000 (or `PORT` env variable) |
| `npm run setup` | Initialize the SQLite database (run once after cloning) |
| `npm run seed` | Load two demo companies with realistic sample data |
| `npm run reset` | Delete all data and reinitialize with fresh demo data |

### Changing the Port

```bash
PORT=8080 npm start
```

---

## API Reference

All endpoints are available at `http://localhost:3000/api/`. Responses are JSON.

### Dashboard Endpoints

```
GET  /api/dashboard/stats          → Portfolio statistics (company count, avg score, critical issues, scans today)
GET  /api/dashboard/companies      → All companies with their latest scan result
GET  /api/dashboard/discrepancies  → All active discrepancies across the portfolio
```

### Company Endpoints

```
GET    /api/companies              → List all companies
POST   /api/companies              → Create a company
                                     Body: {"name": "Acme GmbH", "url": "https://acme.de", "sector": "Tech", "hosting_platform": "WordPress", "description": "Notes"}
                                     Required: name, url
GET    /api/companies/:id          → Full company details including latest scan, scan history, documents, and company details
PUT    /api/companies/:id          → Update company fields
DELETE /api/companies/:id          → Delete company and all associated data (scans, documents, details)
```

### Company Details Endpoints

```
GET    /api/companies/:id/details  → Get stored registration details
PUT    /api/companies/:id/details  → Update registration details
                                     Body fields: company_number, company_type, registered_address, jurisdiction,
                                     incorporation_date, vat_number, registered_email, registered_phone,
                                     lead_director, lead_director_title, local_director, share_capital,
                                     share_type, share_count
```

### Scanning Endpoints

```
POST   /api/companies/:id/scan     → Start a scan for one company (runs in background)
                                     Returns: {"scanId": 1, "status": "running", "message": "Scan started"}
GET    /api/companies/:id/scan/latest → Get the latest scan result with parsed issues, legal, cookie, and discrepancy data
GET    /api/companies/:id/scans    → Get full scan history for a company
POST   /api/scan-all               → Scan all companies sequentially
```

### Document Endpoints

```
GET    /api/companies/:id/documents           → List all documents for a company
POST   /api/companies/:companyId/documents    → Upload a document (multipart form data)
                                                Fields: file (required), category (optional), description (optional)
                                                Categories: incorporation, governance, tax, legal, financial, other
DELETE /api/documents/:id                     → Delete a document
```

### Fix Prompt Endpoint

```
GET    /api/companies/:id/fix-prompt → Generate a comprehensive fix prompt for all issues
                                      Returns: {"prompt": "FIX ALL ISSUES FOR: ..."}
```

### Seed Demo Data

```
POST   /api/seed-demo               → Load demo companies (Meridian Ventures GmbH + NovaTech Solutions UG)
```

---

## Data Storage

All data is stored locally on your machine. Nothing is transmitted to external servers.

| Data | Location | Format |
|---|---|---|
| Database | `data/seo-optimizer.db` | SQLite |
| Uploaded documents | `data/uploads/{companyId}/` | Original files |
| Application code | `public/` and `server/` | JavaScript, HTML, CSS |

The `data/` directory is created automatically on first run and is excluded from git via `.gitignore`.

### Backup

To back up your data, simply copy the `data/` directory:

```bash
cp -r data/ ~/sentinel-backup-$(date +%Y%m%d)/
```

### Reset

To start fresh with empty data and new demo companies:

```bash
npm run reset
```

This deletes the `data/` directory and reinitializes the database with demo data.

---

## File Structure

```
seo-optimizer-local/
├── server/
│   ├── index.js            Express server with all API routes
│   ├── db.js               SQLite database helpers (CRUD operations)
│   ├── scanner.js          Puppeteer-based website scanner
│   ├── discrepancy.js      Discrepancy detection engine
│   ├── setup-db.js         Database schema initialization
│   └── seed-demo.js        Demo company data seeder
├── public/
│   ├── index.html          Single-page application shell
│   ├── css/
│   │   └── style.css       Executive dark-theme dashboard styles
│   └── js/
│       ├── app.js          Frontend application (SPA routing, rendering, interactions)
│       └── i18n.js         German/English translations (150+ keys)
├── data/                   Created on first run (gitignored)
│   ├── seo-optimizer.db    SQLite database
│   └── uploads/            Uploaded company documents
├── SKILL.md                OpenClaw/Manus agent integration guide
├── CHANGELOG.md            Version history
├── LICENSE                 License information
├── package.json            Dependencies and scripts
└── .gitignore              Git exclusions
```

---

## Database Schema

Sentinel uses four tables in SQLite:

### companies

| Column | Type | Description |
|---|---|---|
| id | INTEGER (PK) | Auto-increment ID |
| name | TEXT | Company legal name |
| url | TEXT | Website URL |
| description | TEXT | Internal notes |
| sector | TEXT | Industry sector |
| hosting_platform | TEXT | Detected or manually set hosting platform |
| created_at | TEXT | ISO timestamp |

### company_details

| Column | Type | Description |
|---|---|---|
| company_id | INTEGER (FK) | References companies.id |
| company_number | TEXT | Handelsregisternummer (e.g., HRB 12345) |
| company_type | TEXT | Rechtsform (GmbH, UG, AG, etc.) |
| registered_address | TEXT | Official registered address |
| jurisdiction | TEXT | Registergericht (e.g., Amtsgericht Muenchen) |
| incorporation_date | TEXT | Gruendungsdatum |
| vat_number | TEXT | USt-IdNr. (e.g., DE123456789) |
| registered_email | TEXT | Official email |
| registered_phone | TEXT | Official phone |
| lead_director | TEXT | Geschaeftsfuehrer |
| lead_director_title | TEXT | Title (e.g., CEO, Geschaeftsfuehrer) |
| local_director | TEXT | Local director (if applicable) |
| share_capital | TEXT | Stammkapital |
| share_type | TEXT | Share type |
| share_count | TEXT | Number of shares |

### scans

| Column | Type | Description |
|---|---|---|
| id | INTEGER (PK) | Auto-increment ID |
| company_id | INTEGER (FK) | References companies.id |
| status | TEXT | pending, running, completed, failed |
| overall_score | INTEGER | Weighted average (0-100) |
| meta_score | INTEGER | Meta dimension score |
| content_score | INTEGER | Content dimension score |
| technical_score | INTEGER | Technical dimension score |
| legal_score | INTEGER | Legal dimension score |
| has_impressum | INTEGER | 0 or 1 |
| has_privacy_policy | INTEGER | 0 or 1 |
| has_terms_of_service | INTEGER | 0 or 1 |
| impressum_completeness | INTEGER | Completeness percentage |
| pages_crawled | INTEGER | Number of pages visited |
| issues_json | TEXT | JSON array of all issues |
| legal_json | TEXT | JSON object with legal check details |
| cookie_json | TEXT | JSON object with cookie banner details |
| discrepancies_json | TEXT | JSON array of discrepancies |
| scan_data_json | TEXT | JSON object with raw scan data |
| created_at | TEXT | Scan start timestamp |
| completed_at | TEXT | Scan completion timestamp |

### documents

| Column | Type | Description |
|---|---|---|
| id | INTEGER (PK) | Auto-increment ID |
| company_id | INTEGER (FK) | References companies.id |
| file_name | TEXT | Original filename |
| file_path | TEXT | Local storage path |
| file_size | INTEGER | File size in bytes |
| mime_type | TEXT | MIME type |
| category | TEXT | Document category |
| description | TEXT | Optional description |
| uploaded_at | TEXT | Upload timestamp |

---

## Troubleshooting

### "Chromium revision is not downloaded"

Puppeteer needs to download Chromium on first install. If this fails (e.g., behind a corporate proxy), run:

```bash
npx puppeteer browsers install chrome
```

### "EACCES: permission denied" on Linux

If you get permission errors, avoid running with `sudo`. Instead, fix npm permissions:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Scan fails with "Navigation timeout"

Some websites block headless browsers or load very slowly. This is expected behavior — the scan will be marked as "failed" and you can retry later. Websites behind login walls or with aggressive bot protection cannot be scanned.

### Port 3000 is already in use

Change the port:

```bash
PORT=8080 npm start
```

### Database is corrupted

Delete the data directory and reinitialize:

```bash
npm run reset
```

### Scans are slow

Scans run sequentially to avoid overwhelming your machine. Each scan takes 15-30 seconds depending on website complexity and your internet connection. Portfolio scans process companies one at a time.

### Language does not switch

Clear your browser's localStorage for localhost:3000 and reload:

```bash
# In browser console:
localStorage.removeItem('sentinel-lang');
location.reload();
```

---

## OpenClaw / Manus Skill Installation

Sentinel works as an AI agent skill. After installation via OpenClaw, the agent can start the server, interact with the API, and open the dashboard in the browser.

See [SKILL.md](SKILL.md) for the full agent integration guide with API reference and example commands.

---

## Security Considerations

Sentinel is designed for local use on trusted networks. Keep these points in mind:

- The web interface has no authentication. Anyone on your network who can reach port 3000 can access the dashboard.
- If you need remote access, use an SSH tunnel or VPN rather than exposing the port directly.
- Uploaded documents are stored as files on disk. Ensure appropriate filesystem permissions.
- Scans make outbound HTTP requests to the websites you configure. No data is sent to any other destination.

---

## License

Proprietary. All rights reserved by EX Venture.

For licensing inquiries, contact the EX Venture team.
