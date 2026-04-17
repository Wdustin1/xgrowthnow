const { getSession } = require('../../utils/session');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

function rapidHeaders() {
  return { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };
}

async function fetchTweetPage(userId, cursor) {
  const params = new URLSearchParams({ user_id: userId, count: '50' });
  if (cursor) params.set('cursor', cursor);
  const r = await fetch(`https://${RAPIDAPI_HOST}/user/tweets?${params}`, { headers: rapidHeaders() });
  const d = await r.json();

  const originalTweets        = []; // Robert's originals + QRTs
  const repliedConversationIds = []; // conversation IDs where Robert replied to a comment

  let nextCursor = null;

  const instructions = d?.data?.user?.result?.timeline?.timeline?.instructions || [];
  for (const inst of instructions) {
    if (inst.type !== 'TimelineAddEntries') continue;
    for (const entry of inst.entries || []) {
      const entryId = entry.entryId || '';
      if (entryId.includes('cursor-bottom')) { nextCursor = entry.content?.value || null; continue; }
      if (entryId.includes('cursor')) continue;

      const result = entry?.content?.itemContent?.tweet_results?.result;
      if (!result?.legacy) continue;
      const l = result.legacy;

      const isPlainRT  = !!l.retweeted_status_result;
      const isReply    = !!l.in_reply_to_status_id_str;
      const isQRT      = !!l.is_quote_status;
      const replyToUid = l.in_reply_to_user_id_str;

      // Skip plain retweets (no content)
      if (isPlainRT) continue;

      if (!isReply) {
        // Original post OR quote retweet — these are the tweets we track
        if (l.reply_count > 0) {
          originalTweets.push({
            id:           result.rest_id,
            text:         l.full_text,
            replyCount:   l.reply_count,
            likeCount:    l.favorite_count || 0,
            retweetCount: l.retweet_count || 0,
            createdAt:    l.created_at,
            isQRT,
          });
        }
      } else {
        // This is one of Robert's reply tweets.
        // If in_reply_to_user_id is NOT Robert's own ID, it means he replied to
        // a commenter (not just extending his own thread).
        // The conversation_id_str tells us which original tweet this thread belongs to.
        if (replyToUid && replyToUid !== userId && l.conversation_id_str) {
          repliedConversationIds.push(l.conversation_id_str);
        }
      }
    }
  }

  return { originalTweets, repliedConversationIds, nextCursor };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const session = getSession(req);
  if (!session) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Not authenticated' })); }

  try {
    const { userId, username } = session;
    const allOriginal    = [];
    const repliedConvIds = new Set();
    let   cursor         = null;

    // Fetch up to 10 pages (~500 tweets)
    for (let page = 0; page < 10; page++) {
      const { originalTweets, repliedConversationIds, nextCursor } = await fetchTweetPage(userId, cursor);

      for (const t of originalTweets) {
        t.url = `https://x.com/${username}/status/${t.id}`;
        allOriginal.push(t);
      }
      for (const id of repliedConversationIds) repliedConvIds.add(id);

      cursor = nextCursor;
      if (!cursor) break;
    }

    // An original tweet is "unreplied" if Robert has NOT replied to any commenter in that thread
    const unreplied = allOriginal
      .filter(t => !repliedConvIds.has(t.id))
      .sort((a, b) => b.replyCount - a.replyCount);

    res.end(JSON.stringify({
      unreplied,
      total:        unreplied.length,
      totalScanned: allOriginal.length,
    }));

  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
