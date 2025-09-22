function FindProxyForURL(url, host) {
    // عنوان IP للسيرفر الأردني
    var ip = "91.106.109.12";

    // قائمة البورتات المحسنة لـ PUBG Mobile
    var ports = [
        1080,   // SOCKS5: يدعم UDP، الأولوية القصوى لـ PUBG Mobile
        443,    // HTTPS: خيار احتياطي أساسي
        8080,   // HTTP-alt: خيار احتياطي
        8085,
        20001   // microsan: خيار احتياطي (الإبقاء عليه بناءً على تعليقك)
    ];

    // فحص الشبكات المحلية لتقليل التأخير في الاتصالات الداخلية
    if (isPlainHostName(host) ||
        shExpMatch(host, "*.local") ||
        shExpMatch(host, "localhost") ||
        (isResolvable(host) && (
            isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
            isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
            isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0")
        ))) {
        return "DIRECT";  // اتصال مباشر للشبكات المحلية
    }

    // التأكد من أن المضيف قابل للتحليل لتجنب التأخير
    if (!isResolvable(host)) {
        return "DIRECT";  // تجنب الطلبات غير الصالحة
    }

    // قائمة الاستثناءات للتصفح المباشر (بدون استثناءات للألعاب)
    var excludedDomains = [
        "*.shahid.net",
        "*.shahid.com",
        "*.mbc.net",
        "*.youtube.com",
        "*.googlevideo.com",
        "*.whatsapp.net",
        "*.whatsapp.com",
        "*.facebook.com",
        "*.fbcdn.net",
        "*.messenger.com"
    ];

    // فحص الاستثناءات باستخدام shExpMatch
    for (var i = 0; i < excludedDomains.length; i++) {
        if (shExpMatch(host, excludedDomains[i])) {
            return "DIRECT";
        }
    }

    // تحديد نوع البروكسي بناءً على البروتوكول (مع دعم محسن لـ UDP وWebSocket)
    var protocol = url.split(":")[0].toLowerCase();
    var proxyType = (protocol === "socks" || protocol === "ws" || protocol === "wss") ? "SOCKS5" : "PROXY";

    // توليد قائمة البروكسيات (أولوية قصوى: بورت 1080 لـ PUBG Mobile)
    var proxyList = [];
    proxyList.push("SOCKS5 " + ip + ":1080"); // الأولوية القصوى لـ UDP
    // الاحتياطي (الباقي)
    for (var i = 1; i < ports.length; i++) {
        proxyList.push(proxyType + " " + ip + ":" + ports[i]);
    }

    // إضافة خيار احتياطي
    proxyList.push("DIRECT");

    // إرجاع قائمة البروكسيات
    return proxyList.join(";");
}
