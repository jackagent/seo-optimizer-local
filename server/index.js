const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./db');
const { scanWebsite } = require('./scanner');
const { detectDiscrepancies } = require('./discrepancy');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const companyDir = path.join(UPLOAD_DIR, req.params.companyId || 'general');
    fs.mkdirSync(companyDir, { recursive: true });
    cb(null, companyDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ==================== API ROUTES ====================

// --- Dashboard ---
app.get('/api/dashboard/stats', (req, res) => {
  res.json(db.getDashboardStats());
});

app.get('/api/dashboard/companies', (req, res) => {
  const companies = db.getAllCompanies();
  const result = companies.map(c => {
    const scan = db.getLatestScan(c.id);
    return { ...c, latestScan: scan || null };
  });
  res.json(result);
});

app.get('/api/dashboard/discrepancies', (req, res) => {
  res.json(db.getAllDiscrepancies());
});

// --- Companies ---
app.get('/api/companies', (req, res) => {
  res.json(db.getAllCompanies());
});

app.get('/api/companies/:id', (req, res) => {
  const company = db.getCompanyById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const details = db.getCompanyDetails(company.id);
  const latestScan = db.getLatestScan(company.id);
  const scanHistory = db.getScanHistory(company.id);
  const documents = db.getDocuments(company.id);

  res.json({ ...company, details, latestScan, scanHistory, documents });
});

app.post('/api/companies', (req, res) => {
  const { name, url, description, sector, hosting_platform } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });
  const company = db.createCompany({ name, url, description, sector, hosting_platform });
  res.json(company);
});

app.put('/api/companies/:id', (req, res) => {
  const { name, url, description, sector, hosting_platform } = req.body;
  db.updateCompany(req.params.id, { name, url, description, sector, hosting_platform });
  res.json({ success: true });
});

app.delete('/api/companies/:id', (req, res) => {
  db.deleteCompany(req.params.id);
  res.json({ success: true });
});

// --- Company Details ---
app.get('/api/companies/:id/details', (req, res) => {
  const details = db.getCompanyDetails(req.params.id);
  res.json(details || {});
});

app.put('/api/companies/:id/details', (req, res) => {
  db.upsertCompanyDetails(parseInt(req.params.id), req.body);
  res.json({ success: true });
});

// --- Scanning ---
app.post('/api/companies/:id/scan', async (req, res) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const scanId = db.createScan(companyId);
  res.json({ scanId, status: 'running', message: 'Scan started' });

  // Run scan in background
  try {
    const result = await scanWebsite(company.url);

    if (result.status === 'failed') {
      db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() });
      return;
    }

    // Update hosting platform if detected
    if (result.hostingPlatform && result.hostingPlatform !== 'custom') {
      db.updateCompany(companyId, { ...company, hosting_platform: result.hostingPlatform });
    }

    // Discrepancy detection
    const dbDetails = db.getCompanyDetails(companyId);
    const { discrepancies, autoLearn } = detectDiscrepancies(dbDetails, result.impressumData);

    // Auto-learn: populate empty fields from Impressum
    if (autoLearn && Object.keys(autoLearn).length > 0) {
      db.upsertCompanyDetails(companyId, autoLearn);
      console.log(`[Auto-Learn] Company ${companyId}: populated ${Object.keys(autoLearn).join(', ')}`);
    }

    db.updateScan(scanId, {
      status: 'completed',
      overall_score: result.overallScore,
      meta_score: result.metaScore,
      content_score: result.contentScore,
      technical_score: result.technicalScore,
      legal_score: result.legalScore,
      has_impressum: result.hasImpressum ? 1 : 0,
      has_privacy_policy: result.hasPrivacyPolicy ? 1 : 0,
      has_terms_of_service: result.hasTermsOfService ? 1 : 0,
      impressum_completeness: result.impressumCompleteness,
      pages_crawled: result.pagesCrawled,
      issues_json: JSON.stringify(result.issues),
      legal_json: JSON.stringify(result.legal),
      cookie_json: JSON.stringify(result.cookie),
      discrepancies_json: JSON.stringify(discrepancies),
      scan_data_json: JSON.stringify(result.scanData),
      completed_at: new Date().toISOString()
    });

    console.log(`[Scan Complete] ${company.name} (${company.url}): Score ${result.overallScore}, ${discrepancies.length} discrepancies`);
  } catch (err) {
    console.error(`[Scan Error] ${company.name}:`, err.message);
    db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() });
  }
});

