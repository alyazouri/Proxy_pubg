// PAC – Jordan: Highest-quality Aggressive Matchmaking
// - Primary: 91.106.109.11 (SOCKS5 20001,20002)
// - Backup:  91.106.109.12 (SOCKS5 20001,20002)
// - No DIRECT anywhere (always proxy)
// - Deterministic rotate per-host, prefer reachable proxies first
(function(){ if (typeof __JO_PROBE_CACHE === "undefined") __JO_PROBE_CACHE = {}; })();

function FindProxyForURL(url, host) {
    // ---------------- CONFIG ----------------
    var PRIMARY = { ip: "91.106.109.11", socks: [20001,20002] };
    var BACKUPS = [{ ip: "91.106.109.12", socks: [20001,20002] }];

    var PRIORITY_HOSTS = [
        "match.pubg.com","api.pubg.com","*.pubgmobile.com","*.gpubgm.com","*.tencentgames.com",
        "*.pubgmcdn.com","*.battlegroundsmobile.com","*.igamecj.com","*.pubgmobileapi.com",
        "*.akamaiedge.net","*.cloudfront.net","*.akamaized.net","*.akamai.net"
    ];

    // فقط الأردن والشرق الأوسط
    var REGION_PATTERNS = [
        // الشرق الأوسط وMENA
        "*.me.*","*.mena.*","*.middleeast.*",

        // الأردن
        "*.jo.*","*.jordan.*"
    ];

    var JORDAN_RANGES = [
        { ip: "91.106.109.0", mask: "255.255.255.0" },
        { ip: "109.107.240.0", mask: "255.255.248.0" },
        { ip: "149.200.0.0", mask: "255.255.0.0" },
        { ip: "185.34.16.0", mask: "255.255.252.0" },
        { ip: "188.247.64.0", mask: "255.255.192.0" }
    ];

    // ---------------- HELPERS ----------------
    function makeSocksList(entry) {
        var out = [];
        for (var i = 0; i < entry.socks.length; i++)
            out.push("SOCKS5 " + entry.ip + ":" + entry.socks[i]);
        return out;
    }
    function poolFor(entry) { return makeSocksList(entry); }
    var PRIMARY_POOL = poolFor(PRIMARY);
    var BACKUP_POOL = [];
    for (var b = 0; b < BACKUPS.length; b++)
        BACKUP_POOL = BACKUP_POOL.concat(poolFor(BACKUPS[b]));
    var DEFAULT_POOL = PRIMARY_POOL.concat(BACKUP_POOL);

    function chain(arr) {
        if (!arr || arr.length === 0) return "";
        var s = arr[0];
        for (var i = 1; i < arr.length; i++) s += "; " + arr[i];
        return s;
    }
    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h = h & h;
        }
        return Math.abs(h);
    }
    function rotate(list, seed) {
        if (!list || list.length === 0) return [];
        var idx = hash(seed) % list.length;
        var out = [];
        for (var i = 0; i < list.length; i++)
            out.push(list[(idx + i) % list.length]);
        return out;
    }
    function hostMatchesList(h, arr) {
        var hl = h.toLowerCase();
        for (var i = 0; i < arr.length; i++)
            if (shExpMatch(hl, arr[i])) return true;
        return false;
    }
    function ipInRanges(ip, ranges) {
        if (!ip) return false;
        for (var i = 0; i < ranges.length; i++) {
            if (isInNet(ip, ranges[i].ip, ranges[i].mask)) return true;
        }
        return false;
    }
    function destIP(h) {
        try { return dnsResolve(h); }
        catch (e) { return null; }
    }
    function proxyHost(proxyString) {
        var parts = proxyString.split(/\s+/);
        if (parts.length < 2) return null;
        var hostport = parts[1];
        return hostport.split(":")[0];
    }
    function isProxyReachable(proxyString) {
        try {
            var h = proxyHost(proxyString);
            if (!h) return false;
            if (__JO_PROBE_CACHE && __JO_PROBE_CACHE.hasOwnProperty(h))
                return __JO_PROBE_CACHE[h];
            var r = dnsResolve(h);
            var ok = (r !== null && r !== "");
            if (!ok && (/^\d+\.\d+\.\d+\.\d+$/.test(h) || /^[0-9a-f:]+$/i.test(h))) ok = true;
            try { __JO_PROBE_CACHE[h] = ok; } catch (e) {}
            return ok;
        } catch (e) { return true; }
    }
    function buildChain(pool, seed) {
        var rotated = rotate(pool, seed);
        var reachable = [], unreachable = [];
        for (var i = 0; i < rotated.length; i++) {
            var p = rotated[i];
            if (isProxyReachable(p)) reachable.push(p);
            else unreachable.push(p);
        }
        return chain(reachable.concat(unreachable));
    }

    // ---------------- DECISION ----------------
    var seed = host + "|" + url;
    var clientIP = myIpAddress();

    // إذا كان العميل داخل الأردن، استخدم البروكسي الأردني
    if (ipInRanges(clientIP, JORDAN_RANGES)) {
        if (hostMatchesList(host, PRIORITY_HOSTS)) return buildChain(PRIMARY_POOL, seed);
        if (hostMatchesList(host, REGION_PATTERNS)) return buildChain(PRIMARY_POOL, seed);
        return buildChain(DEFAULT_POOL, seed);
    }

    // خارج الأردن: استخدم البروكسي الأردني لمجالات PUBG وللشرق الأوسط/الأردن
    if (hostMatchesList(host, PRIORITY_HOSTS)) return buildChain(PRIMARY_POOL, seed);
    if (hostMatchesList(host, REGION_PATTERNS)) return buildChain(PRIMARY_POOL, seed);

    // افتراضي: استخدم بروكسي الأردن دائماً
    return buildChain(DEFAULT_POOL, seed);
}
