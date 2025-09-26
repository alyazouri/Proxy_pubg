// PAC – Jordan Proxy Only (PUBG + CDN) Strict Mode

function FindProxyForURL(url, host) {
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" },
        { ip: "188.247.64.0", mask: "255.255.192.0" },
        { ip: "95.141.32.0",  mask: "255.255.240.0" }
    ];

    var GAME_HOSTS = [
        "*.pubgmobile.com",
        "*.gpubgm.com",
        "*.tencentgames.com",
        "*.pubgmcdn.com",
        "*.battlegroundsmobile.com",
        "match.pubg.com",
        "api.pubg.com",
        "*.akamaiedge.net",
        "*.cloudfront.net"
    ];

    var CDN_HOSTS = [
        "*.akamaized.net",
        "*.akamai.net",
        "*.cdninstagram.com",
        "*.edgecastcdn.net",
        "*.cloudflare.com"
    ];

    var PROXY = "SOCKS5 91.106.109.12:14001";

    var PROXIES = [
        "SOCKS5 91.106.109.12:14001",
        "SOCKS5 91.106.109.12:20000",
        "SOCKS5 91.106.109.12:5000",
        "HTTPS 91.106.109.12:8443"
    ];
    PROXY = PROXIES.join("; ");

    function clientInJordan() {
        var ip = myIpAddress();
        for (var i = 0; i < jordanISPs.length; i++) {
            if (isInNet(ip, jordanISPs[i].ip, jordanISPs[i].mask)) return true;
        }
        return false;
    }

    function inList(h, list) {
        h = h.toLowerCase();
        for (var i = 0; i < list.length; i++) {
            if (shExpMatch(h, list[i])) return true;
        }
        return false;
    }

    if (isPlainHostName(host) || shExpMatch(host, "*.local") ||
        isInNet(myIpAddress(), "10.0.0.0", "255.0.0.0") ||
        isInNet(myIpAddress(), "172.16.0.0", "255.240.0.0") ||
        isInNet(myIpAddress(), "192.168.0.0", "255.255.0.0")) {
        return PROXY;
    }

    if (clientInJordan()) {
        if (inList(host, CDN_HOSTS)) return PROXY;
        if (inList(host, GAME_HOSTS)) return PROXY;
        if (shExpMatch(host, "*.jo") || host === "jo") return PROXY;
    }

    if (url.substring(0,5) === "http:" || url.substring(0,6) === "https:") {
        return PROXY;
    }

    return PROXY;
}
