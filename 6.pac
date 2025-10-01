// PAC – Jordan Proxy Only (PUBG + CDN + DNS) — Optimized for 5G Gaming
function FindProxyForURL(url, host) {
    // Advanced cache with dual TTL for gaming and CDN
    var cache = {};
    var cacheSize = 0;
    var MAX_CACHE_SIZE = 500;
    var GAME_TTL = 30000; // 30 seconds for game/geo
    var CDN_TTL = 120000; // 120 seconds for CDN
    var cacheTimestamps = {};

    // Prioritized PRIORITY_HOSTS for 5G
    var PRIORITY_HOSTS = [
        { pattern: "*.pubgmobile.com", type: "game_5g" },
        { pattern: "match.pubg.com", type: "game_5g" },
        { pattern: "api.pubg.com", type: "game_5g" },
        { pattern: "*.pubg.com/geo", type: "geo" },
        { pattern: "*.battlegroundsmobile.com", type: "game_5g" },
        { pattern: "*.gpubgm.com", type: "game_5g" },
        { pattern: "*.tencentgames.com", type: "game_5g" },
        { pattern: "*.tencentgames.com/geo", type: "geo" },
        { pattern: "*.krafton.com", type: "game_5g" },
        { pattern: "*.tencent.com", type: "game_5g" },
        { pattern: "*.pubgmcdn.com", type: "cdn_5g" },
        { pattern: "*.cloud.tencent.com", type: "cdn_5g" },
        { pattern: "*.amazonaws.com", type: "cdn_5g" },
        { pattern: "*.akamaized.net", type: "cdn_5g" },
        { pattern: "*.cloudfront.net", type: "cdn_5g" },
        { pattern: "cdn.club.gpubgm.com", type: "cdn_5g" },
        { pattern: "8.8.8.8", type: "dns" },
        { pattern: "8.8.4.4", type: "dns" },
        { pattern: "1.1.1.1", type: "dns" },
        { pattern: "1.0.0.1", type: "dns" },
        { pattern: "dns.google", type: "dns" },
        { pattern: "*.dns", type: "dns" },
        { pattern: "*.cloudflare-dns.com", type: "dns" }
    ];

    var POOLS = {
        game_5g: ["SOCKS5 91.106.109.12:20001"], // Optimized for 5G gaming (QUIC/UDP)
        cdn_5g: ["SOCKS5 91.106.109.12:8085"], // Optimized for CDN with QUIC
        dns: ["SOCKS5 91.106.109.12:20001"], // Optimized for DNS (DoH/DoQ)
        geo: ["SOCKS5 91.106.109.12:20005"], // Fastest for geo
        default: ["SOCKS5 91.106.109.12:20005"] // Fastest fallback
    };

    function getPriorityType(h) {
        var now = Date.now();
        if (cache[h] && cacheTimestamps[h]) {
            var ttl = cache[h] === "cdn_5g" ? CDN_TTL : GAME_TTL;
            if (now - cacheTimestamps[h] < ttl) {
                return cache[h];
            }
        }

        var hl = h.toLowerCase();
        for (var i = 0; i < PRIORITY_HOSTS.length; i++) {
            if (shExpMatch(hl, PRIORITY_HOSTS[i].pattern)) {
                if (cacheSize < MAX_CACHE_SIZE) {
                    cache[h] = PRIORITY_HOSTS[i].type;
                    cacheTimestamps[h] = now;
                    cacheSize++;
                } else {
                    cache = {};
                    cacheTimestamps = {};
                    cacheSize = 0;
                    cache[h] = PRIORITY_HOSTS[i].type;
                    cacheTimestamps[h] = now;
                    cacheSize++;
                }
                return PRIORITY_HOSTS[i].type;
            }
        }
        if (cacheSize < MAX_CACHE_SIZE) {
            cache[h] = null;
            cacheTimestamps[h] = now;
            cacheSize++;
        }
        return null;
    }

    // Direct proxy selection for 5G
    function getProxy(t) {
        var myIP = myIpAddress();
        if ((t === "cdn_5g" || t === "game_5g") && myIP.startsWith("91.106.")) {
            return POOLS[t][0]; // Ensure QUIC/UDP for 5G
        }
        return POOLS[t] ? POOLS[t][0] : POOLS.default[0];
    }

    var t = getPriorityType(host);
    return getProxy(t);
}
