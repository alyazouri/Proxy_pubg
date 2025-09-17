// PAC: توجيه نطاقات PUBG عبر بروكسيك SOCKS5 المحلي على 1080
function FindProxyForURL(url, host) {
  // 0) استثناءات الشبكات/الأسماء المحلية
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
      isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
      isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0")) {
    return "DIRECT";
  }

  // 1) نطاقات PUBG وخدماتها
  var PUBG = [
    "*.pubgmobile.com",
    "*.igamecj.com",
    "*.proximabeta.com",
    "*.tencent.com",
    "*.tencentgames.com",
    "*.gcloud.qq.com",
    "*.qcloud.com",
    "*.qcloudcdn.com",
    "*.garena.com",
    "*.akamaized.net",
    "*.vtcdn.com"
  ];

  // 2) التحقق من التطابق
  function matchList(host, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (shExpMatch(host, arr[i])) return true;
    }
    return false;
  }

  // 3) عنوان بروكسيك SOCKS5 على نفس الجهاز
  var SOCKS_PROXY = "SOCKS5 " + myIpAddress() + ":1080";

  // 4) التوجيه
  if (matchList(host, PUBG)) {
    return SOCKS_PROXY + "; DIRECT";
  }

  // 5) أي شيء آخر مباشرة
  return "DIRECT";
}
