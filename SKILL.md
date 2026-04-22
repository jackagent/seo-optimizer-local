---
name: sentinel-seo-compliance
description: Enterprise SEO & Compliance Intelligence Dashboard. Scan websites for SEO scores, legal compliance (Impressum, Datenschutz, AGB, Cookie-Banner), detect data discrepancies between database and live websites, auto-learn company details from Impressum pages, generate AI fix prompts, and manage company documents. Full bilingual DE/EN interface. Use when managing a portfolio of company websites, checking legal compliance, or monitoring SEO health.
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
tools:
  - exec
  - browser
---

# Sentinel — SEO & Compliance Intelligence

Enterprise-grade portfolio monitoring dashboard for website SEO, legal compliance, and data integrity. Runs locally with SQLite — no cloud dependencies.

## First-Time Setup

```bash
cd ~/.openclaw/workspace/skills/sentinel-seo-compliance && npm install && npm run setup && npm run seed && npm start
```

Server starts at **http://localhost:3000**. Open in browser for the full dashboard.

## Starting the Server

```bash
cd ~/.openclaw/workspace/skills/sentinel-seo-compliance && npm start
```

Set `PORT=8080` to change port.

## Core Capabilities

### 1. Website Scanning
Crawls company websites and scores four dimensions (0-100):
- **Meta** — Title, description, Open Graph, canonical, favicon, lang attribute
- **Content** — Heading structure, alt text, word count, link analysis
- **Technical** — Load speed, mobile viewport, HTTPS, robots.txt, sitemap, structured data
- **Legal** — Impressum, Privacy Policy, Terms of Service, Cookie consent (granular checks)

### 2. Legal Compliance (German Law Focus)
Detects presence and completeness of:
- Impressum (with completeness scoring)
- Datenschutzerklärung (Privacy Policy)
- AGB (Terms of Service)
- Cookie-Banner (reject-all, granular choices, necessary-only)

### 3. Discrepancy Detection
Compares stored company details against live Impressum data. Checks: company name, address, directors, registration number, VAT, email, phone, jurisdiction, company type. Flags mismatches as CRITICAL/WARNING/INFO.

### 4. Auto-Learn
Automatically populates empty company detail fields from scanned Impressum pages. Never overwrites existing data.

### 5. Fix Prompt Generator
One-click generates a comprehensive prompt containing all issues, company context, and fix instructions — paste directly into any AI agent.

### 6. Document Management
Upload and categorize documents per company: incorporation, governance, tax, legal, financial, other.

## API Reference

Base URL: `http://localhost:3000/api/`

### Dashboard
- `GET /api/dashboard/stats` — Portfolio stats
- `GET /api/dashboard/companies` — All companies with latest scan
- `GET /api/dashboard/discrepancies` — All discrepancies

### Companies
- `GET /api/companies` — List all
- `POST /api/companies` — Create. Body: `{"name","url","sector","hosting_platform","description"}`
- `GET /api/companies/:id` — Full details + scan + documents + history
- `PUT /api/companies/:id` — Update company
- `DELETE /api/companies/:id` — Delete with all data

### Company Details
- `GET /api/companies/:id/details` — Registration, directors, VAT
- `PUT /api/companies/:id/details` — Update details (company_number, company_type, registered_address, jurisdiction, incorporation_date, vat_number, registered_email, registered_phone, lead_director, lead_director_title, local_director, share_capital, share_type, share_count)

### Scanning
- `POST /api/companies/:id/scan` — Scan single company
- `GET /api/companies/:id/scan/latest` — Latest scan result (status: pending/running/completed/failed)
- `POST /api/scan-all` — Scan all companies

### Documents
- `POST /api/companies/:id/documents` — Upload (multipart: file, category, description)
- `DELETE /api/documents/:id` — Delete document

### Fix Prompt
- `GET /api/companies/:id/fix-prompt` — Generate fix-all prompt

## Common Tasks

```bash
# Add company and scan
curl -s -X POST http://localhost:3000/api/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme GmbH","url":"acme.de","sector":"Tech"}'
curl -s -X POST http://localhost:3000/api/companies/1/scan

# Check all discrepancies
curl -s http://localhost:3000/api/dashboard/discrepancies | python3 -m json.tool

# Generate fix prompt
curl -s http://localhost:3000/api/companies/1/fix-prompt | python3 -m json.tool

# Scan entire portfolio
curl -s -X POST http://localhost:3000/api/scan-all
```

## Web Dashboard

Open http://localhost:3000 for the full visual dashboard:
- Dark-theme executive interface (German default, English toggle)
- Portfolio overview with score gauges and discrepancy alerts
- Company detail pages: Issues, Legal Compliance, Company Info, Documents, Scan History
- One-click Fix Prompt generator with copy-to-clipboard
- Two pre-seeded demo companies for immediate exploration
