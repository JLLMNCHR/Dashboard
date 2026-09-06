export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const range = url.searchParams.get('range') || '1mo';
    const interval = url.searchParams.get('interval') || '1d';

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Falta el parámetro symbol' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });
    }

    const targetUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    targetUrl.searchParams.set('range', range);
    targetUrl.searchParams.set('interval', interval);
    targetUrl.searchParams.set('includeAdjustedClose', 'true');
    targetUrl.searchParams.set('events', 'history');

    try {
      const upstream = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json,text/plain,*/*'
        }
      });

      const text = await upstream.text();

      return new Response(text, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json;charset=UTF-8',
          'Cache-Control': 'no-store'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy Yahoo falló',
        detail: error instanceof Error ? error.message : String(error)
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });
    }
  }
};
