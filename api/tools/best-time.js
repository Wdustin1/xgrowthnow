const { getSession } = require('../../utils/session');

// Official X API v2 — uses the user's own OAuth token for real impression data
async function fetchUserTweets(userId, accessToken, { maxPages = 10, excludeReplies = false } = {}) {
  const allTweets = [];
  let nextToken  = null;

  let lastError = null;
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      max_results: '100',
      'tweet.fields': 'created_at,public_metrics,attachments',
      'media.fields': 'url,preview_image_url,type',
      'expansions':   'attachments.media_keys',
    });
    if (excludeReplies) params.set('exclude', 'retweets,replies');
    else params.set('exclude', 'retweets');
    if (nextToken) params.set('pagination_token', nextToken);

    const r = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const d = await r.json();

    // If API call fails entirely, capture error and stop
    if (!r.ok || !d.data) {
      lastError = d.errors?.[0]?.message || d.error || d.title || `HTTP ${r.status}`;
      break;
    }

    // Build media map
    const mediaMap = {};
    for (const m of d.includes?.media || []) {
      mediaMap[m.media_key] = m;
    }

    for (const t of d.data) {
      const pm = t.public_metrics || {};
      // public_metrics.impression_count is available for the authenticated user's own tweets
      const impressions = pm.impression_count || 0;
      const media = (t.attachments?.media_keys || [])
        .map(k => mediaMap[k])
        .filter(Boolean)
        .map(m => ({ type: m.type, url: m.url || m.preview_image_url }));

      allTweets.push({
        id:          t.id,
        text:        t.text,
        createdAt:   t.created_at,
        impressions,
        likes:       pm.like_count     || 0,
        retweets:    pm.retweet_count  || 0,
        replies:     pm.reply_count    || 0,
        quotes:      pm.quote_count    || 0,
        bookmarks:   pm.bookmark_count || 0,
        media,
      });
    }

    nextToken = d.meta?.next_token;
    if (!nextToken || d.data.length === 0) break;
  }

  return { tweets: allTweets, lastError };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }
  if (!session.accessToken) { res.writeHead(403); return res.end(JSON.stringify({ error: 'No access token' })); }

  const url  = new URL(req.url, 'https://xgrowthnow.com');
  const mode = url.searchParams.get('mode');

  // ── Top 5 mode ─────────────────────────────────────────────────────────────
  if (mode === 'top5') {
    try {
      const { tweets, lastError } = await fetchUserTweets(session.userId, session.accessToken, {
        maxPages: 32,
        excludeReplies: true,
      });

      if (!tweets.length) {
        return res.end(JSON.stringify({ top5: [], debug: { total: 0, error: lastError || 'No tweets returned' } }));
      }

      const scored = tweets.map(t => ({
        ...t,
        score:    t.impressions > 0 ? t.impressions : (t.likes * 3 + t.retweets * 5 + t.replies * 2 + t.quotes * 4),
        tweetUrl: `https://x.com/${session.username}/status/${t.id}`,
      }));
      scored.sort((a, b) => b.score - a.score);

      return res.end(JSON.stringify({
        top5:  scored.slice(0, 5),
        debug: { total: tweets.length, maxImpressions: Math.max(0, ...tweets.map(t => t.impressions)) },
      }));
    } catch (e) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ── Best time to post (default) ────────────────────────────────────────────
  try {
    const { tweets: allTweets, lastError: btError } = await fetchUserTweets(session.userId, session.accessToken, {
      maxPages: 10,
      excludeReplies: true,
    });

    if (allTweets.length < 5) {
      return res.end(JSON.stringify({ error: btError || 'Not enough tweet data. Try signing out and back in.', tweets: 0 }));
    }

    const DAYS  = 7;
    const HOURS = 24;
    const grid  = Array.from({ length: DAYS }, () =>
      Array.from({ length: HOURS }, () => ({ total: 0, count: 0 }))
    );
    const hourTotals = Array(HOURS).fill(0).map(() => ({ total: 0, count: 0 }));
    const dayTotals  = Array(DAYS).fill(0).map(() => ({ total: 0, count: 0 }));

    for (const t of allTweets) {
      const date = new Date(t.createdAt);
      const hour = date.getUTCHours();
      const day  = date.getUTCDay();
      // Use real impressions when available, otherwise fall back to engagement proxy
      const eng = t.impressions > 0
        ? t.impressions
        : (t.likes * 10 + t.retweets * 20 + t.replies * 5 + t.quotes * 15);

      grid[day][hour].total += eng;
      grid[day][hour].count += 1;
      hourTotals[hour].total += eng;
      hourTotals[hour].count += 1;
      dayTotals[day].total  += eng;
      dayTotals[day].count  += 1;
    }

    const avgGrid   = grid.map(row => row.map(c => c.count > 0 ? c.total / c.count : 0));
    const avgByHour = hourTotals.map(c => c.count > 0 ? c.total / c.count : 0);
    const avgByDay  = dayTotals.map(c  => c.count > 0 ? c.total / c.count : 0);

    const slots = [];
    for (let d = 0; d < DAYS; d++) {
      for (let h = 0; h < HOURS; h++) {
        if (grid[d][h].count > 0) slots.push({ day: d, hour: h, avg: avgGrid[d][h], sampleSize: grid[d][h].count });
      }
    }
    slots.sort((a, b) => b.avg - a.avg);

    res.end(JSON.stringify({
      tweets:   allTweets.length,
      heatmap:  avgGrid,
      byHour:   avgByHour,
      byDay:    avgByDay,
      topSlots: slots.slice(0, 5),
    }));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
