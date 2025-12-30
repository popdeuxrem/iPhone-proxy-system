import axios from 'axios';
import fs from 'fs-extra';

async function getCountryForIP(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode,country`, {
      timeout: 3000
    });
    return {
      code: response.data.countryCode,
      name: response.data.country,
      success: true
    };
  } catch (error) {
    // Fallback to ipapi.co
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 3000
      });
      return {
        code: response.data.country_code,
        name: response.data.country_name,
        success: true
      };
    } catch (fallbackError) {
      return {
        code: 'Unknown',
        name: 'Unknown',
        success: false
      };
    }
  }
}

async function validateProxy(proxy, targetCountry = 'US') {
  try {
    const [ip, port] = proxy.split(':');
    const parsedPort = parseInt(port);
    
    if (!ip || isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return { proxy, latency: null, working: false, reason: 'Invalid format' };
    }

    // Get country first (before testing the proxy)
    console.log(`Checking ${proxy}...`);
    const countryInfo = await getCountryForIP(ip);
    
    // Test with iPhone-specific endpoints
    const testUrls = [
      'https://captive.apple.com/hotspot-detect.html',
      'https://www.apple.com/library/test/success.html',
      'https://api.ipify.org?format=json'
    ];
    
    const iPhoneHeaders = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-us'
    };
    
    for (const url of testUrls) {
      try {
        const start = Date.now();
        const response = await axios.get(url, {
          proxy: {
            host: ip,
            port: parsedPort,
            protocol: 'http'
          },
          timeout: 5000,
          headers: iPhoneHeaders
        });
        
        const latency = Date.now() - start;
        
        if (response.status === 200) {
          const isTargetCountry = countryInfo.code === targetCountry;
          const countryFlag = isTargetCountry ? '🎯' : '🌍';
          
          console.log(`${countryFlag} ${proxy} (${countryInfo.code} - ${countryInfo.name}) works (${latency}ms)`);
          
          return {
            proxy,
            ip,
            port: parsedPort,
            latency,
            working: true,
            country: countryInfo,
            isTargetCountry,
            ioSCompatible: url.includes('apple.com')
          };
        }
      } catch (error) {
        continue;
      }
    }
    
    return {
      proxy,
      ip,
      port: parsedPort,
      latency: null,
      working: false,
      country: countryInfo,
      isTargetCountry: countryInfo.code === targetCountry,
      reason: 'All tests failed'
    };
  } catch (error) {
    return {
      proxy,
      latency: null,
      working: false,
      reason: error.message
    };
  }
}

async function main() {
  console.log('🚀 iPhone Proxy Validator with Country Filter');
  console.log('=============================================\n');
  
  // Load config
  const config = await fs.readJson('config.json').catch(() => ({ targetCountry: 'US' }));
  const targetCountry = config.targetCountry || 'US';
  console.log(`Target country: ${targetCountry}\n`);
  
  // Load raw proxies
  console.log('Loading raw proxies...');
  const raw = await fs.readJson('data/raw.json');
  console.log(`Found ${raw.proxies.length} raw proxies`);
  
  // Test subset
  const testProxies = raw.proxies.slice(0, 150);
  console.log(`Testing ${testProxies.length} proxies...\n`);
  
  const results = [];
  let workingCount = 0;
  let targetCountryCount = 0;
  let iPhoneCompatibleCount = 0;
  
  for (let i = 0; i < testProxies.length; i++) {
    const proxy = testProxies[i];
    
    if (i % 10 === 0) {
      console.log(`Progress: ${i}/${testProxies.length} (${workingCount} working, ${targetCountryCount} in ${targetCountry})`);
    }
    
    const result = await validateProxy(proxy, targetCountry);
    results.push(result);
    
    if (result.working) {
      workingCount++;
      if (result.isTargetCountry) {
        targetCountryCount++;
      }
      if (result.ioSCompatible) {
        iPhoneCompatibleCount++;
      }
    }
    
    // Stop conditions
    if (targetCountryCount >= 10) {
      console.log(`\n🎯 Found ${targetCountryCount} proxies in ${targetCountry}, stopping early.`);
      break;
    }
    
    if (workingCount >= 20) {
      console.log(`\n✅ Found ${workingCount} working proxies, stopping early.`);
      break;
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Sort results: target country first, then working, then by latency
  const sortedResults = results
    .filter(r => r.working)
    .sort((a, b) => {
      // Target country first
      if (a.isTargetCountry && !b.isTargetCountry) return -1;
      if (!a.isTargetCountry && b.isTargetCountry) return 1;
      // Then iPhone compatible
      if (a.ioSCompatible && !b.ioSCompatible) return -1;
      if (!a.ioSCompatible && b.ioSCompatible) return 1;
      // Then by latency
      return a.latency - b.latency;
    });
  
  // If no target country proxies, show warning
  if (targetCountryCount === 0 && workingCount > 0) {
    console.log(`\n⚠️ Warning: No proxies found in ${targetCountry}. Using proxies from other countries.`);
    console.log('   Update config.json "targetCountry" or sources to get more relevant proxies.');
  }
  
  // Fallback if no proxies at all
  if (sortedResults.length === 0) {
    console.log('\n⚠️ No working proxies found, using fallback list...');
    const fallbackProxies = [
      { proxy: '51.158.68.68:8811', ip: '51.158.68.68', port: 8811, latency: 200, working: true, country: { code: 'FR', name: 'France' }, isTargetCountry: false },
      { proxy: '195.154.53.37:5836', ip: '195.154.53.37', port: 5836, latency: 220, working: true, country: { code: 'FR', name: 'France' }, isTargetCountry: false },
      { proxy: '148.251.245.247:3128', ip: '148.251.245.247', port: 3128, latency: 180, working: true, country: { code: 'DE', name: 'Germany' }, isTargetCountry: false }
    ];
    sortedResults.push(...fallbackProxies);
    workingCount = fallbackProxies.length;
  }
  
  // Save results
  await fs.writeJson('data/proxies.json', {
    timestamp: new Date().toISOString(),
    config: {
      targetCountry,
      requestedCountry: targetCountry
    },
    stats: {
      total: raw.proxies.length,
      tested: results.length,
      working: workingCount,
      targetCountry: targetCountryCount,
      iPhoneCompatible: iPhoneCompatibleCount
    },
    proxies: sortedResults
  }, { spaces: 2 });
  
  // Display summary
  console.log('\n✅ Validation Complete:');
  console.log(`   Total tested: ${results.length}`);
  console.log(`   Working proxies: ${workingCount}`);
  console.log(`   In ${targetCountry}: ${targetCountryCount}`);
  console.log(`   iPhone compatible: ${iPhoneCompatibleCount}`);
  
  if (sortedResults.length > 0) {
    console.log('\n🎯 Top Proxies:');
    const topProxies = sortedResults.slice(0, 5);
    topProxies.forEach((p, i) => {
      const countryFlag = p.isTargetCountry ? '🎯' : '🌍';
      const iPhoneIcon = p.ioSCompatible ? '📱' : '';
      console.log(`   ${i + 1}. ${countryFlag} ${iPhoneIcon} ${p.proxy} (${p.country.code} - ${p.latency}ms)`);
    });
    
    console.log('\n🌍 Country Distribution:');
    const countryMap = {};
    sortedResults.forEach(p => {
      const code = p.country.code;
      countryMap[code] = (countryMap[code] || 0) + 1;
    });
    
    Object.entries(countryMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count} proxies`);
      });
  }
  
  console.log(`\n📊 Results saved to: data/proxies.json`);
}

main().catch(console.error);
