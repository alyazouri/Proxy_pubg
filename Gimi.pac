function FindProxyForURL(url, host) {
    function ipToLong(ip) {
        var parts = ip.split('.');
        return (parseInt(parts[0]) << 24 >>> 0) +
               (parseInt(parts[1]) << 16) +
               (parseInt(parts[2]) << 8) +
               parseInt(parts[3]);
    }

    function isJordanianIPv4(ip) {
        var ipLong = ipToLong(ip);

        var ranges = [
            ["2.59.52.0",   22],
            ["5.45.128.0",  20],
            ["5.198.240.0", 21],
            ["5.199.184.0", 22],
            ["37.17.192.0", 20],
            ["37.44.32.0",  21],
            ["37.75.144.0", 21],
            ["37.123.64.0", 19],
            ["37.152.0.0",  21],
            ["37.202.64.0", 18],
            ["37.220.112.0",20],
            ["46.23.112.0", 20],
            ["46.32.96.0",  19],
            ["46.185.128.0",17],
            ["46.248.192.0",19],
            ["62.72.160.0", 19],
            ["77.245.0.0",  20],
            ["79.134.128.0",19],
            ["79.173.192.0",18],
            ["80.90.160.0", 20],
            ["81.21.0.0",   20],
            ["81.28.112.0", 20],
            ["82.212.64.0", 18],
            ["84.18.32.0",  19],
            ["84.18.64.0",  19],
            ["84.252.106.0",24],
            ["176.29.0.0",  16],
            ["188.247.64.0",18],
            ["185.107.80.0",22]
        ];

        for (var i = 0; i < ranges.length; i++) {
            var baseIp = ipToLong(ranges[i][0]);
            var mask = 0xFFFFFFFF << (32 - ranges[i][1]) >>> 0;
            if ((ipLong & mask) === (baseIp & mask)) {
                return true;
            }
        }
        return false;
    }

    function isJordanianIPv6(ip6) {
        // نعتبر الـ IPv6 كسلسلة (string) ونفحص البادئة (prefix)
        var prefixes = [
            "2001:32c0:",
            "2a00:18d0:",
            "2a00:18d8:",
            "2a00:4620:",
            "2a00:76e0:",
            "2a00:b860:",
            "2a00:caa0:",
            "2a01:1d0:",
            "2a01:9700:",
            "2a01:e240:",
            "2a01:ee40:",
            "2a02:9c0:",
            "2a02:2558:",
            "2a02:25d8:",
            "2a02:5b60:",
            "2a02:c040:",
            "2a02:e680:",
            "2a02:f0c0:",
            "2a03:6b00:",
            "2a03:6d00:",
            "2a03:b640:",
            "2a04:6200:",
            "2a05:74c0:",
            "2a05:7500:",
            "2a06:9bc0:",
            "2a06:bd80:",
            "2a07:140:",
            "2a0a:2740:",
            "2a0c:39c0:",
            "2a0d:cf40:",
            "2a10:1100:",
            "2a10:9740:",
            "2a10:d800:",
            "2a11:d180:",
            "2a13:1f00:",
            "2a13:5c00:",
            "2a13:8d40:",
            "2a14:1a40:",
            "2a14:2840:"
        ];

        for (var i = 0; i < prefixes.length; i++) {
            if (ip6.toLowerCase().indexOf(prefixes[i]) === 0) {
                return true;
            }
        }
        return false;
    }

    var resolved_ip = dnsResolve(host);

    var proxyList = "PROXY 91.106.109.12:15038; PROXY 91.106.109.12:15040; PROXY 91.106.109.12:15042; PROXY 91.106.109.12:15044; PROXY 91.106.109.12:15001; PROXY 91.106.109.12:15006";

    if (resolved_ip === null) {
        return proxyList;
    }

    // فحص IPv4 أو IPv6
    if (resolved_ip.indexOf(":") === -1) {
        if (isJordanianIPv4(resolved_ip)) {
            return proxyList;
        }
    } else {
        if (isJordanianIPv6(resolved_ip)) {
            return proxyList;
        }
    }

    // نطاقات PUBG Mobile الموسعة
    if (dnsDomainIs(host, ".igamecj.com") ||
        dnsDomainIs(host, ".proximabeta.com") ||
        dnsDomainIs(host, ".tencentgamingbuddy.com") ||
        dnsDomainIs(host, ".pubgmobile.com") ||
        dnsDomainIs(host, ".qq.com") ||
        dnsDomainIs(host, ".qcloud.com") ||
        dnsDomainIs(host, ".tencent.com") ||
        dnsDomainIs(host, ".gcloudsdk.com") ||
        dnsDomainIs(host, ".helpshift.com") ||
        dnsDomainIs(host, ".facebook.com") ||
        dnsDomainIs(host, ".googleapis.com") ||
        dnsDomainIs(host, ".playfabapi.com")) {
        return proxyList;
    }

    return proxyList;
}
