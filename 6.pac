// PAC – Jordan Proxy Only (PUBG + CDN + DNS) — QUIC Optimizations for CDN
function FindProxyForURL(url, host) {
    // Advanced cache with TTL for CDN/QUIC efficiency
    var cache = {};
    var cacheSize = 0;
    var MAX_CACHE_SIZE = 500;
    var CACHE_TTL = 120000; // 120 seconds for QUIC/CDN requests
    var cacheTimestamps = {};

    // Prioritized PRIORITY_HOSTS with QUIC-enabled CDN patterns
    var PRIORITY_HOSTS = [
        { pattern: "*.pubgmobile.com", type: "game" },
        { pattern: "match.pubg.com", type: "game" },
        { pattern: "api.pubg.com", type: "game" },
        { pattern: "*.pubg.com/geo", type: "geo" },
        { pattern: "*.battlegroundsmobile.com", type: "game" },
        { pattern: "*.gpubgm.com", type: "game" },
        { pattern: "*.tencentgames.com", type: "game" },
        { pattern: "*.tencentgames.com/geo", type: "geo" },
        { pattern: "*.krafton.com", type: "game" },
        { pattern: "*.tencent.com", type: "game" },
        { pattern: "*.pubgmcdn.com", type: "cdn_quic" }, // PUBG CDN with QUIC
        { pattern: "*.cloud.tencent.com", type: "cdn_quic" }, // Tencent Cloud CDN (QUIC support)
        { pattern: "*.amazonaws.com", type: "cdn_quic" }, // Amazon CloudFront (QUIC)
        { pattern: "*.akamaized.net", type: "cdn_quic" }, // Akamai (QUIC)
        { pattern: "*.cloudfront.net", type: "cdn_quic" }, // CloudFront (QUIC)
        { pattern: "*.akamai.net", type: "cdn_quic" }, // Akamai (QUIC)
        { pattern: "cdn.club.gpubgm.com", type: "cdn_quic" }, // Specific PUBG CDN (QUIC)
        { pattern: "8.8.8.8", type: "dns" },
        { pattern: "8.8.4.4", type: "dns" },
        { pattern: "1.1.1.1", type: "dns" },
        { pattern: "1.0.0.1", type: "dns" },
        { pattern: "dns.google", type: "dns" },
        { pattern: "*.dns", type: "dns" },
        { pattern: "*.cloudflare-dns.com", type: "dns" }
    ];

    var POOLS = {
        game: ["SOCKS5 91.106.109.12:20005"],
        cdn_quic: ["SOCKS5 91.106.109.12:8085"], // Optimized for QUIC/UDP in CDN
        dns: ["SOCKS5 91.106.109.12:20001"],
        geo: ["SOCKS5 91.106.109.12:20005"],
        default: ["SOCKS5 91.106.109.12:20005"]
    };

    function getPriorityType(h) {
        var now = Date.now();
        if (cache[h] && cacheTimestamps[h] && (now - cacheTimestamps[h] < CACHE_TTL)) {
            return cache[h];
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

    // Direct proxy with QUIC check (avoid loops)
    function getProxy(t) {
        var myIP = myIpAddress();
        if (t === "cdn_quic" && myIP.startsWith("91.106.")) {
            return POOLS.cdn_quic[0]; // Enable QUIC via UDP-supporting port
        }
        return POOLS[t] ? POOLS[t][0] : POOLS.default[0];
    }

    var t = getPriorityType(host);
    return getProxy(t);
}
