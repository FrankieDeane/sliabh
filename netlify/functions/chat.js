/**
 * Netlify serverless function — proxies chat messages to the Anthropic API.
 * Requires ANTHROPIC_API_KEY in Netlify environment variables.
 *
 * POST /.netlify/functions/chat
 * Body: { messages: Array<{ role: 'system'|'user'|'assistant', content: string }> }
 * Response: { text: string }
 */

// Restrict cross-origin calls to this site's own deploy URL so the API key
// budget can't be drained by other sites embedding this endpoint. Falls back
// to '*' only when Netlify hasn't set a site URL (local `netlify dev`).
const ALLOWED_ORIGIN = process.env.URL || process.env.DEPLOY_PRIME_URL || '*';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  Vary: 'Origin',
};

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ error: 'AI service not configured. Set ANTHROPIC_API_KEY in Netlify env vars.' }),
    };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'messages must be a non-empty array' }) };
  }
  if (messages.length > MAX_MESSAGES) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Too many messages' }) };
  }
  if (messages.some((m) => typeof m.content !== 'string' || m.content.length > MAX_MESSAGE_CHARS)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Message too long' }) };
  }

  // Separate system prompt (the app sends its own trail-context system
  // message — see src/ai/promptBuilder.ts) from the conversation.
  const systemMsg = messages.find((m) => m.role === 'system');
  const system = systemMsg?.content ?? 'Eres Sliabh, un asistente de montaña para senderistas en Patagonia y Argentina.';

  // Anthropic requires strictly alternating user/assistant messages starting with user
  const chatMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .reduce((acc, msg) => {
      const last = acc[acc.length - 1];
      // Merge consecutive messages with the same role (Anthropic doesn't allow duplicates)
      if (last && last.role === msg.role) {
        last.content += '\n' + msg.content;
        return acc;
      }
      acc.push({ role: msg.role, content: msg.content });
      return acc;
    }, []);

  // Ensure conversation starts with a user message
  if (chatMessages.length === 0 || chatMessages[0].role !== 'user') {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'First message must be from user' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
      };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
