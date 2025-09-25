var PROXIES = [
  "SOCKS5 91.106.109.12:7086",
  "SOCKS5 91.106.109.12:8011",
  "SOCKS5 91.106.109.12:9030",
  "SOCKS5 91.106.109.12:12235",
  "SOCKS5 91.106.109.12:10010",
  "SOCKS5 91.106.109.12:13004",
  "SOCKS5 91.106.109.12:14000",
  "SOCKS5 91.106.109.12:10039",
  "PROXY 91.106.109.12:80",
  "PROXY 91.106.109.12:8080"
];

var BEST_INDEX = 0;
var LAST_CHECK = 0;
var CACHE_INTERVAL = 30000; // 30 ثانية

function extractHost(proxyStr) {
  var m = proxyStr.match(/(?:SOCKS5|SOCKS|PROXY)\s+([^:;]+)/i);
  return m ? m[1] : null;
}

function isResolvable(host) {
  if (!host) return false;
  try {
    var r = dnsResolve(host);
    return (r !== null && r !== "");
  } catch (e) {
    return false;
  }
}

function pickBestProxy() {
  var now = Date.now();
  if (now - LAST_CHECK < CACHE_INTERVAL && BEST_INDEX >= 0 && BEST_INDEX < PROXIES.length) {
    return PROXIES[BEST_INDEX];
  }
  for (var i = 0; i < PROXIES.length; i++) {
    if (isResolvable(extractHost(PROXIES[i]))) {
      BEST_INDEX = i;
      LAST_CHECK = now;
      return PROXIES[BEST_INDEX];
    }
  }
  BEST_INDEX = 0;
  LAST_CHECK = now;
  return PROXIES[BEST_INDEX];
}

function FindProxyForURL(url, host) {
  return pickBestProxy();
}
