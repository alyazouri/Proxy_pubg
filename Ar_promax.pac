// قائمة البروكسيات الأردنية المحلية مع أوزان استقرار (لأقل ping)
const PROXIES = [
  { address: "SOCKS5 91.106.109.12:5000", weight: 0.95, local: true }, // الأفضل لـ PUBG
  { address: "SOCKS5 91.106.109.12:5001", weight: 0.90, local: true },
  { address: "SOCKS5 91.106.109.12:5002", weight: 0.85, local: true },
  { address: "SOCKS5 91.106.109.12:20001", weight: 0.75, local: true },
  { address: "SOCKS5 91.106.109.12:20002", weight: 0.70, local: true },
  { address: "SOCKS5 91.106.109.12:20003", weight: 0.65, local: true }
];

// بروكسي احتياطي أردني
const FALLBACK_PROXY = "SOCKS5 91.106.109.12:5000";
const BLACKHOLE = "PROXY 0.0.0.0:0";

// كاش DNS لتقليل الـ ping
const ipCache = new Map();
const CACHE_TTL = 1800000; // 30 دقيقة
const MAX_CACHE_SIZE = 500;

// نطاقات IP الأردنية المختصرة (IPv4 + IPv6) من IP2Location 2025
const JORDAN_IPV4_RANGES = [
  '37.98.0.0/16',    // Orange Jordan
  '41.31.0.0/16',    // Umniah
  '91.106.109.0/24', // نطاق البروكسيات المحلية
  '91.148.0.0/17',   // Zain Jordan
  '95.177.0.0/16',   // Jordan Telecom
  '162.62.115.0/24', // Tencent Cloud MENA (Jordan-specific)
  '185.10.208.0/22', // مزودات أردنية
  '185.77.160.0/22', // مزودات أردنية
  '188.115.240.0/20' // مزودات إضافية
  // يمكن إضافة المزيد من https://lite.ip2location.com/jordan-ip-address-ranges
];

const JORDAN_IPV6_RANGES = [
  '2a02:2680::/32', // Orange Jordan IPv6
  '2a02:26a0::/32'  // Zain Jordan IPv6
];

// فحص IP أردني فقط (يمنع سوريا)
function ipInJordan(ip) {
  if (!ip) return false;

  // فحص IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    const ipNum = (ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0);
    return JORDAN_IPV4_RANGES.some(range => {
      const [startStr, prefix] = range.split('/');
      if (!prefix) return false;
      const prefixLen = parseInt(prefix);
      const mask = ~((1 << (32 - prefixLen)) - 1);
      const startNum = (startStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0);
      return (ipNum & mask) === (startNum & mask);
    });
  }

  // فحص IPv6 (مبسط)
  if (/^[0-9a-fA-F:]+$/.test(ip)) {
    return JORDAN_IPV6_RANGES.some(range => ip.startsWith(range.split('/')[0]));
  }

  return false;
}

// اختيار أفضل بروكسي أردني
function getProxyChain() {
  let totalWeight = PROXIES.reduce((sum, p) => sum + (p.local ? p.weight : 0), 0);
  let random = Math.random() * totalWeight;
  for (let p of PROXIES) {
    if (!p.local) continue;
    random -= p.weight;
    if (random <= 0) return `${p.address}; ${FALLBACK_PROXY}`;
  }
  return `${PROXIES[0].address}; ${FALLBACK_PROXY}`;
}

// تنظيف الكاش
function cleanCache() {
  if (ipCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (let [host, data] of ipCache.entries()) {
      if (now - data.timestamp > CACHE_TTL) ipCache.delete(host);
    }
  }
}

// حل DNS مع كاش
function resolveIp(host) {
  const now = Date.now();
  if (ipCache.has(host) && now - ipCache.get(host).timestamp < CACHE_TTL) {
    return ipCache.get(host).ip;
  }

  let ip;
  try {
    const isIP = (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /::/.test(host));
    ip = isIP ? host : dnsResolve(host);
  } catch (e) {
    return null;
  }

  if (ip) {
    ipCache.set(host, { ip, timestamp: now });
    cleanCache();
  }
  return ip;
}

function FindProxyForURL(url, host) {
  if (!host) return BLACKHOLE;

  const ip = resolveIp(host);
  if (!ip) return FALLBACK_PROXY;

  // فقط الأردن: بروكسي، غير كده قطع (يمنع سوريا)
  return ipInJordan(ip) ? getProxyChain() : BLACKHOLE;
}
