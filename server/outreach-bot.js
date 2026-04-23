/**
 * Social Media Outreach Bot — AI-powered multi-platform message generation
 */

const { chatCompletion, generateImage, isConfigured } = require('./llm');

const PLATFORM_SPECS = {
  linkedin: {
    name: 'LinkedIn',
    maxChars: 3000,
    hashtagCount: '3-5',
    style: 'professional and thought-leadership oriented',
    features: 'LinkedIn supports rich text, mentions (@), hashtags (#), and document/image attachments'
  },
  twitter: {
    name: 'Twitter/X',
    maxChars: 280,
    hashtagCount: '1-3',
    style: 'concise, punchy, and attention-grabbing',
    features: 'Twitter has a 280 character limit. Use threads for longer content. Hashtags and mentions supported.'
  },
  instagram: {
    name: 'Instagram',
    maxChars: 2200,
    hashtagCount: '15-25',
    style: 'visual-first, storytelling, and community-focused',
    features: 'Instagram captions support up to 2200 chars. Hashtags are crucial for discovery. Use line breaks for readability.'
  },
  facebook: {
    name: 'Facebook',
    maxChars: 63206,
    hashtagCount: '2-5',
    style: 'conversational, community-building, and shareable',
    features: 'Facebook supports long posts, links, images, and videos. Engagement-driven content performs best.'
  },
  xing: {
    name: 'XING',
    maxChars: 2000,
    hashtagCount: '3-5',
    style: 'professional, DACH-market focused',
    features: 'XING is popular in Germany, Austria, and Switzerland. Professional networking focus.'
  }
};

async function generateOutreach({ platform, targetAudience, topic, companyName, companyUrl, tone, language, campaignName, includeImage }) {
  if (!isConfigured()) {
    throw new Error('LLM API key not configured. Go to Settings to add your OpenAI API key.');
  }

  const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.linkedin;
  const lang = language === 'de' ? 'German' : 'English';
  
  const toneGuide = {
    professional: 'professional and authoritative',
    casual: 'casual and approachable',
    provocative: 'provocative and thought-provoking',
    inspirational: 'inspirational and motivating',
    educational: 'educational and informative',
    humorous: 'witty and humorous'
  };

  const systemPrompt = `You are an expert social media strategist and copywriter specializing in ${spec.name}. 
Write in ${lang}. Create content that maximizes engagement and reach.
You understand the ${spec.name} algorithm and what content performs best on this platform.
${spec.features}`;

  const userPrompt = `Create a ${spec.name} post for the following:

Topic/Product: ${topic}
${companyName ? `Company: ${companyName} (${companyUrl || ''})` : ''}
Target Audience: ${targetAudience || 'Business professionals'}
Tone: ${toneGuide[tone] || toneGuide.professional}
Max Characters: ${spec.maxChars}

Requirements:
1. Start with a powerful HOOK (first 1-2 lines that stop the scroll)
2. Write the main message body with value for the reader
3. End with a clear call-to-action
4. Suggest ${spec.hashtagCount} relevant hashtags
5. The style should be ${spec.style}

Return your response in this exact JSON format (no code fences):
{
  "hook": "The attention-grabbing opening line(s)",
  "body": "The main message content",
  "callToAction": "The closing CTA",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "fullPost": "The complete post as it would appear on ${spec.name}",
  "tips": ["Tip 1 for improving engagement", "Tip 2"]
}`;

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.85, max_tokens: 2000 });

  // Parse the JSON response
  let parsed;
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
  } catch {
    // If parsing fails, create a structured response from the raw text
    parsed = {
      hook: '',
      body: response,
      callToAction: '',
      hashtags: [],
      fullPost: response,
      tips: []
    };
  }

  // Generate image if requested
  let imageUrl = null;
  let imagePrompt = null;

  if (includeImage) {
    try {
      imagePrompt = `Professional social media graphic for ${spec.name} about: ${topic}. Clean, modern design. ${platform === 'instagram' ? 'Square format, visually stunning.' : 'Landscape format, corporate style.'} No text overlay.`;
      imageUrl = await generateImage(imagePrompt, {
        size: platform === 'instagram' ? '1024x1024' : '1792x1024',
        quality: 'standard'
      });
    } catch (err) {
      console.error('[Outreach Bot] Image generation failed:', err.message);
      imagePrompt = imagePrompt + ' (generation failed: ' + err.message + ')';
    }
  }

  return {
    platform,
    campaignName: campaignName || `${spec.name} — ${topic}`,
    targetAudience: targetAudience || 'Business professionals',
    tone,
    language,
    hook: parsed.hook || '',
    messageBody: parsed.body || parsed.fullPost || '',
    callToAction: parsed.callToAction || '',
    hashtags: parsed.hashtags || [],
    fullPost: parsed.fullPost || '',
    tips: parsed.tips || [],
    imageUrl,
    imagePrompt,
    charCount: (parsed.fullPost || '').length,
    maxChars: spec.maxChars,
    withinLimit: (parsed.fullPost || '').length <= spec.maxChars
  };
}

function getPlatformSpecs() {
  return PLATFORM_SPECS;
}

module.exports = { generateOutreach, getPlatformSpecs };
