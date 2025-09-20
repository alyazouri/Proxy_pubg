// ======================================================================
// PAC – PUBG Mobile محسّن: IPv6 أولوية + توزيع ثابت + Jordan-first
// ملاحظة: PAC يوجّه HTTP/HTTPS فقط؛ UDP لا يمر عبر PAC.
// ======================================================================

// ======================= CONFIG =======================
var PROXIES_CFG = [
    // رئيسي IPv6
    { ip: "2a13:a5c7:25ff:7000", socksPorts: [20001,20002,1080,8085,10491], httpPorts:[3128,8080] },
    // رئيسي IPv4
    { ip: "91.106.109.12",       socksPorts: [20001,20002,1080,8085,10491], httpPorts:[3128,8080] },
    // احتياطي IPv6
    { ip: "2a01:4f8:c17:2e3f::1", socksPorts: [20001,20002,1080,8085,10491,8000], httpPorts:[3128,8080,8000] },
    // احتياطي IPv4
    { ip: "213.186.179.25",      socksPorts: [20001,20002,1080,8085,10491,8000], httpPorts:[3128,8080,8000] }
];

// سياسات التوجيه
var FORCE_ALL     = true;   // true = كل شيء عبر البروكسيات
var BLOCK_IR      = true;   // حظر نطاقات .ir
var FORBID_DIRECT = true;   // true = لا تضيف DIRECT كخيار أخير

// ======================= DOMAINS =======================
// نطاقات مهمة فقط لو استعملت FORCE_ALL=false
var GAME_DOMAINS = [
    // Tencent & PUBG
    "igamecj.com","igamepubg.com","pubgmobile.com","tencentgames.com",
    "proximabeta.com","qcloudcdn.com","tencentyun.com","qcloud.com",
    "gtimg.com","game.qq.com","gameloop.com","proximabeta.net",
    "cdn-ota.qq.com","cdngame.tencentyun.com",
    // Google / Firebase (خدمات مساندة)
    "googleapis.com","gstatic.com","googleusercontent.com",
    "play.googleapis.com","firebaseinstallations.googleapis.com",
    "mtalk.google.com","android.clients.google.com",
    // Apple / iCloud (iOS خدمات)
    "apple.com","icloud.com","gamecenter.apple.com","gamekit.apple.com","apps.apple.com",
    // X / Twitter (اختياري)
    "x.com","twitter.com","api.x.com","api.twitter.com","abs.twimg.com","pbs.twimg.com","t.co"
];

var KEYWORDS = ["pubg","tencent","igame","proximabeta","qcloud","tencentyun","gcloud","gameloop","match","squad","party","team","rank"];

// ======================= HELPERS =======================

function isIPv6Literal(h){ return h && indexOf(h, ":") !== -1; } // استخدام indexOf PAC-safe
function bracketIPv6(ip){ return isIPv6Literal(ip) ? "[" + ip + "]" : ip; }

function proxyTokensFor(ip, socksPorts, httpPorts){
    var host = bracketIPv6(ip);
    var out = [];
    // أولوية: SOCKS5 → SOCKS → HTTP
    for (var i=0; i<socksPorts.length; i++){
        out.push("SOCKS5 " + host + ":" + socksPorts[i]);
        out.push("SOCKS "  + host + ":" + socksPorts[i]);
    }
    for (var j=0; j<httpPorts.length; j++){
        out.push("PROXY " + host + ":" + httpPorts[j]);
    }
    return out;
}

// بناء قائمة البروكسيات المُسطّحة بالترتيب
var PROXY_LIST = (function(){
    var list = [];
    for (var i=0; i<PROXIES_CFG.length; i++){
        var p = PROXIES_CFG[i];
        var toks = proxyTokensFor(p.ip, p.socksPorts || [], p.httpPorts || []);
        for (var k=0; k<toks.length; k++) list.push(toks[k]);
    }
    return list;
})();

function isPlainIP(host){
    // IPv4 بسيط أو سداسي عشري IPv6 (مبسّط)
    return (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host));
}

