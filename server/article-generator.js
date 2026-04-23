/**
 * Article Generator — AI-powered SEO article creation with automatic image generation
 */

const { chatCompletion, generateImage, isConfigured } = require('./llm');

async function generateArticle({ topic, keywords, platform, tone, language, companyName, companyUrl, includeImages }) {
  if (!isConfigured()) {
    throw new Error('LLM API key not configured. Go to Settings to add your OpenAI API key.');
  }

  const lang = language === 'de' ? 'German' : 'English';
  const platformGuide = {
    blog: 'a long-form blog post (800-1500 words) with H2/H3 headings, bullet points, and a conclusion',
    linkedin: 'a LinkedIn article (400-800 words) with a compelling hook, professional tone, and a call-to-action',
    medium: 'a Medium-style article (600-1200 words) with storytelling elements and subheadings',
    newsletter: 'a newsletter article (300-600 words) with a personal touch and clear value proposition',
    press: 'a press release (300-500 words) in inverted pyramid style with quotes and company info'
  };

  const toneGuide = {
    professional: 'professional and authoritative',
    casual: 'casual and conversational',
    technical: 'technical and detailed',
    persuasive: 'persuasive and compelling',
    educational: 'educational and informative'
  };

  const systemPrompt = `You are an expert SEO content writer. Write in ${lang}. 
Your articles are optimized for search engines while being engaging and valuable for readers.
Always include relevant keywords naturally throughout the text.
Format the output as clean HTML with proper heading tags (h2, h3), paragraphs, and lists where appropriate.
Do NOT include the title in the HTML body — it will be displayed separately.`;

  const userPrompt = `Write ${platformGuide[platform] || platformGuide.blog}.

Topic: ${topic}
Target Keywords: ${(keywords || []).join(', ')}
Tone: ${toneGuide[tone] || toneGuide.professional}
${companyName ? `Company: ${companyName} (${companyUrl || ''})` : ''}

Requirements:
- Optimize for the target keywords (use them in headings and naturally in text)
- Include a compelling introduction that hooks the reader
- Use clear structure with subheadings
- End with a strong conclusion and call-to-action
- Make it genuinely useful and informative

Return ONLY the HTML content (no markdown, no code fences).`;

  // Generate article content
  const content = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.8, max_tokens: 4000 });

  // Generate title
  const titlePrompt = `Based on this article content, generate a single compelling, SEO-optimized title in ${lang}. 
The title should include the main keyword and be 50-70 characters.
Return ONLY the title text, nothing else.

Article topic: ${topic}
Keywords: ${(keywords || []).join(', ')}`;

  const title = await chatCompletion([
    { role: 'system', content: `You are an SEO headline expert. Write in ${lang}. Return only the title.` },
    { role: 'user', content: titlePrompt }
  ], { temperature: 0.9, max_tokens: 100 });

  // Generate summary
  const summaryPrompt = `Write a 1-2 sentence summary/meta description for this article in ${lang}. 
Keep it under 160 characters for SEO. Return ONLY the summary text.

Topic: ${topic}`;

  const summary = await chatCompletion([
    { role: 'system', content: `You are an SEO meta description expert. Write in ${lang}. Return only the summary.` },
    { role: 'user', content: summaryPrompt }
  ], { temperature: 0.7, max_tokens: 200 });

  // Calculate word count
  const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).length;

  // Calculate basic SEO score
  let seoScore = 60;
  const lowerContent = textContent.toLowerCase();
  for (const kw of (keywords || [])) {
    if (lowerContent.includes(kw.toLowerCase())) seoScore += 5;
  }
  if (content.includes('<h2')) seoScore += 5;
  if (content.includes('<h3')) seoScore += 5;
  if (wordCount > 300) seoScore += 5;
  if (wordCount > 600) seoScore += 5;
  if (summary && summary.length <= 160) seoScore += 5;
  seoScore = Math.min(100, seoScore);

  // Generate hero image if requested
  let heroImageUrl = null;
  let heroImagePrompt = null;
  let inlineImages = [];

  if (includeImages) {
    try {
      heroImagePrompt = `Professional, high-quality editorial photograph for an article about: ${topic}. Clean, modern, corporate style. No text overlay.`;
      heroImageUrl = await generateImage(heroImagePrompt, { size: '1792x1024', quality: 'standard' });
    } catch (err) {
      console.error('[Article Generator] Hero image generation failed:', err.message);
      heroImagePrompt = heroImagePrompt + ' (generation failed: ' + err.message + ')';
    }
  }

  return {
    title: title.replace(/^["']|["']$/g, '').trim(),
    content,
    summary: summary.replace(/^["']|["']$/g, '').trim(),
    keywords,
    platform,
    tone,
    language,
    wordCount,
    seoScore,
    heroImageUrl,
    heroImagePrompt,
    inlineImages
  };
}

module.exports = { generateArticle };
