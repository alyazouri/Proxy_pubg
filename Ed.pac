function FindProxyForURL(url, host) {
    // عنوان IP للسيرفر الأردني
    var ip = "91.106.109.12";

    // قائمة البورتات مرتبة حسب الأولوية للألعاب والاستقرار
    var ports = [
        443,    // HTTPS: بروتوكول آمن وسريع، مثالي للألعاب
        8080,   // HTTP-alt: شائع ومستقر
        1080,   // SOCKS5: يدعم UDP، مهم للألعاب
        8085,   // بروكسي إضافي مستقر
        88,     // kerberos
        3306,   // mysql
        5000,   // commplex-main
        5222,   // jabber-client
        6000,
        7080,
        8000,   // irdmi
        8011,
        8081,   // sunproxyadmin
        8086,
        8087,
        8088,   // radan-http
        8181,
        8880,   // cddbp-alt
        9999,   // distinct
        10000,  // ndmp
        10010,
        10011,
        10012,
        10013,
        14001,  // sua
        18000,  // biimenu
        20000,  // dnp
        20001,  // microsan (كخيار احتياطي)
        20003
    ];

    // فحص الشبكات المحلية أولاً للتحسين المحلي
    if (isPlainHostName(host) ||
        shExpMatch(host, "*.local") ||
        shExpMatch(host, "localhost") ||
        (isResolvable(host) && isInNet(dnsResolve(host), "192.168.0.0/16", "255.255.0.0"))) {
        return "DIRECT";  // اتصال مباشر للشبكات المحلية لتقليل التأخير
    }

    // قائمة الاستثناءات للتصفح المباشر (بدون استثناءات الألعاب)
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

    // فحص الاستثناءات باستخدام shExpMatch للدقة والأداء
    for (var i = 0; i < excludedDomains.length; i++) {
        if (shExpMatch(host, excludedDomains[i])) {
            return "DIRECT";  // الاتصال المباشر لتقليل التأخير
        }
    }

    // تحديد نوع البروكسي بناءً على البروتوكول
    var protocol = url.split(":")[0].toLowerCase();
    var proxyType = (protocol === "socks" || protocol === "ws") ? "SOCKS5" : "PROXY";

    // توليد قائمة البروكسيات (أولوية عالية: أول 4 بورتات؛ الباقي احتياطي)
    var proxyList = [];
    // الأولوية العالية (سريعة للألعاب)
    for (var j = 0; j < 4; j++) {
        proxyList.push(proxyType + " " + ip + ":" + ports[j]);
    }
    // الاحتياطي (الباقي)
    for (var i = 4; i < ports.length; i++) {
        proxyList.push(proxyType + " " + ip + ":" + ports[i]);
    }

    // إضافة خيار احتياطي
    proxyList.push("DIRECT");

    // إرجاع قائمة البروكسيات مفصولة بفاصلة منقوطة
    return proxyList.join(";");
}
