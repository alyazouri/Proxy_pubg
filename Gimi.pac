function FindProxyForURL(url, host) {
    // دالة لفحص IP داخلي (شبكة محلية أو مخصص)
    function isLocalIP(ip) {
        var parts = ip.split('.');
        if (parts.length !== 4) return false;

        var first = parseInt(parts[0], 10);
        var second = parseInt(parts[1], 10);
        var third = parseInt(parts[2], 10);
        var fourth = parseInt(parts[3], 10);

        // الشبكات الخاصة
        if (first === 10) return true; // 10.0.0.0/8
        if (first === 192 && second === 168) return true; // 192.168.0.0/16
        if (first === 172 && (second >= 16 && second <= 31)) return true; // 172.16.0.0 - 172.31.255.255

        // النطاق المخصص: 176.29.31.1 - 176.29.31.254
        if (first === 176 && second === 29 && third === 31 && fourth >= 1 && fourth <= 254) {
            return true;
        }

        return false;
    }

    var resolved_ip = dnsResolve(host);

    // قائمة البورتات (مرتبة حسب الأداء الأفضل)
    var proxyList = "PROXY 91.106.109.12:15038; PROXY 91.106.109.12:15040; PROXY 91.106.109.12:15042; PROXY 91.106.109.12:15044; PROXY 91.106.109.12:15001; PROXY 91.106.109.12:15006";

    // إذا فشل الـ DNS → مباشرة على البروكسي
    if (resolved_ip === null) {
        return proxyList;
    }

    // لو IP داخلي أو من الرينج → يمر عبر البروكسي
    if (isLocalIP(resolved_ip)) {
        return proxyList;
    }

    // نطاقات PUBG Mobile الموسعة
    if (dnsDomainIs(host, ".igamecj.com") ||
        dnsDomainIs(host, ".proximabeta.com") ||
        dnsDomainIs(host, ".tencentgamingbuddy.com") ||
        dnsDomainIs(host, ".pubgmobile.com") ||
        dnsDomainIs(host, ".qq.com") ||
        dnsDomainIs(host, ".qcloud.com") ||
        dnsDomainIs(host, ".tencent.com") ||
        dnsDomainIs(host, ".gcloudsdk.com") ||
        dnsDomainIs(host, ".helpshift.com") ||
        dnsDomainIs(host, ".facebook.com") ||
        dnsDomainIs(host, ".googleapis.com") ||
        dnsDomainIs(host, ".playfabapi.com")) {
        return proxyList;
    }

    // الافتراضي: كل شيء بروكسي
    return proxyList;
}
