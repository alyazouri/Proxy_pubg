function FindProxyForURL(url, host) {
  var MATCH_PROXIES = [
    "SOCKS5 91.106.109.12:20001"
  ];

  var LOBBY_PROXIES = [
    "SOCKS5 91.106.109.12:14001"
  ];

  var RECRUIT_PROXIES = [
    "SOCKS5 91.106.109.12:20005"
  ];

  var GLOBAL_PROXIES = [
    "SOCKS5 91.106.109.12:5000"
  ];

  var GAME = [
    "*.pubgmobile.com",
    "*.gpubgm.com",
    "*.battlegroundsmobile.com",
    "*.pubg.com",
    "match.pubg.com",
    "api.pubg.com",
    "*.pubgmobileapi.com",
    "*.pubgmobile.live",
    "esports.pubgmobile.com",
    "*.pubgmcn.com",
    "*.igamecj.com"
  ];

  var TENCENT = [
    "*.tencentgames.com",
    "*.tencentcloud.com",
    "cloud.tencent.com",
    "*.qcloudcdn.com",
    "*.qq.com",
    "gamecommunity.qq.com",
    "sns.qq.com",
    "*.qqcdn.com"
  ];

  var CDN = [
    "*.pubgmcdn.com",
    "*.akamaiedge.net",
    "*.akamai.net",
    "*.akamaized.net",
    "*.edgesuite.net",
    "*.edgekey.net",
    "*.cloudfront.net",
    "*.cloudflare.com",
    "*.llnwd.net",
    "*.alicdn.com",
    "*.fastly.net",
    "*.qiniudn.com",
    "*.cdn.tencent-cloud.com"
  ];

  var ANTI_LEAK = [
    "ipinfo.io",
    "ifconfig.me",
    "api.ipify.org",
    "checkip.amazonaws.com",
    "*.stun.*",
    "stun.l.google.com",
    "stun1.l.google.com",
    "global.stun.twilio.com"
  ];

  function hashKey(k) {
    var h = 0;
    for (var i = 0; i < k.length; i++) {
      h = (h << 5) - h + k.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function seq(list, key) {
    if (!list || list.length === 0) return "PROXY 127.0.0.1:9";
    var start = hashKey(key) % list.length;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      out.push(list[(start + i) % list.length]);
    }
    return out.join("; ");
  }

  function matchAny(h, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (shExpMatch(h, arr[i])) return true;
    }
    return false;
  }

  if (matchAny(host, GAME))    return seq(MATCH_PROXIES, host);
  if (matchAny(host, CDN))     return seq(LOBBY_PROXIES, host);
  if (matchAny(host, TENCENT)) return seq(RECRUIT_PROXIES, host);
  if (matchAny(host, ANTI_LEAK)) return seq(MATCH_PROXIES, host);

  return seq(GLOBAL_PROXIES, host);
}
