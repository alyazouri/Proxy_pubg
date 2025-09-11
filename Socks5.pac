function FindProxyForURL(url, host) {
    // استخدم SOCKS proxy على IP 91.106.109.12 ومنفذ 20001
    return "SOCKS 91.106.109.12:20001; SOCKS 91.106.109.12:443; DIRECT";
}
