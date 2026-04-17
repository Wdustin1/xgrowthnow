// Dedicated endpoint — fetches ALL follower IDs for the logged-in user
// Runs as a separate background call so following list loads instantly first
const { getSession } = require('../../utils/session');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return {
    'x-rapidapi-key':  RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  };
}

function parseUserIds(data) {
  const ids      = [];
  let nextCursor = null;
  try {
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
        const id = entry.content?.itemContent?.user_results?.result?.rest_id;
        if (id) ids.push(id);
      }
    }
  } catch {}
  return { ids, nextCursor };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  const url  = new URL(req.url, 'https://xgrowthnow.com');
  const mode = url.searchParams.get('mode');

  // ── Lookup mode: resolve user IDs → profile info ───────────────────────────
  if (mode === 'lookup') {
    const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 100);
    if (!ids.length) return res.end(JSON.stringify({ users: [] }));
    try {
      const r = await fetch(
        `https://api.twitter.com/2/users?ids=${ids.join(',')}&user.fields=name,username,profile_image_url,verified,public_metrics`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const d = await r.json();
      return res.end(JSON.stringify({ users: d.data || [] }));
    } catch (e) {
      return res.end(JSON.stringify({ users: [], error: e.message }));
    }
  }

  // ── Default: fetch all follower IDs ────────────────────────────────────────
  try {
    const userId  = session.userId;
    const allIds  = [];
    let cursor    = null;

    // Fetch all follower pages sequentially — up to 100 pages (~5,400 followers max)
    // Each page takes ~300ms, 100 pages = ~30s well within 60s timeout
    for (let page = 0; page < 100; page++) {
      const params = new URLSearchParams({ user_id: userId, count: '200' });
      if (cursor) params.set('cursor', cursor);

      const r = await fetch(`https://${RAPIDAPI_HOST}/user/followers?${params}`, {
        headers: rapidHeaders(),
      });
      const data = await r.json();
      const { ids, nextCursor } = parseUserIds(data);

      allIds.push(...ids);
      cursor = nextCursor;

      if (ids.length === 0 || !cursor) break;
    }

    res.end(JSON.stringify({ followerIds: allIds, total: allIds.length }));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
