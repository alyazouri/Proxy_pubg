// ===== Jordan-First PUBG (SOCKS5 Only) =====
// يمرّر نطاقات PUBG/Tencent عبر SOCKS5 فقط على المنافذ المختارة.
// PAC يؤثر على HTTP/HTTPS فقط؛ UDP لا يمر عبر البروكسي.

// --------[ CONFIG ]--------
var PROXY_IP = "91.106.109.12";   // IP البروكسي/السيرفر

// منافذ SOCKS5 مأخوذة من قائمتك
var SOCKS_PORTS = [
  9050,    // SOCKS5 شائع جدًا
  15038    // بديل ظهر في قائمتك
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

function proxyChain() {
  var parts = [];
  for (var i = 0; i < SOCKS_PORTS.length; i++) {
    parts.push("SOCKS5 " + PROXY_IP + ":" + SOCKS_PORTS[i]);
  }
  parts.push("DIRECT"); // آخر خيار لو فشل SOCKS5
  return parts.join("; ");
}

function FindProxyForURL(url, host) {
  if (isLocalHost(host)) return "DIRECT";
  if (isPUBG(host))      return proxyChain();
  return "DIRECT";
}
