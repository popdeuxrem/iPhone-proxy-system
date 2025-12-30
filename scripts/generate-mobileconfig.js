import fs from 'fs-extra';
import { generate } from './generator.js';

async function buildMobileConfig() {
  await generate();
  const pacURL = 'https://popdeuxrem.github.io/iPhone-proxy-system/proxy.pac';
  const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>ProxyPACURL</key>
  <string>${pacURL}</string>
</dict>
</plist>`;
  await fs.writeFile('public/proxy.mobileconfig', mobileconfig, 'utf-8');
  console.log('✅ proxy.mobileconfig generated with Webshare PAC only');
}

if (import.meta.url === `file://${process.argv[1]}`) buildMobileConfig().catch(console.error);
export { buildMobileConfig };
