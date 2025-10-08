var LOBBY_POOL = [
    { proxy: "SOCKS5 91.106.109.12:5000", weight: 5, status: "active" },
    { proxy: "SOCKS5 91.106.109.12:5001", weight: 4, status: "active" }
];

var MATCH_POOL = [
    { proxy: "SOCKS5 91.106.109.12:20001", weight: 6, status: "active" },
    { proxy: "SOCKS5 91.106.109.12:20002", weight: 5, status: "active" }
];

var BLOCK = "PROXY 0.0.0.0:0; PROXY 127.0.0.1:0";

var LOBBY_RE = /^(.*\.)?(me-hl\.pubgmobile\.com|matchmaker\.pubg\.com)$/i;

var MATCH_RE = /^(.*\.)?(game\.pubgmobile\.com|api\.pubgmobile\.com|gpubgm\.com)$/i;

var GAME_PORTS = {
    "20001": 1,
    "20002": 1
};

var WS_PORTS = {
    "5000": 1,
    "5001": 1,
    "20001": 1,
    "20002": 1
};

var JO_V4 = [
    ["91.106.0.0",  "255.255.0.0" ],
    ["185.34.16.0", "255.255.252.0"]
];

var JO_V6 = [
    "2a13:a5c7:"
];

var DNS_CACHE = {};

var DNS_TTL_MS = 20000;

function nowMs() {
    return (new Date()).getTime();
}

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
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].status === "active") s += pool[i].weight;
    }
    return s;
}

function pickFromPool(pool, host, port) {
    var w   = Math.floor(nowMs() / 10000);
    var key = host + ":" + (port || "") + "|" + w;
    var h   = fnv1a(key);
    var t   = totalWeight(pool);
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

function dnsResolveCached(host) {
    var r = DNS_CACHE[host];
    if (r && (nowMs() - r.ts) < DNS_TTL_MS) return r.ip;
    var ip = null;
    try { ip = dnsResolve(host); } catch (e) { ip = null; }
    if (ip) DNS_CACHE[host] = { ip: ip, ts: nowMs() };
    return ip;
}

function isV4InRanges(ip, rs) {
    if (!ip || ip.indexOf(".") === -1) return false;
    for (var i = 0; i < rs.length; i++) {
        if (isInNet(ip, rs[i][0], rs[i][1])) return true;
    }
    return false;
}

function isV6InPrefixes(ip, pf) {
    if (!ip || ip.indexOf(":") === -1) return false;
    var x = ip.toLowerCase();
    for (var i = 0; i < pf.length; i++) {
        if (x.indexOf(pf[i]) === 0) return true;
    }
    return false;
}

function ipLooksJO(ip) {
    return isV4InRanges(ip, JO_V4) || isV6InPrefixes(ip, JO_V6);
}

function isLobby(host) {
    return LOBBY_RE.test(host);
}

function isMatch(host) {
    return MATCH_RE.test(host);
}

function isWS(url) {
    return url.indexOf("ws://") === 0 || url.indexOf("wss://") === 0;
}

function FindProxyForURL(url, host) {
    host = host.toLowerCase();
    var port = portFromUrl(url);
    var ip   = dnsResolveCached(host);

    if (!ipLooksJO(ip)) return BLOCK;

    if (isLobby(host)) return pickFromPool(LOBBY_POOL, host, port);

    if (isMatch(host) || (port && (port in GAME_PORTS))) return pickFromPool(MATCH_POOL, host, port);

    if (isWS(url) && port && (port in WS_PORTS)) {
        if (port === "5000" || port === "5001") return pickFromPool(LOBBY_POOL, host, port);
        if (port === "20001" || port === "20002") return pickFromPool(MATCH_POOL, host, port);
    }

    return BLOCK;
}
