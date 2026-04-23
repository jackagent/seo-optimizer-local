<p align="center">
  <h1 align="center">Sentinel</h1>
  <p align="center"><strong>Enterprise SEO & Compliance Intelligence Platform</strong></p>
  <p align="center">
    Protect your portfolio from legal risk. Monitor SEO health, legal compliance, and data integrity across all your company websites — from a single executive dashboard. Generate SEO-optimized articles with AI images and automate social media outreach across all platforms.
  </p>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> · <a href="#features">Features</a> · <a href="#api-reference">API Reference</a> · <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## The Problem

If you manage a portfolio of companies — as a holding, agency, family office, or advisory firm — every single website is a legal liability. In Germany and the EU, a missing Impressum, an outdated privacy policy, or a non-compliant cookie banner can trigger fines and cease-and-desist letters (Abmahnungen) ranging from 5.000 to 25.000 EUR per incident.

Beyond compliance, growing your portfolio's online presence requires constant content creation and social media outreach — tasks that are time-consuming and expensive when done manually across multiple companies and platforms.

## The Solution

Sentinel is an all-in-one platform that combines compliance monitoring, content creation, and outreach automation:

1. **Compliance Intelligence** — Scan every website for SEO health, legal pages, and data integrity. Get actionable fix instructions.
2. **YouTube SEO Analyzer** — Analyze any YouTube video for SEO optimization, engagement metrics, and improvement opportunities.
3. **Article Generator** — Create SEO-optimized articles with automatically generated hero images using AI.
4. **Social Media Outreach Bot** — Generate professional outreach messages for LinkedIn, Twitter/X, Instagram, Facebook, and Email.

Everything runs locally on your machine. No cloud. No subscription. No data leaves your network.

---

## Quick Start

### Prerequisites

You need **Node.js 18 or higher** installed on your machine. Sentinel runs on **macOS** (Mac Mini M1/M2/M4, MacBook), **Linux**, and **Windows**.

Verify your Node.js version:

```bash
node --version
# Should output v18.x.x or higher
```

**Mac Mini Setup:** If you do not have Node.js installed yet, the fastest way on macOS is:

