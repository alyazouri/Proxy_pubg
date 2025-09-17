// ===== Jordan-Bias Pro (SOCKS5-only, Minimal Ports, JO Heuristics) =====
// الهدف: زيادة الانحياز للأردن قدر الإمكان عبر SOCKS5 أردني، مع منطق ذكي بسيط.
// ملاحظة: PAC يؤثر على HTTP/HTTPS فقط؛ UDP لا يمر عبر البروكسي.

var PROXY_IP    = "91.106.109.12";
var SOCKS_PORTS = [15040, 15042];   // منفذان فقط = فشل أقل = ثبات أعلى

// نطاقات PUBG / Tencent / CDN الأهم
var PUBG = [
  "*.pubgmobile.com","*.cdn.pubgmobile.com","*.igamecj.com","*.proximabeta.com",
  "*.tencent.com","*.tencentgames.com","*.gcloud.qq.com","*.qcloud.com",
  "*.qpic.cn","*.qq.com","*.akamaized.net","*.akadns.net","*.awsedge.net",
  "*.edgekey.net","*.vtcdn.com"
];

// نطاقات خدمات "ما هو موقعي / IP" الشائعة (لو اللعبة أو خدماتها تمرّ عبر HTTP)
var GEO = [
  "*.ipinfo.io","*.ifconfig.co","*.icanhazip.com","*.whatismyip.*","*.ip-api.com",
  "*.geoip.*","*.geoplugin.*","*.ipify.org","*.ident.me"
];

// شبكات أردنية (CIDR) — إذا حلّ DNS وقع داخلها، نخلي DIRECT (المسار أصلاً محلي)
// يمكنك إضافة/حذف نطاقات حسب مزوّدك.
var JO_CIDRS = [
  // أمثلة عامة؛ عدّل حسب بيئتك إن لزم
  // Orange / Umniah / Zain / Local IX (أدخل CIDR الصحيحة لديك إن أحببت)
  "5.0.0.0/8",        // مثال واسع (يفضّل تضييقه لاحقاً)
  "31.0.0.0/8",
  "37.0.0.0/8",
  "62.0.0.0/8",
  "78.0.0.0/8",
  "80.0.0.0/8",
  "82.0.0.0/8",
  "85.0.0.0/8",
  "86.0.0.0/8",
  "87.0.0.0/8",
  "91.0.0.0/8",
  "176.0.0.0/8",
  "188.0.0.0/8",
  "195.0.0.0/8",
  "212.0.0.0/8",
  "213.0.0.0/8"
];

// ===== Helpers =====
function isLocalHost(host){
  return isPlainHostName(host) || shExpMatch(host,"*.local") ||
    isInNet(dnsResolve(host),"10.0.0.0","255.0.0.0") ||
    isInNet(dnsResolve(host),"172.16.0.0","255.240.0.0") ||
    isInNet(dnsResolve(host),"192.168.0.0","255.255.0.0") ||
    isInNet(dnsResolve(host),"127.0.0.0","255.0.0.0");
}
function matchList(host, patterns){
  for (var i=0;i<patterns.length;i++){ if (shExpMatch(host, patterns[i])) return true; }
  return false;
}
function ipInCidrs(ip, cidrs){
  // يدعم IPv4 فقط داخل PAC
  for (var i=0;i<cidrs.length;i++){
    var c = cidrs[i];
    var parts = c.split("/");
    if (parts.length != 2) continue;
    var base = parts[0];
    var maskBits = parseInt(parts[1], 10);
    if (isNaN(maskBits)) continue;
    if (isInNet(ip, base, maskFromBits(maskBits))) return true;
  }
  return false;
}
function maskFromBits(bits){
  var m = [0,0,0,0];
  for (var i=0;i<bits;i++){ m[(i/8)|0] |= 1 << (7 - (i%8)); }
  return m[0]+"."+m[1]+"."+m[2]+"."+m[3];
}
function chainSOCKS5(){
  var p=[];
  for (var i=0;i<SOCKS_PORTS.length;i++) p.push("SOCKS5 "+PROXY_IP+":"+SOCKS_PORTS[i]);
  p.push("DIRECT");
  return p.join("; ");
}

// ===== Policy =====
function FindProxyForURL(url, host){
  if (isLocalHost(host)) return "DIRECT";

  // 1) PUBG و GEO عبر SOCKS5 الأردني (انحياز للأردن)
  if (matchList(host, PUBG) || matchList(host, GEO)){
    // لكن لو الـ DNS رجّع IP يقع داخل شبكات أردنية محددة، خليه DIRECT (هو أصلاً محلي)
    var ip = dnsResolve(host);
    if (ip && ipInCidrs(ip, JO_CIDRS)) return "DIRECT";
    return chainSOCKS5();
  }

  // 2) باقي المواقع DIRECT لتقليل الحمل/التأخير
  return "DIRECT";
}
