import axios from 'axios';
import fs from 'fs-extra';

const WEBSHARE_URL = 'https://proxy.webshare.io/api/v2/proxy/list/download/mcfkakesdposgeiulflehvlbexvwxdjpoottephv/-/any/sourceip/direct/-/?plan_id=11906572';

async function fetchWebshare() {
  try {
    console.log(`Fetching Webshare proxies: ${WEBSHARE_URL}`);
    const resp = await axios.get(WEBSHARE_URL, {
      timeout: 15000,
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const list = resp.data
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^(\d{1,3}\.){3}\d+:\d+$/.test(l));
    console.log(`  Found ${list.length} Webshare proxies`);
    return list;
  } catch (err) {
    console.log(`  Webshare fetch failed: ${err.message}`);
    return [];
  }
}

async function scrape() {
  console.log('🚀 Starting Webshare proxy scrape...');
  const proxies = await fetchWebshare();
  const uniqueProxies = [...new Set(proxies)];
  console.log(`\nTotal unique proxies: ${uniqueProxies.length}`);
  await fs.writeJson('data/raw.json', {
    timestamp: new Date().toISOString(),
    proxies: uniqueProxies
  }, { spaces: 2 });
  return uniqueProxies;
}

if (import.meta.url === `file://${process.argv[1]}`) scrape().catch(console.error);

export { scrape };
