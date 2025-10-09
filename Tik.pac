var PROXY = "PROXY 51.38.232.101:443";

var TIKTOK_HOSTS = [
  "tiktok.com",
  "*.tiktok.com",
  "muscdn.com",
  "*.muscdn.com",
  "v16m.tiktokcdn.com",
  "p16-tiktokcdn.com",
  "*.p16-tiktokcdn.com",
  "ibytedtos.com",
  "*.ibytedtos.com",
  "snssdk.com",
  "*.snssdk.com",
  "amplify-edge.net",
  "*.akamaized.net",
  "web.tiktok.com"
];

function matchAnyPattern(host, patterns) {
  host = host.toLowerCase();
  for (var i = 0; i < patterns.length; i++) {
    var p = patterns[i].toLowerCase();
    if (p.indexOf("*.") === 0) {
      var q = p.substring(2);
      if (host === q || host.endsWith("." + q)) return true;
    } else {
      if (host === p) return true;
    }
  }
  return false;
}

function FindProxyForURL(url, host) {
  if (matchAnyPattern(host, TIKTOK_HOSTS)) return PROXY;
  return PROXY;
}
