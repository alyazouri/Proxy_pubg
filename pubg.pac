// ===== Jordan-First PUBG (Ordered & Stable) =====
// أولوية التوجيه: SOCKS5 أولاً → HTTP/HTTPS → DIRECT
// ملاحظة: PAC يؤثر على HTTP/HTTPS فقط (UDP لا يمر عبر البروكسي).

// --------[ CONFIG ]--------
var PROXY_IP = "91.106.109.12";   // IP البروكسي/السيرفر

// SOCKS5 أولاً (الأكثر ثباتاً لديك)
var SOCKS_PORTS = [
  1080,  // المنفذ الافتراضي لـ SOCKS5
  443    // بديل في حال تفعيل SOCKS5 على 443
];

// HTTP/HTTPS Proxy كاحتياط (يعمل عبر CONNECT للـ HTTPS)
var HTTP_PORTS = [
  443,   // أقل حجباً ويُعطي مساراً جيداً
  8085   // بديل معروف
];

// نطاقات PUBG/Tencent/CDN الأساسية
var PUBG_DOMAINS = [
  "*.pubgmobile.com",
  "*.cdn.pubgmobile.com",
  "*.igamecj.com",
  "*.proximabeta.com",
  "*.tencent.com",
  "*.tencentgames.com",
  "*.gcloud.qq.com",
  "*.qcloud.com",
  "*.qpic.cn",
  "*.qq.com",
  "*.akamaized.net",
  "*.akadns.net",
  "*.awsedge.net",
  "*.edgekey.net",
  "*.vtcdn.com"
];

// استثناءات محلية
function isLocalHost(host) {
  return isPlainHostName(host) ||
         shExpMatch(host, "*.local") ||
         isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
         isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
         isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
         isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0");
}

function isPUBG(host) {
  for (var i = 0; i < PUBG_DOMAINS.length; i++) {
    if (shExpMatch(host, PUBG_DOMAINS[i])) return true;
  }
  return false;
}

// سلسلة التوجيه بالأولوية المذكورة
function proxyChain() {
  var parts = [];

  // 1) SOCKS5
  for (var i = 0; i < SOCKS_PORTS.length; i++) {
    parts.push("SOCKS5 " + PROXY_IP + ":" + SOCKS_PORTS[i]);
  }

  // 2) HTTP/HTTPS
  for (var j = 0; j < HTTP_PORTS.length; j++) {
    parts.push("PROXY " + PROXY_IP + ":" + HTTP_PORTS[j]);
  }

  // 3) DIRECT (آخر خيار)
  parts.push("DIRECT");

  return parts.join("; ");
}

function FindProxyForURL(url, host) {
  if (isLocalHost(host)) return "DIRECT";
  if (isPUBG(host))      return proxyChain();
  return "DIRECT";
}
