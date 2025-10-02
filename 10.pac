// PAC — Jordan-Only PUBG Routing (No DIRECT) — host-based, IPv4-safe
function FindProxyForURL(url, host) {
    // --- CONFIG: IPv4 only ---
    var lobbyProxy        = "SOCKS5 91.106.109.12:5000";
    var classicProxy      = "SOCKS5 91.106.109.12:5001";
    var searchProxy       = "SOCKS5 91.106.109.12:5002";
    var defaultPubgProxy  = "SOCKS5 91.106.109.12:5000";
    var jordanProxy       = "SOCKS5 91.106.109.12:20001";

    // قسّم حسب المضيف قدر الإمكان بدل path
    // لو عندك هوستات مخصصة للـ lobby/queue ضيفها هنا
    var LOBBY_HOSTS = [
        ".pubgmobileapi.com",
        ".match.pubg.com"
    ];
    var SEARCH_HOSTS = [
        ".recruit.pubg.com",
        ".queue.pubg.com"
    ];
    var CLASSIC_HOSTS = [
        ".gpubgm.com",
        ".battlegroundsmobile.com"
    ];

    // مجموعة PUBG الأساسية (كلها تروح على defaultPubgProxy لو ما طابقت أعلاه)
    var PUBG_HOSTS = [
        ".pubg.com",
        ".pubgmobile.com",
        ".gpubgm.com",
        ".tencentgames.com",
        ".tencentcloud.com",
        ".pubgmcdn.com",
        ".igamecj.com",
        ".battlegroundsmobile.com"
    ];

    // CDNs الضرورية للعبة فقط (خفّض التوسّع)
    var GAME_CDNS = [
        ".akamaized.net",
        ".akamai.net",
        ".cloudfront.net",
        ".cloudflare.com"
    ];

    function isIP(v){ return /^[0-9.]+$/.test(v) || v.indexOf(":") !== -1; }
    function endsWithAny(h, arr){
        for (var i=0;i<arr.length;i++){ if (dnsDomainIs(h, arr[i])) return true; }
        return false;
    }
    function isJO(h){
        if (!h || isIP(h)) return false;
        var p = h.split(".");
        return p.length && p[p.length-1].toLowerCase() === "jo";
    }

    // --- MAIN: ترتيب أولوية واضح ---
    // 1) تخصيصات أدق (لوبي/بحث/كلاسك)
    if (endsWithAny(host, LOBBY_HOSTS))  return lobbyProxy;
    if (endsWithAny(host, SEARCH_HOSTS)) return searchProxy;
    if (endsWithAny(host, CLASSIC_HOSTS))return classicProxy;

    // 2) نطاقات PUBG العامة + CDNs الخاصة بها
    if (endsWithAny(host, PUBG_HOSTS))   return defaultPubgProxy;
    if (endsWithAny(host, GAME_CDNS))    return defaultPubgProxy;

    // 3) دومينات أردنية عامة
    if (isJO(host))                      return jordanProxy;

    // 4) افتراضي صارم: كل شيء عبر الأردن (بدون DIRECT)
    return jordanProxy;
}
