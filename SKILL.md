---
name: sentinel-seo-compliance
description: Enterprise SEO & Compliance Intelligence Platform with YouTube SEO Analyzer, AI Article Generator (with auto image generation), and Social Media Outreach Bot. Scan company websites for SEO scores, legal compliance (Impressum, Datenschutz, AGB, Cookie-Banner), detect discrepancies, auto-learn company details, generate fix prompts, analyze YouTube videos, create SEO articles with AI images, and generate outreach campaigns for LinkedIn, Twitter/X, Instagram, Facebook, and Email. Full bilingual DE/EN interface. Use when managing a portfolio of company websites, checking legal compliance, monitoring SEO health, creating content, or automating social media outreach.
version: 3.0.0
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
  - youtube-seo
  - article-generator
  - outreach-bot
  - social-media
  - content-creation
  - ai-images
tools:
  - exec
  - browser
---

# Sentinel — SEO & Compliance Intelligence Platform

Enterprise-grade portfolio monitoring dashboard with YouTube SEO analysis, AI article generation (with auto images), and social media outreach automation. Runs locally with SQLite. No cloud dependencies.

---

## Requirements

- **Node.js 18+** (recommended: 20 LTS or 22 LTS)
- **npm** (comes with Node.js)
- Works on **macOS** (Mac Mini M1/M2/M4, MacBook), **Linux**, and **Windows**
- Puppeteer auto-downloads Chromium (~170 MB) on first `npm install`
- **Optional:** OpenAI-compatible API key for Article Generator and Outreach Bot

### macOS / Mac Mini Notes

On macOS, Puppeteer works out of the box. If you see a Gatekeeper warning on first scan:

```bash
xattr -cr node_modules/puppeteer/.local-chromium
```

---

## First-Time Setup

```bash
cd /path/to/sentinel-seo-compliance
npm install
npm run setup
npm run seed
npm start
```

The server starts at **http://localhost:3000**. Open in browser for the full visual dashboard. Two demo companies are pre-loaded.

To change the port: `PORT=8080 npm start`

## Starting (After First Setup)

```bash
cd /path/to/sentinel-seo-compliance && npm start
```

## Reset All Data

```bash
npm run reset
```

---

## What Sentinel Does

### Core Compliance (No API Key Required)

1. **SEO Health Scanning** — Meta tags, heading structure, page speed, mobile viewport, HTTPS, structured data. Scored across four dimensions: Meta, Content, Technical, Legal (each 0-100).

2. **Legal Compliance (German/EU Law)** — Detects Impressum (with completeness scoring), Datenschutzerklaerung, AGB, and Cookie-Banner (checks for reject-all, granular choices, necessary-only).

3. **Discrepancy Detection** — Compares stored company details against live Impressum data. Flags mismatches as CRITICAL, WARNING, or INFO.

4. **Auto-Learn** — Populates empty company detail fields from scanned Impressum data. Never overwrites existing values.

5. **Fix Prompt Generator** — Creates comprehensive prompts with all issues and fix instructions for any AI agent.

6. **Document Management** — Upload and categorize company documents locally.

### YouTube SEO (No API Key Required)

7. **YouTube Video Analysis** — Analyze any YouTube video for SEO performance: title optimization, description quality, tag coverage, engagement metrics. Fetches real-time data (views, likes, comments, tags, thumbnail).

### AI-Powered Features (Requires OpenAI-Compatible API Key)

8. **Article Generator** — Generate SEO-optimized articles with AI-generated hero images. Configurable topic, tone, language, and word count.

9. **Social Media Outreach Bot** — Generate professional outreach campaigns for LinkedIn, Twitter/X, Instagram, Facebook, and Email. Includes primary message, follow-ups, hooks, and hashtags.

---

## API Reference

Base URL: `http://localhost:3000/api/`

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Portfolio statistics |
| GET | `/api/dashboard/companies` | All companies with latest scan |
| GET | `/api/dashboard/discrepancies` | All active discrepancies |

### Companies

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies` | List all companies |
| POST | `/api/companies` | Create company. Body: `{"name", "url"}` required |
| GET | `/api/companies/:id` | Full company with details, scans, documents |
| PUT | `/api/companies/:id` | Update company (partial update) |
| DELETE | `/api/companies/:id` | Delete company and all data |

### Company Details

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies/:id/details` | Get registration details |
| PUT | `/api/companies/:id/details` | Update details (all fields optional) |

### Scanning

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/companies/:id/scan` | Start scan (background, 15-30s) |
| GET | `/api/companies/:id/scan/latest` | Latest scan with issues, legal, discrepancies |
| GET | `/api/companies/:id/scans` | Full scan history |
| POST | `/api/scan-all` | Scan all companies |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies/:id/documents` | List documents |
| POST | `/api/companies/:companyId/documents` | Upload document (multipart) |
| DELETE | `/api/documents/:id` | Delete document |

