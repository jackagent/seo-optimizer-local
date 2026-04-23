/**
 * LLM Helper — Multi-Provider AI Integration
 * 
 * Pre-configured providers:
 *   - Kimi (Moonshot AI): https://api.moonshot.ai/v1 — Best for text generation (articles, outreach)
 *   - OpenAI: https://api.openai.com/v1 — Best for image generation (DALL-E)
 *   - Custom: Any OpenAI-compatible endpoint (Ollama, LM Studio, Azure, etc.)
 * 
 * API keys are stored in the local SQLite settings table.
 */

const https = require('https');
const http = require('http');
const db = require('./db');

// ==================== Provider Presets ====================

const PROVIDERS = {
  kimi: {
    name: 'Kimi (Moonshot AI)',
    baseUrl: 'https://api.moonshot.ai/v1',
    models: ['kimi-k2.5', 'moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
    defaultModel: 'moonshot-v1-8k',
    supportsImages: false,
    description: 'Kimi by Moonshot AI — excellent for text generation, supports 128K context. Free tier available.',
    signupUrl: 'https://platform.kimi.ai'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    supportsImages: true,
    imageModels: ['dall-e-3', 'dall-e-2'],
    defaultImageModel: 'dall-e-3',
    description: 'OpenAI — GPT models for text, DALL-E for image generation.',
    signupUrl: 'https://platform.openai.com'
  },
  custom: {
    name: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    models: [],
    defaultModel: '',
    supportsImages: false,
    description: 'Any OpenAI-compatible API endpoint (Ollama, LM Studio, Azure, Groq, Together AI, etc.)'
  }
};

// ==================== Configuration ====================

function getConfig() {
  const provider = db.getSetting('llm_provider') || 'openai';
  const preset = PROVIDERS[provider] || PROVIDERS.custom;

  return {
    provider,
    apiKey: db.getSetting('llm_api_key') || process.env.OPENAI_API_KEY || '',
    baseUrl: db.getSetting('llm_base_url') || preset.baseUrl || 'https://api.openai.com/v1',
    model: db.getSetting('llm_model') || preset.defaultModel || 'gpt-4o-mini',
    // Image generation — can use a separate provider (e.g., OpenAI for DALL-E even if text uses Kimi)
    imageApiKey: db.getSetting('image_api_key') || db.getSetting('llm_api_key') || process.env.OPENAI_API_KEY || '',
    imageBaseUrl: db.getSetting('image_base_url') || 'https://api.openai.com/v1',
    imageModel: db.getSetting('image_model') || 'dall-e-3'
  };
}

function isConfigured() {
  const cfg = getConfig();
  return !!(cfg.apiKey && cfg.baseUrl);
}

function isImageConfigured() {
  const cfg = getConfig();
  return !!(cfg.imageApiKey && cfg.imageBaseUrl);
}

function getProviders() {
  return PROVIDERS;
}

function getProviderForUrl(baseUrl) {
  if (!baseUrl) return 'custom';
  const url = baseUrl.toLowerCase().replace(/\/$/, '');
  if (url.includes('moonshot.ai') || url.includes('kimi.ai')) return 'kimi';
  if (url.includes('openai.com')) return 'openai';
  return 'custom';
}

// ==================== HTTP Client ====================

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request(url, {
      method: options.method || 'POST',
      headers: options.headers || {},
      timeout: 120000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout (120s)')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ==================== Chat Completion ====================

async function chatCompletion(messages, options = {}) {
  const cfg = getConfig();
  if (!cfg.apiKey) {
    throw new Error('LLM API key not configured. Go to Settings and enter your Kimi or OpenAI API key.');
  }

  const url = `${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`
    }
  }, {
    model: options.model || cfg.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4000
  });

  if (res.status !== 200) {
    const errMsg = res.body?.error?.message || JSON.stringify(res.body);
    throw new Error(`LLM API error (${res.status}): ${errMsg}`);
  }

  return res.body.choices?.[0]?.message?.content || '';
}

// ==================== Image Generation ====================

async function generateImage(prompt, options = {}) {
  const cfg = getConfig();
  if (!cfg.imageApiKey) {
    throw new Error('Image API key not configured. Go to Settings and enter your OpenAI API key for DALL-E image generation.');
  }

  const url = `${cfg.imageBaseUrl.replace(/\/$/, '')}/images/generations`;
  const res = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.imageApiKey}`
    }
  }, {
    model: options.model || cfg.imageModel,
    prompt,
    n: 1,
    size: options.size || '1024x1024',
    quality: options.quality || 'standard'
  });

  if (res.status !== 200) {
    const errMsg = res.body?.error?.message || JSON.stringify(res.body);
    throw new Error(`Image API error (${res.status}): ${errMsg}`);
  }

  return res.body.data?.[0]?.url || res.body.data?.[0]?.b64_json || null;
}

// ==================== Connection Test ====================

async function testConnection() {
  const cfg = getConfig();
  if (!cfg.apiKey) {
    return { success: false, error: 'No API key configured', provider: cfg.provider };
  }

  try {
    const response = await chatCompletion([
      { role: 'user', content: 'Say "OK" and nothing else.' }
    ], { max_tokens: 10, temperature: 0 });

    return {
      success: true,
      provider: cfg.provider,
      providerName: PROVIDERS[cfg.provider]?.name || 'Custom',
      model: cfg.model,
      response: response.trim()
    };
  } catch (err) {
    return {
      success: false,
      provider: cfg.provider,
      providerName: PROVIDERS[cfg.provider]?.name || 'Custom',
      model: cfg.model,
      error: err.message
    };
  }
}

module.exports = {
  chatCompletion,
  generateImage,
  isConfigured,
  isImageConfigured,
  getConfig,
  getProviders,
  getProviderForUrl,
  testConnection,
  PROVIDERS
};