app.post('/api/scan-all', async (req, res) => {
  const companies = db.getAllCompanies();
  const scanIds = companies.map(c => ({ companyId: c.id, scanId: db.createScan(c.id) }));
  res.json({ message: `${companies.length} scans queued`, scans: scanIds });

  // Run sequentially in background
  for (const { companyId, scanId } of scanIds) {
    const company = db.getCompanyById(companyId);
    try {
      const result = await scanWebsite(company.url);
      if (result.status === 'failed') {
        db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() });
        continue;
      }

      if (result.hostingPlatform && result.hostingPlatform !== 'custom') {
        db.updateCompany(companyId, { ...company, hosting_platform: result.hostingPlatform });
      }

      const dbDetails = db.getCompanyDetails(companyId);
      const { discrepancies, autoLearn } = detectDiscrepancies(dbDetails, result.impressumData);
      if (autoLearn && Object.keys(autoLearn).length > 0) {
        db.upsertCompanyDetails(companyId, autoLearn);
      }

      db.updateScan(scanId, {
        status: 'completed',
        overall_score: result.overallScore,
        meta_score: result.metaScore,
        content_score: result.contentScore,
        technical_score: result.technicalScore,
        legal_score: result.legalScore,
        has_impressum: result.hasImpressum ? 1 : 0,
        has_privacy_policy: result.hasPrivacyPolicy ? 1 : 0,
        has_terms_of_service: result.hasTermsOfService ? 1 : 0,
        impressum_completeness: result.impressumCompleteness,
        pages_crawled: result.pagesCrawled,
        issues_json: JSON.stringify(result.issues),
        legal_json: JSON.stringify(result.legal),
        cookie_json: JSON.stringify(result.cookie),
        discrepancies_json: JSON.stringify(discrepancies),
        scan_data_json: JSON.stringify(result.scanData),
        completed_at: new Date().toISOString()
      });
      console.log(`[Scan Complete] ${company.name}: Score ${result.overallScore}`);
    } catch (err) {
      console.error(`[Scan Error] ${company.name}:`, err.message);
      db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() });
    }
  }
});

// --- Scan Results ---
app.get('/api/companies/:id/scans', (req, res) => {
  res.json(db.getScanHistory(req.params.id));
});

app.get('/api/companies/:id/scan/latest', (req, res) => {
  const scan = db.getLatestScan(req.params.id);
  if (!scan) return res.status(404).json({ error: 'No scans found' });
  // Parse JSON fields
  scan.issues = JSON.parse(scan.issues_json || '[]');
  scan.legal = JSON.parse(scan.legal_json || '{}');
  scan.cookie = JSON.parse(scan.cookie_json || '{}');
  scan.discrepancies = JSON.parse(scan.discrepancies_json || '[]');
  scan.scanData = JSON.parse(scan.scan_data_json || '{}');
  res.json(scan);
});

// --- Documents ---
app.get('/api/companies/:id/documents', (req, res) => {
  res.json(db.getDocuments(req.params.id));
});

app.post('/api/companies/:companyId/documents', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const docId = db.addDocument(parseInt(req.params.companyId), {
    file_name: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size,
    mime_type: req.file.mimetype,
    category: req.body.category || 'other',
    description: req.body.description || null
  });
  res.json({ id: docId, fileName: req.file.originalname });
});

app.delete('/api/documents/:id', (req, res) => {
  db.deleteDocument(req.params.id);
  res.json({ success: true });
});

// --- Fix Prompt Generator ---
app.get('/api/companies/:id/fix-prompt', (req, res) => {
  const company = db.getCompanyById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const scan = db.getLatestScan(company.id);
  if (!scan) return res.status(404).json({ error: 'No scan data available' });

  const issues = JSON.parse(scan.issues_json || '[]');
  const details = db.getCompanyDetails(company.id);

  let prompt = `FIX ALL ISSUES FOR: ${company.name}\n`;
  prompt += `Website: ${company.url}\n`;
  if (company.hosting_platform) prompt += `Platform: ${company.hosting_platform}\n`;
  prompt += `Current SEO Score: ${scan.overall_score}/100\n\n`;

  if (details) {
    prompt += `COMPANY DETAILS:\n`;
    if (details.company_number) prompt += `- Registration: ${details.company_number}\n`;
    if (details.registered_address) prompt += `- Address: ${details.registered_address}\n`;
    if (details.lead_director) prompt += `- Director: ${details.lead_director}\n`;
    if (details.vat_number) prompt += `- VAT: ${details.vat_number}\n`;
    if (details.registered_email) prompt += `- Email: ${details.registered_email}\n`;
    prompt += `\n`;
  }

  prompt += `ISSUES TO FIX (${issues.length} total):\n\n`;

  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

  if (critical.length > 0) {
    prompt += `CRITICAL (${critical.length}):\n`;
    critical.forEach((issue, i) => {
      prompt += `${i + 1}. ${issue.title}\n   ${issue.description}\n   Fix: ${issue.fix}\n\n`;
    });
  }

  if (warnings.length > 0) {
    prompt += `WARNINGS (${warnings.length}):\n`;
    warnings.forEach((issue, i) => {
      prompt += `${i + 1}. ${issue.title}\n   ${issue.description}\n   Fix: ${issue.fix}\n\n`;
    });
  }

  if (info.length > 0) {
    prompt += `INFO (${info.length}):\n`;
    info.forEach((issue, i) => {
      prompt += `${i + 1}. ${issue.title}\n   ${issue.description}\n   Fix: ${issue.fix}\n\n`;
    });
  }

  prompt += `Please fix ALL of the above issues on ${company.url}. Prioritize critical issues first.`;

  res.json({ prompt, issueCount: issues.length, critical: critical.length, warnings: warnings.length });
});

