// =================== Jordan-First PUBG (SOCKS5 + HTTP) ===================
// يمرّر نطاقات PUBG/Tencent عبر بروكسي أردني: يفضّل SOCKS5، ثم HTTP/HTTPS.
// PAC يؤثر على HTTP/HTTPS فقط؛ UDP لا يمر عبر البروكسي.

// ---------[ CONFIG ]---------
var PROXY_IP = "91.106.109.12"; // عنوان بروكسيك/السيرفر

// منافذ SOCKS5 المفضّلة (جرّب من الأعلى للأسفل)
var SOCKS_PORTS = [
  1080, // SOCKS5 شائع
  443,  // أحيانًا SOCKS5 على 443
  8085  // بديل شائع
];

// منافذ HTTP/HTTPS Proxy (تعمل لـ HTTP و HTTPS عبر CONNECT)
var HTTP_PORTS = [
  443,   // HTTPS شائع وأقل حجبًا
  8085,  // بديل شائع
  20000, 20001, 20002,
  10010, 10011, 10012, 10013,
  17000, 17001, 17002, 17500
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

// استثناءات الشبكة/الأسماء المحلية
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

// يبني سلسلة بروكسي: SOCKS5 أولاً، ثم HTTP، ثم DIRECT
function proxyChain() {
  var parts = [];

  // SOCKS5
  for (var i = 0; i < SOCKS_PORTS.length; i++) {
    var sp = SOCKS_PORTS[i];
    parts.push("SOCKS5 " + PROXY_IP + ":" + sp);
  }

  // HTTP/HTTPS (CONNECT)
  for (var j = 0; j < HTTP_PORTS.length; j++) {
    var hp = HTTP_PORTS[j];
    parts.push("PROXY " + PROXY_IP + ":" + hp);
  }

  // أخيرًا مباشر
  parts.push("DIRECT");
  return parts.join("; ");
}

function FindProxyForURL(url, host) {
  if (isLocalHost(host)) return "DIRECT"; // الشبكة المحلية دائمًا مباشر

  // نطاقات PUBG/Tencent عبر السلسلة
  if (isPUBG(host)) return proxyChain();

  // باقي المواقع مباشرة لتقليل التأخير
  return "DIRECT";
}
