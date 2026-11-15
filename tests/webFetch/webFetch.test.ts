/**
 * Web research tools test suite (ADR-019).
 * Covers the agent webfetch (SSRF guards, HTML→text, redirects), keyless
 * search parsers, and the model-initiated web_search/web_fetch tool loop
 * in generateAnswer — all offline via mocked fetch.
 */
import assert from 'node:assert';
import {
  validateUrlShape,
  htmlToText,
  webFetch,
  parseBingNewsRss,
  parseWikipediaSearch,
  isWebFetchEnabled
} from '../../lib/integrations/webFetch';

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function run(): Promise<void> {
  console.log('Running FarmIQ Web Research Tools Test Suite...');

  delete process.env.AI_API_KEY;
  delete process.env.WEB_FETCH_DISABLED;

  /* ------------------------------ SSRF guards ------------------------------ */

  assert(validateUrlShape('https://en.wikipedia.org/wiki/Wheat').ok, 'public https accepted');
  assert(validateUrlShape('http://example.org/page').ok, 'plain http accepted');
  assert(!validateUrlShape('https://user:secret@example.com/').ok, 'credentials rejected');
  assert(!validateUrlShape('file:///etc/passwd').ok, 'file scheme rejected');
  assert(!validateUrlShape('http://localhost:3000/api/secrets').ok, 'localhost rejected');
  assert(!validateUrlShape('http://127.0.0.1/').ok, 'loopback rejected');
  assert(!validateUrlShape('http://[::1]/').ok, 'IPv6 loopback rejected');
  assert(!validateUrlShape('http://169.254.169.254/latest/meta-data/').ok, 'cloud metadata rejected');
  assert(!validateUrlShape('http://10.1.2.3/').ok, '10.x private rejected');
  assert(!validateUrlShape('http://172.16.0.1/').ok, '172.16.x private rejected');
  assert(!validateUrlShape('http://192.168.0.1/').ok, '192.168.x private rejected');
  assert(!validateUrlShape('http://metadata.google.internal/').ok, 'metadata hostname rejected');
  assert(!validateUrlShape('http://printer.local/').ok, '.local hostname rejected');
  assert(!validateUrlShape('http://example.com:8443/x').ok, 'non-standard port rejected');
  console.log('✔ SSRF guards accept public web URLs and reject private/metadata targets');

  /* ------------------------------ HTML → text ------------------------------ */

  const text = htmlToText(
    '<html><head><title>Soil Guide</title></head><body>' +
      '<script>window.x=1</script><style>.a{display:none}</style>' +
      '<h1>pH and fertility</h1><p>Target&nbsp;pH&nbsp;6.0&ndash;7.0.</p></body></html>'
  );
  assert(text.includes('Soil Guide'), 'title kept');
  assert(text.includes('Target pH 6.0'), 'entities decoded, tags stripped');
  assert(!text.includes('window.x'), 'script removed');
  assert(!text.includes('display:none'), 'style removed');
  const capped = htmlToText(`<p>${'word '.repeat(2000)}</p>`, 100);
  assert(capped.length <= 101, 'text capped at maxChars');
  console.log('✔ HTML→text keeps readable content, drops scripts/styles, honors cap');

  /* --------------------------- Keyless search parsers ---------------------- */

  const rss = `<rss><channel><item>
    <title>Wheat MSP announced for Rabi</title>
    <link>http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;url=https%3a%2f%2fgov.example%2fmSP</link>
    <description>Government &lt;em&gt;announces&lt;/em&gt; MSP.</description>
    <pubDate>Mon, 10 Nov 2026 06:30:00 GMT</pubDate>
    <News:Source>Gov Daily</News:Source></item></channel></rss>`;
  const news = parseBingNewsRss(rss);
  assertEqual(news.length, 1, 'one item parsed');
  assertEqual(news[0].url, 'https://gov.example/mSP', 'apiclick unwrapped');
  assert(news[0].snippet.includes('announces') && !news[0].snippet.includes('<em>'), 'snippet cleaned');
  assertEqual(news[0].source, 'Gov Daily', 'source preserved');
  assert(Boolean(news[0].publishedAt), 'date normalized');

  assertEqual(parseBingNewsRss('not xml at all').length, 0, 'garbage RSS → no items');
  const wiki = parseWikipediaSearch({
    query: { search: [{ title: 'Maize', snippet: 'a <span class="searchmatch">cereal</span> crop', timestamp: '2026-09-01T00:00:00Z' }] }
  });
  assertEqual(wiki[0].url, 'https://en.wikipedia.org/wiki/Maize', 'wiki url built');
  assertEqual(wiki[0].snippet, 'a cereal crop', 'wiki snippet cleaned');
  assertEqual(parseWikipediaSearch({ bad: true }).length, 0, 'garbage wiki payload → no items');
  console.log('✔ Keyless search parsers handle real and garbage payloads');

  /* ------------------------- web_fetch with mocked network ----------------- */

  const originalFetch = global.fetch;
  const fetchCalls: string[] = [];

  // 1) Successful page fetch (HTML → text)
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    fetchCalls.push(url);
    if (url.includes('example.com/redir-target')) {
      return {
        ok: false,
        status: 302,
        url,
        headers: { get: (h: string) => (h.toLowerCase() === 'location' ? 'http://127.0.0.1/steal' : null) },
        text: async () => ''
      } as unknown as Response;
    }
    if (url.includes('example.com/missing-page')) {
      return { ok: false, status: 404, url, headers: { get: () => null }, text: async () => '' } as unknown as Response;
    }
    if (url.includes('example.com')) {
      return {
        ok: true,
        status: 200,
        url,
        headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null) },
        text: async () => '<html><head><title>Extension Guide</title></head><body><p>Scout fields twice a week during the wet season for early blight signs.</p></body></html>'
      } as unknown as Response;
    }
    if (url.includes('bing.com/news')) {
      return {
        ok: true,
        status: 200,
        text: async () => '<rss><channel><item><title>Big harvest news</title><link>https://news.example/harvest</link><description>Record harvest.</description><pubDate>Wed, 12 Nov 2026 09:00:00 GMT</pubDate></item></channel></rss>'
      } as unknown as Response;
    }
    if (url.includes('en.wikipedia.org/w/api.php')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ query: { search: [{ title: 'Blight', snippet: 'leaf disease', timestamp: '2026-11-01T00:00:00Z' }] } })
      } as unknown as Response;
    }
    return { ok: false, status: 404, url, headers: { get: () => null }, text: async () => '', json: async () => ({}) } as unknown as Response;
  }) as typeof fetch;

  try {
    const page = await webFetch('https://example.com/guide');
    assert(page.ok, 'good page fetched');
    assert(Boolean(page.title && page.title.includes('Extension Guide')), 'page title extracted');
    assert(Boolean(page.text && page.text.includes('Scout fields twice a week')), 'page text extracted');

    const redirected = await webFetch('https://example.com/redir-target/x');
    assert(!redirected.ok, 'redirect to private address refused');
    assert(Boolean(redirected.reason && redirected.reason.includes('not allowed')), 'SSRF redirect reason disclosed');

    const missing = await webFetch('https://example.com/missing-page/');
    assert(!missing.ok, 'failed fetch reports honestly');
    assert(Boolean(missing.reason), 'failure has a reason');
    console.log('✔ web_fetch extracts real pages and blocks private redirects');

    // 2) Tool loop: model asks to search, then answers
    process.env.AI_API_KEY = 'test-key';
    const { generateAnswer } = await import('../../lib/integrations/ai');

    let completionTurn = 0;
    const gatewayCalls: Array<Record<string, unknown>> = [];
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/chat/completions')) {
        completionTurn += 1;
        const payload = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
        gatewayCalls.push(payload);
        if (completionTurn === 1) {
          // Model decides to search first (ChatGPT-style tool call)
          return {
            ok: true,
            json: async () => ({
              choices: [{
                message: {
                  content: null,
                  tool_calls: [{
                    id: 'call_1',
                    type: 'function',
                    function: { name: 'web_search', arguments: JSON.stringify({ query: 'wheat harvest news', recent: true }) }
                  }]
                }
              }]
            })
          } as Response;
        }
        // After tool results → final grounded answer
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'Wheat harvest news this week: record harvest reported [Web Search]. https://news.example/harvest' } }] })
        } as Response;
      }
      if (url.includes('bing.com/news')) {
        return {
          ok: true,
          status: 200,
          text: async () => '<rss><channel><item><title>Record wheat harvest</title><link>https://news.example/harvest</link><description>Record harvest reported.</description><pubDate>Wed, 12 Nov 2026 09:00:00 GMT</pubDate></item></channel></rss>'
        } as unknown as Response;
      }
      if (url.includes('en.wikipedia.org/w/api.php')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ query: { search: [{ title: 'Wheat', snippet: 'cereal grain', timestamp: '2026-11-01T00:00:00Z' }] } })
        } as unknown as Response;
      }
      return { ok: false, status: 404, url, headers: { get: () => null }, text: async () => '' } as unknown as Response;
    }) as typeof fetch;

    const answer = await generateAnswer('You are FarmIQ.', [], 'Any big wheat harvest news?');
    assert(answer, 'tool-loop answer produced');
    assert(Boolean(answer!.text.includes('record harvest')), 'final answer returned');
    assert(Boolean(answer!.research && answer!.research.length > 0), 'research items recorded');
    assert(
      answer!.research!.some((r) => r.url.includes('news.example')),
      'research cites the real fetched URL'
    );
    assertEqual(completionTurn, 2, 'one tool round + one final answer turn');
    const firstPayload = gatewayCalls[0];
    assert(Array.isArray(firstPayload.tools), 'tools passed to the model');
    const secondPayload = gatewayCalls[1];
    assert(
      Array.isArray((secondPayload.messages as unknown[]).filter((m) => (m as { role?: string }).role === 'tool')),
      'tool results appended as tool messages'
    );
    console.log('✔ Model-initiated web_search tool loop researches and cites real results');

    // 3) Tool loop: model fetches a known URL directly
    completionTurn = 0;
    gatewayCalls.length = 0;
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/chat/completions')) {
        completionTurn += 1;
        const payload = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
        gatewayCalls.push(payload);
        if (completionTurn === 1) {
          return {
            ok: true,
            json: async () => ({
              choices: [{
                message: {
                  content: null,
                  tool_calls: [{
                    id: 'call_f',
                    type: 'function',
                    function: { name: 'web_fetch', arguments: JSON.stringify({ url: 'https://example.com/official' }) }
                  }]
                }
              }]
            })
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'Official guidance says scout twice weekly [Web Page]. https://example.com/official' } }] })
        } as Response;
      }
      if (url.includes('example.com/official')) {
        return {
          ok: true,
          status: 200,
          url,
          headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html' : null) },
          text: async () => '<html><head><title>Official guidance</title></head><body><p>Scout twice weekly and remove affected leaves.</p></body></html>'
        } as unknown as Response;
      }
      return { ok: false, status: 404, url, headers: { get: () => null }, text: async () => '' } as unknown as Response;
    }) as typeof fetch;

    const fetched = await generateAnswer('You are FarmIQ.', [], 'What does the official page say?');
    assert(fetched, 'web_fetch loop answer produced');
    assert(Boolean(fetched!.research && fetched!.research.some((r) => r.kind === 'page')), 'page research item recorded');
    assert(
      Boolean(fetched!.text.includes('Official guidance')),
      'answer grounded in fetched page content'
    );
    console.log('✔ Model-initiated web_fetch tool reads a page and answers from it');

    // 4) Unknown tool / malformed args degrade honestly
    completionTurn = 0;
    gatewayCalls.length = 0;
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/chat/completions')) {
        completionTurn += 1;
        gatewayCalls.push(JSON.parse(String(init?.body || '{}')) as Record<string, unknown>);
        if (completionTurn === 1) {
          return {
            ok: true,
            json: async () => ({
              choices: [{
                message: {
                  content: null,
                  tool_calls: [
                    { id: 'c1', type: 'function', function: { name: 'web_search', arguments: '{bad json' } },
                    { id: 'c2', type: 'function', function: { name: 'delete_everything', arguments: '{}' } }
                  ]
                }
              }]
            })
          } as Response;
        }
        return { ok: true, json: async () => ({ choices: [{ message: { content: 'Fallback grounded answer text.' } }] }) } as Response;
      }
      return { ok: false, status: 404, url, headers: { get: () => null }, text: async () => '' } as unknown as Response;
    }) as typeof fetch;

    const degraded = await generateAnswer('You are FarmIQ.', [], 'hello?');
    assert(degraded, 'loop survives bad tool calls');
    const toolMessages = (gatewayCalls[1].messages as Array<{ role: string; content?: string }>).filter((m) => m.role === 'tool');
    assertEqual(toolMessages.length, 2, 'both bad tool calls answered with tool messages');
    assert(toolMessages.every((m) => Boolean(m.content && m.content.startsWith('Error'))), 'errors are honest tool messages');
    console.log('✔ Malformed/unknown tool calls degrade to honest tool errors, never crash');
  } finally {
    global.fetch = originalFetch;
    delete process.env.AI_API_KEY;
  }

  assertEqual(isWebFetchEnabled(), true, 'tools enabled by default');
  console.log('All web research tool tests passed successfully!');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
