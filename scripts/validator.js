import fs from 'fs-extra';
import axios from 'axios';
import { performance } from 'perf_hooks';

async function testProxy(proxy) {
  const url = 'https://www.google.com/';
  const config = {
    proxy: {
      host: proxy.ip,
      port: parseInt(proxy.port),
      auth: proxy.auth ? { username: proxy.auth.split(':')[0], password: proxy.auth.split(':')[1] } : undefined,
    },
    timeout: 5000,
    validateStatus: () => true,
  };
  const result = { working: false, latency: null, country: null };
  const start = performance.now();
  try {
    const res = await axios.get(url, config);
    const end = performance.now();
    result.working = res.status >= 200 && res.status < 400;
    result.latency = Math.round(end - start);
    if (res.headers['x-country']) result.country = res.headers['x-country'];
  } catch (e) {}
  return result;
}

function parseProxyLine(line) {
  if (typeof line === 'string') {
    const parts = line.trim().split(':');
    if (parts.length === 2) return { ip: parts[0], port: parts[1], auth: null };
    if (parts.length === 4) return { ip: parts[0], port: parts[1], auth: `${parts[2]}:${parts[3]}` };
  } else if (typeof line === 'object' && line.ip && line.port) {
    return { ip: line.ip, port: line.port, auth: line.auth || null };
  }
  return null;
}

async function validateAllProxies(filePath, targetCountry = null) {
  const data = await fs.readJson(filePath);
  const results = [];
  for (const p of data.proxies) {
    const proxy = parseProxyLine(p);
    if (!proxy) continue;
    const test = await testProxy(proxy);
    results.push({ ...proxy, ...test, isTargetCountry: targetCountry ? test.country === targetCountry : null });
  }
  return results;
}

export { parseProxyLine, testProxy, validateAllProxies };
// Updated: Tue Dec 30 22:27:26 UTC 2025
