# Contributing to Sentinel

Thank you for your interest in contributing to Sentinel. This document provides guidelines for contributing to the project.

---

## Development Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/jackagent/seo-optimizer-local.git
cd seo-optimizer-local
npm install
npm run setup
npm run seed
npm start
```

The server starts at http://localhost:3000 with hot-reload disabled. Restart the server manually after making changes to server files. Frontend changes (HTML, CSS, JS in `public/`) are served statically and take effect on browser reload.

---

## Project Structure

The project follows a clean separation between server-side logic and the frontend single-page application.

| Directory | Purpose |
|---|---|
| `server/` | Express API server, database helpers, scanner engine, discrepancy detection |
| `public/` | Static frontend files — HTML shell, CSS, JavaScript SPA, i18n translations |
| `data/` | Runtime data directory (SQLite database, uploaded documents). Gitignored. |

### Server Files

**index.js** is the Express server with all API routes. Keep routes organized by resource (dashboard, companies, scans, documents).

**db.js** contains all SQLite database operations. Every database interaction goes through this file.

**scanner.js** is the Puppeteer-based website scanner. It launches a headless browser, navigates to the target URL, and evaluates SEO and legal compliance.

**discrepancy.js** compares stored company details against live Impressum data using fuzzy string matching.

**setup-db.js** creates the database schema. Run once after cloning.

**seed-demo.js** inserts demo companies with realistic scan results and discrepancies.

### Frontend Files

**index.html** is the SPA shell with sidebar navigation and content area.

**app.js** handles all client-side routing, API calls, rendering, and user interactions.

**i18n.js** contains all German and English translation strings. When adding new UI text, add keys to both language objects.

---

## Adding New Features

### Adding a New Scanner Check

1. Add the check logic in `server/scanner.js` inside the `scanWebsite()` function
2. Include the result in the appropriate score dimension (meta, content, technical, or legal)
3. Add an issue object if the check fails: `{ title, description, severity, fix, category }`
4. Update the score calculation weights if needed

### Adding a New API Endpoint

1. Add the route in `server/index.js`
2. Add any required database operations in `server/db.js`
3. Test with curl or the browser

### Adding New Translations

1. Open `public/js/i18n.js`
2. Add the new key to both the `de` and `en` objects
3. Use the key in HTML with `data-i18n="your_key"` or in JavaScript with `t('your_key')`

---

## Code Style

The project uses vanilla JavaScript (ES6+) without a build step. Keep it simple:

- Use `const` and `let`, never `var`
- Use template literals for string interpolation
- Use async/await for asynchronous operations
- Keep functions focused and under 50 lines where possible
- Add comments for non-obvious logic

---

## Testing

Currently, testing is manual. Run the server, seed demo data, and verify features in the browser. When adding new scanner checks, test against real websites to ensure accuracy.

```bash
npm run reset    # Fresh start with demo data
npm start        # Start server
# Open http://localhost:3000 and verify
```

---

## Submitting Changes

1. Create a feature branch from `master`
2. Make your changes with clear, descriptive commit messages
3. Test thoroughly with demo data and at least one real website
4. Submit a pull request with a description of what changed and why
