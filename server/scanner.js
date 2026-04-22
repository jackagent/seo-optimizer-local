const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const LEGAL_KEYWORDS = {
  impressum: ['impressum', 'imprint', 'legal notice', 'legal-notice', 'site notice'],
  privacy: ['privacy', 'datenschutz', 'privacy-policy', 'data-protection', 'privacypolicy'],
  terms: ['terms', 'agb', 'terms-of-service', 'terms-and-conditions', 'nutzungsbedingungen', 'tos'],
  cookie: ['cookie', 'cookies', 'cookie-policy']
};

async function scanWebsite(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) SEOOptimizer/1.0');
    await page.setViewport({ width: 1440, height: 900 });

    const startTime = Date.now();
    let response;
    try {
      response = await page.goto(ensureProtocol(url), { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      return { error: `Failed to load ${url}: ${e.message}`, status: 'failed' };
    }
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);

    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract meta data
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
    const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '';
    const lang = $('html').attr('lang') || '';
    const robots = $('meta[name="robots"]').attr('content') || '';

    // Images analysis
    const images = $('img').map((_, el) => ({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt') || '',
      hasAlt: !!($(el).attr('alt'))
    })).get();
    const imagesWithoutAlt = images.filter(i => !i.hasAlt).length;

    // Links
    const allLinks = $('a[href]').map((_, el) => $(el).attr('href')).get();
    const internalLinks = allLinks.filter(l => l && !l.startsWith('http') || l.includes(new URL(ensureProtocol(url)).hostname));
    const externalLinks = allLinks.filter(l => l && l.startsWith('http') && !l.includes(new URL(ensureProtocol(url)).hostname));

    // Scripts
    const scripts = $('script[src]').map((_, el) => ({
      src: $(el).attr('src'),
      async: $(el).attr('async') !== undefined,
      defer: $(el).attr('defer') !== undefined
    })).get();
    const externalScripts = scripts.filter(s => s.src && s.src.startsWith('http'));
    const scriptsWithoutAsyncDefer = externalScripts.filter(s => !s.async && !s.defer);

    // Detect legal pages
    const legalLinks = {};
    $('a[href]').each((_, el) => {
      const href = ($(el).attr('href') || '').toLowerCase();
      const text = $(el).text().toLowerCase().trim();
      for (const [type, keywords] of Object.entries(LEGAL_KEYWORDS)) {
        if (keywords.some(k => href.includes(k) || text.includes(k))) {
          legalLinks[type] = $(el).attr('href');
        }
      }
    });

    // Crawl legal pages for content
    const legalPages = {};
    for (const [type, link] of Object.entries(legalLinks)) {
      try {
        const fullUrl = new URL(link, ensureProtocol(url)).href;
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        const legalHtml = await page.content();
        const legal$ = cheerio.load(legalHtml);
        legalPages[type] = {
          exists: true,
          url: fullUrl,
          content: legal$('body').text().substring(0, 5000)
        };
      } catch {
        legalPages[type] = { exists: true, url: link, content: '' };
      }
    }

    // Cookie banner detection
    const cookieBanner = await detectCookieBanner(page, $);

    // Detect hosting platform
    const hostingPlatform = detectPlatform(html, response?.headers() || {});

    // Analyze Impressum completeness
    let impressumCompleteness = 0;
    let impressumData = {};
    if (legalPages.impressum?.content) {
      const analysis = analyzeImpressum(legalPages.impressum.content);
      impressumCompleteness = analysis.completeness;
      impressumData = analysis.extracted;
    }

    // Build issues list
    const issues = [];

    // Critical issues
    if (!legalPages.impressum?.exists) {
      issues.push({ severity: 'critical', category: 'legal', title: 'Missing Impressum/Imprint', description: 'No Impressum page found. Required by German law (TMG).', fix: 'Create an Impressum page with company name, address, contact, registration, and VAT details.' });
    }
    if (!legalPages.privacy?.exists) {
      issues.push({ severity: 'critical', category: 'legal', title: 'Missing Privacy Policy', description: 'No privacy policy page found. Required by GDPR.', fix: 'Create a comprehensive privacy policy.' });
    }
    if (!cookieBanner.detected) {
      issues.push({ severity: 'critical', category: 'legal', title: 'Missing Cookie Consent Banner', description: 'No cookie consent banner detected. Required by EU ePrivacy Directive and GDPR.', fix: 'Implement a cookie consent banner using a CMP tool.' });
    }

    // Warnings
    if (!legalPages.terms?.exists) {
      issues.push({ severity: 'warning', category: 'legal', title: 'Missing Terms of Service', description: 'No terms of service page found.', fix: 'Create a terms of service page.' });
    }
    if (title.length < 30) {
      issues.push({ severity: 'warning', category: 'meta', title: 'Page Title Too Short', description: `Title is only ${title.length} characters.`, fix: 'Expand the title to 30-60 characters for optimal SEO.' });
    }
    if (title.length > 60) {
      issues.push({ severity: 'warning', category: 'meta', title: 'Page Title Too Long', description: `Title is ${title.length} characters.`, fix: 'Shorten the title to under 60 characters.' });
    }
    if (!metaDesc) {
      issues.push({ severity: 'warning', category: 'meta', title: 'Missing Meta Description', description: 'No meta description found.', fix: 'Add a meta description of 120-160 characters.' });
    } else if (metaDesc.length < 120) {
      issues.push({ severity: 'warning', category: 'meta', title: 'Meta Description Too Short', description: `Description is only ${metaDesc.length} characters.`, fix: 'Expand to 120-160 characters.' });
    }
    if (h1s.length === 0) {
      issues.push({ severity: 'warning', category: 'content', title: 'Missing H1 Tag', description: 'No H1 heading found.', fix: 'Add a single H1 tag with your main keyword.' });
    }
    if (h1s.length > 1) {
      issues.push({ severity: 'warning', category: 'content', title: 'Multiple H1 Tags', description: `Found ${h1s.length} H1 tags.`, fix: 'Use only one H1 tag per page.' });
    }
    if (imagesWithoutAlt > 0) {
      issues.push({ severity: 'warning', category: 'accessibility', title: 'Images Missing Alt Text', description: `${imagesWithoutAlt} of ${images.length} images lack alt text.`, fix: 'Add descriptive alt text to all images.' });
    }
    if (parseFloat(loadTime) > 5) {
      issues.push({ severity: 'warning', category: 'technical', title: 'Slow Page Load', description: `Page loaded in ${loadTime}s.`, fix: 'Optimize images, minify CSS/JS, and consider a CDN.' });
    }
    if (scriptsWithoutAsyncDefer.length > 0) {
      issues.push({ severity: 'warning', category: 'technical', title: 'No Async/Defer Scripts', description: `${scriptsWithoutAsyncDefer.length} external scripts without async or defer.`, fix: 'Add async for independent scripts or defer for DOM-dependent scripts.' });
    }
    if (!viewport) {
      issues.push({ severity: 'warning', category: 'technical', title: 'Missing Viewport Meta Tag', description: 'No viewport meta tag found.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">.' });
    }
    if (!ogTitle && !ogImage) {
      issues.push({ severity: 'info', category: 'meta', title: 'Missing Open Graph Tags', description: 'No OG title or image found.', fix: 'Add Open Graph meta tags for better social sharing.' });
    }
    if (!canonical) {
      issues.push({ severity: 'info', category: 'technical', title: 'Missing Canonical URL', description: 'No canonical link found.', fix: 'Add a canonical URL to prevent duplicate content issues.' });
    }
    if (!lang) {
      issues.push({ severity: 'info', category: 'accessibility', title: 'Missing Language Attribute', description: 'No lang attribute on HTML tag.', fix: 'Add lang="en" or appropriate language code to the HTML tag.' });
    }

    // Calculate scores
    const metaScore = calculateMetaScore({ title, metaDesc, ogTitle, ogDesc, ogImage, canonical, viewport, favicon, lang, robots });
    const contentScore = calculateContentScore({ h1s, h2s, images, imagesWithoutAlt, bodyText: $('body').text().length });
    const technicalScore = calculateTechnicalScore({ loadTime: parseFloat(loadTime), scriptsWithoutAsyncDefer, viewport, canonical });
    const legalScore = calculateLegalScore({ impressum: !!legalPages.impressum?.exists, privacy: !!legalPages.privacy?.exists, terms: !!legalPages.terms?.exists, cookieBanner: cookieBanner.detected, impressumCompleteness });
    const overallScore = Math.round((metaScore + contentScore + technicalScore + legalScore) / 4);

    return {
      status: 'completed',
      overallScore,
      metaScore,
      contentScore,
      technicalScore,
      legalScore,
      hasImpressum: !!legalPages.impressum?.exists,
      hasPrivacyPolicy: !!legalPages.privacy?.exists,
      hasTermsOfService: !!legalPages.terms?.exists,
      impressumCompleteness,
      pagesCrawled: 1 + Object.keys(legalPages).length,
      issues,
      legal: legalPages,
      cookie: cookieBanner,
      hostingPlatform,
      impressumData,
      scanData: {
        title, metaDesc, h1s, h2s, canonical, ogTitle, ogDesc, ogImage, viewport, favicon, lang, robots,
        images: images.length, imagesWithoutAlt, internalLinks: internalLinks.length, externalLinks: externalLinks.length,
        scripts: scripts.length, loadTime: parseFloat(loadTime)
      }
    };
  } catch (err) {
    return { error: err.message, status: 'failed' };
  } finally {
    if (browser) await browser.close();
  }
}

