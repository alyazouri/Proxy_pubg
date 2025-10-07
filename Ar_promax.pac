// قائمة البروكسيات المحلية في الأردن مع أوزان استقرار (قيم أعلى = أكثر استقراراً)
const PROXIES = [
  { address: "SOCKS5 91.106.109.12:5000", weight: 0.95, local: true }, // الأكثر استقراراً
  { address: "SOCKS5 91.106.109.12:5001", weight: 0.90, local: true },
  { address: "SOCKS5 91.106.109.12:5002", weight: 0.85, local: true },
  { address: "SOCKS5 91.106.109.12:20001", weight: 0.75, local: true },
  { address: "SOCKS5 91.106.109.12:20002", weight: 0.70, local: true },
  { address: "SOCKS5 91.106.109.12:20003", weight: 0.65, local: true }
];

// بروكسي احتياطي محلي في الأردن
const FALLBACK_PROXY = "SOCKS5 91.106.109.12:5000";
const BLACKHOLE = "PROXY 0.0.0.0:0";

// كاش لتخزين نتائج DNS مع تنظيف دوري
const ipCache = new Map();
const CACHE_TTL = 1800000; // 30 دقيقة لتقليل استدعاءات DNS
const MAX_CACHE_SIZE = 500; // الحد الأقصى للكاش

// عدادات الأداء لتتبع نجاح/فشل البروكسيات
const proxyPerformance = new Map(PROXIES.map(p => [p.address, { success: 0, failures: 0, lastPing: 0 }]));

// فحص ما إذا كان الـ IP أردني (محلي)
function ipInJordan(ip) {
  // فحص نطاقات IP الأردنية (مثال مبسط)
  // استبدل هذا بفحص نطاقات IP الأردنية الفعلية (IPv4/IPv6)
  const jordanRanges = [
    /^91\.106\.109\.\d{1,3}$/, // مثال لنطاق IPv4 أردني
    // أضف نطاقات IPv6 إذا لزم الأمر
  ];
  return ip && jordanRanges.some(range => range.test(ip));
}

// دالة لاختيار أفضل بروكسي محلي بناءً على الوزن
function getProxyChain() {
  // اختيار البروكسي بناءً على الوزن (الأعلى أولوية)
  let totalWeight = PROXIES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (let p of PROXIES) {
    if (!p.local) continue; // التأكد من أن البروكسي محلي
    random -= p.weight;
    if (random <= 0) {
      proxyPerformance.get(p.address).success++;
      return `${p.address}; ${FALLBACK_PROXY}`;
    }
  }
  proxyPerformance.get(PROXIES[0].address).success++;
  return `${PROXIES[0].address}; ${FALLBACK_PROXY}`; // الافتراضي المحلي
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
    proxyPerformance.get(FALLBACK_PROXY).failures++;
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

  // فحص الـ IP باستخدام الكاش
  const ip = resolveIp(host);
  if (!ip) {
    proxyPerformance.get(FALLBACK_PROXY).success++;
    return FALLBACK_PROXY; // استخدام الاحتياطي المحلي
  }
  return ipInJordan(ip) ? getProxyChain() : BLACKHOLE;
}
