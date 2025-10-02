// Proxy Auto-Config (PAC) Script لـ PUBG Mobile مع تحسينات أردنية
// دعم للـ Desktop (Chrome/Firefox) و Mobile (استخدم في apps زي Drony أو Proxifier)
// للتحديث: غيّر الـ ports في vars أدناه حسب proxies الخاصة بك
// اختبر في Network tab: DevTools > Network > Filter by domain

function FindProxyForURL(url, host) {
    // نطاقات IP الأردنية المحدثة (من RIPE NCC - تغطي Zain, Orange, Umniah, وأكثر)
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" },   // عام
        { ip: "188.247.64.0", mask: "255.255.192.0" },   // عام
        { ip: "95.141.32.0",  mask: "255.255.240.0" },   // عام
        { ip: "2a13:a5c7::",  mask: "ffff:ffff:ffff:ffff::" }, // IPv6 عام
        { ip: "94.127.0.0", mask: "255.255.128.0" },     // Zain Jordan
        { ip: "94.127.128.0", mask: "255.255.192.0" },   // Zain إضافي
        { ip: "78.100.0.0", mask: "255.255.0.0" },       // Orange Jordan
        { ip: "37.107.0.0", mask: "255.255.0.0" },       // Umniah Jordan
        { ip: "5.0.32.0", mask: "255.255.240.0" },       // Zain إضافي
        { ip: "37.108.0.0", mask: "255.255.192.0" }      // Umniah إضافي
    ];

    // Proxies الموزعة على منافذ (غيّر IPs/ports حسب setup الخاص بك)
    var lobbyProxy     = "SOCKS5 91.106.109.12:5000";   // للـ Lobby و Matchmaking
    var classicProxy   = "SOCKS5 91.106.109.12:5001";   // للمباريات الكلاسيكية
    var searchProxy    = "SOCKS5 91.106.109.12:5002";   // للتجنيد والبحث/Queue
    var defaultPubgProxy = "SOCKS5 91.106.109.12:5000"; // افتراضي لـ PUBG
    var jordanProxy    = "SOCKS5 91.106.109.12:20001";  // للـ domains الأردنية (.jo)

    // قائمة domains PUBG الموسعة (شمل CDNs و APIs الجديدة)
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
        ".pubgmobile.live",
        ".akamaized.net",
        ".akamai.net",
        ".cloudfront.net",
        ".edgecastcdn.net",
        ".cloudflare.com",
        ".krakengames.com",      // Global servers
        ".tencentfigures.com",   // Analytics
        ".awsstatic.com",        // AWS assets
        ".googleusercontent.com" // بعض الـ assets
    ];

    var clientIP = myIpAddress();

    // تحقق إذا الـ client أردني (مع error handling لـ IPv6)
    var isJordanianISP = false;
    try {
        for (var i = 0; i < jordanISPs.length; i++) {
            if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) {
                isJordanianISP = true;
                break;  // أسرع: توقف عند أول match
            }
        }
    } catch (e) {
        // Fallback إذا خطأ في isInNet (مثل IPv6 غير مدعوم)
        isJordanianISP = false;  // أو استخدم geolocation خارجي إذا أمكن
    }

    if (isJordanianISP) {
        // تحقق إذا domain PUBG (مع wildcard للأسرع)
        if (shExpMatch(host, "*.pubg*") || shExpMatch(host, "*.tencent*") || 
            shExpMatch(host, "*.battlegroundsmobile*") || 
            pubgDomains.some(function(domain) { return dnsDomainIs(host, domain); })) {  // some() للأداء
            // توزيع دقيق بناءً على URL path أو host (مع regex أقوى)
            if (shExpMatch(url, "*lobby*") || shExpMatch(url, "*matchmaking*") || 
                shExpMatch(url, "*api/v1/lobby*") || dnsDomainIs(host, ".pubgmobileapi.com")) {
                // Logging خفيف للـ debug (شيل في الإنتاج)
                // alert("Proxy: Lobby for " + host);
                return lobbyProxy;
            } else if (shExpMatch(url, "*classic*") || shExpMatch(url, "*mode=classic*") || 
                       shExpMatch(url, "*api/v1/classic*")) {
                // alert("Proxy: Classic for " + host);
                return classicProxy;
            } else if (shExpMatch(url, "*search*") || shExpMatch(url, "*recruit*") || 
                       shExpMatch(url, "*queue*") || shExpMatch(url, "*api/v1/search*")) {
                // alert("Proxy: Search for " + host);
                return searchProxy;
            } else {
                // Fallback مع check resolvability
                if (isResolvable(host)) {
                    // alert("Proxy: Default PUBG for " + host);
                    return defaultPubgProxy;
                } else {
                    return "DIRECT";  // إذا ما ينحل، روح مباشرة
                }
            }
        }
        
        // للـ domains الأردنية (.jo)
        if (isJordanianDomain(host)) {
            // alert("Proxy: Jordan for " + host);
            return jordanProxy;
        }
    }

    // Fallback عام: Jordan proxy أو DIRECT للآخرين
    if (isResolvable(host)) {
        return jordanProxy;
    } else {
        return "DIRECT";
    }
}

function isJordanianDomain(host) {
    var tld = host.split(".").pop();
    return tld === "jo";
}
