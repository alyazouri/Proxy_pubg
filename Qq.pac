function FindProxyForURL(url, host) {
  var LOBBY_PROXIES = "SOCKS5 91.106.109.12:5000; SOCKS5 91.106.109.12:20001";
  var MATCH_PROXIES = "SOCKS5 91.106.109.12:20001; SOCKS5 91.106.109.12:5000";
  var JO_PROXIES    = "SOCKS5 91.106.109.12:20001; SOCKS5 91.106.109.12:5000";

  var LOBBY_DOMAINS = [
    ".pubg.com",
    "match.pubg.com",
    "api.pubg.com",
    ".pubgmobile.com",
    ".gpubgm.com",
    ".tencentgames.com",
    ".tencent.com",
    ".igamecj.com",
    ".pubgmobileapi.com",
    ".pubgmobile.live"
  ];

  var MATCH_DOMAINS = [
    ".pubgmcdn.com",
    ".tencentcloud.com",
    ".akamaized.net",
    ".akamai.net",
    ".cloudfront.net",
    ".edgecastcdn.net",
    ".cloudflare.com",
    ".awsstatic.com",
    ".googleusercontent.com"
  ];

  if (hostMatches(host, LOBBY_DOMAINS)) return LOBBY_PROXIES;
  if (hostMatches(host, MATCH_DOMAINS)) return MATCH_PROXIES;
  if (isJordanianDomain(host))          return JO_PROXIES;
  return JO_PROXIES;
}

function hostMatches(host, suffixes) {
  for (var i = 0; i < suffixes.length; i++) {
    if (dnsDomainIs(host, suffixes[i])) return true;
  }
  return false;
}

function isJordanianDomain(host) {
  var p = host.split(".");
  var n = p.length;
  if (n < 2) return false;
  var tld = p[n-1];
  var sld = p[n-2];
  if (tld === "jo") return true;
  if ((sld === "co" || sld === "org" || sld === "gov" || sld === "edu" || sld === "net") && tld === "jo") return true;
  return false;
}
