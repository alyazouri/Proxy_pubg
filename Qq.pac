function FindProxyForURL(url, host) {
    // قائمة نطاقات IP الأردنية (Jordan ISPs) - للكشف عن الموقع
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" },   // Orange Jordan
        { ip: "188.247.64.0", mask: "255.255.192.0" },  // Zain Jordan
        { ip: "95.141.32.0",  mask: "255.255.240.0" },  // Umniah
        { ip: "2a13:a5c7::",  mask: "ffff:ffff:ffff:ffff::" }  // IPv6 للأردن
    ];

    // بروكسيات SOCKS5 - استخدم pubgProxy لـPUBG، وjordanProxy للمواقع الأردنية
    var pubgProxy   = "SOCKS5 91.106.109.12:5000";  // لتحسين PUBG Global/KR (أوروبي/آسيوي)
    var jordanProxy = "SOCKS5 91.106.109.12:20001"; // للمواقع المحلية الأردنية

    // قائمة مجالات PUBG Mobile (عالمية وكورية) + CDN لتقليل اللاج
    var pubgDomains = [
        // مجالات PUBG الرئيسية
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
        
        // CDN وخدمات إضافية للتحميل والمباريات
        ".akamaized.net",
        ".akamai.net",
        ".cloudfront.net",
        ".edgecastcdn.net",
        ".cloudflare.com",
        ".awsstatic.com",      // AWS للكورية
        ".googleusercontent.com"  // Google Cloud للتحديثات
    ];

    // الحصول على IP العميل
    var clientIP = myIpAddress();

    // التحقق إذا كان العميل في الأردن
    for (var i = 0; i < jordanISPs.length; i++) {
        if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) {
            // إذا كان host متعلق بـPUBG، استخدم pubgProxy لتحسين المطابقة
            for (var j = 0; j < pubgDomains.length; j++) {
                if (dnsDomainIs(host, pubgDomains[j])) {
                    return pubgProxy;
                }
            }
            // إذا كان host أردنياً (مثل .jo)، استخدم jordanProxy للوصول المحلي
            if (isJordanianDomain(host)) {
                return jordanProxy;
            }
        }
    }

    // الافتراضي: استخدم jordanProxy لكل شيء آخر في الأردن
    return jordanProxy;
}

// دالة مساعدة: التحقق من المجالات الأردنية (TLD .jo أو فرعيات)
function isJordanianDomain(host) {
    var parts = host.split(".");
    var tld = parts[parts.length - 1];
    var sld = parts.length > 1 ? parts[parts.length - 2] : "";  // للفرعيات مثل co.jo
    return tld === "jo" || (sld === "co" && tld === "jo") || (sld === "org" && tld === "jo");
}
