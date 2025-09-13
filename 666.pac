function FindProxyForURL(url, host) {
  // ===== إعداد البروكسي الأردني =====
  var JORDAN_PROXIES = [
    "PROXY 61.109.106.12:443"   // بروكسي أردني رئيسي
  ];
  var DEFAULT_ROUTE = "DIRECT"; // التوجيه الافتراضي

  // ===== أدوات مساعدة =====
  host = host.toLowerCase();

  function joinProxies(arr) {
    var s = "";
    for (var i = 0; i < arr.length; i++) s += (i ? "; " : "") + arr[i];
    return s + "; " + DEFAULT_ROUTE;
  }

  function matchAny(globs) {
    for (var i = 0; i < globs.length; i++) {
      if (shExpMatch(host, globs[i])) return true;
    }
    return false;
  }

  // ===== استثناءات للشبكات الداخلية =====
  if (isPlainHostName(host)) return "DIRECT";
  if (isInNet(host, "10.0.0.0",  "255.0.0.0"))   return "DIRECT";
  if (isInNet(host, "192.168.0.0","255.255.0.0"))return "DIRECT";
  if (isInNet(host, "172.16.0.0", "255.240.0.0"))return "DIRECT";
  if (host === "localhost" || shExpMatch(host,"127.*")) return "DIRECT";

  // ===== DNS-over-HTTPS موثوقة تبقى مباشرة =====
  if (matchAny([
    "one.one.one.one", "cloudflare-dns.com", "*.cloudflare-dns.com",
    "dns.google", "*.dns.google",
    "*.quad9.net", "resolver1.opendns.com", "*.opendns.com"
  ])) return "DIRECT";

  // ===== التعامل مع 6.6.6.6 =====
  if (host === "6.6.6.6") return "DIRECT";

  // ===== نطاقات مهمة للنظام تبقى مباشرة =====
  if (matchAny([
    "*.apple.com", "*.icloud.com", "*.mzstatic.com", "*.itunes.apple.com",
    "*.microsoft.com", "*.windowsupdate.com", "*.office.com",
    "*.google.com", "*.gstatic.com", "*.googleapis.com", "*.youtube.com"
  ])) return "DIRECT";

  // ===== نطاقات PUBG موجهة عبر البروكسي =====
  var PUBG = [
    "*.pubgmobile.com", "*.cdn.pubgmobile.com", "*.igamecj.com",
    "*.proximabeta.com", "*.tencent.com", "*.tencentgames.com",
    "*.gcloud.qq.com", "*.qcloud.com", "*.qpic.cn",
    "*.akamaized.net", "*.akamaiedge.net", "*.edgekey.net", "*.edgesuite.net",
    "*.vtcdn.com", "*.alicdn.com", "*.alicdn.com.cn", "*.bytecdn.cn",
    "*.bugly.qq.com", "*.tendcloud.com", "*.firebaseio.com"
  ];
  if (matchAny(PUBG)) return joinProxies(JORDAN_PROXIES);

  // ===== المسار الافتراضي =====
  return DEFAULT_ROUTE;
}
