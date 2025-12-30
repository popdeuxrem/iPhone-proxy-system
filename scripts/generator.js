import fs from 'fs-extra';
import { scrape } from './scraper.js';

function generatePAC(proxies) {
  const proxyList = proxies.join('; ');
  return `function FindProxyForURL(url, host) {
    return "PROXY ${proxyList}; DIRECT";
  }`;
}

async function generate() {
  const proxies = await scrape();
  if (!proxies.length) throw new Error('❌ No valid Webshare proxies found. Build aborted.');
  await fs.writeFile('public/proxy.pac', generatePAC(proxies), 'utf-8');
  await fs.writeJson('public/status.json', { totalProxies: proxies.length, timestamp: new Date().toISOString() }, { spaces: 2 });
  console.log('✅ proxy.pac generated with Webshare proxies only');
}

if (import.meta.url === `file://${process.argv[1]}`) generate().catch(console.error);

export { generate };
