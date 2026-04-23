/**
 * LLM Helper — OpenAI-compatible API integration
 * Supports any OpenAI-compatible endpoint (OpenAI, Ollama, LM Studio, etc.)
 * API key and base URL are stored in the settings table.
 */

const https = require('https');
const http = require('http');
const db = require('./db');

function getConfig() {
  return {
    apiKey: db.getSetting('llm_api_key') || process.env.OPENAI_API_KEY || '',
    baseUrl: db.getSetting('llm_base_url') || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: db.getSetting('llm_model') || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    imageModel: db.getSetting('image_model') || 'dall-e-3',
    imageBaseUrl: db.getSetting('image_base_url') || db.getSetting('llm_base_url') || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  };
}

function isConfigured() {
  const cfg = getConfig();
  return !!(cfg.apiKey && cfg.baseUrl);
}

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
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function chatCompletion(messages, options = {}) {
  const cfg = getConfig();
  if (!cfg.apiKey) throw new Error('LLM API key not configured. Go to Settings to add your OpenAI API key.');

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

async function generateImage(prompt, options = {}) {
  const cfg = getConfig();
  if (!cfg.apiKey) throw new Error('API key not configured. Go to Settings to add your OpenAI API key.');

  const url = `${cfg.imageBaseUrl.replace(/\/$/, '')}/images/generations`;
  const res = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`
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

module.exports = { chatCompletion, generateImage, isConfigured, getConfig };
