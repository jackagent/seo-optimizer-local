---
name: sentinel-seo-compliance
description: Enterprise SEO & Compliance Intelligence Dashboard. Scan company websites for SEO scores, legal compliance (Impressum, Datenschutz, AGB, Cookie-Banner), detect discrepancies between stored records and live websites, auto-learn company details from Impressum pages, generate AI fix prompts, and manage company documents. Full bilingual DE/EN interface. Use when managing a portfolio of company websites, checking legal compliance under German/EU law, or monitoring SEO health across multiple entities.
version: 2.0.0
author: EX Venture
tags:
  - seo
  - compliance
  - legal
  - gdpr
  - impressum
  - website-scanner
  - portfolio-management
  - german-law
  - abmahnung
  - cookie-banner
tools:
  - exec
  - browser
---

# Sentinel — SEO & Compliance Intelligence

Enterprise-grade portfolio monitoring dashboard for website SEO health, legal compliance, and data integrity. Runs locally with SQLite. No cloud dependencies, no data leaves the machine.

---

## Setup

Run these commands in order on first use:

```bash
cd ~/.openclaw/workspace/skills/sentinel-seo-compliance
npm install
npm run setup
npm run seed
npm start
```

The server starts at **http://localhost:3000**. Open in browser for the full visual dashboard. Two demo companies are pre-loaded.

To change the port: `PORT=8080 npm start`

## Starting (After First Setup)

```bash
cd ~/.openclaw/workspace/skills/sentinel-seo-compliance && npm start
```

## Reset All Data

```bash
cd ~/.openclaw/workspace/skills/sentinel-seo-compliance && npm run reset
```

---

## What Sentinel Does

Sentinel monitors a portfolio of company websites and checks each one for:

1. **SEO Health** — Meta tags, heading structure, page speed, mobile viewport, HTTPS, structured data. Scored across four dimensions: Meta, Content, Technical, Legal (each 0-100).

2. **Legal Compliance (German/EU Law)** — Detects Impressum (with completeness scoring), Datenschutzerklaerung, AGB, and Cookie-Banner (checks for reject-all, granular choices, necessary-only).

3. **Discrepancy Detection** — Compares stored company details (Handelsregisternummer, address, directors, VAT, etc.) against what is published on the live Impressum page. Flags mismatches as CRITICAL, WARNING, or INFO.

4. **Auto-Learn** — Automatically populates empty company detail fields from scanned Impressum data. Never overwrites existing values.

5. **Fix Prompt Generator** — Creates a comprehensive prompt with all issues, company context, and fix instructions. Ready to paste into any AI agent.

6. **Document Management** — Upload and categorize company documents (incorporation, governance, tax, legal, financial).

---

## API Reference

Base URL: `http://localhost:3000/api/`

All responses are JSON. All request bodies are JSON (Content-Type: application/json) unless noted otherwise.

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Portfolio statistics: company count, average score, critical issues, scans today |
| GET | `/api/dashboard/companies` | All companies with their latest scan result attached |
| GET | `/api/dashboard/discrepancies` | All active discrepancies across the entire portfolio |

### Companies

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies` | List all companies |
| POST | `/api/companies` | Create a company. Body: `{"name": "Acme GmbH", "url": "https://acme.de"}`. Optional: `sector`, `hosting_platform`, `description` |
| GET | `/api/companies/:id` | Full company with details, latest scan, scan history, and documents |
| PUT | `/api/companies/:id` | Update company fields |
| DELETE | `/api/companies/:id` | Delete company and all associated data |

### Company Details (Registration Data)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies/:id/details` | Get stored registration details |
| PUT | `/api/companies/:id/details` | Update details. Fields: `company_number`, `company_type`, `registered_address`, `jurisdiction`, `incorporation_date`, `vat_number`, `registered_email`, `registered_phone`, `lead_director`, `lead_director_title`, `local_director`, `share_capital`, `share_type`, `share_count` |

### Scanning

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/companies/:id/scan` | Start scan for one company (background, 15-30s). Returns `{"scanId", "status": "running"}` |
| GET | `/api/companies/:id/scan/latest` | Latest scan with parsed issues, legal, cookie, and discrepancy data |
| GET | `/api/companies/:id/scans` | Full scan history |
| POST | `/api/scan-all` | Scan all companies sequentially |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies/:id/documents` | List documents for a company |
| POST | `/api/companies/:companyId/documents` | Upload document. Multipart form: `file` (required), `category`, `description`. Categories: incorporation, governance, tax, legal, financial, other |
| DELETE | `/api/documents/:id` | Delete a document |

### Fix Prompt

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies/:id/fix-prompt` | Generate comprehensive fix prompt with all issues and company context |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/seed-demo` | Load demo companies with sample data |

---

## Common Agent Workflows

### Add a company and scan it

```bash
# Create company
curl -s -X POST http://localhost:3000/api/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme GmbH","url":"https://acme.de","sector":"Technology"}'

# Start scan (returns scanId)
curl -s -X POST http://localhost:3000/api/companies/1/scan

# Wait 20-30 seconds, then check result
curl -s http://localhost:3000/api/companies/1/scan/latest
```

### Check portfolio compliance status

```bash
# Get all companies with scores
curl -s http://localhost:3000/api/dashboard/companies

# Get all discrepancies
curl -s http://localhost:3000/api/dashboard/discrepancies

# Get portfolio stats
curl -s http://localhost:3000/api/dashboard/stats
```

### Generate fix instructions for a company

```bash
curl -s http://localhost:3000/api/companies/1/fix-prompt
# Returns {"prompt": "FIX ALL ISSUES FOR: ..."} — copy the prompt text
```

### Scan entire portfolio

```bash
curl -s -X POST http://localhost:3000/api/scan-all
# Scans run sequentially in background. Check individual results after ~30s per company.
```

### Update company registration details

```bash
curl -s -X PUT http://localhost:3000/api/companies/1/details \
  -H 'Content-Type: application/json' \
  -d '{"company_number":"HRB 12345","vat_number":"DE123456789","registered_address":"Musterstr. 1, 80331 Muenchen","lead_director":"Max Mustermann"}'
```

---

## Web Dashboard

Open http://localhost:3000 in the browser for the full visual dashboard:

- Dark-theme executive interface with German default language and English toggle
- Portfolio overview with score gauges, issue counts, and discrepancy alert banners
- Company detail pages with five tabs: Issues, Legal Compliance, Company Info, Documents, Scan History
- One-click Fix Prompt generator with copy-to-clipboard
- Add, edit, and delete companies directly in the UI
- Upload and manage documents per company
- Two pre-seeded demo companies for immediate exploration

---

## Important Notes

- Scans use Puppeteer (headless Chrome). First `npm install` downloads Chromium (~170 MB).
- Scans take 15-30 seconds per website. Portfolio scans run sequentially.
- Websites behind login walls or with aggressive bot protection may fail to scan.
- All data is stored locally in `data/seo-optimizer.db` (SQLite). Nothing is transmitted externally.
- The `data/` directory is created on first run. Delete it and run `npm run reset` to start fresh.
