const CONFIG = {
  DIRECT_FIRST: false,
  FORBID_DIRECT: true,
  BLOCK_IR: true,
  ENABLE_SOCKS: true,
  ENABLE_HTTPS_PROXY: true,
  ENABLE_HTTP3: true,
  PORT_ORDER: [1080, 443, 8443],
  JITTER_WINDOW: 5,
  JITTER_THRESHOLD: 1.2,
  GLOBAL_REFRESH_INTERVAL: 120e3,
  DEBUG: false
};

const JORDAN_RANGES = [
  { net: "91.106.109.0",  mask: "255.255.255.0" },
  { net: "149.200.200.0", mask: "255.255.255.0" },
  { net: "185.51.215.0",  mask: "255.255.255.0" },
  { net: "2a13:a5c7::",   mask: "ffff:ffff:ffff:ffff::" }
];

let PROXIES_CFG = [
  { ip: "91.106.109.12", socksPorts: [1080], httpPorts: [443], http3Ports: [8443], supportsUDP: true },
  { ip: "149.200.200.44",   socksPorts: [1080], httpPorts: [443], http3Ports: [8443], supportsUDP: true },
  { ip: "185.51.215.229",   socksPorts: [1080], httpPorts: [],    http3Ports: [8443], supportsUDP: true },
  { ip: "2a13:a5c7:25ff:7000", socksPorts: [1080], httpPorts: [443], http3Ports: [8443], supportsUDP: true }
];

const GAME_DOMAINS = [
  /\.pubgmobile\.com$/,
  /\.tencentgames\.com$/,
  /\.qcloud\.com$/,
  /\.tencentyun\.com$/
];

const proxyStats = {};
let lastGlobalCheck = 0;
let previousGlobalAvg = Infinity;

function safeDnsResolve(host) {
  try { return dnsResolve(host); }
  catch { return null; }
}

function safeTestProxy(host, port, proto) {
  try { return testProxy(host, port, proto); }
  catch { return { available: false, latency: Infinity }; }
}

function isInNetSafe(ip, net, mask) {
  try { return isInNet(ip, net, mask); }
  catch { return false; }
}

function isPlainHostName(host) {
  return /^\w+$/.test(host);
}

function isJordanIP(ip) {
  if (!ip) return false;
  return JORDAN_RANGES.some(r => isInNetSafe(ip, r.net, r.mask));
}

function testProxyWithJitter(ip, port, proto) {
  const key = `${ip}:${port}:${proto}`;
  const now = Date.now();
  let stat = proxyStats[key] || { latencies: [], lastTS: 0, latestResult: null };

  if (stat.latestResult && now - stat.lastTS < CONFIG.GLOBAL_REFRESH_INTERVAL) {
    return stat.latestResult;
  }

  const res = safeTestProxy(ip, port, proto);
  stat.latencies.push(res.latency);
  if (stat.latencies.length > CONFIG.JITTER_WINDOW) stat.latencies.shift();

  const mean = stat.latencies.reduce((a, b) => a + b, 0) / stat.latencies.length;
  const jitter = Math.sqrt(stat.latencies.reduce((s, v) => s + (v - mean) ** 2, 0) / stat.latencies.length);

  stat.latestResult = { available: res.available, latency: res.latency, jitter };
  stat.lastTS = now;
  proxyStats[key] = stat;
  return stat.latestResult;
}

function maybeRefreshAll(avgLatency) {
  const now = Date.now();
  if (now - lastGlobalCheck > CONFIG.GLOBAL_REFRESH_INTERVAL ||
      avgLatency > previousGlobalAvg * CONFIG.JITTER_THRESHOLD) {
    for (const k in proxyStats) delete proxyStats[k];
    lastGlobalCheck = now;
  }
  previousGlobalAvg = avgLatency;
}

function buildProxyList() {
  const samples = [];
  for (const { ip, socksPorts } of PROXIES_CFG) {
    for (const p of socksPorts) {
      const r = testProxyWithJitter(ip, p, "SOCKS5");
      if (r.available) samples.push(r.latency);
    }
  }

  const overallAvg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : Infinity;
  maybeRefreshAll(overallAvg);

  const candidates = [];
  for (const { ip, socksPorts, httpPorts, http3Ports, supportsUDP } of PROXIES_CFG) {
    if (!isJordanIP(safeDnsResolve(ip))) continue;
    const host = ip.includes(":") ? `[${ip}]` : ip;

    if (CONFIG.ENABLE_SOCKS && supportsUDP) {
      for (const p of socksPorts) {
        const s = testProxyWithJitter(ip, p, "SOCKS5");
        if (s.available) candidates.push({ token: `SOCKS5 ${host}:${p}`, stats: s });
      }
    }
    if (CONFIG.ENABLE_HTTPS_PROXY) {
      for (const p of httpPorts) {
        const s = testProxyWithJitter(ip, p, "HTTPS");
        if (s.available) candidates.push({ token: `HTTPS ${host}:${p}`, stats: s });
      }
    }
    if (CONFIG.ENABLE_HTTP3 && http3Ports) {
      for (const p of http3Ports) {
        const s = testProxyWithJitter(ip, p, "HTTP3");
        if (s.available) candidates.push({ token: `HTTP3 ${host}:${p}`, stats: s });
      }
    }
  }

  candidates.sort((a, b) => a.stats.jitter !== b.stats.jitter
    ? a.stats.jitter - b.stats.jitter
    : a.stats.latency - b.stats.latency
  );

  const tokens = candidates.map(c => c.token);
  tokens.push("PROXY 127.0.0.1:9");
  return tokens.join("; ");
}

function isPUBGDomain(host) {
  const h = host.toLowerCase();
  return GAME_DOMAINS.some(rx => rx.test(h));
}

function FindProxyForURL(url, host) {
  host = host || url.split("/")[2];
  const ip = safeDnsResolve(host);

  if (
    isPlainHostName(host) ||
    isInNetSafe(ip, "10.0.0.0", "255.255.255.0") ||
    (CONFIG.BLOCK_IR && host.endsWith(".ir"))
  ) {
    return "PROXY 127.0.0.1:9";
  }

  if (isPUBGDomain(host)) {
    return buildProxyList();
  }

  return CONFIG.DIRECT_FIRST ? "DIRECT" : "PROXY 127.0.0.1:9";
}
