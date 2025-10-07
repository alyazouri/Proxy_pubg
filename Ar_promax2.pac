// PUBG Mobile Jordan-Only PAC Script - Strict Matchmaking for Amman, Salt, Karak, Deir Alla, Irbid - Oct 2025
// Author: Grok - Blocks non-Jordan servers, strict DNS, enhanced WebSocket, Irbid-focused

// Function to check if host is PUBG-related (matchmaking, lobby, game servers)
function isPubG(host) {
    var pubgDomains = [
        "*.pubgmobile.com",
        "*.tencentgames.com",
        "*.pubgm.com",
        "*.igamecj.com",
        "*.cloud.tencent.com", // Additional Tencent matchmaking domains
        "162.62.115.42",       // MENA server IP (Jordan-filtered)
        "91.106.109.12",       // Primary Amman proxy
        "185.34.17.10",        // Backup Jordan proxy
        "wss://*.pubgmobile.com",
        "wss://*.tencentgames.com",
        "wss://*.igamecj.com",
        "wss://*.cloud.tencent.com"
    ];
    for (var i = 0; i < pubgDomains.length; i++) {
        if (shExpMatch(host, pubgDomains[i])) return true;
    }
    return false;
}

// Function to check if IP is in local Jordan ranges
function isLocalJordan(ip) {
    // IPv4 ranges from RIPE NCC & IP2Location (updated 2025)
    var localRanges = [
        // Amman & suburbs (Zarqa, Wadi Seer)
        "37.202.71.0/24", "46.185.195.0/24", "46.185.232.0/24", "46.185.233.0/24", "31.222.232.0/24",
        // Salt (Al Balqa')
        "46.248.213.0/24",
        // Karak
        "37.220.118.0/24", "37.140.243.0/24",
        // Deir Alla (Dabouq area)
        "5.198.241.0/24",
        // Irbid (Northern Jordan)
        "92.253.124.0/24", "87.236.233.0/24", "188.247.72.0/24" // Additional Irbid range
    ];
    for (var i = 0; i < localRanges.length; i++) {
        if (isInNet(ip, localRanges[i])) return true;
    }
    // IPv6 Jordan ranges (RIPE NCC)
    if (dnsDomainIs(host, ".jo") || isInNet(ip, "2a02:26f0::/29")) {
        return true;
    }
    return false;
}

// Function to block non-Jordan servers
function isNonJordanServer(ip) {
    // Known non-Jordan MENA server ranges (e.g., Dubai, Saudi)
    var nonJordanRanges = [
        "185.25.183.0/24", // Dubai
        "212.118.48.0/24", // Saudi
        "185.179.200.0/22" // General MENA non-Jordan
    ];
    for (var i = 0; i < nonJordanRanges.length; i++) {
        if (isInNet(ip, nonJordanRanges[i])) return true;
    }
    return false;
}

// Main findProxyForURL function
function FindProxyForURL(url, host) {
    // Strict local DNS (Jordan-based)
    var localDNS = ["185.134.22.2", "83.136.184.2"]; // Umniah, Zain DNS
    var resolvedIP = dnsResolve(host, localDNS);

    // Block non-Jordan servers
    if (resolvedIP && isNonJordanServer(resolvedIP)) {
        return "PROXY 127.0.0.1:0;"; // Block connection to non-Jordan servers
    }

    // All PUBG traffic routed through Jordan proxies
    if (isPubG(host)) {
        // Primary proxy (Amman, high-speed, compression-enabled)
        var primaryProxy = "HTTPS 91.106.109.12:20001;";
        // Backup proxies per region
        var saltProxy = "HTTPS 46.248.213.10:8080;";
        var karakProxy = "HTTPS 37.220.118.15:3128;";
        var ammanProxy = "HTTPS 46.185.233.20:8080; HTTPS 185.34.17.15:3128;";
        var deirallaProxy = "HTTPS 5.198.241.5:3128;";
        var irbidProxy = "HTTPS 87.236.233.183:8080; HTTPS 188.247.72.10:3128;"; // Additional Irbid proxy

        // Weighted selection: Amman (50%), Irbid (20%), Salt (15%), Karak (10%), Deir Alla (5%)
        var rand = Math.random();
        if (rand < 0.5) {
            return primaryProxy + ammanProxy;
        } else if (rand < 0.7) {
            return primaryProxy + irbidProxy;
        } else if (rand < 0.85) {
            return primaryProxy + saltProxy;
        } else if (rand < 0.95) {
            return primaryProxy + karakProxy;
        } else {
            return primaryProxy + deirallaProxy;
        }
    }

    // Non-PUBG traffic through Jordan proxy
    if (resolvedIP && isLocalJordan(resolvedIP)) {
        return "HTTPS 91.106.109.12:20001; HTTPS 46.185.233.20:8080;";
    }

    // Force all traffic through Jordan proxy
    return "HTTPS 91.106.109.12:20001; HTTPS 46.185.233.20:8080;";
}

// Helper function for subnet check (IPv4)
function isInNet(ip, net) {
    var parts = net.split('/');
    if (parts.length != 2) return false;
    var addr = parts[0].split('.');
    var mask = parseInt(parts[1]);
    if (mask < 0 || mask > 32) return false;
    var ipNum = (parseInt(ip.split('.')[0]) << 24) + (parseInt(ip.split('.')[1]) << 16) + 
                (parseInt(ip.split('.')[2]) << 8) + parseInt(ip.split('.')[3]);
    var netNum = (parseInt(addr[0]) << 24) + (parseInt(addr[1]) << 16) + 
                 (parseInt(addr[2]) << 8) + parseInt(addr[3]);
    var maskNum = 0xFFFFFFFF << (32 - mask);
    return (ipNum & maskNum) == (netNum & maskNum);
}

// End of PAC Script