function ensureProtocol(url) {
  if (!url.startsWith('http')) return 'https://' + url;
  return url;
}

function detectPlatform(html, headers) {
  const lower = html.toLowerCase();
  if (lower.includes('base44') || lower.includes('base-44')) return 'base44';
  if (lower.includes('squarespace')) return 'squarespace';
  if (lower.includes('wordpress') || lower.includes('wp-content')) return 'wordpress';
  if (lower.includes('shopify')) return 'shopify';
  if (lower.includes('wix.com')) return 'wix';
  if (lower.includes('webflow')) return 'webflow';
  if (headers['x-powered-by']?.includes('Next')) return 'nextjs';
  return 'custom';
}

async function detectCookieBanner(page, $) {
  const result = { detected: false, hasRejectAll: false, hasGranularChoices: false, hasNecessaryOnly: false, hasCookiePolicy: false, score: 0 };

  // Check for common cookie banner selectors
  const bannerSelectors = [
    '#cookie-banner', '.cookie-banner', '#cookie-consent', '.cookie-consent',
    '#cookiebanner', '.cookiebanner', '[class*="cookie"]', '[id*="cookie"]',
    '#onetrust', '.onetrust', '#usercentrics', '.cc-banner', '#cc-main',
    '[class*="consent"]', '[id*="consent"]', '#gdpr', '.gdpr'
  ];

  for (const sel of bannerSelectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        result.detected = true;
        const text = await page.evaluate(e => e.textContent, el);
        const lower = (text || '').toLowerCase();
        if (lower.includes('reject') || lower.includes('decline') || lower.includes('ablehnen')) result.hasRejectAll = true;
        if (lower.includes('settings') || lower.includes('preferences') || lower.includes('einstellungen')) result.hasGranularChoices = true;
        if (lower.includes('necessary') || lower.includes('essential') || lower.includes('notwendig')) result.hasNecessaryOnly = true;
        break;
      }
    } catch {}
  }

  // Check for cookie policy link
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').toLowerCase();
    if (href.includes('cookie')) result.hasCookiePolicy = true;
  });

  result.score = [result.detected, result.hasRejectAll, result.hasGranularChoices, result.hasNecessaryOnly, result.hasCookiePolicy]
    .filter(Boolean).length * 20;

  return result;
}

