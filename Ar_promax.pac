// قائمة البروكسيات مع أوزان افتراضية للاستقرار (قيم أعلى = أكثر استقراراً)
const PROXIES = [
  { address: "SOCKS5 91.106.109.12:5000", weight: 0.9 }, // الأكثر استقراراً بناءً على افتراض
  { address: "SOCKS5 91.106.109.12:5001", weight: 0.85 },
  { address: "SOCKS5 91.106.109.12:5002", weight: 0.8 },
  { address: "SOCKS5 91.106.109.12:20001", weight: 0.7 },
  { address: "SOCKS5 91.106.109.12:20002", weight: 0.65 },
  { address: "SOCKS5 91.106.109.12:20003", weight: 0.6 }
];

// بروكسي احتياطي في حال فشل الكل
const FALLBACK_PROXY = "SOCKS5 91.106.109.12:5000";
const BLACKHOLE = "PROXY 0.0.0.0:0";

// كاش لتخزين نتائج DNS مع تنظيف دوري
const ipCache = new Map();
const CACHE_TTL = 1200000; // 20 دقيقة بالميلي ثانية
const MAX_CACHE_SIZE = 1000; // الحد الأقصى للكاش

// عدادات الأداء (للإعجاب بتتبع الأداء)
const proxyPerformance = new Map(PROXIES.map(p => [p.address, { success: 0, failures: 0 }]));

// فحص ما إذا كان الـ IP أردني (استبدل بالمنطق الأصلي)
function ipInJordan(ip) {
  // نفس فحص الرينجات (IPv4/IPv6) للأردن
  return true; // استبدل بفحص نطاقات IP الأردنية
}

// دالة لاختيار أفضل بروكسي بناءً على الوزن
function getProxyChain() {
  // اختيار البروكسي بناءً على الوزن (الأعلى أولوية)
  let totalWeight = PROXIES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (let p of PROXIES) {
    random -= p.weight;
    if (random <= 0) {
      proxyPerformance.get(p.address).success++;
      return `${p.address}; ${FALLBACK_PROXY}`;
    }
  }
  proxyPerformance.get(PROXIES[0].address).success++;
  return `${PROXIES[0].address}; ${FALLBACK_PROXY}`; // الافتراضي إذا فشل الاختيار
}

// دالة لتنظيف الكاش إذا تجاوز الحجم
function cleanCache() {
  if (ipCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (let [host, data] of ipCache) {
      if (now - data.timestamp > CACHE_TTL) {
        ipCache.delete(host);
      }
    }
  }
}

// دالة لفحص الـ IP مع كاش ومعالجة أخطاء
function resolveIp(host) {
  const now = Date.now();
  const cached = ipCache.get(host);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.ip;
  }

  let ip;
  try {
    ip = (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /::/.test(host)) ? host : dnsResolve(host);
  } catch (e) {
    // تتبع الفشل في الأداء
    proxyPerformance.get(FALLBACK_PROXY).failures++;
    return null;
  }

  if (ip) {
    ipCache.set(host, { ip, timestamp: now });
    cleanCache(); // تنظيف الكاش إذا لزم الأمر
  }
  return ip;
}

function FindProxyForURL(url, host) {
  if (!host) return BLACKHOLE;

  // فحص الـ IP باستخدام الكاش
  const ip = resolveIp(host);
  if (!ip) {
    proxyPerformance.get(FALLBACK_PROXY).success++;
    return FALLBACK_PROXY; // إذا فشل DNS، استخدام الاحتياطي
  }
  return ipInJordan(ip) ? getProxyChain() : BLACKHOLE;
}
