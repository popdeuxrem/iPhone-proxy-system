import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

async function generateMobileConfig() {
  try {
    // Load config and proxy data
    const config = await fs.readJson('config.json');
    const data = await fs.readJson('data/proxies.json');
    
    if (!config.pacUrl) {
      console.log('⚠️ No pacUrl in config.json, skipping mobileconfig');
      return;
    }
    
    // Generate unique IDs
    const rootUUID = uuidv4();
    const httpUUID = uuidv4();
    const proxyUUID = uuidv4();
    
    // Get proxy details for manual proxy fallback
    const primaryProxy = data.proxies[0]?.proxy || '';
    const [proxyHost, proxyPort] = primaryProxy.split(':');
    
    // Create mobile config
    const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- PAC Auto Configuration -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.proxy.http.global</string>
            <key>PayloadIdentifier</key>
            <string>com.iphone.proxy.pac.${httpUUID}</string>
            <key>PayloadUUID</key>
            <string>${httpUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>ProxyAutoConfigEnable</key>
            <integer>1</integer>
            <key>ProxyAutoConfigURLString</key>
            <string>${config.pacUrl}</string>
        </dict>
        
        <!-- Manual Proxy (Fallback) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.proxy.shared</string>
            <key>PayloadIdentifier</key>
            <string>com.iphone.proxy.manual.${proxyUUID}</string>
            <key>PayloadUUID</key>
            <string>${proxyUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Proxies</key>
            <dict>
                <key>HTTPEnable</key>
                <integer>1</integer>
                <key>HTTPPort</key>
                <integer>${proxyPort || 80}</integer>
                <key>HTTPProxy</key>
                <string>${proxyHost || 'proxy.example.com'}</string>
                <key>HTTPSEnable</key>
                <integer>1</integer>
                <key>HTTPSPort</key>
                <integer>${proxyPort || 443}</integer>
                <key>HTTPSProxy</key>
                <string>${proxyHost || 'proxy.example.com'}</string>
            </dict>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>iPhone Proxy Configuration</string>
    <key>PayloadIdentifier</key>
    <string>com.iphone.proxy.${rootUUID}</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${rootUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
    
    await fs.writeFile('public/proxy.mobileconfig', mobileConfig);
    console.log('✅ Generated mobile configuration profile');
    console.log(`📱 Install: ${config.pacUrl.replace('proxy.pac', 'proxy.mobileconfig')}`);
    
  } catch (error) {
    console.error('Error generating mobile config:', error.message);
  }
}

generateMobileConfig().catch(console.error);
