function FindProxyForURL(url, host) {
    var ip = "91.106.109.12";

    var proxies = [
        "PROXY " + ip + ":10012",
        "PROXY " + ip + ":20000",
        "PROXY " + ip + ":20001",
        "PROXY " + ip + ":20002"
    ];

    return proxies.join(";");
}