```bash
# Option A: Download from nodejs.org
# Option B: Install via Homebrew
brew install node
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/jackagent/seo-optimizer-local.git
cd seo-optimizer-local

# 2. Install dependencies (downloads Chromium ~170 MB on first run)
npm install

# 3. Initialize the database
npm run setup

# 4. Load demo companies (recommended for first run)
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser. You will see the dashboard with two pre-loaded demo companies ready to explore.

> **Mac Mini Note:** On macOS, if you see a Gatekeeper warning about Chromium on first scan, run: `xattr -cr node_modules/puppeteer/.local-chromium`

### What Happens During Installation

The `npm install` command downloads all dependencies, including Puppeteer which ships with a bundled Chromium browser (~170 MB on first install). This is used for website scanning and requires no additional configuration.

The `npm run setup` command creates a local SQLite database at `data/seo-optimizer.db` with all required tables (companies, scans, documents, youtube_analyses, articles, outreach_campaigns, settings). All your data stays in this file on your machine.

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

Compares the company details you have stored in the database (Handelsregisternummer, address, directors, VAT number, etc.) against what is actually published on the company's live Impressum page.

Mismatches are flagged with severity levels:

| Severity | Meaning | Example |
|---|---|---|
| **CRITICAL** | Legal risk — data on website contradicts your records | Different company address, wrong director name |
| **WARNING** | Potential issue — data is incomplete or partially different | Missing VAT number on website |
| **INFO** | Minor difference — may be intentional | Slightly different formatting of company name |

### YouTube SEO Analyzer

Analyze any YouTube video for SEO performance. Enter a YouTube URL and Sentinel extracts and scores:

| Metric | What It Measures |
|---|---|
| **Title Score** | Length, keyword density, clickbait detection, emotional triggers |
| **Description Score** | Length, link presence, keyword usage, call-to-action |
| **Tag Score** | Number of tags, relevance, keyword coverage |
| **Engagement Score** | View-to-like ratio, comment engagement, subscriber growth signals |

The analyzer fetches real-time data from YouTube including view count, likes, comments, channel name, thumbnail, duration, publish date, and all tags. Results are stored for comparison over time.

### Article Generator (with AI Image Generation)

Generate SEO-optimized articles with automatically created hero images. Powered by any OpenAI-compatible API (configurable in Settings).

| Feature | Description |
|---|---|
| **Topic Input** | Enter a topic, keywords, and target audience |
| **Tone Selection** | Professional, casual, academic, persuasive, or informative |
| **Language** | German or English article output |
| **Word Count** | Configurable target length (500-5000 words) |
| **Auto Images** | AI-generated hero image included with every article |
| **SEO Optimization** | Meta description, heading structure, keyword density, internal linking suggestions |

Articles are stored in the database and can be viewed, copied, or deleted. Each article includes a generated hero image.

### Social Media Outreach Bot

Generate professional outreach messages for all major social media platforms:

| Platform | Message Types |
|---|---|
| **LinkedIn** | Connection requests, InMail, post comments, engagement messages |
| **Twitter/X** | Tweets, replies, DMs, thread starters |
| **Instagram** | DMs, story replies, post captions, engagement comments |
| **Facebook** | Page posts, group posts, Messenger outreach |
| **Email** | Cold outreach, follow-ups, newsletter intros |

Each campaign includes a primary message, 3 follow-up variations, 5 engaging hooks, and platform-specific formatting with character limits and hashtag suggestions.

### Auto-Learn

When Sentinel scans a website and finds Impressum data, it can automatically populate empty fields in your company records. Auto-Learn never overwrites existing data — it only fills empty fields.

### Fix Prompt Generator

For every company with issues, Sentinel generates a comprehensive AI-ready prompt containing all issues, company context, severity levels, and specific fix instructions. Copy and paste into any AI agent for immediate fixes.

### Document Management

Upload and categorize documents for each company. Categories: Incorporation, Governance, Tax, Legal, Financial, Other. Files are stored locally and never leave your machine.

### Bilingual Interface (German / English)

The entire interface is available in German (default) and English. A one-click toggle in the sidebar footer switches between languages. Over 200 translation keys cover every label, button, tab, modal, and message.

---

## Usage Guide

### Step 1: Explore the Demo

After running `npm run seed`, you have two demo companies. Click on either to explore the detail view with its five tabs: Issues, Legal Compliance, Company Info, Documents, and Scan History.

### Step 2: Add Your Companies

Click **"Unternehmen hinzufuegen"** on the dashboard. Enter the company name and website URL (required), plus optional sector, hosting platform, and description.

### Step 3: Run Scans

Click the scan button on any company card or use **"Alle scannen"** to scan the entire portfolio. Scans take 15-30 seconds per website.

### Step 4: Analyze YouTube Videos

Navigate to **YouTube SEO** in the sidebar. Enter a YouTube URL and optionally select a company to associate it with. Click **Analysieren** and wait for the results.

### Step 5: Generate Articles

Navigate to **Article Generator**. You need to configure your AI provider (Kimi or OpenAI) in **Settings** first. Then enter a topic, select tone and language, and click **Generate Article**. The article is created with an AI-generated hero image.

### Step 6: Create Outreach Campaigns

Navigate to **Outreach Bot**. Configure your AI provider in **Settings** first. Select a platform, enter your target audience and campaign goal, then click **Generate Campaign**. You get a primary message, follow-ups, and hooks.

### Step 7: Configure AI Settings

Navigate to **Settings** in the sidebar. Sentinel supports multiple AI providers out of the box:

#### Pre-configured Providers

| Provider | Best For | API URL | Signup |
|---|---|---|---|
| **Kimi (Moonshot AI)** | Text generation (articles, outreach). Free tier available. | `https://api.moonshot.ai/v1` | [platform.kimi.ai](https://platform.kimi.ai) |
| **OpenAI** | Text generation + DALL-E image generation | `https://api.openai.com/v1` | [platform.openai.com](https://platform.openai.com) |
| **Custom** | Any OpenAI-compatible endpoint (Ollama, LM Studio, Azure, Groq, etc.) | Your endpoint URL | N/A |

#### Recommended Setup for Mac Mini

1. **Text generation:** Use **Kimi** (free tier, excellent quality, 128K context window)
2. **Image generation:** Use **OpenAI** (DALL-E 3 for article hero images)

You can mix providers — e.g., Kimi for text and OpenAI for images. Just enter the respective API keys in the Settings page.

#### Settings Reference

| Setting | Description | Default |
|---|---|---|
| **Provider** | Select Kimi, OpenAI, or Custom | Kimi |
| **API Key** | Your provider's API key | Required for Article Generator and Outreach Bot |
| **API URL** | Auto-filled based on provider selection | `https://api.moonshot.ai/v1` |
| **Model** | Model dropdown with provider-specific options | `moonshot-v1-8k` (Kimi) / `gpt-4o-mini` (OpenAI) |
| **Image API Key** | Separate key for DALL-E image generation | Falls back to text API key |
| **Image API URL** | Base URL for image generation | `https://api.openai.com/v1` |

Use the **Test Connection** button to verify your API key works before generating content.

---

## Available Commands

| Command | Description |
|---|---|
| `npm start` | Start the server on port 3000 (or `PORT` env variable) |
| `npm run dev` | Alias for `npm start` |
| `npm run setup` | Initialize the SQLite database (run once after cloning) |
| `npm run seed` | Load two demo companies with realistic sample data |
| `npm run reset` | Delete all data and reinitialize with fresh demo companies |

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
POST   /api/companies              → Create a company. Body: {"name", "url"} (required), {"sector", "hosting_platform", "description"} (optional)
GET    /api/companies/:id          → Full company details including latest scan, scan history, documents, and company details
PUT    /api/companies/:id          → Update any company fields (partial update supported)
DELETE /api/companies/:id          → Delete company and all associated data
```

### Company Details Endpoints

```
GET    /api/companies/:id/details  → Get stored registration details
PUT    /api/companies/:id/details  → Update registration details (all fields optional)
```

### Scanning Endpoints

```
POST   /api/companies/:id/scan     → Start a scan for one company (runs in background, 15-30s)
GET    /api/companies/:id/scan/latest → Get the latest scan result with parsed issues, legal, cookie, and discrepancy data
GET    /api/companies/:id/scans    → Get full scan history for a company
POST   /api/scan-all               → Scan all companies sequentially
```

### Document Endpoints

```
GET    /api/companies/:id/documents           → List all documents for a company
POST   /api/companies/:companyId/documents    → Upload a document (multipart form data)
DELETE /api/documents/:id                     → Delete a document
```

### Fix Prompt Endpoint

```
GET    /api/companies/:id/fix-prompt → Generate a comprehensive fix prompt for all issues
```

### YouTube SEO Endpoints

```
POST   /api/youtube/analyze        → Analyze a YouTube video. Body: {"url": "https://youtube.com/watch?v=...", "company_id": 1} (company_id optional)
GET    /api/youtube                 → List all YouTube analyses
GET    /api/youtube/:id            → Get a specific YouTube analysis
DELETE /api/youtube/:id            → Delete a YouTube analysis
```

### Article Generator Endpoints

```
POST   /api/articles/generate      → Generate an article with AI. Body: {"topic", "keywords", "tone", "language", "word_count", "company_id"}
GET    /api/articles               → List all generated articles
GET    /api/articles/:id           → Get a specific article
DELETE /api/articles/:id           → Delete an article
```

### Outreach Bot Endpoints

```
GET    /api/outreach/platforms     → Get supported platforms with specs (character limits, features)
POST   /api/outreach/generate     → Generate outreach campaign. Body: {"platform", "target_audience", "campaign_goal", "tone", "language", "company_id"}
GET    /api/outreach              → List all outreach campaigns
GET    /api/outreach/:id          → Get a specific campaign
DELETE /api/outreach/:id          → Delete a campaign
```

### Settings Endpoints

```
GET    /api/settings               → Get all settings (API keys are masked)
PUT    /api/settings               → Update settings. Body: {"llm_provider", "llm_api_key", "llm_base_url", "llm_model", "image_api_key", "image_base_url"}
POST   /api/settings/test-llm     → Test LLM connection with current settings
GET    /api/providers              → Get all available AI provider presets (Kimi, OpenAI, Custom) with models and capabilities
```

### Utility Endpoints

```
POST   /api/seed-demo              → Load demo companies with sample data
```

---

## Data Storage

All data is stored locally on your machine. Nothing is transmitted to external servers (except when using the Article Generator or Outreach Bot, which send requests to your configured OpenAI-compatible API).

| Data | Location | Format |
|---|---|---|
| Database | `data/seo-optimizer.db` | SQLite |
| Uploaded documents | `data/uploads/{companyId}/` | Original files |
| Application code | `public/` and `server/` | JavaScript, HTML, CSS |

The `data/` directory is created automatically on first run and is excluded from git via `.gitignore`.

### Backup

```bash
cp -r data/ ~/sentinel-backup-$(date +%Y%m%d)/
```

### Reset

```bash
npm run reset
```

---

## Database Schema

Sentinel uses eight tables in SQLite:

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
| company_number | TEXT | Handelsregisternummer |
| company_type | TEXT | Rechtsform (GmbH, UG, AG, etc.) |
| registered_address | TEXT | Official registered address |
| jurisdiction | TEXT | Registergericht |
| incorporation_date | TEXT | Gruendungsdatum |
| vat_number | TEXT | USt-IdNr. |
| registered_email | TEXT | Official email |
| registered_phone | TEXT | Official phone |
| lead_director | TEXT | Geschaeftsfuehrer |
| lead_director_title | TEXT | Title |
| local_director | TEXT | Local director |
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
| meta_score, content_score, technical_score, legal_score | INTEGER | Dimension scores |
| has_impressum, has_privacy_policy, has_terms_of_service | INTEGER | 0 or 1 |
| impressum_completeness | INTEGER | Completeness percentage |
| pages_crawled | INTEGER | Number of pages visited |
| issues_json, legal_json, cookie_json, discrepancies_json, scan_data_json | TEXT | JSON data |
| created_at, completed_at | TEXT | Timestamps |

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

### youtube_analyses

| Column | Type | Description |
|---|---|---|
| id | INTEGER (PK) | Auto-increment ID |
| company_id | INTEGER | Optional company association |
| video_url | TEXT | YouTube video URL |
| video_id | TEXT | YouTube video ID |
| video_title | TEXT | Video title |
| channel_name | TEXT | Channel name |
| thumbnail_url | TEXT | Thumbnail URL |
| view_count | INTEGER | View count |
| like_count | INTEGER | Like count |
| comment_count | INTEGER | Comment count |
| duration | TEXT | Video duration |
| published_at | TEXT | Publish date |
| description | TEXT | Video description |
| tags_json | TEXT | JSON array of tags |
| seo_score | INTEGER | Overall SEO score (0-100) |
| title_score, description_score, tag_score, engagement_score | INTEGER | Sub-scores |
| issues_json | TEXT | JSON array of SEO issues |
| status | TEXT | analyzing, completed, failed |
| created_at | TEXT | Analysis timestamp |

### articles

| Column | Type | Description |
|---|---|---|
| id | INTEGER (PK) | Auto-increment ID |
| company_id | INTEGER | Optional company association |
| topic | TEXT | Article topic |
| keywords | TEXT | Target keywords |
| tone | TEXT | Writing tone |
| language | TEXT | Article language (de/en) |
| word_count | INTEGER | Target word count |
| title | TEXT | Generated article title |
| content | TEXT | Generated article content (Markdown) |
| meta_description | TEXT | Generated meta description |
| hero_image_url | TEXT | AI-generated hero image URL |
| seo_score | INTEGER | Article SEO score |
| status | TEXT | generating, completed, failed |
| created_at | TEXT | Generation timestamp |

### outreach_campaigns

| Column | Type | Description |
|---|---|---|
| id | INTEGER (PK) | Auto-increment ID |
| company_id | INTEGER | Optional company association |
| platform | TEXT | Target platform (linkedin, twitter, instagram, facebook, email) |
| target_audience | TEXT | Target audience description |
| campaign_goal | TEXT | Campaign objective |
| tone | TEXT | Message tone |
| language | TEXT | Message language (de/en) |
| primary_message | TEXT | Main outreach message |
| follow_ups_json | TEXT | JSON array of follow-up messages |
| hooks_json | TEXT | JSON array of engaging hooks |
| hashtags_json | TEXT | JSON array of suggested hashtags |
| status | TEXT | generating, completed, failed |
| created_at | TEXT | Generation timestamp |

### settings

| Column | Type | Description |
|---|---|---|
| key | TEXT (PK) | Setting key |
| value | TEXT | Setting value |
| updated_at | TEXT | Last update timestamp |

---

## File Structure

```
seo-optimizer-local/
├── server/
│   ├── index.js              Express server with all API routes
│   ├── db.js                 SQLite database helpers (CRUD for all tables)
│   ├── scanner.js            Puppeteer-based website scanner
│   ├── discrepancy.js        Discrepancy detection engine
│   ├── youtube-analyzer.js   YouTube video SEO analyzer
│   ├── article-generator.js  AI article generator with image generation
│   ├── outreach-bot.js       Social media outreach message generator
│   ├── llm.js                OpenAI-compatible LLM client
│   ├── setup-db.js           Database schema initialization (8 tables)
│   └── seed-demo.js          Demo company data seeder
├── public/
│   ├── index.html            Single-page application shell
│   ├── css/
│   │   └── style.css         Executive dark-theme dashboard styles
│   └── js/
│       ├── app.js            Frontend application (SPA routing, rendering, interactions)
│       └── i18n.js           German/English translations (200+ keys)
├── data/                     Created on first run (gitignored)
│   ├── seo-optimizer.db      SQLite database
│   └── uploads/              Uploaded company documents
├── SKILL.md                  OpenClaw/Manus agent integration guide
├── CHANGELOG.md              Version history
├── CONTRIBUTING.md           Contribution guidelines
├── LICENSE                   License information
├── package.json              Dependencies and scripts
└── .gitignore                Git exclusions
```

---

## Troubleshooting

### "Chromium revision is not downloaded"

Puppeteer needs to download Chromium on first install. If this fails, run:

```bash
npx puppeteer browsers install chrome
```

### macOS Gatekeeper blocks Chromium

On Mac Mini or MacBook, macOS may block the bundled Chromium:

```bash
xattr -cr node_modules/puppeteer/.local-chromium
```

### "EACCES: permission denied" on Linux

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Scan fails with "Navigation timeout"

Some websites block headless browsers or load very slowly. The scan will be marked as "failed" and you can retry later.

### Port 3000 is already in use

```bash
PORT=8080 npm start
```

### Database is corrupted

```bash
npm run reset
```

### Article Generator or Outreach Bot shows "API Key Required"

Navigate to **Settings** in the sidebar, select your provider (Kimi or OpenAI), and enter your API key. Use the **Test Connection** button to verify it works. Recommended: Use **Kimi** (free tier at platform.kimi.ai) for text generation and **OpenAI** for image generation. Any OpenAI-compatible API also works (Ollama, LM Studio, Azure, Groq, etc.).

### Server crashes during scan

This was fixed in v2.1.0. The server includes global error handling and will never crash from a failed scan. Update to the latest version if needed.

### Language does not switch

Clear your browser's localStorage and reload:

```javascript
// In browser console:
localStorage.removeItem('sentinel-lang');
location.reload();
```

---

## OpenClaw / Manus Skill Installation

Sentinel works as an AI agent skill. After installation via OpenClaw, the agent can start the server, interact with the API, and open the dashboard in the browser.

See [SKILL.md](SKILL.md) for the full agent integration guide with API reference and example commands.

---

## Security Considerations

Sentinel is designed for local use on trusted networks:

- The web interface has no authentication. Anyone on your network who can reach port 3000 can access the dashboard.
- If you need remote access, use an SSH tunnel or VPN rather than exposing the port directly.
- API keys for the Article Generator and Outreach Bot are stored in the local SQLite database. They are never transmitted except to the configured API endpoint.
- Scans make outbound HTTP requests to the websites you configure. No data is sent to any other destination.
- Uploaded documents are stored as files on disk. Ensure appropriate filesystem permissions.

---

## License

Proprietary. All rights reserved by EX Venture.

For licensing inquiries, contact the EX Venture team.
