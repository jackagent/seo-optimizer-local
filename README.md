# Sentinel — Enterprise SEO & Compliance Intelligence Platform

A fully self-contained SEO and compliance monitoring tool that runs locally on your Mac Mini. No external APIs, no cloud dependencies — everything runs on your machine.

## Features

- **Portfolio Management** — Add and manage companies with full details (registration, directors, VAT, address)
- **Automated Website Scanning** — Crawls pages, checks meta tags, legal compliance, cookie banners
- **SEO Scoring** — Meta, Content, Technical, and Legal scores with overall rating
- **Legal Compliance** — Impressum, Privacy Policy, Terms of Service, Cookie Banner detection
- **Discrepancy Detection** — Compares your database against live website Impressum data
- **Auto-Learn** — Automatically populates empty company details from scanned Impressum pages
- **Document Storage** — Upload and categorize company documents (PDFs, certificates)
- **Fix Prompt Generator** — One-click generates a comprehensive prompt to fix all issues
- **Scan All** — Batch scan your entire portfolio at once
- **German/English** — Full bilingual interface, German default with one-click toggle to English
- **Demo Companies** — Pre-seeded demo data to explore all features immediately
- **Dark Theme Dashboard** — Clean, professional interface designed for executives

## Requirements

- **Node.js 18+** (install from https://nodejs.org)
- **Mac Mini** (or any macOS/Linux machine)

## Quick Start

```bash
# 1. Navigate to the project folder
cd seo-optimizer-local

# 2. Install dependencies
npm install

# 3. Initialize the database
npm run setup

# 4. Seed demo companies (optional but recommended)
npm run seed

# 5. Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

## Usage

1. **Explore the demo** — Two pre-seeded companies (Meridian Ventures GmbH, NovaTech Solutions UG) let you explore all features immediately
2. **Add a company** — Click "+ Unternehmen hinzufügen" (or "+ Add Company" in English), enter name and URL
3. **Scan** — Click "Erneut scannen" on any company or "Alle scannen" for the entire portfolio
4. **Review results** — Check SEO scores, legal compliance, and issues
5. **Fix issues** — Use the "Fix-Prompt" button to generate a copy-paste prompt for AI agents
6. **Upload documents** — Store shareholder certificates, registration docs, etc.
7. **Monitor discrepancies** — Red alerts when database and website data don't match
8. **Switch language** — Click the DE/EN toggle in the sidebar footer

## Data Storage

All data is stored locally in `data/seo-optimizer.db` (SQLite). Uploaded documents are saved in `data/uploads/`. No data leaves your machine.

## File Structure

```
seo-optimizer-local/
  server/
    index.js          — Express server with all API routes
    db.js             — SQLite database helpers
    scanner.js        — Puppeteer-based website scanner
    discrepancy.js    — Discrepancy detection engine
    setup-db.js       — Database initialization
    seed-demo.js      — Demo company seeder
  public/
    index.html        — Single-page app shell
    css/style.css     — Dashboard theme
    js/app.js         — Frontend application logic
    js/i18n.js        — German/English translations
  data/               — Created on first run
    seo-optimizer.db  — SQLite database
    uploads/          — Uploaded documents
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run setup` | Initialize the database |
| `npm run seed` | Seed demo companies with sample data |
| `npm run reset` | Delete all data and start fresh with demo data |

## Configuration

- **Port**: Set `PORT` environment variable (default: 3000)
  ```bash
  PORT=8080 npm start
  ```

## Notes

- Scanning uses Puppeteer (headless Chrome) — first scan may take longer as Chrome downloads
- Scans run sequentially to avoid resource conflicts
- The discrepancy detector compares your stored company details against what it finds on the live website Impressum
- Auto-learn only fills empty fields — it never overwrites existing data
- Language preference is saved in localStorage and persists across sessions
