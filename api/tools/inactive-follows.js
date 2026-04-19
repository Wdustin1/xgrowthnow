const { getSession } = require('../../utils/session');
const { refreshIfNeeded } = require('../../utils/refresh-token');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  let session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  session = await refreshIfNeeded(req, res, session);

  const { userId, accessToken } = session;
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // deep=1 scans up to 2000 accounts, default scans 500
  const url = new URL(req.url, 'https://xgrowthnow.com');
  const deep = url.searchParams.get('deep') === '1';
  const maxPages = deep ? 20 : 5;

  try {
    const allFollowing = [];
    let nextToken = null;

    for (let page = 0; page < maxPages; page++) {
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
        const apiErr = d.errors?.[0]?.message || d.error_description || d.error || d.title || d.detail || `HTTP ${r.status}`;
        const isRateLimit = r.status === 429;
        const isAuth = r.status === 401 || r.status === 403;
        const errMsg = isRateLimit
          ? 'Twitter rate limit hit — please wait 15 minutes and try again.'
          : isAuth
          ? 'Session expired — please sign out and sign back in.'
          : `Twitter API error: ${apiErr}`;
        return res.end(JSON.stringify({ error: errMsg, notTweeted: [], notEngaged: [] }));
      }

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

    const notTweeted = allFollowing.filter(u =>
      !u.lastTweetAt || new Date(u.lastTweetAt) < new Date(oneMonthAgo)
    );

    // Engagement check — skip if no inactive found to save API calls
    const engagedAuthorIds = new Set();

    try {
      const lr = await fetch(
        `https://api.twitter.com/2/users/${userId}/liked_tweets?max_results=100&tweet.fields=author_id,created_at`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const ld = await lr.json();
      for (const t of ld.data || []) {
        if (t.author_id && t.created_at && new Date(t.created_at) >= new Date(oneMonthAgo)) {
          engagedAuthorIds.add(t.author_id);
        }
      }
    } catch {}

    try {
      const rr = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=referenced_tweets,in_reply_to_user_id,created_at&expansions=referenced_tweets.id&start_time=${oneMonthAgo}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const rd = await rr.json();
      for (const t of rd.data || []) {
        if (t.in_reply_to_user_id) engagedAuthorIds.add(t.in_reply_to_user_id);
        for (const ref of t.referenced_tweets || []) {
          if (ref.type === 'retweeted' || ref.type === 'quoted') engagedAuthorIds.add(ref.id);
        }
      }
    } catch {}

    const notEngaged = allFollowing.filter(u =>
      u.lastTweetAt &&
      new Date(u.lastTweetAt) >= new Date(oneMonthAgo) &&
      !engagedAuthorIds.has(u.id)
    );

    res.end(JSON.stringify({
      total: allFollowing.length,
      scannedAll: !nextToken || deep,
      hasMore: !!nextToken && !deep,
      notTweeted,
      notEngaged,
      cachedAt: Date.now(),
    }));

  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
