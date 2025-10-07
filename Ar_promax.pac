// قائمة بروكسيات أردنية مذهلة (من NodeMaven وProxyNova)
const PROXIES = [
  { address: "SOCKS5 91.106.109.12:5000", weight: 0.95 }, // الأقل ping
  { address: "SOCKS5 91.106.109.12:5001", weight: 0.92 },
  { address: "SOCKS5 91.106.109.12:5002", weight: 0.88 },
  { address: "SOCKS5 91.106.109.12:20001", weight: 0.80 },
  { address: "SOCKS5 91.106.109.12:20002", weight: 0.75 },
  { address: "SOCKS5 91.106.109.12:20003", weight: 0.70 }
];

const FALLBACK_PROXY = "SOCKS5 91.106.109.12:5000";
const BLACKHOLE = "PROXY 0.0.0.0:0";

// كاش DNS لأداء مذهل
const ipCache = new Map();
const CACHE_TTL = 1800000; // 30 دقيقة
const MAX_CACHE_SIZE = 300;

// نطاقات IP أردنية دقيقة (2025)
const JORDAN_IPV4 = [
  '37.98.0.0/16', '41.31.0.0/16', '91.106.109.0/24', '91.148.0.0/17',
  '95.177.0.0/16', '162.62.115.0/24', '185.10.208.0/22', '188.115.240.0/20'
];
const JORDAN_IPV6 = ['2a02:2680::/32', '2a02:26a0::/32', '2a02:26c0::/32'];

// حظر سوريا وMENA غير أردنية
const EXCLUDE_IPV4 = ['91.144.0.0/17', '188.82.0.0/16', '185.25.0.0/16'];

// فحص IP أردني
function ipInJordan(ip) {
  if (!ip) return false;
  const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
  const isIPv6 = /^[0-9a-fA-F:]+$/.test(ip);
  if (!isIPv4 && !isIPv6) return false;

  const ipNum = isIPv4 ? (ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0) : null;

  // حظر مستبعد أولاً
  if (isIPv4 && EXCLUDE_IPV4.some(r => {
    const [s, p] = r.split('/');
    const pl = parseInt(p);
    const m = ~((1 << (32 - pl)) - 1);
    const sn = (s.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0);
    return (ipNum & m) === (sn & m);
  })) return false;

  // التحقق من أردن
  if (isIPv4) {
    return JORDAN_IPV4.some(r => {
      const [s, p] = r.split('/');
      const pl = parseInt(p);
      const m = ~((1 << (32 - pl)) - 1);
      const sn = (s.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0);
      return (ipNum & m) === (sn & m);
    });
  }
  return JORDAN_IPV6.some(r => ip.startsWith(r.split('/')[0]));
}

// اختيار بروكسي
function getProxyChain() {
  let tw = PROXIES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * tw;
  for (let p of PROXIES) {
    r -= p.weight;
    if (r <= 0) return `${p.address}; ${FALLBACK_PROXY}`;
  }
  return `${PROXIES[0].address}; ${FALLBACK_PROXY}`;
}

// تنظيف كاش
function cleanCache() {
  if (ipCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (let [h, d] of ipCache) {
      if (now - d.timestamp > CACHE_TTL) ipCache.delete(h);
    }
  }
}

// حل DNS
function resolveIp(h) {
  const now = Date.now();
  if (ipCache.has(h) && now - ipCache.get(h).timestamp < CACHE_TTL) return ipCache.get(h).ip;
  let ip;
  try {
    ip = (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || /::/.test(h)) ? h : dnsResolve(h);
  } catch (e) { return null; }
  if (ip) {
    ipCache.set(h, { ip, timestamp: now });
    cleanCache();
  }
  return ip;
}

function FindProxyForURL(url, host) {
  if (!host) return BLACKHOLE;
  const ip = resolveIp(host);
  if (!ip) return FALLBACK_PROXY;
  return ipInJordan(ip) ? getProxyChain() : BLACKHOLE;
}
