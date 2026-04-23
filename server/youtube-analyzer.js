/**
 * YouTube SEO Analyzer
 * Analyzes YouTube videos for SEO optimization without requiring an API key.
 * Uses YouTube oEmbed API + page scraping for metadata extraction.
 */

const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sentinel/2.0)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function analyzeTitle(title) {
  const issues = [];
  const recs = [];
  
  if (!title) {
    issues.push({ severity: 'critical', title: 'Missing Video Title', description: 'No title found for this video.' });
    return { issues, recs, score: 0 };
  }

  let score = 100;

  if (title.length < 30) {
    issues.push({ severity: 'warning', title: 'Title Too Short', description: `Title is only ${title.length} characters. Aim for 50-70 characters.` });
    recs.push('Expand the title to 50-70 characters for better SEO visibility.');
    score -= 15;
  } else if (title.length > 100) {
    issues.push({ severity: 'warning', title: 'Title Too Long', description: `Title is ${title.length} characters. YouTube truncates after ~70 characters.` });
    recs.push('Shorten the title to under 70 characters to avoid truncation in search results.');
    score -= 10;
  }

  if (!/[0-9]/.test(title)) {
    recs.push('Consider adding numbers to the title (e.g., "5 Tips", "2024 Guide") — numbered titles get 36% more clicks.');
  }

  if (!/[!?|:]/.test(title)) {
    recs.push('Add power punctuation (!, ?, |, :) to make the title more engaging.');
  }

  // Check for common SEO patterns
  const powerWords = ['how to', 'best', 'top', 'ultimate', 'guide', 'tutorial', 'review', 'tips', 'tricks', 'secret', 'anleitung', 'tipps', 'beste'];
  const hasPowerWord = powerWords.some(w => title.toLowerCase().includes(w));
  if (!hasPowerWord) {
    recs.push('Include power words like "How To", "Best", "Guide", "Tips" to improve click-through rate.');
    score -= 5;
  }

  return { issues, recs, score: Math.max(0, score) };
}

function analyzeDescription(desc) {
  const issues = [];
  const recs = [];

  if (!desc || desc.length < 10) {
    issues.push({ severity: 'critical', title: 'Missing/Empty Description', description: 'Video description is missing or too short.' });
    recs.push('Write a detailed description of at least 200 words with relevant keywords.');
    return { issues, recs, score: 0 };
  }

  let score = 100;

  if (desc.length < 100) {
    issues.push({ severity: 'warning', title: 'Description Too Short', description: `Description is only ${desc.length} characters. Aim for 500+ characters.` });
    recs.push('Expand the description to at least 500 characters with keywords, timestamps, and links.');
    score -= 25;
  } else if (desc.length < 300) {
    issues.push({ severity: 'info', title: 'Description Could Be Longer', description: `Description is ${desc.length} characters. Top-performing videos have 500+ characters.` });
    score -= 10;
  }

  // Check for links
  if (!/(https?:\/\/|www\.)/i.test(desc)) {
    recs.push('Add relevant links (website, social media, related videos) to the description.');
    score -= 5;
  }

  // Check for timestamps
  if (!/\d{1,2}:\d{2}/.test(desc)) {
    recs.push('Add timestamps/chapters to improve viewer retention and SEO.');
    score -= 5;
  }

  // Check for hashtags
  if (!/#\w+/.test(desc)) {
    recs.push('Add 3-5 relevant hashtags at the end of the description.');
    score -= 5;
  }

  // Check for call-to-action
  const ctaWords = ['subscribe', 'abonnieren', 'like', 'comment', 'kommentar', 'share', 'teilen', 'click', 'klick', 'link'];
  const hasCTA = ctaWords.some(w => desc.toLowerCase().includes(w));
  if (!hasCTA) {
    recs.push('Add a call-to-action (Subscribe, Like, Comment) to boost engagement.');
    score -= 5;
  }

  return { issues, recs, score: Math.max(0, score) };
}

function analyzeTags(tags) {
  const issues = [];
  const recs = [];

  if (!tags || tags.length === 0) {
    issues.push({ severity: 'warning', title: 'No Tags Found', description: 'Video has no tags. Tags help YouTube understand your content.' });
    recs.push('Add 10-15 relevant tags mixing broad and specific keywords.');
    return { issues, recs, score: 30 };
  }

  let score = 100;

  if (tags.length < 5) {
    issues.push({ severity: 'info', title: 'Few Tags', description: `Only ${tags.length} tags found. Aim for 10-15 tags.` });
    recs.push('Add more tags to improve discoverability. Mix broad and long-tail keywords.');
    score -= 15;
  } else if (tags.length > 30) {
    issues.push({ severity: 'info', title: 'Too Many Tags', description: `${tags.length} tags found. YouTube may ignore excess tags.` });
    recs.push('Reduce to 10-15 highly relevant tags. Quality over quantity.');
    score -= 10;
  }

  return { issues, recs, score: Math.max(0, score) };
}