// --- Seed Demo ---
app.post('/api/seed-demo', (req, res) => {
  try {
    const allCompanies = db.getAllCompanies();
    const existing = allCompanies.find(c => c.name && c.name.includes('(Demo)'));
    if (existing) {
      return res.json({ success: true, message: 'Demo company already exists' });
    }
    const company = db.createCompany({
      name: 'Meridian Ventures GmbH (Demo)',
      url: 'example.com',
      sector: 'Venture Capital',
      hosting_platform: 'Custom',
      description: 'A demo company to explore Sentinel features. Delete anytime.'
    });
    db.upsertCompanyDetails(company.id, {
      company_number: 'HRB 218456',
      company_type: 'GmbH',
      jurisdiction: 'Amtsgericht M\u00fcnchen',
      registered_address: 'Maximilianstra\u00dfe 35a, 80539 M\u00fcnchen',
      incorporation_date: '15.03.2021',
      vat_number: 'DE345678901',
      registered_email: 'info@meridian-ventures.de',
      registered_phone: '+49 89 2180 7700',
      lead_director: 'Dr. Alexander Hartmann',
      lead_director_title: 'Gesch\u00e4ftsf\u00fchrer'
    });
    const scanId = db.createScan(company.id);
    db.updateScan(scanId, {
      status: 'completed',
      overall_score: 68,
      meta_score: 65,
      content_score: 70,
      technical_score: 78,
      legal_score: 58,
      has_impressum: 1,
      has_privacy_policy: 1,
      has_terms_of_service: 0,
      impressum_completeness: 72,
      pages_crawled: 4,
      issues_json: JSON.stringify([
        { severity: 'critical', category: 'legal', title: 'Missing Cookie Consent Banner', description: 'No cookie consent banner detected.', fix: 'Implement a GDPR-compliant cookie consent banner.' },
        { severity: 'warning', category: 'legal', title: 'Missing Terms of Service', description: 'No terms of service page found.', fix: 'Create AGB/Terms of Service page.' },
        { severity: 'warning', category: 'meta', title: 'Meta Description Too Short', description: 'Meta description is only 78 characters.', fix: 'Expand to 120-160 characters.' },
        { severity: 'warning', category: 'content', title: 'Multiple H1 Tags', description: 'Found 3 H1 headings.', fix: 'Consolidate to a single H1.' },
        { severity: 'info', category: 'meta', title: 'Missing Open Graph Tags', description: 'No OG title or image found.', fix: 'Add Open Graph meta tags.' }
      ]),
      legal_json: JSON.stringify({ impressum: { exists: true, url: 'https://example.com/impressum' }, privacy: { exists: true, url: 'https://example.com/datenschutz' } }),
      cookie_json: JSON.stringify({ detected: false, score: 0 }),
      discrepancies_json: JSON.stringify([{ field: 'Registered Address', dbField: 'registered_address', dbValue: 'Maximilianstra\u00dfe 35a, 80539 M\u00fcnchen', websiteValue: 'Maximilianstr. 35a, 80539 M\u00fcnchen, Deutschland', severity: 'critical' }]),
      scan_data_json: '{}',
      completed_at: new Date().toISOString()
    });
    res.json({ success: true, companyId: company.id });
  } catch (err) {
    console.error('Seed demo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Serve frontend ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  SEO & Compliance Optimizer running at http://localhost:${PORT}\n`);
});
