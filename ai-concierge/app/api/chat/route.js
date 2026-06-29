export async function POST(req) {
  try {
    const body = await req.json();
    const sessionId = req.headers.get('x-session-id') || 'default';

    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    // Forward the streaming response directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Vercel-AI-Data-Stream': 'v1',
        'x-cart-updated': response.headers.get('x-cart-updated') || '',
      },
    });
  } catch (error) {
    console.error("Next.js proxy error:", error);
    return new Response(JSON.stringify({ error: "Proxy error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
