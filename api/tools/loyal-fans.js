const { getSession } = require('../../utils/session');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';
const BEARER        = process.env.TWITTER_BEARER_TOKEN;

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

// ── Parse tweets from RapidAPI user/tweets response ───────────────────────
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
        id:          result.rest_id,
        replyCount:  l.reply_count || 0,
        likeCount:   l.favorite_count || 0,
      });
    }
  }
  return tweets;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  const { username } = session;
  const interactionMap = {};

  try {
    // ── Strategy 1: Paginate mention/reply search (up to 5 pages = 500 tweets) ──
    // Finds everyone who has mentioned or replied to the user in the last 7 days
    let nextToken = null;
    let mentionsParsed = 0;

    for (let page = 0; page < 5; page++) {
      const query = encodeURIComponent(`@${username} -from:${username} -is:retweet`);
      const url   = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=100&tweet.fields=author_id&expansions=author_id&user.fields=name,username,profile_image_url,public_metrics${nextToken ? `&next_token=${nextToken}` : ''}`;

      const r = await fetch(url, { headers: { Authorization: `Bearer ${BEARER}` } });
      const d = await r.json();

      if (!d.data?.length) break;

      // Build user lookup from expansions
      const userLookup = {};
      for (const u of d.includes?.users || []) {
        userLookup[u.id] = {
          id:             u.id,
          name:           u.name,
          username:       u.username,
          avatar:         (u.profile_image_url || '').replace('_normal', '_bigger'),
          followersCount: u.public_metrics?.followers_count || 0,
          interactionCount: 0,
        };
      }

      // Count per author
      for (const tweet of d.data) {
        const aid = tweet.author_id;
        if (!aid || aid === session.userId) continue;
        if (!interactionMap[aid] && userLookup[aid]) {
          interactionMap[aid] = { ...userLookup[aid] };
        }
        if (interactionMap[aid]) interactionMap[aid].interactionCount++;
        mentionsParsed++;
      }

      nextToken = d.meta?.next_token;
      if (!nextToken) break;
    }

    // ── Strategy 2: Scan user's tweet history for replies in each conversation ──
    // Fetch up to 300 of Robert's original tweets across 6 pages
    let cursor = null;
    const allTweets = [];

    for (let page = 0; page < 6; page++) {
      const params = new URLSearchParams({ user_id: session.userId, count: '50' });
      if (cursor) params.set('cursor', cursor);

      const r = await fetch(
        `https://${RAPIDAPI_HOST}/user/tweets?${params}`,
        { headers: rapidHeaders() }
      );
      const d = await r.json();
      const tweets = parseTweets(d);
      allTweets.push(...tweets);

      // Get next cursor
      const instructions = d?.data?.user?.result?.timeline?.timeline?.instructions || [];
      for (const inst of instructions) {
        if (inst.type !== 'TimelineAddEntries') continue;
        for (const entry of inst.entries || []) {
          if ((entry.entryId || '').includes('cursor-bottom')) {
            cursor = entry.content?.value || null;
          }
        }
      }
      if (!cursor) break;
    }

    // Take top 20 tweets by reply count and search their conversations
    const topReplied = allTweets
      .filter(t => t.replyCount > 0)
      .sort((a, b) => b.replyCount - a.replyCount)
      .slice(0, 20);

    for (const tweet of topReplied) {
      try {
        const query = encodeURIComponent(`conversation_id:${tweet.id} -from:${username}`);
        const r = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=100&tweet.fields=author_id&expansions=author_id&user.fields=name,username,profile_image_url,public_metrics`,
          { headers: { Authorization: `Bearer ${BEARER}` } }
        );
        const d = await r.json();
        if (!d.data?.length) continue;

        const userLookup = {};
        for (const u of d.includes?.users || []) {
          userLookup[u.id] = {
            id:             u.id,
            name:           u.name,
            username:       u.username,
            avatar:         (u.profile_image_url || '').replace('_normal', '_bigger'),
            followersCount: u.public_metrics?.followers_count || 0,
            interactionCount: 0,
          };
        }

        for (const t of d.data) {
          const aid = t.author_id;
          if (!aid || aid === session.userId) continue;
          if (!interactionMap[aid] && userLookup[aid]) {
            interactionMap[aid] = { ...userLookup[aid] };
          }
          if (interactionMap[aid]) interactionMap[aid].interactionCount++;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 150));
    }

    const fans = Object.values(interactionMap)
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, 20);

    res.end(JSON.stringify({
      fans,
      total:         fans.length,
      tweetsScanned: allTweets.length,
      mentionsFound: mentionsParsed,
    }));

  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