function isPrivateOrLocal(host){
    if (isPlainHostName(host)) return true;

    // IPv6 link-local / loopback
    if (isIPv6Literal(host)){
        var h = toLowerCase(host);
        if (h === "::1" || shExpMatch(h, "fe80::*")) return true;
        // ملاحظة: dnsResolve لا يرجع IPv6 دائماً، فنكتفي بهذا الفحص
        return false;
    }

    var ip = null;
    try { ip = dnsResolve(host); } catch(e) {}
    if (!ip) return false;

    if (isInNet(ip, "127.0.0.0",  "255.0.0.0"))   return true;
    if (isInNet(ip, "10.0.0.0",   "255.0.0.0"))   return true;
    if (isInNet(ip, "172.16.0.0", "255.240.0.0")) return true;
    if (isInNet(ip, "192.168.0.0","255.255.255.0")) return true;
    if (isInNet(ip, "169.254.0.0","255.255.0.0")) return true; // APIPA
    if (isInNet(ip, "100.64.0.0", "255.192.0.0")) return true; // CGNAT
    return false;
}

function hostInList(host, list){
    host = toLowerCase(host);
    for (var i=0; i<list.length; i++){
        var d = list[i];
        if (host === d || shExpMatch(host, "*." + d)) return true;
    }
    return false;
}

function hasKeyword(s){
    s = (s || "");
    s = toLowerCase(s);
    for (var i=0; i<KEYWORDS.length; i++){
        if (indexOf(s, KEYWORDS[i]) !== -1) return true;
    }
    return false;
}

function isIranTLD(host){
    var h = toLowerCase(host);
    return (shExpMatch(h, "*.ir") || shExpMatch(h, "*.ir.") || h.endsWith(".ir"));
}

// djb2 hash (ثابت لكل host) لتوزيع بداية السلسلة
function hashStr(s){
    var h = 5381;
    for (var i=0; i<length(s); i++){
        h = ((h << 5) + h) + charCodeAt(s, i);
        // ملاحظة: PAC JavaScript محدود؛ نتجنب العمليات الكبيرة
    }
    // تحويل إلى موجب
    if (h < 0) h = -h;
    return h;
}

// توزيع مستقر: يحدد نقطة البداية حسب host
function buildProxyChain(host){
    var startIdx = 0;
    if (PROXY_LIST.length > 0){
        startIdx = hashStr(host) % PROXY_LIST.length;
    }
    var parts = [];
    for (var i=0; i<PROXY_LIST.length; i++){
        var idx = (startIdx + i) % PROXY_LIST.length;
        parts.push(PROXY_LIST[idx]);
    }
    if (!FORBID_DIRECT) parts.push("DIRECT");
    return parts.join("; ");
}

// ======================= MAIN =======================
function FindProxyForURL(url, host){
    // استثناءات داخلية ومحلية
    if (isPrivateOrLocal(host)) return "DIRECT";

    // حظر نطاقات .ir
    if (BLOCK_IR && isIranTLD(host)) return "PROXY 127.0.0.1:9";

    // بناء سلسلة البروكسي مع أولوية IPv6 داخل PROXY_LIST
    var proxyChain = buildProxyChain(host);

    // FORCE_ALL: كل شيء عبر البروكسي
    if (FORCE_ALL) return proxyChain;

    // غير FORCE_ALL: وجّه فقط الدومينات/الكلمات المفتاحية
    if (isPlainIP(host)) return proxyChain;
    if (hostInList(host, GAME_DOMAINS) || hasKeyword(host) || hasKeyword(url)) return proxyChain;

    // الباقي:
    return FORBID_DIRECT ? proxyChain : "DIRECT";
}

// ======================= PAC-safe helpers =======================
// بعض بيئات PAC لا تدعم كل String.prototype، لذلك نعرّف بدائل آمنة.
function toLowerCase(s){ return (""+s).toLowerCase(); }
function length(s){ return (""+s).length; }
function indexOf(s, sub){ return (""+s).indexOf(sub); }
function charCodeAt(s, i){ return (""+s).charCodeAt(i); }
