const { getSession } = require('../../utils/session');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

// Fetch one page of tweets from user/tweets, returns { tweets, nextCursor }
async function fetchTweetPage(userId, cursor) {
  const params = new URLSearchParams({ user_id: userId, count: '50' });
  if (cursor) params.set('cursor', cursor);

  const r    = await fetch(
    `https://${RAPIDAPI_HOST}/user/tweets?${params}`,
    { headers: rapidHeaders() }
  );
  const data = await r.json();

  const tweets     = [];
  let   nextCursor = null;

  const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions || [];
  for (const inst of instructions) {
    if (inst.type !== 'TimelineAddEntries') continue;
    for (const entry of inst.entries || []) {
      const entryId = entry.entryId || '';
      if (entryId.includes('cursor-bottom')) {
        nextCursor = entry.content?.value || null;
        continue;
      }
      if (entryId.includes('cursor')) continue;

      const result = entry?.content?.itemContent?.tweet_results?.result;
      if (!result?.legacy) continue;
      const l = result.legacy;

      // Original posts only — skip RTs and replies
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

  return { tweets, nextCursor };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  const { userId, username } = session;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  try {
    // Fetch up to 5 pages of tweet history
    const allTweets = [];
    let   cursor    = null;

    for (let page = 0; page < 5; page++) {
      const { tweets, nextCursor } = await fetchTweetPage(userId, cursor);
      allTweets.push(...tweets);
      cursor = nextCursor;
      if (!cursor) break;
    }

    // Filter: original tweets older than 30 days
    const oldTweets = allTweets.filter(t => {
      const ts = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      return ts > 0 && ts < thirtyDaysAgo;
    });

    // Score and sort
    const scored = oldTweets.map(t => {
      const engagementScore = (t.likes * 3) + (t.retweets * 5) + t.replies;
      const daysSincePosted = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000);
      return {
        id:              t.id,
        text:            t.text,
        likes:           t.likes,
        retweets:        t.retweets,
        replies:         t.replies,
        engagementScore,
        createdAt:       t.createdAt,
        url:             `https://twitter.com/${username}/status/${t.id}`,
        daysSincePosted,
      };
    });

    scored.sort((a, b) => b.engagementScore - a.engagementScore);

    res.end(JSON.stringify({
      tweets:      scored.slice(0, 20),
      totalScanned: allTweets.length,
      totalOld:    oldTweets.length,
    }));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
