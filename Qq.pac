function FindProxyForURL(url, host) {
  var LOBBY_PROXIES = "SOCKS5 91.106.109.12:5000";
  var MATCH_PROXIES = "SOCKS5 91.106.109.12:20001";
  var JO_PROXIES    = "SOCKS5 91.106.109.12:20001";

  var LOBBY_DOMAINS = [
    "pubg.com",
    "match.pubg.com",
    "api.pubg.com",
    "hl.pubg.com",
    "matchmaker.pubg.com",
    "pubgmobile.com",
    "gpubgm.com",
    "igamecj.com",
    "tencentgames.com",
    "tencent.com",
    "pubgmobileapi.com",
    "pubgmobile.live",
    "pubgmobile.ky3d.com",
    "me-hl.pubgmobile.com",
    "me.pubg.com"
  ];

  var MATCH_DOMAINS = [
    "pubgmcdn.com",
    "tencentcloud.com",
    "tencentcloudapi.com",
    "akamaized.net",
    "akamai.net",
    "cloudfront.net",
    "cloudflare.com",
    "edgecastcdn.net",
    "awsstatic.com",
    "googleusercontent.com",
    "pubgmobile.com.akadns.net",
    "pubgmobile.me.akadns.net",
    "asia-east.pubgmobile.com",
    "kr-a.akamai.net",
    "dub1-pubgmcdn.ks3-cn-beijing.ksyun.com",
    "sg1-pubgmcdn.ks3-cn-beijing.ksyun.com",
    "*.jo.pubgmcdn.com",
    "me-hl.pubgmobile.com",
    "me.pubg.com"
  ];

  var h = host.toLowerCase();

  if (isJordanianDomain(h)) return JO_PROXIES;
  if (h.indexOf("me-") === 0 || h.indexOf(".me.") !== -1) return LOBBY_PROXIES + "; " + MATCH_PROXIES;
  if (hostMatches(h, LOBBY_DOMAINS)) return LOBBY_PROXIES;
  if (hostMatches(h, MATCH_DOMAINS)) return MATCH_PROXIES;
  return MATCH_PROXIES;
}

function hostMatches(host, list) {
  for (var i = 0; i < list.length; i++) {
    var s = list[i].toLowerCase();
    if (s.indexOf("*") !== -1) {
      if (shExpMatch(host, s)) return true;
    } else {
      if (host === s || dnsDomainIs(host, "." + s)) return true;
    }
  }
  return false;
}

function isJordanianDomain(host) {
  var parts = host.split(".");
  if (parts.length < 2) return false;
  return parts[parts.length - 1] === "jo";
}
