function FindProxyForURL(url, host) {
    var jordanISPs = [
        { ip: "213.139.33.0",  mask: "255.255.255.0" }, // Orange
        { ip: "46.32.100.0",   mask: "255.255.255.0" }, // Zain
        { ip: "109.107.240.0", mask: "255.255.248.0" }  // Umniah
    ];

    var proxyIP = "91.106.109.12";
    var ports = [80, 5000];

    var clientIP = myIpAddress();
    var onJordanISP = false;
    for (var i = 0; i < jordanISPs.length; i++) {
        if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) {
            onJordanISP = true;
            break;
        }
    }

    if (onJordanISP) {
        var idx = Math.floor((new Date()).getTime() / 1000) % ports.length;
        var chain = [];
        for (var k = 0; k < ports.length; k++) {
            var p = ports[(idx + k) % ports.length];
            chain.push("PROXY " + proxyIP + ":" + p);
        }
        return chain.join("; ");
    }
}
