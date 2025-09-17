// ===== Jordan-First PUBG (SOCKS5 Only, Minimal Ports) =====
// يمرّر نطاقات PUBG/Tencent عبر SOCKS5 فقط باستخدام منفذين لتقليل الفشل.
// PAC يؤثر على HTTP/HTTPS فقط؛ UDP لا يمر عبر البروكسي.

var PROXY_IP = "91.106.109.12";   // IP البروكسي/السيرفر

// منافذ SOCKS5 (اثنان فقط لتقليل التذبذب)
var SOCKS_PORTS = [15040, 15042];

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
  parts.push("DIRECT"); // لو فشل كل شيء
  return parts.join("; ");
}

function FindProxyForURL(url, host) {
  if (isLocalHost(host)) return "DIRECT";
  if (isPUBG(host))      return proxyChain();
  return "DIRECT";
}
