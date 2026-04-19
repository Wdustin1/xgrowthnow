const { getSession } = require('../../utils/session');
const { refreshIfNeeded } = require('../../utils/refresh-token');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

function parseUsers(data) {
  const users    = [];
  let nextCursor = null;
  try {
    const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions || [];
    for (const inst of instructions) {
      if (inst.type !== 'TimelineAddEntries') continue;
      for (const entry of inst.entries || []) {
        const entryId = entry.entryId || '';
        if (entryId.includes('cursor-bottom')) { nextCursor = entry.content?.value || null; continue; }
        if (entryId.includes('cursor')) continue;
        const result = entry.content?.itemContent?.user_results?.result;
        if (!result?.legacy) continue;
        const l = result.legacy;
        users.push({
          id:           result.rest_id,
          name:         l.name,
          username:     l.screen_name,
          avatar:       (l.profile_image_url_https || '').replace('_normal', '_bigger'),
          followers:    l.followers_count || 0,
          verifiedType: (() => {
            if (result.is_blue_verified || l.verified) return 'blue';
            const vt = (result.verified_type || l.verified_type || '').toLowerCase();
            if (vt === 'business') return 'business';
            if (vt === 'government') return 'government';
            return null;
          })(),
          followsBack:  null, // resolved client-side after /api/tools/followers loads
        });
      }
    }
  } catch {}
  return { users, nextCursor };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }
  session = await refreshIfNeeded(req, res, session);

  const url  = new URL(req.url, 'https://xgrowthnow.com');
  const mode = url.searchParams.get('mode');

  // ── Verify mode: fetch is_blue_verified for a batch of user IDs ────────────
  if (mode === 'verify') {
    try {
      const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 10);
      const results = [];
      for (const id of ids) {
        try {
          const r = await fetch(`https://${RAPIDAPI_HOST}/user/details?user_id=${id}`, { headers: rapidHeaders() });
          const d = await r.json();
          const result = d?.data?.user?.result;
          if (!result) { results.push({ id, verifiedType: null }); continue; }
          const l  = result.legacy || {};
          let vt = null;
          if (result.is_blue_verified || l.verified) vt = 'blue';
          else {
            const vtRaw = (result.verified_type || l.verified_type || '').toLowerCase();
            if (vtRaw === 'business')   vt = 'business';
            if (vtRaw === 'government') vt = 'government';
          }
          results.push({ id, verifiedType: vt });
        } catch { results.push({ id, verifiedType: null }); }
        await new Promise(r => setTimeout(r, 150)); // avoid rate limit
      }
      const map = {};
      results.forEach(({ id, verifiedType }) => { map[id] = verifiedType; });
      return res.end(JSON.stringify({ verified: map }));
    } catch (e) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ── Normal following fetch ─────────────────────────────────────────────────
  try {
    const cursor = url.searchParams.get('cursor') || null;
    const params = new URLSearchParams({ user_id: session.userId, count: '100' });
    if (cursor) params.set('cursor', cursor);

    const r    = await fetch(`https://${RAPIDAPI_HOST}/user/following?${params}`, { headers: rapidHeaders() });
    const data = await r.json();
    const { users, nextCursor } = parseUsers(data);

    res.end(JSON.stringify({ following: users, nextCursor: nextCursor || null, hasMore: !!nextCursor }));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
