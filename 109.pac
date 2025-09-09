// === PUBG PAC — Full Jordan Proxy (No Raw DIRECT) — مع استثناء YouTube ===

var proxyIP = "91.106.109.12";
var minPort = 10000;
var maxPort = 27015;
var classicMinPort = 27016;
var classicMaxPort = 27020;
var stickyTTL = 60000;

var hostMap = {};

function generatePort(min, max) {
  var nowSec = Math.floor(Date.now() / 1000);
  var range = max - min + 1;
  return min + (nowSec % range);
}

function buildProxyString(port) {
  return "SOCKS5 " + proxyIP + ":" + port +
         "; SOCKS4 " + proxyIP + ":" + port +
         "; PROXY " + proxyIP + ":" + port;
}

function isPubgHost(host) {
  host = host.toLowerCase();
  var pubgList = [
    "pubgmobile.com", "pubgmobile.net", "pubgmobile.org",
    "igamecj.com", "tencent.com", "tencentgames.com", "tencentgames.net",
    "proximabeta.com", "gpubgm.com", "qcloud.com", "qcloudcdn.com",
    "akamaized.net", "gamepubgm.com", "sg-global-pubg.com", "tdatamaster.com"
  ];
  for (var i = 0; i < pubgList.length; i++) {
    var d = pubgList[i];
    if (host === d || dnsDomainIs(host, "." + d) || shExpMatch(host, "*." + d)) {
      return true;
    }
  }
  if (shExpMatch(host, "*pubg*") || shExpMatch(host, "*tencent*") ||
      shExpMatch(host, "*qcloud*") || shExpMatch(host, "*proximabeta*")) {
    return true;
  }
  return false;
}

function isClassicMatchHost(host) {
  host = host.toLowerCase();
  var classicList = [
    "classic.pubgmobile.com", "classicmatch.pubgmobile.net", "classic.tencentgames.com"
  ];
  for (var i = 0; i < classicList.length; i++) {
    var d = classicList[i];
    if (host === d || dnsDomainIs(host, "." + d) || shExpMatch(host, "*." + d)) {
      return true;
    }
  }
  if (shExpMatch(host, "*classic*") || shExpMatch(host, "*classicmatch*")) {
    return true;
  }
  return false;
}

function isYouTubeHost(host) {
  host = host.toLowerCase();
  return host === "youtube.com" ||
         dnsDomainIs(host, ".youtube.com") ||
         shExpMatch(host, "*youtube.com");
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  // 0) استثناء YouTube — DIRECT بدون بروكسي
  if (isYouTubeHost(host)) {
    return "DIRECT";
  }

  var now = Date.now();

  // 1) مباريات الكلاسيك — بورت ثابت خاص
  if (isClassicMatchHost(host)) {
    var entry = hostMap[host];
    if (entry && (now - entry.ts) <= stickyTTL) {
      return buildProxyString(entry.port);
    }
    var port = generatePort(classicMinPort, classicMaxPort);
    hostMap[host] = { port: port, ts: now };
    return buildProxyString(port);
  }

  // 2) باقي نطاقات PUBG — Hybrid بورت متغير
  if (isPubgHost(host)) {
    var entry = hostMap[host];
    if (entry && (now - entry.ts) <= stickyTTL) {
      return buildProxyString(entry.port);
    }
    var port = generatePort(minPort, maxPort);
    hostMap[host] = { port: port, ts: now };
    return buildProxyString(port);
  }

  // 3) كل الاتصالات الأخرى — توجيه عبر البروكسي الأردني
  var port = generatePort(minPort, maxPort);
  return buildProxyString(port);
}