function analyzeEngagement(viewCount, likeCount, commentCount) {
  const issues = [];
  const recs = [];
  let score = 70; // baseline

  if (viewCount && viewCount > 0) {
    if (likeCount) {
      const likeRatio = (likeCount / viewCount) * 100;
      if (likeRatio < 2) {
        issues.push({ severity: 'warning', title: 'Low Like Ratio', description: `Like ratio is ${likeRatio.toFixed(1)}%. Average is 4-5%.` });
        recs.push('Encourage likes with a verbal CTA in the video and pinned comment.');
        score -= 15;
      } else if (likeRatio >= 5) {
        score += 15;
      }
    }

    if (commentCount) {
      const commentRatio = (commentCount / viewCount) * 100;
      if (commentRatio < 0.5) {
        recs.push('Boost comments by asking questions in the video and responding to viewers.');
        score -= 5;
      } else if (commentRatio >= 2) {
        score += 10;
      }
    }
  }

  return { issues, recs, score: Math.min(100, Math.max(0, score)) };
}

async function analyzeYoutubeVideo(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { status: 'failed', error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' };
  }

  try {
    // Fetch oEmbed data (no API key needed)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedRes = await fetchUrl(oembedUrl);
    
    let oembedData = {};
    if (oembedRes.status === 200) {
      try { oembedData = JSON.parse(oembedRes.body); } catch {}
    }

    // Fetch the video page to extract metadata
    const pageRes = await fetchUrl(`https://www.youtube.com/watch?v=${videoId}`);
    let pageData = {};
    
    if (pageRes.status === 200) {
      const html = pageRes.body;
      
      // Extract from ytInitialPlayerResponse
      const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (playerMatch) {
        try {
          const playerData = JSON.parse(playerMatch[1]);
          const vd = playerData.videoDetails || {};
          const md = playerData.microformat?.playerMicroformatRenderer || {};
          
          pageData = {
            title: vd.title || oembedData.title,
            description: vd.shortDescription || '',
            channelName: vd.author || oembedData.author_name,
            viewCount: parseInt(vd.viewCount) || 0,
            lengthSeconds: parseInt(vd.lengthSeconds) || 0,
            tags: vd.keywords || [],
            thumbnailUrl: vd.thumbnail?.thumbnails?.pop()?.url || oembedData.thumbnail_url,
            publishDate: md.publishDate || '',
            subscriberCount: null,
            likeCount: null,
            commentCount: null
          };
        } catch {}
      }

      // Try to extract like count from page
      const likeMatch = html.match(/"likeCount":\s*"?(\d+)"?/);
      if (likeMatch) pageData.likeCount = parseInt(likeMatch[1]);

      // Try subscriber count
      const subMatch = html.match(/"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/);
      if (subMatch) pageData.subscriberCountText = subMatch[1];
    }

    // If we couldn't get any data
    if (!pageData.title && !oembedData.title) {
      return { status: 'failed', error: 'Could not fetch video data. The video may be private or unavailable.' };
    }

    // Run analyses
    const titleAnalysis = analyzeTitle(pageData.title || oembedData.title);
    const descAnalysis = analyzeDescription(pageData.description);
    const tagAnalysis = analyzeTags(pageData.tags);
    const engagementAnalysis = analyzeEngagement(pageData.viewCount, pageData.likeCount, pageData.commentCount);

    // Calculate overall score
    const overallScore = Math.round(
      titleAnalysis.score * 0.3 +
      descAnalysis.score * 0.3 +
      tagAnalysis.score * 0.2 +
      engagementAnalysis.score * 0.2
    );

    // Combine all issues and recommendations
    const allIssues = [
      ...titleAnalysis.issues,
      ...descAnalysis.issues,
      ...tagAnalysis.issues,
      ...engagementAnalysis.issues
    ];

    const allRecs = [
      ...titleAnalysis.recs,
      ...descAnalysis.recs,
      ...tagAnalysis.recs,
      ...engagementAnalysis.recs
    ];

    // Format duration
    const duration = pageData.lengthSeconds
      ? `${Math.floor(pageData.lengthSeconds / 60)}:${String(pageData.lengthSeconds % 60).padStart(2, '0')}`
      : null;

    return {
      status: 'completed',
      videoId,
      videoTitle: pageData.title || oembedData.title || '',
      channelName: pageData.channelName || oembedData.author_name || '',
      videoDescription: (pageData.description || '').substring(0, 2000),
      tags: pageData.tags || [],
      thumbnailUrl: pageData.thumbnailUrl || oembedData.thumbnail_url || '',
      viewCount: pageData.viewCount || 0,
      likeCount: pageData.likeCount || 0,
      commentCount: pageData.commentCount || 0,
      subscriberCount: pageData.subscriberCountText || null,
      duration,
      publishedAt: pageData.publishDate || '',
      seoScore: overallScore,
      issues: allIssues,
      recommendations: allRecs,
      scores: {
        title: titleAnalysis.score,
        description: descAnalysis.score,
        tags: tagAnalysis.score,
        engagement: engagementAnalysis.score
      }
    };
  } catch (err) {
    return { status: 'failed', error: `Analysis failed: ${err.message}` };
  }
}

module.exports = { analyzeYoutubeVideo, extractVideoId };
