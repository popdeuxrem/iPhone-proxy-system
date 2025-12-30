import fs from 'fs-extra';
import { validateAllProxies } from './validator.js';
import { execSync } from 'child_process';

async function loadConfig() {
  try { return await fs.readJson('config.json'); } 
  catch { 
    return { bypassDomains:['apple.com','icloud.com'], forceProxyDomains:['netflix.com','hulu.com'] };
  }
}

async function generate() {
  const config = await loadConfig();
  const data = await fs.readJson('data/proxies.json');

  const results = await validateAllProxies('data/proxies.json', config.targetCountry || 'US');
  const enrichedProxies = data.proxies.map((p,i)=>({...p,...results[i],isTargetCountry:results[i].country.code===config.targetCountry}));

  const targetCountryProxies = enrichedProxies.filter(p=>p.isTargetCountry&&p.working);
  const otherProxies = enrichedProxies.filter(p=>!p.isTargetCountry&&p.working);
  const selectedProxies = targetCountryProxies.length>=3 ? targetCountryProxies.slice(0,8) : [...targetCountryProxies,...otherProxies].slice(0,8);

  const proxyList = selectedProxies.map(p=>p.proxy);
  const chain = proxyList.length>0 ? proxyList.map(p=>`PROXY ${p}`).join('; ')+'; DIRECT' : 'DIRECT';

  const bypassCode=(config.bypassDomains||[]).map(d=>d.includes('*')?`    shExpMatch(host,"${d}")`:`    dnsDomainIs(host,"${d}") ||\n    shExpMatch(host,"*.${d}")`).join(' ||\n');
  const forceCode=(config.forceProxyDomains||[]).map(d=>d.includes('*')?`    shExpMatch(host,"${d}")`:`    dnsDomainIs(host,"${d}") ||\n    shExpMatch(host,"*.${d}")`).join(' ||\n');

  const pac=`function FindProxyForURL(url, host){
  host=host.toLowerCase();
  if(isPlainHostName(host)||shExpMatch(host,"localhost")||shExpMatch(host,"127.*")||shExpMatch(host,"10.*")||shExpMatch(host,"192.168.*")||shExpMatch(host,"172.16.*")||shExpMatch(host,"172.31.*") )return "DIRECT";
  if(
${bypassCode}
  )return "DIRECT";
  if(
${forceCode}
  )return "${chain}";
  return "${chain}";
}`;
  await fs.writeFile('public/proxy.pac', pac);

  try { execSync('node scripts/generate-mobileconfig.js',{stdio:'inherit'}); } catch{ console.log('Note: Install uuid for mobileconfig'); }

  const workingProxies = results.filter(r=>r.working);
  const targetWorking = workingProxies.filter(r=>r.country.code===config.targetCountry);

  const status={
    timestamp:new Date().toISOString(),
    pacUrl:config.pacUrl||'https://localhost/proxy.pac',
    mobileConfigUrl:config.pacUrl?config.pacUrl.replace('proxy.pac','proxy.mobileconfig'):null,
    config:{targetCountry:config.targetCountry,bypassDomains:config.bypassDomains,forceProxyDomains:config.forceProxyDomains},
    proxies:{total:workingProxies.length,targetCountry:targetWorking.length,list:proxyList.slice(0,5)},
    instructions:{
      iphonePac:'Settings → Wi-Fi → ⓘ → Configure Proxy → Automatic',
      iphoneMobileConfig:'Open proxy.mobileconfig in Safari to install',
      pacUrl:config.pacUrl||'Update config.json with your GitHub Pages URL'
    }
  };
  await fs.writeJson('public/status.json',status,{spaces:2});

  console.log('✅ Generated files:');
  console.log(`   - public/proxy.pac (${proxyList.length} proxies)`);
  console.log(`   - public/proxy.mobileconfig (if uuid installed)`);
  console.log(`   - public/status.json`);

  if(proxyList.length>0){
    console.log('\n🎯 Proxy chain:');
    selectedProxies.forEach((p,i)=>{
      const flag=p.isTargetCountry?'🎯':'🌍';
      console.log(`   ${i+1}. ${flag} ${p.proxy} (${p.country.code||'??'} - ${p.latency||'N/A'}ms)`);
    });
  }

  if(config.pacUrl){
    console.log(`\n📱 PAC URL: ${config.pacUrl}`);
    console.log(`📱 MobileConfig: ${config.pacUrl.replace('proxy.pac','proxy.mobileconfig')}`);
  }
}

generate().catch(console.error);
