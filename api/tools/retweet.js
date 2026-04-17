const { getSession } = require('../../utils/session');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  const { userId, accessToken } = session;

  // ── POST: Retweet a tweet ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body = '';
    await new Promise(r => { req.on('data', c => body += c); req.on('end', r); });
    let tweetId;
    try { tweetId = JSON.parse(body).tweetId; } catch {
      res.writeHead(400); return res.end(JSON.stringify({ error: 'Invalid body' }));
    }

    const r = await fetch(`https://api.twitter.com/2/users/${userId}/retweets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet_id: tweetId }),
    });
    const d = await r.json();

    if (d.data?.retweeted) {
      return res.end(JSON.stringify({ success: true }));
    }
    // Handle scope error gracefully
    const err = d.errors?.[0]?.message || d.detail || JSON.stringify(d);
    if (err.includes('scope') || err.includes('403') || r.status === 403) {
      return res.end(JSON.stringify({ error: 'scope', message: 'Please sign out and back in to enable retweet permissions.' }));
    }
    res.writeHead(400);
    return res.end(JSON.stringify({ error: err }));
  }

  // ── DELETE: Undo a retweet ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const url     = new URL(req.url, 'https://xgrowthnow.com');
    const tweetId = url.searchParams.get('tweetId');
    if (!tweetId) { res.writeHead(400); return res.end(JSON.stringify({ error: 'tweetId required' })); }

    const r = await fetch(`https://api.twitter.com/2/users/${userId}/retweets/${tweetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const d = await r.json();

    if (d.data?.retweeted === false) return res.end(JSON.stringify({ success: true }));
    const err = d.errors?.[0]?.message || d.detail || JSON.stringify(d);
    res.writeHead(400);
    return res.end(JSON.stringify({ error: err }));
  }

  res.writeHead(405);
  res.end(JSON.stringify({ error: 'Method not allowed' }));
};
