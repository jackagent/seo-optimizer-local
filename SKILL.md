---
name: seo_optimizer
description: SEO & Compliance Optimizer — scan websites, detect legal compliance issues, track company details, flag data discrepancies, generate fix prompts, and manage company documents. Runs as a local Node.js server with SQLite.
version: 1.0.0
author: EX Venture
tags:
  - seo
  - compliance
  - legal
  - website-scanner
  - portfolio-management
tools:
  - exec
  - browser
---

# SEO & Compliance Optimizer Skill

You have access to a local SEO & Compliance Optimizer running on this machine. It is a full-featured portfolio monitoring tool for tracking website SEO scores, legal compliance, data discrepancies, and company documents.

## Starting the Server

If the server is not already running, start it:

```bash
cd ~/.openclaw/workspace/skills/seo-optimizer && npm start
```

The server runs on **http://localhost:3000** by default. Set `PORT` environment variable to change.

If dependencies are not installed yet:

```bash
cd ~/.openclaw/workspace/skills/seo-optimizer && npm install && npm run setup && npm start
```

## API Reference

All endpoints are at `http://localhost:3000/api/`. Use `exec` with `curl` to interact.

### Dashboard

- `GET /api/dashboard/stats` — Portfolio stats (total companies, avg score, critical issues, scans today)
- `GET /api/dashboard/companies` — All companies with their latest scan data
- `GET /api/dashboard/discrepancies` — All data discrepancies across the portfolio

### Companies

- `GET /api/companies` — List all companies
- `POST /api/companies` — Add a company. Body: `{"name": "...", "url": "...", "sector": "...", "hosting_platform": "...", "description": "..."}`
- `GET /api/companies/:id` — Get company details, latest scan, documents, scan history
- `PUT /api/companies/:id` — Update company. Body: `{"name": "...", "url": "...", "sector": "...", "hosting_platform": "...", "description": "..."}`
- `DELETE /api/companies/:id` — Delete company and all associated data

### Company Details (Registration, Directors, VAT)

- `GET /api/companies/:id/details` — Get stored company details
- `PUT /api/companies/:id/details` — Update company details. Body includes: `company_number`, `company_type`, `registered_address`, `jurisdiction`, `incorporation_date`, `vat_number`, `registered_email`, `registered_phone`, `lead_director`, `lead_director_title`, `local_director`, `share_capital`, `share_type`, `share_count`

### Scanning

- `POST /api/companies/:id/scan` — Trigger a scan for a single company
- `GET /api/companies/:id/scan/latest` — Get the latest scan result (poll for status: pending/running/completed/failed)
- `POST /api/scan-all` — Trigger scans for all companies sequentially

### Documents

- `POST /api/companies/:id/documents` — Upload a document (multipart form: file, category, description). Categories: incorporation, governance, tax, legal, financial, other
- `DELETE /api/documents/:id` — Delete a document

### Fix Prompt

- `GET /api/companies/:id/fix-prompt` — Generate a comprehensive fix-all prompt for a company's website issues

## What the Scanner Checks

Each scan crawls the company website and evaluates:

1. **Meta Score** — Title length, meta description, Open Graph tags, canonical URL, favicon, language attribute
2. **Content Score** — Heading structure (H1-H6), image alt text, word count, internal/external links
3. **Technical Score** — Page load speed, mobile viewport, HTTPS, robots.txt, sitemap.xml, structured data, async/defer scripts
4. **Legal Score** — Impressum/Imprint page, Privacy Policy, Terms of Service, Cookie consent banner (with granular checks for reject-all, granular choices, necessary-only options)

## Discrepancy Detection

After scanning, the system compares the company details stored in the database against what it finds on the live website Impressum page. It checks:

- Company name
- Registered address
- Directors/management
- Company registration number
- VAT number
- Email and phone
- Jurisdiction
- Company type

Discrepancies are flagged with severity levels: CRITICAL, WARNING, INFO.

## Auto-Learn

When scanning, the system automatically populates empty company detail fields from the extracted Impressum data. It only fills empty fields and never overwrites existing values.

## Web Dashboard

Open **http://localhost:3000** in a browser to access the full visual dashboard with:

- Portfolio overview with score gauges
- Data discrepancy alerts (red banners)
- Company detail pages with Issues, Legal, Company Info, Documents, and Scan History tabs
- One-click Fix Prompt generator
- Add/edit/delete companies
- Document upload and management

## Common Tasks

### Add a new company and scan it
```bash
# Add the company
curl -s -X POST http://localhost:3000/api/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Corp","url":"acme.com","sector":"Tech"}'

# Trigger a scan (use the returned id)
curl -s -X POST http://localhost:3000/api/companies/1/scan
```

### Check for discrepancies across all companies
```bash
curl -s http://localhost:3000/api/dashboard/discrepancies | python3 -m json.tool
```

### Generate a fix prompt for a company
```bash
curl -s http://localhost:3000/api/companies/1/fix-prompt | python3 -m json.tool
```

### Scan all companies at once
```bash
curl -s -X POST http://localhost:3000/api/scan-all
```

### Add company registration details
```bash
curl -s -X PUT http://localhost:3000/api/companies/1/details \
  -H 'Content-Type: application/json' \
  -d '{"company_number":"HRB 12345","registered_address":"Main St 1, Berlin","lead_director":"John Doe","vat_number":"DE123456789"}'
```
