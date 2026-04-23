const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./db');
const { scanWebsite } = require('./scanner');
const { detectDiscrepancies } = require('./discrepancy');
const { analyzeYoutubeVideo } = require('./youtube-analyzer');
const { generateArticle } = require('./article-generator');
const { generateOutreach, getPlatformSpecs } = require('./outreach-bot');
const llm = require('./llm');

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

// ==================== DASHBOARD ====================

app.get('/api/dashboard/stats', (req, res) => {
  try {
    res.json(db.getDashboardStats());
  } catch (err) {
    console.error('[API Error] /api/dashboard/stats:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.get('/api/dashboard/companies', (req, res) => {
  try {
    const companies = db.getAllCompanies();
    const result = companies.map(c => {
      const scan = db.getLatestScan(c.id);
      return { ...c, latestScan: scan || null };
    });
    res.json(result);
  } catch (err) {
    console.error('[API Error] /api/dashboard/companies:', err.message);
    res.status(500).json({ error: 'Failed to load companies' });
  }
});

app.get('/api/dashboard/discrepancies', (req, res) => {
  try {
    res.json(db.getAllDiscrepancies());
  } catch (err) {
    console.error('[API Error] /api/dashboard/discrepancies:', err.message);
    res.status(500).json({ error: 'Failed to load discrepancies' });
  }
});

// ==================== COMPANIES ====================

app.get('/api/companies', (req, res) => {
  try {
    res.json(db.getAllCompanies());
  } catch (err) {
    console.error('[API Error] GET /api/companies:', err.message);
    res.status(500).json({ error: 'Failed to load companies' });
  }
});

app.get('/api/companies/:id', (req, res) => {
  try {
    const company = db.getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const details = db.getCompanyDetails(company.id);
    const latestScan = db.getLatestScan(company.id);
    const scanHistory = db.getScanHistory(company.id);
    const documents = db.getDocuments(company.id);
    res.json({ ...company, details, latestScan, scanHistory, documents });
  } catch (err) {
    console.error('[API Error] GET /api/companies/:id:', err.message);
    res.status(500).json({ error: 'Failed to load company' });
  }
});

app.post('/api/companies', (req, res) => {
  try {
    const { name, url, description, sector, hosting_platform } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });
    const company = db.createCompany({ name, url, description, sector, hosting_platform });
    res.json(company);
  } catch (err) {
    console.error('[API Error] POST /api/companies:', err.message);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    db.updateCompany(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('[API Error] PUT /api/companies/:id:', err.message);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    db.deleteCompany(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/companies/:id:', err.message);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// ==================== COMPANY DETAILS ====================

app.get('/api/companies/:id/details', (req, res) => {
  try {
    const details = db.getCompanyDetails(req.params.id);
    res.json(details || {});
  } catch (err) {
    console.error('[API Error] GET /api/companies/:id/details:', err.message);
    res.status(500).json({ error: 'Failed to load details' });
  }
});

app.put('/api/companies/:id/details', (req, res) => {
  try {
    db.upsertCompanyDetails(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('[API Error] PUT /api/companies/:id/details:', err.message);
    res.status(500).json({ error: 'Failed to update details' });
  }
});

// ==================== SCANNING ====================

app.post('/api/companies/:id/scan', async (req, res) => {
  const companyId = parseInt(req.params.id);
  try {
    const company = db.getCompanyById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const scanId = db.createScan(companyId);
    res.json({ scanId, status: 'running', message: 'Scan started' });

    (async () => {
      try {
        const result = await scanWebsite(company.url);
        if (result.status === 'failed') {
          db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() });
          console.log(`[Scan Failed] ${company.name}: ${result.error || 'Unknown error'}`);
          return;
        }
        if (result.hostingPlatform && result.hostingPlatform !== 'custom') {
          try { db.updateCompany(companyId, { hosting_platform: result.hostingPlatform }); } catch (e) {}
        }
        const dbDetails = db.getCompanyDetails(companyId);
        const { discrepancies, autoLearn } = detectDiscrepancies(dbDetails, result.impressumData);
        if (autoLearn && Object.keys(autoLearn).length > 0) {
          try { db.upsertCompanyDetails(companyId, autoLearn); } catch (e) {}
        }
        db.updateScan(scanId, {
          status: 'completed',
          overall_score: result.overallScore, meta_score: result.metaScore,
          content_score: result.contentScore, technical_score: result.technicalScore,
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
        try { db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() }); } catch (e) {}
      }
    })();
  } catch (err) {
    console.error('[API Error] POST /api/companies/:id/scan:', err.message);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

app.post('/api/scan-all', async (req, res) => {
  try {
    const companies = db.getAllCompanies();
    const scanIds = [];
    for (const c of companies) {
      try {
        const scanId = db.createScan(c.id);
        scanIds.push({ companyId: c.id, scanId });
      } catch (e) {}
    }
    res.json({ message: `${scanIds.length} scans queued`, scans: scanIds });

    (async () => {
      for (const { companyId, scanId } of scanIds) {
        const company = db.getCompanyById(companyId);
        try {
          const result = await scanWebsite(company.url);
          if (result.status === 'failed') {
            db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() });
            continue;
          }
          if (result.hostingPlatform && result.hostingPlatform !== 'custom') {
            try { db.updateCompany(companyId, { hosting_platform: result.hostingPlatform }); } catch (e) {}
          }
          const dbDetails = db.getCompanyDetails(companyId);
          const { discrepancies, autoLearn } = detectDiscrepancies(dbDetails, result.impressumData);
          if (autoLearn && Object.keys(autoLearn).length > 0) {
            try { db.upsertCompanyDetails(companyId, autoLearn); } catch (e) {}
          }
          db.updateScan(scanId, {
            status: 'completed',
            overall_score: result.overallScore, meta_score: result.metaScore,
            content_score: result.contentScore, technical_score: result.technicalScore,
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
          console.log(`[Scan-All] Complete: ${company.name} — Score ${result.overallScore}`);
        } catch (err) {
          console.error(`[Scan-All Error] ${company.name}:`, err.message);
          try { db.updateScan(scanId, { status: 'failed', completed_at: new Date().toISOString() }); } catch (e) {}
        }
      }
    })();
  } catch (err) {
    console.error('[API Error] POST /api/scan-all:', err.message);
    res.status(500).json({ error: 'Failed to start scan-all' });
  }
});

app.get('/api/companies/:id/scans', (req, res) => {
  try { res.json(db.getScanHistory(req.params.id)); }
  catch (err) { res.status(500).json({ error: 'Failed to load scan history' }); }
});

app.get('/api/companies/:id/scan/latest', (req, res) => {
  try {
    const scan = db.getLatestScan(req.params.id);
    if (!scan) return res.status(404).json({ error: 'No scans found' });
    scan.issues = JSON.parse(scan.issues_json || '[]');
    scan.legal = JSON.parse(scan.legal_json || '{}');
    scan.cookie = JSON.parse(scan.cookie_json || '{}');
    scan.discrepancies = JSON.parse(scan.discrepancies_json || '[]');
    scan.scanData = JSON.parse(scan.scan_data_json || '{}');
    res.json(scan);
  } catch (err) { res.status(500).json({ error: 'Failed to load latest scan' }); }
});

// ==================== DOCUMENTS ====================

app.get('/api/companies/:id/documents', (req, res) => {
  try { res.json(db.getDocuments(req.params.id)); }
  catch (err) { res.status(500).json({ error: 'Failed to load documents' }); }
});

app.post('/api/companies/:companyId/documents', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const docId = db.addDocument(parseInt(req.params.companyId), {
      file_name: req.file.originalname, file_path: req.file.path,
      file_size: req.file.size, mime_type: req.file.mimetype,
      category: req.body.category || 'other', description: req.body.description || null
    });
    res.json({ id: docId, fileName: req.file.originalname });
  } catch (err) { res.status(500).json({ error: 'Failed to upload document' }); }
});

app.delete('/api/documents/:id', (req, res) => {
  try { db.deleteDocument(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete document' }); }
});

// ==================== FIX PROMPT ====================

app.get('/api/companies/:id/fix-prompt', (req, res) => {
  try {
    const company = db.getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const scan = db.getLatestScan(company.id);
    if (!scan) return res.status(404).json({ error: 'No scan data available' });
    const issues = JSON.parse(scan.issues_json || '[]');
    const details = db.getCompanyDetails(company.id);

    let prompt = `FIX ALL ISSUES FOR: ${company.name}\nWebsite: ${company.url}\n`;
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
    if (critical.length > 0) { prompt += `CRITICAL (${critical.length}):\n`; critical.forEach((issue, i) => { prompt += `${i+1}. ${issue.title}\n   ${issue.description}\n   Fix: ${issue.fix}\n\n`; }); }
    if (warnings.length > 0) { prompt += `WARNINGS (${warnings.length}):\n`; warnings.forEach((issue, i) => { prompt += `${i+1}. ${issue.title}\n   ${issue.description}\n   Fix: ${issue.fix}\n\n`; }); }
    if (info.length > 0) { prompt += `INFO (${info.length}):\n`; info.forEach((issue, i) => { prompt += `${i+1}. ${issue.title}\n   ${issue.description}\n   Fix: ${issue.fix}\n\n`; }); }
    prompt += `Please fix ALL of the above issues on ${company.url}. Prioritize critical issues first.`;
    res.json({ prompt, issueCount: issues.length, critical: critical.length, warnings: warnings.length });
  } catch (err) { res.status(500).json({ error: 'Failed to generate fix prompt' }); }
});

// ==================== YOUTUBE SEO ANALYZER ====================

app.post('/api/youtube/analyze', async (req, res) => {
  try {
    const { url, companyId } = req.body;
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

    // Create DB record
    const analysisId = db.createYoutubeAnalysis({ youtube_url: url, company_id: companyId || null });
    res.json({ id: analysisId, status: 'analyzing', message: 'YouTube analysis started' });

    // Run analysis in background
    (async () => {
      try {
        const result = await analyzeYoutubeVideo(url);
        if (result.status === 'failed') {
          db.updateYoutubeAnalysis(analysisId, { status: 'failed', analysis_data_json: JSON.stringify({ error: result.error }) });
          return;
        }
        db.updateYoutubeAnalysis(analysisId, {
          status: 'completed',
          channel_name: result.channelName || '',
          video_title: result.videoTitle || '',
          video_description: result.videoDescription || '',
          tags_json: JSON.stringify(result.tags || []),
          thumbnail_url: result.thumbnailUrl || '',
          view_count: result.viewCount || 0,
          like_count: result.likeCount || 0,
          comment_count: result.commentCount || 0,
          duration: result.duration || '',
          published_at: result.publishedAt || '',
          seo_score: result.seoScore || 0,
          issues_json: JSON.stringify(result.issues || []),
          recommendations_json: JSON.stringify(result.recommendations || []),
          analysis_data_json: JSON.stringify(result.scores || {})
        });
        console.log(`[YouTube] Analyzed: ${result.videoTitle} — Score ${result.seoScore}`);
      } catch (err) {
        console.error('[YouTube Error]', err.message);
        try { db.updateYoutubeAnalysis(analysisId, { status: 'failed' }); } catch (e) {}
      }
    })();
  } catch (err) {
    console.error('[API Error] POST /api/youtube/analyze:', err.message);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

app.get('/api/youtube', (req, res) => {
  try { res.json(db.getAllYoutubeAnalyses()); }
  catch (err) { res.status(500).json({ error: 'Failed to load analyses' }); }
});

app.get('/api/youtube/:id', (req, res) => {
  try {
    const analysis = db.getYoutubeAnalysis(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: 'Failed to load analysis' }); }
});

app.delete('/api/youtube/:id', (req, res) => {
  try { db.deleteYoutubeAnalysis(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete analysis' }); }
});

// ==================== ARTICLE GENERATOR ====================

app.post('/api/articles/generate', async (req, res) => {
  try {
    const { topic, keywords, platform, tone, language, company_id, companyName, companyUrl, include_images } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    if (!llm.isConfigured()) {
      return res.status(400).json({ error: 'API key not configured. Go to Settings to add your OpenAI API key.', needsConfig: true });
    }

    const result = await generateArticle({
      topic,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
      platform: platform || 'blog',
      tone: tone || 'professional',
      language: language || 'de',
      companyName: companyName || '',
      companyUrl: companyUrl || '',
      includeImages: include_images || false
    });

    const articleId = db.createArticle({
      company_id: company_id || null,
      title: result.title,
      content: result.content,
      summary: result.summary,
      keywords_json: JSON.stringify(result.keywords || []),
      platform: result.platform,
      tone: result.tone,
      language: result.language,
      word_count: result.wordCount,
      seo_score: result.seoScore,
      hero_image_url: result.heroImageUrl,
      hero_image_prompt: result.heroImagePrompt,
      inline_images_json: JSON.stringify(result.inlineImages || []),
      status: 'published'
    });

    console.log(`[Article] Generated: "${result.title}" — ${result.wordCount} words, SEO ${result.seoScore}`);
    res.json({ id: articleId, ...result });
  } catch (err) {
    console.error('[API Error] POST /api/articles/generate:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate article' });
  }
});

// Synchronous generation endpoint (simpler for local use)
app.post('/api/articles/create', async (req, res) => {
  try {
    const { topic, keywords, platform, tone, language, companyId, companyName, companyUrl, includeImages } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    if (!llm.isConfigured()) {
      return res.status(400).json({ error: 'API key not configured. Go to Settings to add your OpenAI API key.', needsConfig: true });
    }

    const result = await generateArticle({
      topic,
      keywords: keywords || [],
      platform: platform || 'blog',
      tone: tone || 'professional',
      language: language || 'de',
      companyName: companyName || '',
      companyUrl: companyUrl || '',
      includeImages: includeImages || false
    });

    const articleId = db.createArticle({
      company_id: companyId || null,
      title: result.title,
      content: result.content,
      summary: result.summary,
      keywords_json: JSON.stringify(result.keywords || []),
      platform: result.platform,
      tone: result.tone,
      language: result.language,
      word_count: result.wordCount,
      seo_score: result.seoScore,
      hero_image_url: result.heroImageUrl,
      hero_image_prompt: result.heroImagePrompt,
      inline_images_json: JSON.stringify(result.inlineImages || []),
      status: 'published'
    });

    console.log(`[Article] Generated: "${result.title}" — ${result.wordCount} words, SEO ${result.seoScore}`);
    res.json({ id: articleId, ...result });
  } catch (err) {
    console.error('[API Error] POST /api/articles/create:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate article' });
  }
});

app.get('/api/articles', (req, res) => {
  try { res.json(db.getAllArticles()); }
  catch (err) { res.status(500).json({ error: 'Failed to load articles' }); }
});

app.get('/api/articles/:id', (req, res) => {
  try {
    const article = db.getArticle(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) { res.status(500).json({ error: 'Failed to load article' }); }
});

app.delete('/api/articles/:id', (req, res) => {
  try { db.deleteArticle(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete article' }); }
});

// ==================== OUTREACH BOT ====================

app.get('/api/outreach/platforms', (req, res) => {
  res.json(getPlatformSpecs());
});

// Support both /api/outreach/generate and /api/outreach/create
app.post('/api/outreach/generate', async (req, res) => {
  req.url = '/api/outreach/create';
  return outreachCreateHandler(req, res);
});

const outreachCreateHandler = async (req, res) => {
  try {
    const b = req.body;
    const platform = b.platform;
    const targetAudience = b.targetAudience || b.target_audience || '';
    const topic = b.topic;
    const companyId = b.companyId || b.company_id;
    const companyName = b.companyName || b.company_name || '';
    const companyUrl = b.companyUrl || b.company_url || '';
    const tone = b.tone;
    const language = b.language;
    const campaignName = b.campaignName || b.campaign_name || '';
    const includeImage = b.includeImage || b.include_image || false;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    if (!llm.isConfigured()) {
      return res.status(400).json({ error: 'API key not configured. Go to Settings to add your OpenAI API key.', needsConfig: true });
    }

    const result = await generateOutreach({
      platform: platform || 'linkedin',
      targetAudience: targetAudience || '',
      topic,
      companyName: companyName || '',
      companyUrl: companyUrl || '',
      tone: tone || 'professional',
      language: language || 'de',
      campaignName: campaignName || '',
      includeImage: includeImage || false
    });

    const campaignId = db.createCampaign({
      company_id: companyId || null,
      platform: result.platform,
      campaign_name: result.campaignName,
      target_audience: result.targetAudience,
      tone: result.tone,
      language: result.language,
      hook: result.hook,
      message_body: result.fullPost || result.messageBody,
      call_to_action: result.callToAction,
      hashtags_json: JSON.stringify(result.hashtags || []),
      image_prompt: result.imagePrompt,
      image_url: result.imageUrl,
      status: 'draft'
    });

    console.log(`[Outreach] Generated: ${result.platform} campaign — "${result.campaignName}"`);
    res.json({ id: campaignId, ...result });
  } catch (err) {
    console.error('[API Error] POST /api/outreach/create:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate outreach' });
  }
};

app.post('/api/outreach/create', outreachCreateHandler);

app.get('/api/outreach', (req, res) => {
  try { res.json(db.getAllCampaigns()); }
  catch (err) { res.status(500).json({ error: 'Failed to load campaigns' }); }
});

app.get('/api/outreach/:id', (req, res) => {
  try {
    const campaign = db.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) { res.status(500).json({ error: 'Failed to load campaign' }); }
});

app.delete('/api/outreach/:id', (req, res) => {
  try { db.deleteCampaign(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: 'Failed to delete campaign' }); }
});

// ==================== SETTINGS ====================

app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getAllSettings();
    const result = {};
    for (const s of settings) {
      // Mask API keys but keep first 8 chars for identification
      if (s.key.includes('api_key') && s.value) {
        result[s.key] = s.value.substring(0, 8) + '...' + s.value.substring(s.value.length - 4);
      } else {
        result[s.key] = s.value;
      }
    }
    result._isConfigured = llm.isConfigured();
    result._isImageConfigured = llm.isImageConfigured();
    result._provider = llm.getConfig().provider;
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Failed to load settings' }); }
});

// Get available providers
app.get('/api/providers', (req, res) => {
  res.json(llm.getProviders());
});

app.put('/api/settings', (req, res) => {
  try {
    const body = req.body;
    // Support both single key/value and bulk object
    if (body.key) {
      db.setSetting(body.key, body.value || '');
    } else {
      // Bulk update: treat all keys as settings
      for (const [key, value] of Object.entries(body)) {
        if (key.startsWith('_')) continue;
        // Don't overwrite API keys with masked values
        if (key.includes('api_key') && value && value.includes('...')) continue;
        db.setSetting(key, value || '');
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to save setting' }); }
});

app.post('/api/settings/bulk', (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Invalid settings' });
    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith('_')) continue; // skip internal fields
      db.setSetting(key, value || '');
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to save settings' }); }
});

app.post('/api/settings/test-llm', async (req, res) => {
  try {
    const result = await llm.testConnection();
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== SEED DEMO ====================

app.post('/api/seed-demo', (req, res) => {
  try {
    const allCompanies = db.getAllCompanies();
    const existing = allCompanies.find(c => c.name && c.name.includes('(Demo)'));
    if (existing) return res.json({ success: true, message: 'Demo company already exists' });
    const company = db.createCompany({
      name: 'Meridian Ventures GmbH (Demo)', url: 'example.com',
      sector: 'Venture Capital', hosting_platform: 'Custom',
      description: 'A demo company to explore Sentinel features. Delete anytime.'
    });
    db.upsertCompanyDetails(company.id, {
      company_number: 'HRB 218456', company_type: 'GmbH',
      jurisdiction: 'Amtsgericht München',
      registered_address: 'Maximilianstraße 35a, 80539 München',
      incorporation_date: '15.03.2021', vat_number: 'DE345678901',
      registered_email: 'info@meridian-ventures.de',
      registered_phone: '+49 89 2180 7700',
      lead_director: 'Dr. Alexander Hartmann', lead_director_title: 'Geschäftsführer'
    });
    const scanId = db.createScan(company.id);
    db.updateScan(scanId, {
      status: 'completed', overall_score: 68, meta_score: 65, content_score: 70,
      technical_score: 78, legal_score: 58, has_impressum: 1, has_privacy_policy: 1,
      has_terms_of_service: 0, impressum_completeness: 72, pages_crawled: 4,
      issues_json: JSON.stringify([
        { severity: 'critical', category: 'legal', title: 'Missing Cookie Consent Banner', description: 'No cookie consent banner detected.', fix: 'Implement a GDPR-compliant cookie consent banner.' },
        { severity: 'warning', category: 'legal', title: 'Missing Terms of Service', description: 'No terms of service page found.', fix: 'Create AGB/Terms of Service page.' },
        { severity: 'warning', category: 'meta', title: 'Meta Description Too Short', description: 'Meta description is only 78 characters.', fix: 'Expand to 120-160 characters.' },
        { severity: 'warning', category: 'content', title: 'Multiple H1 Tags', description: 'Found 3 H1 headings.', fix: 'Consolidate to a single H1.' },
        { severity: 'info', category: 'meta', title: 'Missing Open Graph Tags', description: 'No OG title or image found.', fix: 'Add Open Graph meta tags.' }
      ]),
      legal_json: JSON.stringify({ impressum: { exists: true, url: 'https://example.com/impressum' }, privacy: { exists: true, url: 'https://example.com/datenschutz' } }),
      cookie_json: JSON.stringify({ detected: false, score: 0 }),
      discrepancies_json: JSON.stringify([{ field: 'Registered Address', dbField: 'registered_address', dbValue: 'Maximilianstraße 35a, 80539 München', websiteValue: 'Maximilianstr. 35a, 80539 München, Deutschland', severity: 'critical' }]),
      scan_data_json: '{}', completed_at: new Date().toISOString()
    });
    res.json({ success: true, companyId: company.id });
  } catch (err) {
    console.error('Seed demo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

process.on('unhandledRejection', (reason) => { console.error('[Unhandled Rejection]', reason); });
process.on('uncaughtException', (err) => { console.error('[Uncaught Exception]', err.message); });

app.listen(PORT, () => {
  console.log(`\n  Sentinel SEO & Compliance Optimizer v3.0 running at http://localhost:${PORT}\n`);
});
