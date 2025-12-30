import fs from 'fs-extra';

async function loadConfig() {
  try {
    return await fs.readJson('config.json');
  } catch (error) {
    return {
      bypassDomains: ['apple.com', 'icloud.com'],
      forceProxyDomains: ['netflix.com', 'hulu.com']
    };
  }
}

async function generate() {
  const config = await loadConfig();
  const data = await fs.readJson('data/proxies.json');
  
  // Get proxies - prioritize target country ones
  const targetCountryProxies = data.proxies.filter(p => p.isTargetCountry);
  const otherProxies = data.proxies.filter(p => !p.isTargetCountry);
  
  let selectedProxies = [];
  if (targetCountryProxies.length >= 3) {
    selectedProxies = targetCountryProxies.slice(0, 8);
  } else {
    selectedProxies = [...targetCountryProxies, ...otherProxies].slice(0, 8);
  }
  
  const proxyList = selectedProxies.map(p => p.proxy);
  
  // Build proxy chain
  let chain = 'DIRECT';
  if (proxyList.length > 0) {
    chain = proxyList.map(p => `PROXY ${p}`).join('; ') + '; DIRECT';
  }
  
  // Build bypass rules
  const bypassRules = config.bypassDomains || [];
  const bypassCode = bypassRules.map(domain => {
    if (domain.includes('*')) {
      return `    shExpMatch(host, "${domain}")`;
    } else {
      return `    dnsDomainIs(host, "${domain}") ||\n    shExpMatch(host, "*.${domain}")`;
    }
  }).join(' ||\n');
  
  // Build force proxy rules
  const forceRules = config.forceProxyDomains || [];
  const forceCode = forceRules.map(domain => {
    if (domain.includes('*')) {
      return `    shExpMatch(host, "${domain}")`;
    } else {
      return `    dnsDomainIs(host, "${domain}") ||\n    shExpMatch(host, "*.${domain}")`;
    }
  }).join(' ||\n');
  
  // Generate PAC
  const pac = `function FindProxyForURL(url, host) {
  host = host.toLowerCase();
  
  // ==== Configuration ====
  // Generated: ${new Date().toISOString()}
  // Target country: ${data.config?.targetCountry || 'Any'}
  // Proxies: ${data.stats?.working || 0} working (${data.stats?.targetCountry || 0} in target country)
  // ========================
  
  // 1. Local & Private Networks (DIRECT)
  if (
    isPlainHostName(host) ||
    shExpMatch(host, "localhost") ||
    shExpMatch(host, "127.*") ||
    shExpMatch(host, "10.*") ||
    shExpMatch(host, "192.168.*") ||
    shExpMatch(host, "172.16.*") ||
    shExpMatch(host, "172.17.*") ||
    shExpMatch(host, "172.18.*") ||
    shExpMatch(host, "172.19.*") ||
    shExpMatch(host, "172.20.*") ||
    shExpMatch(host, "172.21.*") ||
    shExpMatch(host, "172.22.*") ||
    shExpMatch(host, "172.23.*") ||
    shExpMatch(host, "172.24.*") ||
    shExpMatch(host, "172.25.*") ||
    shExpMatch(host, "172.26.*") ||
    shExpMatch(host, "172.27.*") ||
    shExpMatch(host, "172.28.*") ||
    shExpMatch(host, "172.29.*") ||
    shExpMatch(host, "172.30.*") ||
    shExpMatch(host, "172.31.*")
  ) return "DIRECT";
  
  // 2. Bypass Domains (DIRECT)
  if (
${bypassCode}
  ) return "DIRECT";
  
  // 3. Force Proxy Domains (Always use proxy)
  if (
${forceCode}
  ) return "${chain}";
  
  // 4. Default Routing
  return "${chain}";
}`;
  
  await fs.writeFile('public/proxy.pac', pac);
  
  // Generate status file
  const status = {
    timestamp: new Date().toISOString(),
    pacUrl: config.pacUrl || 'https://localhost/proxy.pac',
    config: {
      targetCountry: data.config?.targetCountry,
      bypassDomains: config.bypassDomains,
      forceProxyDomains: config.forceProxyDomains
    },
    proxies: {
      total: data.stats?.working || 0,
      targetCountry: data.stats?.targetCountry || 0,
      list: proxyList.slice(0, 5)
    },
    instructions: {
      iphone: 'Settings → Wi-Fi → ⓘ → Configure Proxy → Automatic',
      pacUrl: config.pacUrl || 'Update config.json with your GitHub Pages URL'
    }
  };
  
  await fs.writeJson('public/status.json', status, { spaces: 2 });
  
  console.log('✅ Generated files:');
  console.log(`   - public/proxy.pac (${proxyList.length} proxies)`);
  console.log(`   - public/status.json`);
  
  if (proxyList.length > 0) {
    console.log('\n🎯 Proxy chain:');
    proxyList.forEach((proxy, i) => {
      const proxyData = selectedProxies[i];
      const countryFlag = proxyData.isTargetCountry ? '🎯' : '🌍';
      console.log(`   ${i + 1}. ${countryFlag} ${proxy} (${proxyData.country?.code || '??'} - ${proxyData.latency}ms)`);
    });
  }
  
  console.log(`\n📱 PAC URL: ${config.pacUrl || 'Set pacUrl in config.json'}`);
}

generate().catch(console.error);
