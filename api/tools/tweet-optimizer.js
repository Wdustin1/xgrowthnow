const { getSession } = require('../../utils/session');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

// Parse tweets from user/tweets RapidAPI response
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
        id:    result.rest_id,
        text:  l.full_text,
        likes: l.favorite_count || 0,
        retweets: l.retweet_count || 0,
      });
    }
  }
  return tweets;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end(JSON.stringify({ error: 'POST required' }));
  }

  // Parse body
  let draft = '';
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    draft = (body.draft || '').trim();
  } catch {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
  }

  if (!draft) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'draft is required' }));
  }

  // Check OpenAI key
  if (!process.env.OPENAI_API_KEY) {
    return res.end(JSON.stringify({ error: 'OpenAI key not configured' }));
  }

  const { userId } = session;

  try {
    // Step 1: Fetch user's tweets to find top 10 by likes
    const tweetsR    = await fetch(
      `https://${RAPIDAPI_HOST}/user/tweets?user_id=${userId}&count=50`,
      { headers: rapidHeaders() }
    );
    const tweetsData = await tweetsR.json();
    const tweets     = parseTweets(tweetsData);

    const topTweets = tweets
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    const examplesText = topTweets.length
      ? topTweets.map((t, i) => `${i + 1}. (${t.likes} likes) ${t.text}`).join('\n')
      : '(no tweet history available)';

    // Step 2: Call OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role:    'system',
            content: 'You are a viral tweet writing assistant. The user\'s best-performing tweets show their authentic voice. Rewrite their draft in 3 ways maximizing engagement while matching their voice. Return ONLY valid JSON: {"versions":[{"text":"...","why":"..."}]}',
          },
          {
            role:    'user',
            content: `Here are my top-performing tweets:\n${examplesText}\n\nDraft to optimize:\n${draft}\n\nRewrite this draft in 3 different ways that maximize engagement while staying true to my voice. Return ONLY valid JSON.`,
          },
        ],
        temperature: 0.8,
        max_tokens:  1200,
      }),
    });

    const openaiData = await openaiRes.json();

    if (!openaiRes.ok) {
      const errMsg = openaiData?.error?.message || `OpenAI error ${openaiRes.status}`;
      return res.end(JSON.stringify({ error: errMsg }));
    }

    const rawContent = openaiData.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.end(JSON.stringify({ error: 'OpenAI returned unexpected format', raw: rawContent }));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.end(JSON.stringify(parsed));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
