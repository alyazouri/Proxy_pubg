function FindProxyForURL(url, host) {
  // =========[ 0) Normalizers & Utils ]=========
  if (host) {
    if (host.charAt(host.length - 1) === ".") host = host.slice(0, -1);
    host = host.toLowerCase();
  }

  function anyMatch(patterns, h) {
    if (!h) return false;
    for (var i = 0; i < patterns.length; i++) {
      if (shExpMatch(h, patterns[i])) return true;
    }
    return false;
  }

  function ipToLong(x) {
    var p = x ? x.split(".") : [];
    if (p.length !== 4) return null;
    return ((+p[0] << 24) >>> 0) + ((+p[1] << 16) >>> 0) + ((+p[2] << 8) >>> 0) + (+p[3] >>> 0);
  }

  function inCIDRs(ip, cidrs) {
    if (!ip) return false;
    var ipL = ipToLong(ip);
    if (ipL === null) return false;
    for (var i = 0; i < cidrs.length; i++) {
      var parts = cidrs[i].split("/");
      var base = parts[0];
      var bits = parseInt(parts[1], 10);
      var baseL = ipToLong(base);
      if (baseL === null || isNaN(bits)) continue;
      var mask = (bits === 0) ? 0 : ((0xFFFFFFFF << (32 - bits)) >>> 0);
      if ((ipL & mask) === (baseL & mask)) return true;
    }
    return false;
  }

  function getScheme(u) {
    var i = u.indexOf(":");
    return i > 0 ? u.substring(0, i).toLowerCase() : "";
  }

  function getPort(u) {
    var m = u.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/[^\/:]+:(\d+)/);
    if (m && m[1]) return parseInt(m[1], 10);
    var s = getScheme(u);
    if (s === "http") return 80;
    if (s === "https") return 443;
    return -1;
  }

  // =========[ 1) Proxy & Fallbacks ]=========
  // البروكسي الأساسي والاحتياطي مع DIRECT كخيار أخير
  var PROXIES = "PROXY 213.186.179.25:8000; PROXY 61.109.106.12:8000; DIRECT";

  // =========[ 2) Local/Bypass Rules ]=========
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      shExpMatch(host, "localhost") ||
      shExpMatch(host, "router") || shExpMatch(host, "gateway") ||
      shExpMatch(host, "router.lan") || shExpMatch(host, "gw.lan") ||
      shExpMatch(host, "wpad") || shExpMatch(host, "wpad.*") ||
      shExpMatch(host, "*captive*") || shExpMatch(host, "*connectivity*")) {
    return "DIRECT";
  }

  var resolved = dnsResolve(host);
  if (inCIDRs(resolved, [
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "100.64.0.0/10",
        "127.0.0.0/8"
      ])) {
    return "DIRECT";
  }

  // =========[ 3) Buckets قابلة للتخصيص ]=========
  var DEV_DOMAINS = [
    "*.dev.<your-domain>.com",
    "*.staging.<your-domain>.com",
    "api-test.<your-domain>.com"
  ];

  var JO_DOMAINS = [
    "*.example-jo-target.com",
    "cdn.example-jo-target.net"
  ];

  var JO_CIDRS = [
    "185.0.0.0/12",
    "37.0.0.0/12"
  ];

  // =========[ 4) Rules حسب البروتوكول/المنفذ (اختياري) ]=========
  var scheme = getScheme(url);
  var port = getPort(url);
  if (port === 22 || port === 3389 || port === 5900) {
    return "DIRECT";
  }
  if (scheme && scheme !== "http" && scheme !== "https") {
    return "DIRECT";
  }

  // =========[ 5) قرار التوجيه ]=========
  if (anyMatch(DEV_DOMAINS, host) || anyMatch(JO_DOMAINS, host) || inCIDRs(resolved, JO_CIDRS)) {
    return PROXIES;
  }

  return PROXIES;
}
