function FindProxyForURL(url, host) {
  var PROXY = "PROXY 87.236.233.68:443";

  // استثناءات أساسية ومحلية
  if (isPlainHostName(host)) return "DIRECT";
  if (dnsDomainIs(host, ".local")) return "DIRECT";
  if (isInNet(host, "10.0.0.0", "255.0.0.0")) return "DIRECT";
  if (isInNet(host, "172.16.0.0", "255.240.0.0")) return "DIRECT";
  if (isInNet(host, "192.168.0.0", "255.255.0.0")) return "DIRECT";
  if (isInNet(host, "127.0.0.0", "255.0.0.0")) return "DIRECT";
  if (dnsDomainIs(host, "captive.apple.com")) return "DIRECT";

  // نطاقات PUBG Mobile وTencent
  var D = [
    "pubgmobile.com",
    "gpubgm.com",
    "napubgm.broker.amsoveasea.com",
    "cdn.pubgmobile.com",
    "img.pubgmobile.com",
    "igamecj.com",
    "proximabeta.com",
    "tencentgames.com",
    "tencent.com",
    "tencentcloud.com",
    "tencentcloudapi.com",
    "qcloud.com",
    "gcloud.qq.com",
    "gtimg.com",
    "akamaized.net",
    "akmcdn.com",
    "aksdk.qq.com",
    "vtcdn.com"
  ];

  function isListedDomain(h) {
    var lh = h.toLowerCase();
    for (var i = 0; i < D.length; i++) {
      var d = "." + D[i].toLowerCase();
      if (lh === D[i].toLowerCase() || lh.slice(-d.length) === d) return true;
    }
    return false;
  }

  if (isListedDomain(host)) return PROXY;

  var u = url.toLowerCase();
  if (shExpMatch(u, "*pubg*") || shExpMatch(u, "*tencent*") || shExpMatch(u, "*proximabeta*")) {
    return PROXY;
  }

  return "DIRECT";
}
