// PAC – Jordan Proxy Only (PUBG + CDN + Google DNS) — FORBID DIRECT GLOBALLY (LAN bypass kept)
function FindProxyForURL(url, host) {
    // cache client IP once
    var _myIP = myIpAddress();

    // Jordan ISPs IP ranges (can be expanded)
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" },
        { ip: "188.247.64.0", mask: "255.255.192.0" },
        { ip: "95.141.32.0",  mask: "255.255.240.0" }
    ];

    // Hosts lists
    var GAME_HOSTS = [
        "*.pubgmobile.com","*.gpubgm.com","*.tencentgames.com",
        "*.battlegroundsmobile.com","match.pubg.com","api.pubg.com"
    ];

    var CDN_HOSTS = [
        "*.pubgmcdn.com","*.akamaiedge.net","*.cloudfront.net",
        "*.akamaized.net","*.akamai.net","*.cloudflare.com","*.edgecastcdn.net"
    ];

    var DNS_HOSTS = [
        "dns.google", "8.8.8.8", "8.8.4.4"
    ];

    // Proxy pools (order = priority; rotation + fallback)
    var P_GAME = [
        "SOCKS5 91.106.109.12:20000",
        "SOCKS5 91.106.109.12:10010",
        "SOCKS5 91.106.109.12:10491",
        "SOCKS5 91.106.109.12:1080",
        "SOCKS5 109.107.240.101:8000"
    ];

    var P_CDN = [
        "SOCKS5 91.106.109.12:14001",
        "SOCKS5 91.106.109.12:8011",
        "SOCKS5 91.106.109.12:7086",
        "SOCKS5 91.106.109.12:9030",
        "SOCKS5 91.106.109.12:12235"
    ];

    var P_DEF = [
        "SOCKS5 91.106.109.12:14001",
        "SOCKS5 91.106.109.12:20000",
        "SOCKS5 109.107.240.101:8000"
    ];

    // ---------------- helper funcs ----------------
    function isLocalNetwork() {
        return isPlainHostName(host) ||
               shExpMatch(host, "*.local") ||
               isInNet(_myIP, "10.0.0.0", "255.0.0.0") ||
               isInNet(_myIP, "172.16.0.0", "255.240.0.0") ||
               isInNet(_myIP, "192.168.0.0", "255.255.0.0");
    }

    function isInList(h, list) {
        var hl = h.toLowerCase();
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            // if pattern contains wildcard use shExpMatch, else exact compare (for IPs like 8.8.8.8)
            if (p.indexOf("*") !== -1) {
                if (shExpMatch(hl, p)) return true;
            } else {
                if (hl === p.toLowerCase()) return true;
            }
        }
        return false;
    }

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

    function chain(list) {
        // build semicolon separated fallback chain
        if (!list || list.length === 0) return ""; // empty chain (should not happen)
        var out = "";
        for (var i = 0; i < list.length; i++) {
            if (i) out += "; ";
            out += list[i];
        }
        return out;
    }

    // ----------------- main logic -----------------
    // allow local network traffic direct (practical exception)
    if (isLocalNetwork()) {
        return "DIRECT";
    }

    // determine proxy chain based on host type
    if (isInList(host, GAME_HOSTS)) {
        return chain(rotate(P_GAME, host + url));
    }

    if (isInList(host, CDN_HOSTS)) {
        return chain(rotate(P_CDN, host + url));
    }

    if (isInList(host, DNS_HOSTS)) {
        // force DNS queries through proxy as well (no DIRECT)
        return chain(rotate(P_DEF, host + url));
    }

    // If client IP is in Jordan, prefer Jordan proxies (we already use them above).
    // But since DIRECT is forbidden, for any other host => use default proxy chain.
    return chain(rotate(P_DEF, host + url));
}
