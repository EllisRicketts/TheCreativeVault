import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'data', 'weekly-drip-config.json');
const outputPath = path.join(root, 'data', 'weekly-drip.json');

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.error('Missing YOUTUBE_API_KEY environment variable.');
  process.exit(1);
}

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
const publishedAfter = new Date(Date.now() - config.windowDays * 86400000).toISOString();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseDuration(iso = 'PT0S') {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0);
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

async function youtube(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body}`);
  }
  return res.json();
}

async function searchTopic(topic) {
  const data = await youtube('search', {
    part: 'snippet',
    type: 'video',
    q: topic.query,
    maxResults: config.searchResultsPerTopic,
    order: 'viewCount',
    publishedAfter,
    relevanceLanguage: 'en',
    safeSearch: 'moderate',
    videoEmbeddable: 'true'
  });

  return (data.items || []).map((item) => ({
    id: item.id.videoId,
    topic: topic.label,
    query: topic.query,
    searchSnippet: item.snippet
  }));
}

async function fetchDetails(ids) {
  const all = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await youtube('videos', {
      part: 'snippet,statistics,contentDetails,status',
      id: chunk.join(',')
    });
    all.push(...(data.items || []));
    if (i + 50 < ids.length) await sleep(100);
  }
  return all;
}

function scoreVideo(video, topicMatches) {
  const published = new Date(video.snippet.publishedAt).getTime();
  const ageDays = Math.max((Date.now() - published) / 86400000, 0.5);
  const views = Number(video.statistics.viewCount || 0);
  const likes = Number(video.statistics.likeCount || 0);
  const comments = Number(video.statistics.commentCount || 0);
  const viewsPerDay = views / ageDays;
  const engagementRate = views > 0 ? (likes + comments * 2) / views : 0;
  const freshness = Math.max(0.55, 1.35 - ageDays / Math.max(config.windowDays, 1));
  const topicBreadth = Math.min(1.18, 1 + Math.max(0, topicMatches.length - 1) * 0.04);
  const velocityScore = Math.log10(viewsPerDay + 10) * 22;
  const totalViewsScore = Math.log10(views + 10) * 6;
  const engagementScore = Math.min(18, engagementRate * 350);
  return Number(((velocityScore + totalViewsScore + engagementScore) * freshness * topicBreadth).toFixed(2));
}

function normalizeCandidate(detail, topicMatches) {
  const durationSeconds = parseDuration(detail.contentDetails.duration);
  const views = Number(detail.statistics.viewCount || 0);
  const likes = Number(detail.statistics.likeCount || 0);
  const comments = Number(detail.statistics.commentCount || 0);
  const publishedAt = detail.snippet.publishedAt;
  const ageDays = Math.max((Date.now() - new Date(publishedAt).getTime()) / 86400000, 0.5);
  const score = scoreVideo(detail, topicMatches);

  return {
    videoId: detail.id,
    title: detail.snippet.title,
    channelId: detail.snippet.channelId,
    channelTitle: detail.snippet.channelTitle,
    publishedAt,
    thumbnail: detail.snippet.thumbnails?.maxres?.url || detail.snippet.thumbnails?.standard?.url || detail.snippet.thumbnails?.high?.url || detail.snippet.thumbnails?.medium?.url || detail.snippet.thumbnails?.default?.url || '',
    durationSeconds,
    duration: formatDuration(durationSeconds),
    views,
    likes,
    comments,
    viewsPerDay: Math.round(views / ageDays),
    score,
    topics: topicMatches,
    primaryTopic: topicMatches[0] || 'Trending',
    url: `https://www.youtube.com/watch?v=${detail.id}`
  };
}

function pickTopVideos(candidates) {
  const sorted = candidates.sort((a, b) => b.score - a.score);
  const channelCounts = new Map();
  const picked = [];

  for (const video of sorted) {
    const count = channelCounts.get(video.channelId) || 0;
    if (count >= config.maxVideosPerChannel) continue;
    picked.push(video);
    channelCounts.set(video.channelId, count + 1);
    if (picked.length >= config.videosPerCategory) break;
  }
  return picked;
}

function buildTopicPulse(videos, category) {
  const pulse = category.topics.map((topic) => {
    const matches = videos.filter((video) => video.topics.includes(topic.label));
    return {
      label: topic.label,
      score: Number(matches.reduce((sum, video) => sum + video.score, 0).toFixed(2)),
      videoCount: matches.length
    };
  }).filter((topic) => topic.videoCount > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return pulse;
}

const result = {
  updatedAt: new Date().toISOString(),
  windowDays: config.windowDays,
  methodology: 'Fresh YouTube videos are ranked by view velocity, engagement, recency and topical relevance. Channel repetition is limited for variety.',
  categories: []
};

for (const category of config.categories) {
  console.log(`\nScanning ${category.name}...`);
  const discovered = [];

  for (const topic of category.topics) {
    try {
      const items = await searchTopic(topic);
      discovered.push(...items);
      console.log(`  ${topic.label}: ${items.length} candidates`);
    } catch (err) {
      console.error(`  ${topic.label}: ${err.message}`);
    }
    await sleep(120);
  }

  const matchMap = new Map();
  for (const item of discovered) {
    if (!item.id) continue;
    if (!matchMap.has(item.id)) matchMap.set(item.id, new Set());
    matchMap.get(item.id).add(item.topic);
  }

  const ids = [...matchMap.keys()];
  const details = await fetchDetails(ids);
  const candidates = details
    .filter((video) => video.status?.embeddable !== false)
    .filter((video) => video.snippet?.liveBroadcastContent === 'none')
    .map((video) => normalizeCandidate(video, [...(matchMap.get(video.id) || [])]))
    .filter((video) => video.durationSeconds >= config.minimumDurationSeconds)
    .filter((video) => video.durationSeconds <= config.maximumDurationSeconds)
    .filter((video) => video.views >= config.minimumViews);

  const videos = pickTopVideos(candidates);
  result.categories.push({
    id: category.id,
    name: category.name,
    description: category.description,
    topics: buildTopicPulse(candidates, category),
    videos
  });
  console.log(`  Selected ${videos.length} videos from ${candidates.length} qualified candidates.`);
}

await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`\nWeekly Drip updated: ${outputPath}`);
