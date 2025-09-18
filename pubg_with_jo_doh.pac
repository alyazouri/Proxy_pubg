// ===== Jordan-Bias (SOCKS5) + JO DoH (Anycast to Amman/Aqaba) =====
// يمرّر نطاقات PUBG + DoH الأردني عبر SOCKS5 الأردني.
// PAC يؤثر على HTTP/HTTPS فقط؛ UDP خارج نطاقه.

var PROXY_IP    = "91.106.109.12";
var SOCKS_PORTS = [15040, 15042]; // منافذ SOCKS5 الأردنية

// نطاقات PUBG/Tencent/CDN
var PUBG = [
  "*.pubgmobile.com","*.cdn.pubgmobile.com","*.igamecj.com","*.proximabeta.com",
  "*.tencent.com","*.tencentgames.com","*.gcloud.qq.com","*.qcloud.com",
  "*.qpic.cn","*.qq.com","*.akamaized.net","*.akadns.net","*.awsedge.net",
  "*.edgekey.net","*.vtcdn.com"
];

// DoH أردني فعلي via Anycast:
// - Cloudflare (Amman, JO) -> cloudflare-dns.com
// - Quad9 (Jordan, Aqaba IX) -> dns.quad9.net
var DOH_JO = [
  "cloudflare-dns.com","*.cloudflare-dns.com",
  "dns.quad9.net","dns11.quad9.net","dns10.quad9.net"
];

var TARGETS = PUBG.concat(DOH_JO);

// ===== Helpers =====
function isLocalHost(host){
  return isPlainHostName(host) || shExpMatch(host,"*.local") ||
    isInNet(dnsResolve(host),"10.0.0.0","255.0.0.0") ||
    isInNet(dnsResolve(host),"172.16.0.0","255.240.0.0") ||
    isInNet(dnsResolve(host),"192.168.0.0","255.255.0.0") ||
    isInNet(dnsResolve(host),"127.0.0.0","255.0.0.0");
}
function matchList(host, patterns){
  for (var i=0;i<patterns.length;i++){
    if (shExpMatch(host, patterns[i]) || host === patterns[i]) return true;
  }
  return false;
}
function chainSOCKS5(){
  var p=[]; for (var i=0;i<SOCKS_PORTS.length;i++) p.push("SOCKS5 "+PROXY_IP+":"+SOCKS_PORTS[i]);
  p.push("DIRECT"); return p.join("; ");
}

// ===== Policy =====
function FindProxyForURL(url, host){
  if (isLocalHost(host)) return "DIRECT";
  if (matchList(host, TARGETS)) return chainSOCKS5(); // PUBG + DoH الأردني عبر SOCKS5
  return "DIRECT";
}
