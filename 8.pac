function FindProxyForURL(url, host) {
  var PROXY_JO_MATCH   = "SOCKS5 91.106.109.12:20001";
  var PROXY_JO_LOBBY   = "SOCKS5 91.106.109.12:14001";
  var PROXY_JO_RECRUIT = "SOCKS5 91.106.109.12:20005";

  var ALL_PROXIES = [
    PROXY_JO_MATCH,
    PROXY_JO_LOBBY,
    PROXY_JO_RECRUIT
  ];

  // --- دومينات اللعبة (أساسية) ---
  var GAME_HOSTS = [
    "*.pubgmobile.com",
    "*.gpubgm.com",
    "*.battlegroundsmobile.com",
    "match.pubg.com",
    "api.pubg.com",
    "*.pubgmcdn.com",
    "*.igamecj.com"
  ];

  // --- دومينات أردنية فقط ---
  var JO_HOSTS = [
    "*.jo",
    "*.local.jo",
    "*jordan*",
    "*.gamingserver1.jo",
    "*.gamingserver2.jo"
  ];

  function matchAny(h, arr) {
    if (!h || !arr) return false;
    for (var i = 0; i < arr.length; i++) {
      if (shExpMatch(h, arr[i])) return true;
    }
    return false;
  }

  function hashKey(k) {
    var h = 0;
    for (var i = 0; i < k.length; i++) {
      h = (h << 5) - h + k.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function seq(list, key) {
    if (!list || list.length === 0) return PROXY_JO_MATCH;
    var start = hashKey(key || "") % list.length;
    return list[start];
  }

  // دومينات أردنية
  if (matchAny(host, JO_HOSTS)) {
    if (shExpMatch(host, "*.gamingserver1.jo")) return PROXY_JO_LOBBY;
    if (shExpMatch(host, "*.gamingserver2.jo")) return PROXY_JO_RECRUIT;
    return PROXY_JO_MATCH;
  }

  // دومينات اللعبة
  if (matchAny(host, GAME_HOSTS)) return PROXY_JO_MATCH;

  // أي شيء آخر → يوزع بين البروكسيات الأردنية
  return seq(ALL_PROXIES, host);
}
