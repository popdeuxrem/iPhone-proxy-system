import fs from 'fs-extra';

async function test() {
  console.log('=== Proxy System Test ===\n');
  
  // Check config
  try {
    const config = await fs.readJson('config.json');
    console.log(`1. Config: ✅ (Target: ${config.targetCountry})`);
  } catch (err) {
    console.log('1. Config: ❌ Missing config.json');
  }
  
  // Check PAC file
  try {
    const pacExists = await fs.pathExists('public/proxy.pac');
    console.log(`2. PAC file: ${pacExists ? '✅' : '❌'}`);
    if (pacExists) {
      const pac = await fs.readFile('public/proxy.pac', 'utf8');
      const proxyCount = (pac.match(/PROXY/g) || []).length;
      console.log(`   Proxies in PAC: ${proxyCount}`);
    }
  } catch (err) {
    console.log(`2. PAC check error: ${err.message}`);
  }
  
  // Check proxies data
  try {
    const proxiesExist = await fs.pathExists('data/proxies.json');
    console.log(`3. Proxies data: ${proxiesExist ? '✅' : '❌'}`);
    if (proxiesExist) {
      const data = await fs.readJson('data/proxies.json');
      console.log(`   Working: ${data.stats?.working || 0}`);
      console.log(`   Target country (${data.config?.targetCountry}): ${data.stats?.targetCountry || 0}`);
      
      if (data.proxies && data.proxies.length > 0) {
        console.log(`\n   Top 3 proxies:`);
        data.proxies.slice(0, 3).forEach((p, i) => {
          const flag = p.isTargetCountry ? '🎯' : '🌍';
          console.log(`   ${i + 1}. ${flag} ${p.proxy} (${p.country?.code || '??'} - ${p.latency}ms)`);
        });
      }
    }
  } catch (err) {
    console.log(`3. Proxies check error: ${err.message}`);
  }
  
  // Check status file
  try {
    const statusExists = await fs.pathExists('public/status.json');
    console.log(`4. Status file: ${statusExists ? '✅' : '❌'}`);
  } catch (err) {
    console.log(`4. Status check error: ${err.message}`);
  }
  
  console.log('\n=== Quick Commands ===');
  console.log('Switch to US:        npm run switch:us');
  console.log('Switch to UK:        npm run switch:uk');
  console.log('Switch to Germany:   npm run switch:germany');
  console.log('Switch to Japan:     npm run switch:japan');
  console.log('Full rebuild:        npm run build');
  console.log('\n=== Test Complete ===');
}

test().catch(console.error);
