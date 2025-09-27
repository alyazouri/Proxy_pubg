function FindProxyForURL(url, host) {
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" },
        { ip: "188.247.64.0", mask: "255.255.192.0" },
        { ip: "95.141.32.0", mask: "255.255.240.0" }
    ];

    var clientIP = myIpAddress();
    for (var i = 0; i < jordanISPs.length; i++) {
        if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) {
            if (dnsDomainIs(host, ".pubg.com") ||
                dnsDomainIs(host, ".pubgmobile.com") ||
                dnsDomainIs(host, ".gpubgm.com") ||
                dnsDomainIs(host, ".tencent.com") ||
                dnsDomainIs(host, ".tencentgames.com") ||
                dnsDomainIs(host, ".tencentcloud.com") ||
                dnsDomainIs(host, ".pubgmcdn.com") ||
                dnsDomainIs(host, ".igamecj.com") ||
                dnsDomainIs(host, ".battlegroundsmobile.com") ||
                dnsDomainIs(host, ".pubgmobileapi.com") ||
                dnsDomainIs(host, ".pubgmobile.live")) {
                return "SOCKS5 91.106.109.12:14001";
            }
            if (shExpMatch(host, "*.jo") || host == "jo") {
                return "SOCKS5 91.106.109.12:5000";
            }
        }
    }
}
