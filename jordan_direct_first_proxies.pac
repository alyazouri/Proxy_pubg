// ======================================================================
// PAC – Jordan-first (DIRECT-first with proxy fallback) + HTTP/HTTPS/SOCKS
// ملاحظة: iOS قد يتجاهل HTTPS/SOCKS في PAC. سيتم استخدامها إن كانت مدعومة.
// ======================================================================

function FindProxyForURL(url, host) {
  // -------- CONFIG --------
  var JO_HOST = "109.107.240.101";
  var PORTS = [443, 8000, 20000];

  // نطاقات PUBG/Tencent/CDN الشائعة
  var PUBG = [
    "*.pubgmobile.com","*.cdn.pubgmobile.com","*.igamecj.com",
    "*.proximabeta.com","*.tencent.com","*.tencentgames.com",
    "*.qcloud.com","*.tencent-cloud.net","*.gcloud.qq.com","*.qq.com",
    "*.akamaized.net","*.cloudfront.net","*.amazonaws.com"
  ];

  // استثناءات تبقى مباشرة لتقليل التأخير
  var EXCLUDE = [
    "*.youtube.com","*.googlevideo.com","*.ytimg.com",
    "*.facebook.com","*.fbcdn.net","*.whatsapp.com","*.whatsapp.net",
    "*.apple.com","*.icloud.com","*.mzstatic.com",
    "*.microsoft.com","*.windowsupdate.com","*.msftconnecttest.com",
    "*.zoom.us","*.teams.microsoft.com"
  ];

  // -------- Helpers --------
  function domListMatch(list, h) {
    h = h.toLowerCase();
    for (var i = 0; i < list.length; i++) if (shExpMatch(h, list[i])) return true;
    return false;
  }
  function joinProxies(arr) { return arr.join("; ") + "; DIRECT"; }

  function buildHTTP() {
    var out = [];
    for (var i=0;i<PORTS.length;i++) out.push("PROXY " + JO_HOST + ":" + PORTS[i]);
    return out;
  }
  function buildHTTPS() {
    // تحذير: "HTTPS" في PAC قد لا يكون مدعومًا في كل الأنظمة/التطبيقات
    var out = [];
    for (var i=0;i<PORTS.length;i++) out.push("HTTPS " + JO_HOST + ":" + PORTS[i]);
    return out;
  }
  function buildSOCKS() {
    // تحذير: iOS غالبًا لا يعتمد SOCKS عبر PAC
    var out = [];
    for (var i=0;i<PORTS.length;i++) out.push("SOCKS " + JO_HOST + ":" + PORTS[i]);
    return out;
  }

  var HTTP_PROXIES  = buildHTTP();
  var HTTPS_PROXIES = buildHTTPS();
  var SOCKS_PROXIES = buildSOCKS();

  // -------- Local/LAN bypass --------
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
      isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
      isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0")) {
    return "DIRECT";
  }

  // -------- Smart rules --------
  // أ) استثناءات (دائماً DIRECT)
  if (domListMatch(EXCLUDE, host)) return "DIRECT";

  // ب) نطاقات PUBG: جرّب DIRECT أولاً (إن كان المسار المحلي أفضل)، ثم البروكسيات + SOCKS + HTTPS
  if (domListMatch(PUBG, host)) {
    return "DIRECT; " + HTTP_PROXIES.concat(SOCKS_PROXIES).concat(HTTPS_PROXIES).join("; ") + "; DIRECT";
  }

  // ج) باقي المواقع: DIRECT أولاً، ثم البروكسيات (HTTP -> SOCKS -> HTTPS) كبدائل
  return joinProxies(HTTP_PROXIES.concat(SOCKS_PROXIES).concat(HTTPS_PROXIES));
}
