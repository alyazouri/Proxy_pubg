var PROXY = "SOCKS5 51.38.232.101:443";

var APP_HOSTS = [
  "v.tiktok.net",
  "webcast.tiktokv.com",
  "*.webcast*.tiktokv.com",
  "*.api.tiktokv.com",
  "*.tiktokv.com",
  "*.tiktokcdn.com",
  "*.ibytedtos.com",
  "*.ibyteimg.com"
];

function match(host, patt) {
  if (patt.indexOf("*.") === 0) {
    var root = patt.substring(2).toLowerCase();
    return host === root || host.endsWith("." + root);
  }
  return host === patt.toLowerCase();
}

function inList(host, list) {
  for (var i = 0; i < list.length; i++) if (match(host, list[i])) return true;
  return false;
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();
  if (host === "web.tiktok.com" || host === "www.tiktok.com") return PROXY;  // الويب أيضاً
  if (inList(host, APP_HOSTS)) return PROXY;                                  // نطاقات التطبيق الشائعة
  return "DIRECT";
}
