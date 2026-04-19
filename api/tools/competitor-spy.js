const { getSession } = require('../../utils/session');
const { refreshIfNeeded } = require('../../utils/refresh-token');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

// Parse tweets from user/tweets RapidAPI response
function parseTweets(data) {
  const tweets = [];
  const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions || [];
  for (const inst of instructions) {
    if (inst.type !== 'TimelineAddEntries') continue;
    for (const entry of inst.entries || []) {
      const entryId = entry.entryId || '';
      if (entryId.includes('cursor')) continue;
      const result = entry?.content?.itemContent?.tweet_results?.result;
      if (!result?.legacy) continue;
      const l = result.legacy;
      if (l.retweeted_status_result) continue;
      if (l.in_reply_to_status_id_str) continue;
      tweets.push({
        id:        result.rest_id,
        text:      l.full_text,
        likes:     l.favorite_count || 0,
        retweets:  l.retweet_count  || 0,
        replies:   l.reply_count    || 0,
        createdAt: l.created_at,
      });
    }
  }
  return tweets;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  let session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }
  session = await refreshIfNeeded(req, res, session);

  const url    = new URL(req.url, 'https://xgrowthnow.com');
  const handle = (url.searchParams.get('handle') || '').replace('@', '').trim();

  if (!handle) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'handle parameter required' }));
  }

  const BEARER = process.env.TWITTER_BEARER_TOKEN;

  try {
    // Step 1: Fetch profile via official Twitter API v2 (reliable, no parsing guesswork)
    const profileR = await fetch(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=name,username,profile_image_url,public_metrics,description,verified,verified_type`,
      { headers: { Authorization: `Bearer ${BEARER}` } }
    );
    const profileData = await profileR.json();
    const u = profileData?.data;

    if (!u) {
      const reason = profileData?.errors?.[0]?.detail || 'User not found or account is private';
      return res.end(JSON.stringify({ error: reason }));
    }

    const profile = {
      id:         u.id,
      name:       u.name,
      username:   u.username,
      avatar:     (u.profile_image_url || '').replace('_normal', '_400x400'),
      bio:        u.description || '',
      followers:  u.public_metrics?.followers_count  || 0,
      following:  u.public_metrics?.following_count  || 0,
      tweetCount: u.public_metrics?.tweet_count      || 0,
      verified:   u.verified_type === 'blue' || u.verified || false,
    };

    // Step 2: Fetch their tweets — up to 5 pages (250 tweets) for accurate stats
    const tweets = [];
    let cursor = null;
    for (let page = 0; page < 5; page++) {
      const params = new URLSearchParams({ user_id: profile.id, count: '50' });
      if (cursor) params.set('cursor', cursor);
      const tweetsR    = await fetch(
        `https://${RAPIDAPI_HOST}/user/tweets?${params}`,
        { headers: rapidHeaders() }
      );
      const tweetsData = await tweetsR.json();
      const pageTweets = parseTweets(tweetsData);
      tweets.push(...pageTweets);

      // Extract next cursor
      const instructions = tweetsData?.data?.user?.result?.timeline?.timeline?.instructions || [];
      cursor = null;
      for (const inst of instructions) {
        if (inst.type !== 'TimelineAddEntries') continue;
        for (const entry of inst.entries || []) {
          if ((entry.entryId || '').includes('cursor-bottom')) cursor = entry.content?.value || null;
        }
      }
      if (!cursor || !pageTweets.length) break;
    }

    // Step 3: Compute stats
    const tweetCount  = tweets.length;
    const avgLikes    = tweetCount ? Math.round(tweets.reduce((s, t) => s + t.likes,    0) / tweetCount) : 0;
    const avgRTs      = tweetCount ? Math.round(tweets.reduce((s, t) => s + t.retweets, 0) / tweetCount) : 0;
    const engagementRate = profile.followers > 0
      ? +((avgLikes + avgRTs) / profile.followers * 100).toFixed(3)
      : 0;

    // Top 5 tweets by combined likes + RTs
    const top5 = [...tweets]
      .sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets))
      .slice(0, 5)
      .map(t => ({
        id:       t.id,
        text:     t.text,
        likes:    t.likes,
        retweets: t.retweets,
        replies:  t.replies,
        url:      `https://twitter.com/${profile.username}/status/${t.id}`,
      }));

    // Posting heatmap (7 days × 24 hours)
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const t of tweets) {
      if (!t.createdAt) continue;
      const d    = new Date(t.createdAt);
      const day  = d.getUTCDay();
      const hour = d.getUTCHours();
      heatmap[day][hour]++;
    }

    res.end(JSON.stringify({
      profile,
      stats: { avgLikes, avgRTs, engagementRate, tweetCount },
      top5,
      heatmap,
    }));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
