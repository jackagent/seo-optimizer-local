# SEO & Compliance Optimizer — Local Edition

A fully self-contained SEO and compliance monitoring tool that runs locally on your Mac Mini. No external APIs, no cloud dependencies — everything runs on your machine.

## Features

- **Add & manage companies** with full details (registration, directors, VAT, address)
- **Automated website scanning** — crawls pages, checks meta tags, legal compliance, cookie banners
- **SEO scoring** — Meta, Content, Technical, and Legal scores with overall rating
- **Legal compliance** — Impressum, Privacy Policy, Terms of Service, Cookie Banner detection
- **Discrepancy detection** — compares your database against live website Impressum data
- **Auto-learn** — automatically populates empty company details from scanned Impressum pages
- **Document storage** — upload and categorize company documents (PDFs, certificates)
- **Fix prompt generator** — one-click generates a comprehensive prompt to fix all issues
- **Scan All** — batch scan your entire portfolio at once
- **Dark theme dashboard** — clean, professional interface

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

# 4. Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

## Usage

1. **Add a company** — Click "+ Add Company", enter name and URL
2. **Scan** — Click "Scan" on any company or "Scan All" for the entire portfolio
3. **Review results** — Check SEO scores, legal compliance, and issues
4. **Fix issues** — Use the "Fix Prompt" button to generate a copy-paste prompt for AI agents
5. **Upload documents** — Store shareholder certificates, registration docs, etc.
6. **Monitor discrepancies** — Red alerts when database and website data don't match

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
  public/
    index.html        — Single-page app shell
    css/style.css     — Dashboard theme
    js/app.js         — Frontend application logic
  data/               — Created on first run
    seo-optimizer.db  — SQLite database
    uploads/          — Uploaded documents
```

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