### Fix Prompt

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies/:id/fix-prompt` | Generate fix prompt |

### YouTube SEO

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/youtube/analyze` | Analyze video. Body: `{"url", "company_id"}` (company_id optional) |
| GET | `/api/youtube` | List all analyses |
| GET | `/api/youtube/:id` | Get specific analysis |
| DELETE | `/api/youtube/:id` | Delete analysis |

### Article Generator

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/articles/generate` | Generate article. Body: `{"topic", "keywords", "tone", "language", "word_count", "company_id"}` |
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/:id` | Get specific article |
| DELETE | `/api/articles/:id` | Delete article |

### Outreach Bot

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/outreach/platforms` | Get supported platforms with specs |
| POST | `/api/outreach/generate` | Generate campaign. Body: `{"platform", "target_audience", "campaign_goal", "tone", "language", "company_id"}` |
| GET | `/api/outreach` | List all campaigns |
| GET | `/api/outreach/:id` | Get specific campaign |
| DELETE | `/api/outreach/:id` | Delete campaign |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/settings` | Get all settings (keys masked) |
| PUT | `/api/settings` | Update settings. Body: `{"llm_api_key", "llm_base_url", "llm_model", "image_api_key", "image_base_url"}` |
| POST | `/api/settings/test-llm` | Test LLM connection |

---

## Common Agent Workflows

### Add a company and scan it

```bash
curl -s -X POST http://localhost:3000/api/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme GmbH","url":"https://acme.de","sector":"Technology"}'

curl -s -X POST http://localhost:3000/api/companies/1/scan

# Wait 20-30 seconds
curl -s http://localhost:3000/api/companies/1/scan/latest
```

### Analyze a YouTube video

```bash
curl -s -X POST http://localhost:3000/api/youtube/analyze \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Wait 10-15 seconds
curl -s http://localhost:3000/api/youtube/1
```

### Configure API key and generate an article

```bash
# Set API key
curl -s -X PUT http://localhost:3000/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"llm_api_key":"sk-your-key","llm_base_url":"https://api.openai.com/v1","llm_model":"gpt-4o-mini"}'

# Test connection
curl -s -X POST http://localhost:3000/api/settings/test-llm

# Generate article
curl -s -X POST http://localhost:3000/api/articles/generate \
  -H 'Content-Type: application/json' \
  -d '{"topic":"SEO Best Practices 2026","keywords":"seo, google ranking, meta tags","tone":"professional","language":"en","word_count":1500}'
```

### Generate outreach campaign

```bash
curl -s -X POST http://localhost:3000/api/outreach/generate \
  -H 'Content-Type: application/json' \
  -d '{"platform":"linkedin","target_audience":"CTOs at German startups","campaign_goal":"Introduce compliance monitoring service","tone":"professional","language":"en"}'
```

### Check portfolio compliance

```bash
curl -s http://localhost:3000/api/dashboard/stats
curl -s http://localhost:3000/api/dashboard/discrepancies
```

### Scan entire portfolio

```bash
curl -s -X POST http://localhost:3000/api/scan-all
```

---

## Web Dashboard

Open http://localhost:3000 in the browser for the full visual dashboard:

- Dark-theme executive interface with German default language and English toggle
- Portfolio overview with score gauges, issue counts, and discrepancy alerts
- Company detail pages with five tabs: Issues, Legal, Company Info, Documents, Scan History
- YouTube SEO analyzer with video metrics and optimization suggestions
- Article generator with AI-powered content and hero image creation
- Social media outreach bot for LinkedIn, Twitter/X, Instagram, Facebook, Email
- Settings page for API configuration with connection testing
- One-click Fix Prompt generator with copy-to-clipboard

---

## Troubleshooting

### Puppeteer / Chromium Issues

**macOS Gatekeeper:** `xattr -cr node_modules/puppeteer/.local-chromium`

**Linux missing libraries:** `sudo apt-get install -y libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libgtk-3-0`

### Article/Outreach Features Not Working

Configure your OpenAI API key in Settings first. Any OpenAI-compatible API works (OpenAI, Azure, Ollama, LM Studio, etc.).

### Port Already in Use

```bash
PORT=3001 npm start
```

### Start Fresh

```bash
npm run reset
```

---

## Important Notes

- Scans use Puppeteer (headless Chrome). First `npm install` downloads Chromium (~170 MB).
- Scans take 15-30 seconds per website. Portfolio scans run sequentially.
- YouTube analysis fetches real-time data from YouTube (no API key needed).
- Article Generator and Outreach Bot require an OpenAI-compatible API key configured in Settings.
- All data is stored locally in `data/seo-optimizer.db` (SQLite). Nothing is transmitted externally except API calls to your configured LLM endpoint.
- The server includes global error handling — it will never crash from a failed scan or API error.
