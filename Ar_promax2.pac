const PROXY = "SOCKS5 213.186.179.175:23989; SOCKS5 213.186.179.175:59624; SOCKS5 91.106.109.12:5000";
const FALLBACK_PROXY = "SOCKS5 91.106.109.12:20001";

const PUBG_REGEX = /^(.*\.)?(pubgmobile\.com|pubg\.com|gpubgm\.com|pgsl\.tencent\.com|tencentgames\.com|tencent\.com|pubgmcdn\.com|battlegroundsmobile\.com|me-hl\.pubgmobile\.com|api\.pubgmobile\.com|match\.pubg\.com|cloud\.gpubgm\.com|pubgmobile\.live|me\.pubg\.com|igame\.qq\.com|pg\.qq\.com|tdm\.qq\.com|ak\.pubgmobile\.com|cdn\.pubgmobile\.com|hl\.pubgmobile\.com|me\.pubgmobile\.com|search\.pubgmobile\.com|lobby\.pubgmobile\.com|party\.pubgmobile\.com|session\.pubgmobile\.com|game\.api\.pubgmobile\.com|match\.api\.pubgmobile\.com|classic\.pubgmobile\.com)$/i;

const JO_IPV4_RANGES = [
  ["185.34.16.0", "255.255.252.0"],
  ["91.106.0.0", "255.255.0.0"],
  ["176.28.128.0", "255.255.128.0"],
  ["194.165.128.0", "255.255.252.0"],
  ["213.139.32.0", "255.255.224.0"],
  ["94.249.70.0", "255.255.255.0"],
  ["212.118.21.0", "255.255.255.0"],
  ["176.29.72.0", "255.255.255.0"]
].map(([ip, mask]) => ({ base: ipToNum(ip), mask: ipToNum(mask) }));

const GAME_PORTS = new Set([10012, 13004, 14000, 17000, 17500, 18081, 20000, 20001, 20002, 20371, 5001]);

function ipToNum(ip) {
  const p = ip.split('.');
  return ((+p[0] << 24) | (+p[1] << 16) | (+p[2] << 8) | +p[3]) >>> 0;
}

function inRange(ipNum, ranges) {
  return ranges.some(r => (ipNum & r.mask) === (r.base & r.mask));
}

const dnsCache = {};

function cachedResolve(host) {
  return dnsCache[host] || (dnsCache[host] = dnsResolve(host) || null);
}

function FindProxyForURL(url, host) {
  const lUrl = url.toLowerCase();
  const lHost = host.toLowerCase();
  if (PUBG_REGEX.test(lHost) || GAME_PORTS.has(+lUrl.match(/:(\d+)/)?.[1])) {
    const ip = cachedResolve(lHost);
    if (ip && inRange(ipToNum(ip), JO_IPV4_RANGES)) return PROXY;
  }
  return FALLBACK_PROXY;
}
