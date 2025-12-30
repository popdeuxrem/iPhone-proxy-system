import axios from 'axios';
import fs from 'fs-extra';

const failureCounts = {};
const MAX_SSL_FAILURES = 2;

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

async function validateProxy(proxy, targetCountry='US') {
  const [ip, portStr] = proxy.split(':');
  const port = parseInt(portStr || '0');
  if (!ip || isNaN(port) || port < 1 || port > 65535) return { proxy, working: false, reason: 'Invalid format', latency: null };

  const sslFailures = failureCounts[proxy] || 0;
  if (sslFailures > MAX_SSL_FAILURES) return { proxy, working: false, reason: 'Repeated SSL failure', latency: null };

  const start = Date.now();
  try {
    await axios.get('http://www.google.com', { proxy: { host: ip, port }, timeout: 5000 });
    const latency = Date.now() - start;
    const country = await getCountryForIP(ip);
    return { proxy, working: true, latency, country: country.code || 'Unknown' };
  } catch (err) {
    failureCounts[proxy] = sslFailures + 1;
    return { proxy, working: false, reason: err.message, latency: null, country: null };
  }
}

async function validateAllProxies(file='data/proxies.json', targetCountry='US') {
  const data = await fs.readJson(file);
  const results = [];
  for (const p of data.proxies || []) {
    const res = await validateProxy(p.proxy, targetCountry);
    results.push(res);
  }
  return results;
}

export { validateProxy, validateAllProxies };
