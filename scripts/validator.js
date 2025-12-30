import axios from 'axios';
import fs from 'fs-extra';
import { performance } from 'perf_hooks';

async function getCountryForIP(ip) {
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode,country`, { timeout: 3000 });
    return { code: res.data.countryCode, name: res.data.country, success: true };
  } catch {
    try {
      const res = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
      return { code: res.data.country_code, name: res.data.country_name, success: true };
    } catch {
      return { code: 'Unknown', name: 'Unknown', success: false };
    }
  }
}

async function validateProxy(proxy, targetCountry = 'US') {
  const [ip, portStr] = proxy.split(':');
  const port = parseInt(portStr);
  if (!ip || isNaN(port) || port < 1 || port > 65535) {
    return { proxy, working: false, latency: null, country: { code: '??', name: 'Unknown' } };
  }

  const start = performance.now();
  try {
    // Simple HTTP GET to test proxy
    await axios.get('http://example.com', {
      proxy: { host: ip, port },
      timeout: 5000,
      validateStatus: () => true
    });
    const latency = Math.round(performance.now() - start);
    const country = await getCountryForIP(ip);
    return { proxy, working: true, latency, country };
  } catch {
    return { proxy, working: false, latency: null, country: { code: '??', name: 'Unknown' } };
  }
}

export async function validateAllProxies(filePath, targetCountry = 'US') {
  const data = await fs.readJson(filePath);
  const results = [];
  for (const p of data.proxies) {
    results.push(await validateProxy(p.proxy, targetCountry));
  }
  return results;
}
