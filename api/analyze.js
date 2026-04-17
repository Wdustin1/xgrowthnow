const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

function hashUsername(u) {
  let h = 0;
  for (let i = 0; i < u.length; i++) {
    const c = u.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return Math.abs(h);
}

function seededRand(seed) {
  const t = Math.sin(seed + 1) * 10000;
  return t - Math.floor(t);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Support both GET (?handle=) and POST (body.handle)
  const url    = new URL(req.url, 'https://xgrowthnow.com');
  let   handle = url.searchParams.get('handle');
  if (!handle && req.method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      handle = body.handle;
    } catch {}
  }

  if (!handle) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Handle is required' }));
  }

  const username = handle.replace('@', '').trim().toLowerCase();

  // ── Fetch user data from RapidAPI ──
  let currentFollowers, accountAgeMonths, displayName, verified, profileImageUrl;
  try {
    const r = await fetch(
      `https://${RAPIDAPI_HOST}/user/details?username=${encodeURIComponent(username)}`,
      { headers: rapidHeaders() }
    );
    const d = await r.json();

    const result = d?.data?.user?.result;
    if (!result?.legacy) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: 'Account not found or private.' }));
    }

    const l = result.legacy;
    currentFollowers = l.followers_count || 0;
    displayName      = l.name || username;
    verified         = result.is_blue_verified || l.verified || false;
    profileImageUrl  = (l.profile_image_url_https || '')
      .replace('_normal', '_400x400');

    // Account age
    const created = new Date(l.created_at);
    const now     = new Date();
    accountAgeMonths = Math.max(1,
      Math.floor((now - created) / (1000 * 60 * 60 * 24 * 30.44))
    );
  } catch (e) {
    res.writeHead(500);
    return res.end(JSON.stringify({ error: 'Failed to fetch Twitter data. Try again.' }));
  }

  // ── Growth multiplier (tier-based) ──
  const hash = hashUsername(username);
  const n    = seededRand(hash + 4);
  let growthMultiplier;

  if (currentFollowers >= 200 && currentFollowers <= 5000) {
    const l = 0.50, u = 1.0, d = (5000 - currentFollowers) / 4800 * 0.20;
    growthMultiplier = l + d + n * (u - l - d);
  } else if (currentFollowers > 5000 && currentFollowers <= 15000) {
    const l = 0.40, u = 0.70, d = (15000 - currentFollowers) / 10000 * 0.10;
    growthMultiplier = l + d + n * (u - l - d);
  } else if (currentFollowers > 15000 && currentFollowers <= 30000) {
    const l = 0.30, u = 0.55, d = (30000 - currentFollowers) / 15000 * 0.08;
    growthMultiplier = l + d + n * (u - l - d);
  } else if (currentFollowers > 30000 && currentFollowers <= 100000) {
    const l = 0.20, u = 0.38, d = (100000 - currentFollowers) / 70000 * 0.07;
    growthMultiplier = l + d + n * (u - l - d);
  } else if (currentFollowers > 100000) {
    const l = 0.060, u = 0.120, d = Math.min((500000 - currentFollowers) / 400000, 1) * 0.030;
    growthMultiplier = l + d + n * (u - l - d);
  } else {
    growthMultiplier = 0.80;
  }

  // ── Projections ──
  const avgMonthlyGrowth = currentFollowers / accountAgeMonths;
  const monthlyAmount    = (currentFollowers * growthMultiplier) / 12;
  const now = new Date();
  const labels = [], bear = [], base = [], bull = [];
  let bv = currentFollowers, sv = currentFollowers, uv = currentFollowers;

  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    bv += monthlyAmount * 0.7;
    sv += monthlyAmount;
    uv += monthlyAmount * 1.3;
    bear.push(Math.floor(bv));
    base.push(Math.floor(sv));
    bull.push(Math.floor(uv));
  }

  // ── Historical backfill ──
  const histMonths = Math.min(6, accountAgeMonths);
  const histLabels = [], histData = [];
  for (let i = histMonths; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    histLabels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    histData.push(Math.max(0, Math.floor(currentFollowers - avgMonthlyGrowth * i)));
  }

  res.end(JSON.stringify({
    handle: username,
    displayName,
    verified,
    profileImageUrl,
    current:          currentFollowers,
    accountAgeMonths,
    avgMonthlyGrowth: Math.floor(avgMonthlyGrowth),
    monthlyAmount:    Math.floor(monthlyAmount),
    dailyAmount:      Math.floor(monthlyAmount / 30),
    weeklyAmount:     Math.floor(monthlyAmount / 4),
    projections: { labels, bear, base, bull },
    history:     { labels: histLabels, data: histData },
    summary: {
      bear12: bear[11],
      base12: base[11],
      bull12: bull[11],
    }
  }));
};
