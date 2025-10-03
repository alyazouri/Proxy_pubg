function FindProxyForURL(url, host) {
  var h = host.toLowerCase();

  // ------- إعدادات البروكسي -------
  var LOBBY_PROXIES = "SOCKS5 91.106.109.12:5000";
  var MATCH_PROXIES = "SOCKS5 91.106.109.12:20001";
  var JO_PROXIES    = "SOCKS5 91.106.109.12:5001";

  // ------- كاش بسيط لتسريع المطابقة -------
  if (typeof __PAC_CACHE === "undefined") { __PAC_CACHE = {}; }
  if (__PAC_CACHE[h]) { return __PAC_CACHE[h]; }

  // ------- قوائم مطابقة سريعة (Exact Domains) -------
  var LOBBY_EXACT = {
    "pubg.com":1,"match.pubg.com":1,"api.pubg.com":1,"hl.pubg.com":1,"matchmaker.pubg.com":1,
    "pubgmobile.com":1,"gpubgm.com":1,"igamecj.com":1,"tencentgames.com":1,"tencent.com":1,
    "pubgmobileapi.com":1,"pubgmobile.live":1,"pubgmobile.ky3d.com":1,"me-hl.pubgmobile.com":1,
    "me.pubg.com":1
  };

  var MATCH_EXACT = {
    "pubgmcdn.com":1,"tencentcloud.com":1,"tencentcloudapi.com":1,"akamaized.net":1,"akamai.net":1,
    "cloudfront.net":1,"cloudflare.com":1,"edgecastcdn.net":1,"awsstatic.com":1,"googleusercontent.com":1,
    "pubgmobile.com.akadns.net":1,"pubgmobile.me.akadns.net":1,"asia-east.pubgmobile.com":1,
    "kr-a.akamai.net":1,"dub1-pubgmcdn.ks3-cn-beijing.ksyun.com":1,"sg1-pubgmcdn.ks3-cn-beijing.ksyun.com",
    "me-hl.pubgmobile.com":1,"me.pubg.com":1
  };

  // ------- أنماط وايلدكارد فقط لما نحتاج -------
  var LOBBY_WILDCARDS = [
    "*.gpubgm.com","*.igamecj.com","*.tencentgames.com","*.tencent.com","*.pubgmobile.com"
  ];
  var MATCH_WILDCARDS = [
    "*.pubgmcdn.com","*.tencentcloud.com","*.tencentcloudapi.com","*.akamaized.net","*.akamai.net",
    "*.cloudfront.net","*.cloudflare.com","*.edgecastcdn.net","*.googleusercontent.com","*.ksyun.com",
    "*.jo.pubgmcdn.com"
  ];

  // ------- دوال مساعدة سريعة -------
  function endsWithDotDomain(h, d){ return h===d || dnsDomainIs(h,"."+d); }
  function anyWildcard(list, h){
    for (var i=0;i<list.length;i++){ if (shExpMatch(h, list[i])) return true; }
    return false;
  }
  function isJordanTLD(h){
    var p = h.split(".");
    if (p.length < 2) return true;
    return p[p.length-1] === "jo";
  }

  // ------- منطق التوجيه -------
  if (isJordanTLD(h)) { __PAC_CACHE[h] = JO_PROXIES; return JO_PROXIES; }

  // نطاقات الشرق الأوسط (me- / .me.)
  if (h.indexOf("me-") === 0 || h.indexOf(".me.") !== -1) {
    var both = LOBBY_PROXIES + "; " + MATCH_PROXIES;
    __PAC_CACHE[h] = both; return both;
  }

  if (LOBBY_EXACT[h]) { __PAC_CACHE[h] = LOBBY_PROXIES; return LOBBY_PROXIES; }
  if (MATCH_EXACT[h]) { __PAC_CACHE[h] = MATCH_PROXIES; return MATCH_PROXIES; }

  // fallback على الوايلدكارد فقط إذا ما طابقت الـ exact
  if (anyWildcard(LOBBY_WILDCARDS, h)) { __PAC_CACHE[h] = LOBBY_PROXIES; return LOBBY_PROXIES; }
  if (anyWildcard(MATCH_WILDCARDS, h)) { __PAC_CACHE[h] = MATCH_PROXIES; return MATCH_PROXIES; }

  // افتراضي
  __PAC_CACHE[h] = MATCH_PROXIES;
  return MATCH_PROXIES;
}
