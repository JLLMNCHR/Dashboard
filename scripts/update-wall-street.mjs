const sources = {
  SPY: { symbol: 'SPY', assetClass: 'etf' },
  COMP: { symbol: 'COMP', assetClass: 'index' },
  IWM: { symbol: 'IWM', assetClass: 'etf' },
  DIA: { symbol: 'DIA', assetClass: 'etf' }
};

const dateString = date => date.toISOString().slice(0, 10);
const endpoint = (source, fromdate) => {
  const params = new URLSearchParams({ assetclass: source.assetClass, fromdate, todate: dateString(new Date()) });
  return `https://api.nasdaq.com/api/quote/${source.symbol}/chart?${params}`;
};

async function getSeries(source, fromdate) {
  const response = await fetch(endpoint(source, fromdate), {
    headers: { Accept: 'application/json', 'User-Agent': 'wall-street-dashboard/1.0' }
  });
  if (!response.ok) throw new Error(`${source.symbol}: HTTP ${response.status}`);

  const payload = await response.json();
  const chart = payload?.data?.chart;
  if (!Array.isArray(chart) || chart.length === 0) {
    throw new Error(`${source.symbol}: response without chart data`);
  }

  return chart
    .map(point => ({ t: point.x / 1000, c: Number(point.y) }))
    .filter(point => Number.isFinite(point.t) && Number.isFinite(point.c));
}

const historicalFrom = new Date();
historicalFrom.setDate(historicalFrom.getDate() - 1825);
const dailyFrom = dateString(historicalFrom);
const result = { updatedAt: new Date().toISOString(), panels: {} };

for (const [key, source] of Object.entries(sources)) {
  result.panels[key] = {
    daily: await getSeries(source, dailyFrom),
    intraday: await getSeries(source, dateString(new Date()))
  };
}

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
