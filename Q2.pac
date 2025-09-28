function FindProxyForURL(url, host) {
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" },
        { ip: "188.247.64.0", mask: "255.255.192.0" },
        { ip: "95.141.32.0",  mask: "255.255.240.0" }
    ];

    var pubgProxy   = "SOCKS5 91.106.109.12:14001";
    var jordanProxy = "SOCKS5 91.106.109.12:5000";

    var pubgDomains = [
        ".pubg.com",
        ".pubgmobile.com",
        ".gpubgm.com",
        ".tencent.com",
        ".tencentgames.com",
        ".tencentcloud.com",
        ".pubgmcdn.com",
        ".igamecj.com",
        ".battlegroundsmobile.com",
        ".pubgmobileapi.com",
        ".pubgmobile.live"
    ];

    var clientIP = myIpAddress();

    for (var i = 0; i < jordanISPs.length; i++) {
        if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) {
            for (var j = 0; j < pubgDomains.length; j++) {
                if (dnsDomainIs(host, pubgDomains[j])) {
                    return pubgProxy;
                }
            }
            if (isJordanianDomain(host)) {
                return jordanProxy;
            }
        }
    }

    return jordanProxy; // لا يوجد DIRECT
}

function isJordanianDomain(host) {
    var tld = host.split(".").pop();
    return tld === "jo";
}
