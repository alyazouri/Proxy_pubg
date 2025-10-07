// PUBG Mobile Local Jordan PAC Script - Optimized for Amman, Salt, Karak, Deir Alla (Dabouq) - Oct 2025
// Author: Grok - No DIRECT fallback, all traffic through local proxies

// Function to check if host is PUBG-related (matchmaking, game servers)
function isPubG(host) {
    var pubgDomains = [
        "*.pubgmobile.com",
        "*.tencentgames.com",
        "*.pubgm.com",
        "162.62.115.42",  // Known MENA server IP
        "91.106.109.12",  // Local Jordan proxy for stability
        "185.34.17.10"    // Backup Jordan proxy
    ];
    for (var i = 0; i < pubgDomains.length; i++) {
        if (shExpMatch(host, pubgDomains[i])) return true;
    }
    return false;
}

// Function to check if IP is in local Jordan ranges (Amman, Salt, Karak, Deir Alla areas)
function isLocalJordan(ip) {
    // IPv4 ranges from RIPE NCC & IP2Location for specified regions (updated 2025)
    var localRanges = [
        // Amman & suburbs (Zarqa, Wadi Seer)
        "37.202.71.0/24", "46.185.195.0/24", "46.185.232.0/24", "46.185.233.0/24", "31.222.232.0/24",
        // Salt (Al Balqa')
        "46.248.213.0/24",
        // Karak
        "37.220.118.0/24", "37.140.243.0/24",
        // Deir Alla (Dabouq area, Balqa')
        "5.198.241.0/24"
    ];
    for (var i = 0; i < localRanges.length; i++) {
        if (isInNet(ip, localRanges[i])) return true;
    }
    // IPv6 Jordan ranges (RIPE NCC 2a02:26f0::/29 for local stability)
    if (dnsDomainIs(host, ".jo") || isInNet(ip, "2a02:26f0::/29")) {
        return true;
    }
    return false;
}

// Main findProxyForURL function
function FindProxyForURL(url, host) {
    // If it's PUBG traffic, route through local Jordan proxy for matchmaking
    if (isPubG(host)) {
        // Primary local proxy (Amman-based for low ping)
        var primaryProxy = "PROXY 91.106.109.12:20001;";
        // Backup proxies from specific regions
        var saltProxy = "PROXY 46.248.213.10:8080;";
        var karakProxy = "PROXY 37.220.118.15:3128;";
        var ammanProxy = "PROXY 46.185.233.20:8080;";
        var deirallaProxy = "PROXY 5.198.241.5:3128;";

        // Weighted selection: Prefer Amman (70%), then others
        var rand = Math.random();
        if (rand < 0.7) {
            return primaryProxy + ammanProxy;
        } else if (rand < 0.85) {
            return primaryProxy + saltProxy;
        } else if (rand < 0.95) {
            return primaryProxy + karakProxy;
        } else {
            return primaryProxy + deirallaProxy;
        }
    }

    // For general traffic, route through a default local proxy (no DIRECT)
    var resolvedIP = dnsResolve(host);
    if (resolvedIP && isLocalJordan(resolvedIP)) {
        return "PROXY 91.106.109.12:20001; PROXY 46.185.233.20:8080;"; // Default to Amman proxies
    }

    // Default to primary proxy for all other traffic (no DIRECT)
    return "PROXY 91.106.109.12:20001; PROXY 46.185.233.20:8080;";
}

// Helper function for subnet check (IPv4)
function isInNet(ip, net) {
    var parts = net.split('/');
    if (parts.length != 2) return false;
    var addr = parts[0].split('.');
    var mask = parseInt(parts[1]);
    if (mask < 0 || mask > 32) return false;
    var ipNum = (parseInt(ip.split('.')[0]) << 24) + (parseInt(ip.split('.')[1]) << 16) + (parseInt(ip.split('.')[2]) << 8) + parseInt(ip.split('.')[3]);
    var netNum = (parseInt(addr[0]) << 24) + (parseInt(addr[1]) << 16) + (parseInt(addr[2]) << 8) + parseInt(addr[3]);
    var maskNum = 0xFFFFFFFF << (32 - mask);
    return (ipNum & maskNum) == (netNum & maskNum);
}

// End of PAC Script
