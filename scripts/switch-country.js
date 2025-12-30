import fs from 'fs-extra';

const countryCodes = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'CA': 'Canada',
  'AU': 'Australia',
  'SG': 'Singapore',
  'NL': 'Netherlands',
  'SE': 'Sweden'
};

async function switchCountry(countryCode) {
  if (!countryCodes[countryCode]) {
    console.log(`❌ Invalid country code: ${countryCode}`);
    console.log('Valid codes:', Object.keys(countryCodes).join(', '));
    return;
  }
  
  console.log(`🔄 Switching to ${countryCodes[countryCode]} (${countryCode})...`);
  
  // Load current config
  const config = await fs.readJson('config.json').catch(() => ({}));
  
  // Update config
  config.targetCountry = countryCode;
  
  // Update sources to include country filter where possible
  config.sources = [
    `https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=${countryCode}&ssl=all&anonymity=all`,
    `https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc&protocols=http&country=${countryCode}`,
    `https://www.proxy-list.download/api/v1/get?type=http&country=${countryCode}`,
    'https://api.openproxylist.xyz/http.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'
  ];
  
  // Save updated config
  await fs.writeJson('config.json', config, { spaces: 2 });
  
  console.log(`✅ Switched to ${countryCodes[countryCode]}!`);
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Commit and push changes');
  console.log('3. Wait for GitHub Pages to update');
  console.log(`\nYour iPhone will use ${countryCodes[countryCode]} proxies on next connection.`);
}

// Get country from command line or prompt
const countryCode = process.argv[2]?.toUpperCase();
if (countryCode) {
  switchCountry(countryCode);
} else {
  console.log('🌍 Country Switcher');
  console.log('==================\n');
  console.log('Usage: node scripts/switch-country.js [COUNTRY_CODE]\n');
  console.log('Available countries:');
  Object.entries(countryCodes).forEach(([code, name]) => {
    console.log(`  ${code} - ${name}`);
  });
}
