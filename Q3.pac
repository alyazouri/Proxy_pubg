function FindProxyForURL(url, host) {
    var jordanISPs = [
        { ip: "213.139.33.0",  mask: "255.255.255.0" },
        { ip: "94.249.49.0",   mask: "255.255.255.0" },
        { ip: "46.32.100.0",   mask: "255.255.255.0" },
        { ip: "46.32.101.0",   mask: "255.255.255.0" },
        { ip: "188.247.64.0",  mask: "255.255.192.0" },
        { ip: "109.107.240.0", mask: "255.255.248.0" },
        { ip: "46.248.192.0",  mask: "255.255.224.0" },
        { ip: "37.17.192.0",   mask: "255.255.240.0" }
    ];

    var proxyIP = "91.106.109.12";
    var ports = [20000, 20001, 17000, 10491, 5000];

    var clientIP = myIpAddress();
    var onJordanISP = false;
    for (var i = 0; i < jordanISPs.length; i++) {
        if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) { onJordanISP = true; break; }
    }

    var idx = Math.floor((new Date()).getTime() / 1000) % ports.length;
    var chain = [];
    for (var k = 0; k < ports.length; k++) {
        var p = ports[(idx + k) % ports.length];
        chain.push("PROXY " + proxyIP + ":" + p);
    }

    return chain.join("; ");
}
