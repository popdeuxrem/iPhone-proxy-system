import fs from 'fs-extra';
import { validateAllProxies } from './validator.js';
import { execSync } from 'child_process';

async function loadConfig() {
  try { return await fs.readJson('config.json'); } 
  catch { return { bypassDomains:['apple.com','icloud.com'], forceProxyDomains:['netflix.com','hulu.com'], targetCountry:'US' }; }
}

async function generate() {
  const config = await loadConfig();
  const data = await fs.readJson('data/proxies.json');

  const results = await validateAllProxies('data/proxies.json', config.targetCountry || 'US');
  const enriched = data.proxies.map((p,i)=>({ ...p, ...results[i], isTargetCountry: results[i]?.country===config.targetCountry }));

  const working = enriched.filter(p=>p.working);
  const failures = enriched.filter(p=>!p.working);

  working.sort((a,b)=>(a.latency||9999)-(b.latency||9999));
  const selected = working.slice(0,8);
  const proxyList = selected.map(p=>p.proxy);
  const chain = proxyList.length>0 ? proxyList.map(p=>`PROXY ${p}`).join('; ')+'; DIRECT' : 'DIRECT';

  const bypassCode = (config.bypassDomains||[]).map(d=>d.includes('*')?`    shExpMatch(host,"${d}")`:`    dnsDomainIs(host,"${d}") ||\n    shExpMatch(host,"*.${d}")`).join(' ||\n');
  const forceCode = (config.forceProxyDomains||[]).map(d=>d.includes('*')?`    shExpMatch(host,"${d}")`:`    dnsDomainIs(host,"${d}") ||\n    shExpMatch(host,"*.${d}")`).join(' ||\n');

  const pac = `function FindProxyForURL(url, host) {
  host=host.toLowerCase();
  if(isPlainHostName(host)||shExpMatch(host,"localhost")||shExpMatch(host,"127.*")||shExpMatch(host,"10.*")||shExpMatch(host,"192.168.*")||shExpMatch(host,"172.16.*")||shExpMatch(host,"172.17.*")||shExpMatch(host,"172.18.*")||shExpMatch(host,"172.19.*")||shExpMatch(host,"172.20.*")||shExpMatch(host,"172.21.*")||shExpMatch(host,"172.22.*")||shExpMatch(host,"172.23.*")||shExpMatch(host,"172.24.*")||shExpMatch(host,"172.25.*")||shExpMatch(host,"172.26.*")||shExpMatch(host,"172.27.*")||shExpMatch(host,"172.28.*")||shExpMatch(host,"172.29.*")||shExpMatch(host,"172.30.*")||shExpMatch(host,"172.31.*")) return "DIRECT";
  if(${bypassCode}) return "DIRECT";
  if(${forceCode}) return "${chain}";
  return "${chain}";
}`;

  await fs.writeFile('public/proxy.pac', pac);

  try { execSync('node scripts/generate-mobileconfig.js',{stdio:'inherit'}); } catch {}

  const status = {
    timestamp:new Date().toISOString(),
    pacUrl:config.pacUrl||'https://localhost/proxy.pac',
    mobileConfigUrl:config.pacUrl?config.pacUrl.replace('proxy.pac','proxy.mobileconfig'):null,
    config:{ targetCountry: config.targetCountry, bypassDomains: config.bypassDomains, forceProxyDomains: config.forceProxyDomains },
    proxies:{ total: working.length, targetCountry: working.filter(p=>p.isTargetCountry).length, list: proxyList.slice(0,5) },
    failures: failures.map(p=>({ proxy:p.proxy, reason:p.reason, country:p.country, latency:p.latency }))
  };

  await fs.writeJson('public/status.json', status, { spaces:2 });

  console.log('✅ Generated files:');
  console.log(`   - public/proxy.pac (${proxyList.length} proxies)`);
  console.log(`   - public/proxy.mobileconfig`);
  console.log(`   - public/status.json`);
}

generate().catch(console.error);
