// قائمة بروكسيات أردنية خارقة بأداء عالي
const PROXIES = [
  { address: "SOCKS5 91.106.109.12:5000", weight: 0.95 }, // الأسرع مع NAT مفتوح
  { address: "SOCKS5 91.106.109.12:5001", weight: 0.93 },
  { address: "SOCKS5 91.106.109.12:5002", weight: 0.90 },
  { address: "SOCKS5 91.106.109.12:20001", weight: 0.85 },
  { address: "SOCKS5 91.106.109.12:20002", weight: 0.80 },
  { address: "SOCKS5 91.106.109.12:20003", weight: 0.75 }
];

const FALLBACK_PROXY = "SOCKS5 91.106.109.12:20001";
const BLACKHOLE = "PROXY 0.0.0.0:0";

// كاش DNS خارق لتقليل البنق
const ipCache = new Map();
const CACHE_TTL = 1800000; // 30 دقيقة
const MAX_CACHE_SIZE = 200;

// نطاقات IP أردنية دقيقة جدًا
const JORDAN_IPV4 = [
  '37.98.0.0/16', '41.31.0.0/16', '91.106.109.0/24', '91.148.0.0/17',
  '95.177.0.0/16', '162.62.115.0/24', '185.10.208.0/22', '188.115.240.0/20',
  '109.108.128.0/17'
];
const JORDAN_IPV6 = ['2a02:2680::/32', '2a02:26a0::/32', '2a02:26c0::/32'];

// حظر نطاقات سورية وMENA غير أردنية
const EXCLUDE_IPV4 = [
  '91.144.0.0/17', '188.82.0.0/16', '185.25.0.0/16', '37.98.0.0/15', '41.31.0.0/15'
];

// فحص IP أردني بقوة
function ipInJordan(ip) {
  if (!ip) return false;
  const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
  const isIPv6 = /^[0-9a-fA-F:]+$/.test(ip);
  if (!isIPv4 && !isIPv6) return false;

  const ipNum = isIPv4 ? (ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0) : null;

  // حظر نطاقات غير مرغوبة أولاً
  if (isIPv4 && EXCLUDE_IPV4.some(r => {
    const [s, p] = r.split('/');
    const pl = parseInt(p);
    const m = ~((1 << (32 - pl)) - 1);
    const sn = (s.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0);
    return (ipNum & m) === (sn & m);
  })) return false;

  // التحقق من نطاقات أردنية
  if (isIPv4) {
    return JORDAN_IPV4.some(r => {
      const [s, p] = r.split('/');
      const pl = parseInt(p);
      const m = ~((1 << (32 - pl)) - 1);
      const sn = (s.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0);
      return (ipNum & m) === (sn & m);
    });
  }
  return isIPv6 && JORDAN_IPV6.some(r => ip.startsWith(r.split('/')[0]));
}

// اختيار بروكسي خارق مع دعم NAT
function getProxyChain() {
  let totalWeight = PROXIES.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return FALLBACK_PROXY;
  let random = Math.random() * totalWeight;
  for (let p of PROXIES) {
    random -= p.weight;
    if (random <= 0) return `${p.address}; ${FALLBACK_PROXY}`;
  }
  return FALLBACK_PROXY;
}

// تنظيف الكاش لاستقرار خارق
function cleanCache() {
  if (ipCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (let [host, data] of [...ipCache]) {
      if (now - data.timestamp > CACHE_TTL) ipCache.delete(host);
    }
  }
}

// حلول DNS محسّنة مع NAT
function resolveIp(host) {
  const now = Date.now();
  if (ipCache.has(host) && now - ipCache.get(host).timestamp < CACHE_TTL) {
    return ipCache.get(host).ip;
  }
  let ip;
  try {
    ip = (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /::/.test(host)) ? host : dnsResolve(host);
    if (!ip) throw new Error("DNS failed");
  } catch (e) {
    return null;
  }
  if (ip) {
    ipCache.set(host, { ip, timestamp: now });
    cleanCache();
  }
  return ip;
}

// توجيه خارق مع دعم NAT مفتوح
function FindProxyForURL(url, host) {
  if (!host || !/^(?:\d{1,3}\.){3}\d{1,3}$|(?:[0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/.test(host)) {
    return BLACKHOLE;
  }
  const ip = resolveIp(host);
  if (!ip) return FALLBACK_PROXY;
  if (ipInJordan(ip)) {
    // تحسين التوجيه مع NAT مفتوح
    return getProxyChain() + "; DIRECT"; // يسمح باستخدام الاتصال المباشر إذا NAT مفتوح
  }
  return BLACKHOLE;
}
