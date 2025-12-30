import axios from 'axios';
import fs from 'fs-extra';

async function loadConfig() {
  try {
    return await fs.readJson('config.json');
  } catch (error) {
    console.log('Using default config...');
    return {
      targetCountry: 'US',
      sources: [
        'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=US&ssl=all&anonymity=all',
        'https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc&protocols=http&country=US',
        'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'
      ]
    };
  }
}

async function fetchSource(source) {
  try {
    console.log(`Fetching: ${source.url || source}`);
    const response = await axios.get(source.url || source, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    let proxies = [];
    
    // Handle different source types
    if (typeof source === 'string') {
      // String URL
      if (source.includes('proxyscrape') || source.includes('geonode') || source.includes('proxy-list.download')) {
        // JSON responses
        const data = response.data;
        if (data.data && Array.isArray(data.data)) {
          proxies = data.data.map(p => `${p.ip}:${p.port}`);
        } else if (data.proxies && Array.isArray(data.proxies)) {
          proxies = data.proxies.map(p => `${p.ip}:${p.port}`);
        } else if (Array.isArray(data)) {
          proxies = data.map(p => `${p.ip}:${p.port}`);
        }
      } else {
        // Text responses
        proxies = response.data.split('\n')
          .map(line => line.trim())
          .filter(line => {
            if (!line || line.startsWith('#')) return false;
            const parts = line.split(':');
            if (parts.length !== 2) return false;
            const port = parseInt(parts[1]);
            return !isNaN(port) && port > 0 && port <= 65535;
          });
      }
    } else if (source.type === 'json') {
      // Structured source with type
      proxies = source.extract(response.data);
    }
    
    // Validate proxy format
    const validProxies = proxies.filter(proxy => {
      const parts = proxy.split(':');
      if (parts.length !== 2) return false;
      const port = parseInt(parts[1]);
      return !isNaN(port) && port > 0 && port <= 65535;
    });
    
    console.log(`  Found ${validProxies.length} valid proxies`);
    return validProxies;
    
  } catch (error) {
    console.log(`  Failed: ${error.message}`);
    return [];
  }
}

async function scrape() {
  console.log('🚀 Starting proxy scrape...\n');
  
  const config = await loadConfig();
  console.log(`Target country: ${config.targetCountry}`);
  console.log(`Sources: ${config.sources.length}\n`);
  
  const allProxies = [];
  
  for (const source of config.sources) {
    const proxies = await fetchSource(source);
    allProxies.push(...proxies);
  }
  
  // Remove duplicates
  const uniqueProxies = [...new Set(allProxies)];
  
  console.log(`\n=== Scrape Complete ===`);
  console.log(`Total unique proxies: ${uniqueProxies.length}`);
  
  // Save raw data
  await fs.writeJson('data/raw.json', {
    timestamp: new Date().toISOString(),
    config: {
      targetCountry: config.targetCountry,
      sources: config.sources
    },
    count: uniqueProxies.length,
    proxies: uniqueProxies
  }, { spaces: 2 });
  
  return uniqueProxies;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrape().catch(console.error);
}

export { scrape };
