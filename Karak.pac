var LOBBY_POOL = [
    { proxy: "SOCKS5 91.106.109.12:5050", weight: 6, status: "active" },
    { proxy: "SOCKS5 91.106.109.12:5051", weight: 4, status: "active" }
];

var MATCH_POOL = [
    { proxy: "SOCKS5 91.106.109.12:20001", weight: 8, status: "active" },
    { proxy: "SOCKS5 91.106.109.12:20002", weight: 3, status: "active" }
];

var FALLBACK_CHAIN = "PROXY 91.106.109.12:20002; PROXY 91.106.109.12:5051";
var BLOCK = "PROXY 0.0.0.0:0; PROXY 127.0.0.1:0";

var LOBBY_RE = /^(.*\.)?(me-hl\.pubgmobile\.com|matchmaker\.pubg\.com|recruit\.pubgmobile\.com|pubgmobile\.live)$/i;
var MATCH_RE = /^(.*\.)?(game\.pubgmobile\.com|match\.pubg\.com|api\.pubgmobile\.com|gpubgm\.com|pubgmcdn\.com|igamecj\.com|tencentgames\.com|tencentcloud\.com|tencent\.com)$/i;

var GAME_PORTS = { "20001":1, "20002":1 };
var WS_PORTS = { "5050":1, "5051":1, "20001":1, "20002":1 };

var JO_V4 = [
    ["46.248.192.0", "255.255.224.0"],
    ["95.172.192.0", "255.255.224.0"],
    ["212.34.11.0",  "255.255.255.0"],
    ["212.34.13.0",  "255.255.255.0"],
    ["86.108.10.0",  "255.255.255.0"]
];

var JO_V6 = [ "2a13:a5c7:" ];

var DNS_CACHE = {};
var STICKY = {};
var DNS_TTL_MS = 5000;
var STICKY_TTL_MS = 20000;

function nowMs() { return (new Date()).getTime(); }

function portFromUrl(u) {
    var m = u.match(/:(\d+)(?:[\/]|$)/);
    return m ? m[1] : null;
}

function fnv1a(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul ? Math.imul(h, 16777619) >>> 0 : ((h * 16777619) & 0xffffffff) >>> 0;
    }
    return h >>> 0;
}

function totalWeight(pool) {
    var s = 0;
    for (var i = 0; i < pool.length; i++) if (pool[i].status === "active") s += pool[i].weight;
    return s;
}

function pickFromPool(pool, host, port) {
    var window = Math.floor(nowMs() / 10000);
    var key = host + ":" + (port || "") + "|" + window;
    var h = fnv1a(key);
    var t = totalWeight(pool);
    if (t <= 0) return pool[0].proxy;
    var v = h % t;
    var s = 0;
    for (var i = 0; i < pool.length; i++) {
        var o = pool[i];
        if (o.status !== "active") continue;
        s += o.weight;
        if (v < s) {
            var a = o.proxy;
            var b = pool[(i + 1) % pool.length].proxy;
            return a + "; " + b;
        }
    }
    return pool[0].proxy;
}

function setSticky(h, p, chain) {
    var k = h + "|" + (p || "");
    STICKY[k] = { chain: chain, ts: nowMs() };
}

function getSticky(h, p) {
    var k = h + "|" + (p || "");
    var e = STICKY[k];
    if (e && (nowMs() - e.ts) < STICKY_TTL_MS) return e.chain;
    return null;
}

function dnsResolveCached(host) {
    var r = DNS_CACHE[host];
    if (r && (nowMs() - r.ts) < DNS_TTL_MS) return r.ip;
    var ip = null;
    try { ip = dnsResolve(host); } catch (e) { ip = null; }
    if (ip) DNS_CACHE[host] = { ip: ip, ts: nowMs() };
    return ip;
}

function isV4InRanges(ip, ranges) {
    if (!ip || ip.indexOf(".") === -1) return false;
    for (var i = 0; i < ranges.length; i++) if (isInNet(ip, ranges[i][0], ranges[i][1])) return true;
    return false;
}

function isV6InPrefixes(ip, prefixes) {
    if (!ip || ip.indexOf(":") === -1) return false;
    var low = ip.toLowerCase();
    for (var i = 0; i < prefixes.length; i++) if (low.indexOf(prefixes[i]) === 0) return true;
    return false;
}

function ipLooksKarak(ip) {
    return isV4InRanges(ip, JO_V4) || isV6InPrefixes(ip, JO_V6);
}

function isLobby(host) { return LOBBY_RE.test(host); }
function isMatch(host) { return MATCH_RE.test(host); }
function isWS(url) { return url.indexOf("ws://") === 0 || url.indexOf("wss://") === 0; }

function hardKarakGate(url, host) {
    var port = portFromUrl(url);
    var ip = dnsResolveCached(host);
    if (!ip) return BLOCK;
    if (!ipLooksKarak(ip)) return BLOCK;
    if (! (isMatch(host) || isLobby(host) || (port && (port in GAME_PORTS)) || (isWS(url) && port && (port in WS_PORTS)) ) ) return BLOCK;
    var sticky = getSticky(host, port);
    if (sticky) return sticky;
    var chain;
    if (isLobby(host) || (isWS(url) && (port === "5050" || port === "5051"))) chain = pickFromPool(LOBBY_POOL, host, port);
    else chain = pickFromPool(MATCH_POOL, host, port);
    setSticky(host, port, chain);
    return chain;
}

function FindProxyForURL(url, host) {
    host = host.toLowerCase();
    try {
        return hardKarakGate(url, host);
    } catch (e) {
        return FALLBACK_CHAIN;
    }
}