function analyzeImpressum(content) {
  const lower = content.toLowerCase();
  const fields = {
    companyName: /(?:firma|company|unternehmen)[:\s]*([^\n]+)/i,
    address: /(?:anschrift|address|adresse)[:\s]*([^\n]+)/i,
    email: /[\w.-]+@[\w.-]+\.\w+/,
    phone: /(?:tel|phone|telefon)[.:\s]*([+\d\s()-]+)/i,
    registration: /(?:hrb|handelsregister|register)[:\s]*([^\n]+)/i,
    vat: /(?:ust|vat|umsatzsteuer)[.\s-]*(?:id|nr|number)?[.:\s]*([A-Z]{2}\d+)/i,
    director: /(?:geschäftsführer|director|vertreten|managing)[:\s]*([^\n]+)/i
  };

  const extracted = {};
  let found = 0;
  for (const [key, regex] of Object.entries(fields)) {
    const match = content.match(regex);
    if (match) {
      extracted[key] = match[1]?.trim() || match[0]?.trim();
      found++;
    }
  }

  // Also check for common patterns without labels
  if (!extracted.email) {
    const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) { extracted.email = emailMatch[0]; found++; }
  }

  return {
    completeness: Math.round((found / Object.keys(fields).length) * 100),
    extracted
  };
}

function calculateMetaScore({ title, metaDesc, ogTitle, ogDesc, ogImage, canonical, viewport, favicon, lang, robots }) {
  let score = 0;
  if (title && title.length >= 10) score += 15;
  if (title && title.length >= 30 && title.length <= 60) score += 10;
  if (metaDesc && metaDesc.length >= 50) score += 15;
  if (metaDesc && metaDesc.length >= 120 && metaDesc.length <= 160) score += 10;
  if (ogTitle) score += 10;
  if (ogDesc) score += 5;
  if (ogImage) score += 10;
  if (canonical) score += 10;
  if (viewport) score += 5;
  if (favicon) score += 5;
  if (lang) score += 5;
  return Math.min(100, score);
}

function calculateContentScore({ h1s, h2s, images, imagesWithoutAlt, bodyText }) {
  let score = 0;
  if (h1s.length === 1) score += 25;
  else if (h1s.length > 0) score += 10;
  if (h2s.length >= 2) score += 20;
  else if (h2s.length > 0) score += 10;
  if (images > 0) score += 15;
  if (images > 0 && imagesWithoutAlt === 0) score += 15;
  if (bodyText > 300) score += 15;
  if (bodyText > 1000) score += 10;
  return Math.min(100, score);
}

function calculateTechnicalScore({ loadTime, scriptsWithoutAsyncDefer, viewport, canonical }) {
  let score = 50;
  if (loadTime < 3) score += 25;
  else if (loadTime < 5) score += 15;
  else if (loadTime < 8) score += 5;
  else score -= 10;
  if (scriptsWithoutAsyncDefer.length === 0) score += 10;
  if (viewport) score += 10;
  if (canonical) score += 5;
  return Math.max(0, Math.min(100, score));
}

function calculateLegalScore({ impressum, privacy, terms, cookieBanner, impressumCompleteness }) {
  let score = 0;
  if (impressum) score += 25 + Math.round(impressumCompleteness * 0.15);
  if (privacy) score += 25;
  if (terms) score += 15;
  if (cookieBanner) score += 20;
  return Math.min(100, score);
}

module.exports = { scanWebsite };
