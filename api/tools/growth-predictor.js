module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url    = new URL(req.url, 'https://xgrowthnow.com');
  const handle = (url.searchParams.get('handle') || '').replace('@', '').trim();

  if (!handle) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'handle parameter required' }));
  }

  const BEARER = process.env.TWITTER_BEARER_TOKEN;
  if (!BEARER) {
    res.writeHead(500);
    return res.end(JSON.stringify({ error: 'Server misconfiguration' }));
  }

  try {
    const r = await fetch(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=public_metrics,created_at,description,profile_image_url,verified`,
      { headers: { Authorization: `Bearer ${BEARER}` } }
    );

    const body = await r.json();
    const u = body?.data;

    if (!u) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: 'User not found' }));
    }

    const m = u.public_metrics || {};
    const followers   = m.followers_count  || 0;
    const following   = m.following_count  || 0;
    const tweetCount  = m.tweet_count      || 0;
    const listedCount = m.listed_count     || 0;
    const createdAt   = u.created_at;

    const followRatio    = followers / Math.max(following, 1);
    const accountAgeDays = (Date.now() - new Date(createdAt)) / 86400000;
    const tweetsPerDay   = tweetCount / Math.max(accountAgeDays, 1);
    const engagementScore = Math.min(100, Math.round(
      (followRatio * 20) + (tweetsPerDay * 10) + (listedCount / Math.max(followers, 1) * 1000)
    ));
    const growthScore = Math.min(100, Math.round(engagementScore * 0.6 + Math.min(40, followRatio * 10)));

    // Build insights
    const insights = [];

    if (followRatio < 0.5) {
      insights.push({ type: 'warning', text: "You're following too many people who don't follow back. Clean your list to boost credibility." });
    } else if (followRatio > 2) {
      insights.push({ type: 'good', text: 'Great follow ratio! Your content is attracting more followers than you follow.' });
    }

    if (tweetsPerDay < 0.5) {
      insights.push({ type: 'warning', text: "You're posting less than once every 2 days. Consistency is key to growth." });
    } else if (tweetsPerDay > 3) {
      insights.push({ type: 'good', text: "You're posting consistently — great habit for growth." });
    }

    if (followers < 500) {
      insights.push({ type: 'tip', text: 'Under 500 followers? Focus on engaging with bigger accounts in your niche.' });
    }

    if (listedCount > 10) {
      insights.push({ type: 'good', text: `You're on ${listedCount} lists — people are paying attention.` });
    }

    if (growthScore < 40) {
      insights.push({ type: 'tip', text: 'Your growth score is low. Try posting more consistently and engaging with others in your niche.' });
    } else if (growthScore >= 70) {
      insights.push({ type: 'good', text: "Strong growth score! You're building authority on X." });
    }

    res.end(JSON.stringify({
      handle:        u.username,
      name:          u.name,
      avatar:        (u.profile_image_url || '').replace('_normal', '_400x400'),
      bio:           u.description || '',
      followers,
      following,
      tweets:        tweetCount,
      listed:        listedCount,
      followRatio:   followRatio.toFixed(2),
      accountAgeDays: Math.floor(accountAgeDays),
      tweetsPerDay:  tweetsPerDay.toFixed(1),
      engagementScore,
      growthScore,
      insights,
    }));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
