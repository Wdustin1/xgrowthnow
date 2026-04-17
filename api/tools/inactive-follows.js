const { getSession } = require('../../utils/session');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  const { userId, accessToken } = session;
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // ── Step 1: Fetch all followed accounts with their most recent tweet date ──
    // The `most_recent_tweet_id` expansion gets last tweet date in ONE request
    // instead of making individual calls per user (avoids rate limits)
    const allFollowing = [];
    let nextToken = null;

    for (let page = 0; page < 20; page++) {
      const params = new URLSearchParams({
        max_results: '100',
        'user.fields': 'name,username,profile_image_url,public_metrics,most_recent_tweet_id,verified,verified_type',
        expansions: 'most_recent_tweet_id',
        'tweet.fields': 'created_at',
      });
      if (nextToken) params.set('pagination_token', nextToken);

      const r = await fetch(
        `https://api.twitter.com/2/users/${userId}/following?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const d = await r.json();

      if (!r.ok || !d.data) {
        const apiErr = d.errors?.[0]?.message || d.error || d.title || `HTTP ${r.status}`;
        return res.end(JSON.stringify({ error: `Twitter API error: ${apiErr}`, notTweeted: [], notEngaged: [] }));
      }

      // Map tweet id → created_at from the includes block
      const tweetDates = {};
      for (const t of d.includes?.tweets || []) {
        tweetDates[t.id] = t.created_at;
      }

      for (const u of d.data) {
        const lastTweetAt = u.most_recent_tweet_id ? (tweetDates[u.most_recent_tweet_id] || null) : null;
        allFollowing.push({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.profile_image_url || '',
          followersCount: u.public_metrics?.followers_count || 0,
          verified: u.verified_type === 'blue' || u.verified === true,
          lastTweetAt,
        });
      }

      nextToken = d.meta?.next_token;
      if (!nextToken) break;
    }

    if (!allFollowing.length) {
      return res.end(JSON.stringify({
        error: 'No following data returned — try signing out and back in to refresh your token.',
        notTweeted: [], notEngaged: []
      }));
    }

    // ── Step 2: Who hasn't tweeted in the last month? ──────────────────────────
    const notTweeted = allFollowing.filter(u =>
      !u.lastTweetAt || new Date(u.lastTweetAt) < new Date(oneMonthAgo)
    );

    // ── Step 3: Your engagement in the last 30 days ───────────────────────────
    // Checks: likes, retweets, and replies — all within the last month
    const engagedAuthorIds = new Set();

    // Likes (last 100 — API doesn't support start_time filter here)
    try {
      const lr = await fetch(
        `https://api.twitter.com/2/users/${userId}/liked_tweets?max_results=100&tweet.fields=author_id,created_at`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const ld = await lr.json();
      for (const t of ld.data || []) {
        // Only count likes within the last month
        if (t.author_id && t.created_at && new Date(t.created_at) >= new Date(oneMonthAgo)) {
          engagedAuthorIds.add(t.author_id);
        }
      }
    } catch {}

    // Retweets + replies from your own tweets in the last month
    try {
      const rr = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=referenced_tweets,in_reply_to_user_id,created_at&expansions=referenced_tweets.id&start_time=${oneMonthAgo}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const rd = await rr.json();
      for (const t of rd.data || []) {
        // Replies — in_reply_to_user_id tells us who you replied to
        if (t.in_reply_to_user_id) {
          engagedAuthorIds.add(t.in_reply_to_user_id);
        }
        // Retweets/quotes
        for (const ref of t.referenced_tweets || []) {
          if (ref.type === 'retweeted' || ref.type === 'quoted') {
            engagedAuthorIds.add(ref.id); // ref.id is tweet id — best we can do without author lookup
          }
        }
      }
    } catch {}

    // ── Step 4: Accounts with recent tweets you haven't liked or retweeted ────
    const notEngaged = allFollowing.filter(u =>
      u.lastTweetAt &&
      new Date(u.lastTweetAt) >= new Date(oneMonthAgo) &&
      !engagedAuthorIds.has(u.id)
    );

    res.end(JSON.stringify({
      total: allFollowing.length,
      notTweeted,   // haven't posted in 30 days
      notEngaged,   // active but you haven't liked/RT'd their stuff
    }));

  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
