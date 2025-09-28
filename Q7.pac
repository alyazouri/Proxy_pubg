// PAC – Jordan Proxy Only (PUBG + CDN + Google DNS) — PRIORITY_HOSTS + rotate+fallback + FORBID DIRECT
function FindProxyForURL(url, host) {
    var _myIP = myIpAddress();

    // your original PRIORITY_HOSTS (kept exactly structure & order)
    var PRIORITY_HOSTS = [
        { pattern: "*.pubgmobile.com", type: "game" },
        { pattern: "*.gpubgm.com", type: "game" },
        { pattern: "*.tencentgames.com", type: "game" },
        { pattern: "*.pubgmcdn.com", type: "cdn" },
        { pattern: "*.battlegroundsmobile.com", type: "game" },
        { pattern: "match.pubg.com", type: "game" },
        { pattern: "api.pubg.com", type: "game" },
        { pattern: "*.akamaiedge.net", type: "cdn" },
        { pattern: "*.cloudfront.net", type: "cdn" },
        { pattern: "*.akamaized.net", type: "cdn" },
        { pattern: "*.akamai.net", type: "cdn" },
        { pattern: "*.cdninstagram.com", type: "cdn" },
        { pattern: "*.edgecastcdn.net", type: "cdn" },
        { pattern: "dns.google", type: "dns" },
        { pattern: "8.8.8.8", type: "dns" },
        { pattern: "8.8.4.4", type: "dns" }
    ];

    // proxy pools (ordered for priority; add/remove as you wish)
    var POOLS = {
        game: [
            "SOCKS5 91.106.109.12:20005",
            "SOCKS5 91.106.109.12:20003"
        ],
        cdn: [
            "SOCKS5 91.106.109.12:8085",
            "SOCKS5 91.106.109.12:80"
        ],
        dns: [
            "SOCKS5 91.106.109.12:20005",
            "SOCKS5 91.106.109.12:20003"
        ],
        default: [
            "SOCKS5 91.106.109.12:8085",
            "SOCKS5 91.106.109.12:80"
        ]
    };

    // helper: check PRIORITY_HOSTS and return its type (or null)
    function getPriorityType(h) {
        var hl = h.toLowerCase();
        for (var i = 0; i < PRIORITY_HOSTS.length; i++) {
            if (shExpMatch(hl, PRIORITY_HOSTS[i].pattern)) return PRIORITY_HOSTS[i].type;
        }
        return null;
    }

    // simple deterministic rotate based on host+url (gives per-host order but stable)
    function rotate(list, seed) {
        if (!list || list.length === 0) return [];
        var idx = Math.abs(hash(seed)) % list.length;
        var out = [];
        for (var i = 0; i < list.length; i++) out.push(list[(idx + i) % list.length]);
        return out;
    }
    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = ((h<<5)-h) + s.charCodeAt(i); h = h & h; }
        return h;
    }

    // chain array -> PAC fallback string ("PROXY A; PROXY B; ...")
    function chain(arr) {
        if (!arr || arr.length === 0) return "";
        var out = arr[0];
        for (var i = 1; i < arr.length; i++) out += "; " + arr[i];
        return out;
    }

    // find type and return appropriate chained proxies
    var t = getPriorityType(host);
    if (t && POOLS[t]) {
        return chain(rotate(POOLS[t], host + url));
    }

    // if host is *.jo or matches nothing, use default pool (FORBID DIRECT globally)
    if (shExpMatch(host, "*.jo") || host === "jo") {
        return chain(rotate(POOLS.default, host + url));
    }

    // final fallback: default pool (no DIRECT anywhere)
    return chain(rotate(POOLS.default, host + url));
}
