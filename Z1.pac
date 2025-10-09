function FindProxyForURL(url, host) {

    const pubgDomains = /^(gpubgm\.com|pubgmobile\.com|tencent\.com|api\.gubgm\.com|cloud\.gubgm\.com)$/i;
    const classicPaths = /^(\/match\/classic|\/lobby\/classic|\/game\/classic)$/i;

    // Current time and network context
    const now = new Date();
    const isOffPeak = (now.getUTCHours() + 3 >= 0 && now.getUTCHours() + 3 < 6); // 00:00-06:00
    const isWiFi = typeof navigator !== 'undefined' && navigator.connection && navigator.connection.type === "wifi";

    // Accurate port selection
    let primaryPort = "1080"; // Best UDP-supported port from open list
    let backupPort = isOffPeak ? "1080" : "443"; // Fallback based on time

    // Validate traffic as Classic match
    if (pubgDomains.test(host) && classicPaths.test(url)) {
        return `SOCKS5 91.106.109.12:${primaryPort}; PROXY 91.106.109.12:${backupPort}`;
    }

    // Fallback for general PUBG traffic
    if (pubgDomains.test(host) && /\/(match|team|search|recruit|lobby|battle|game)/i.test(url)) {
        return `SOCKS5 91.106.109.12:${backupPort}; PROXY 91.106.109.12:1443`;
    }

    // No DIRECT fallback
    return `SOCKS5 91.106.109.12:${backupPort}; PROXY 91.106.109.12:1443`;
}
