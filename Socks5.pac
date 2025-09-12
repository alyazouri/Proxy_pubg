// proxy.pac - ملف PAC جاهز للتعديل والنشر
// عدّل القائمة PROXIES أو الاستثناءات أدناه حسب حاجتك.

function FindProxyForURL(url, host) {
    // -------------------------
    // تهيئة: تعديل هذه القيم حسب حاجتك
    // -------------------------
    // ترتيب البروكسي: الأول سيُجرب أولاً
    var PROXIES = [
        "SOCKS 91.106.109.12:20001",
        "SOCKS 91.106.109.12:443"
    ];
    var FALLBACK = "DIRECT"; // تضاف دائماً في النهاية

    // استثناءات اسماء دومين (يمكن وضع أسماء كاملة أو أقسام نطاق باستخدام .domain)
    var BYPASS_DOMAINS = [
        ".local",
        ".lan",
        ".intranet",
        ".example.corp"
    ];

    // استثناءات مضيفين/نطاقات محددة (shExpMatch patterns)
    var BYPASS_PATTERNS = [
        "http://internal.example/*",
        "https://internal.example/*"
    ];

    // استثناءات عناوين IP (يمكن إضافة سلاسل CIDR في التعليقات هنا ومقارنة بـ isInNet)
    // مثال: bypass 10.0.0.0/8 , 172.16.0.0/12 , 192.168.0.0/16 handled below.

    // -------------------------
    // دوال مساعدة صغيرة (للتوضيح — الدوال التالية متوفرة في بيئة PAC عموماً:
    // isPlainHostName, dnsDomainIs, isInNet, myIpAddress, shExpMatch, isResolvable
    // -------------------------

    // 1) تجنّب أسماء المضيف القصيرة و localhost
    if (isPlainHostName(host) || host === "localhost" || host === "127.0.0.1") {
        return FALLBACK;
    }

    // 2) التجاوز للمضيفات المعرفة في BYPASS_DOMAINS
    for (var i = 0; i < BYPASS_DOMAINS.length; i++) {
        if (dnsDomainIs(host, BYPASS_DOMAINS[i])) {
            return FALLBACK;
        }
    }

    // 3) التجاوز لأنماط URL محددة
    for (var j = 0; j < BYPASS_PATTERNS.length; j++) {
        if (shExpMatch(url, BYPASS_PATTERNS[j])) {
            return FALLBACK;
        }
    }

    // 4) التجاوز لشبكات وعناوين محلية (RFC1918) و loopback و link-local و multicast
    // 10.0.0.0/8
    if (isInNet(host, "10.0.0.0", "255.0.0.0")) {
        return FALLBACK;
    }
    // 172.16.0.0/12
    if (isInNet(host, "172.16.0.0", "255.240.0.0")) {
        return FALLBACK;
    }
    // 192.168.0.0/16
    if (isInNet(host, "192.168.0.0", "255.255.0.0")) {
        return FALLBACK;
    }
    // loopback
    if (isInNet(host, "127.0.0.0", "255.0.0.0")) {
        return FALLBACK;
    }
    // link-local 169.254.0.0/16
    if (isInNet(host, "169.254.0.0", "255.255.0.0")) {
        return FALLBACK;
    }
    // multicast 224.0.0.0/4 (عادة لا تريد بروكسي للترافيك هذا)
    if (isInNet(host, "224.0.0.0", "240.0.0.0")) {
        return FALLBACK;
    }
    // experimental/reserved 240.0.0.0/4
    if (isInNet(host, "240.0.0.0", "240.0.0.0")) {
        return FALLBACK;
    }

    // 5) إذا host هو عنوان IP نصي، تأكدنا من الشبكات أعلاه. (isInNet يعمل مع host كاسم أو IP)
    // 6) أمثلة قواعد خاصة: توجه مباشر لمجلدات/مسارات داخلية
    if (url.indexOf("/internal/") !== -1) {
        return FALLBACK;
    }

    // 7) قواعد تستهدف دومينات عامة تريدها عبر البروكسي بشكل دائم
    // مثال: إجبار استخدام البروكسي لمحتوى CDN أو لمجال محدد
    if (shExpMatch(host, "*.cdn.example") || shExpMatch(host, "static.*")) {
        return PROXIES.join("; ") + "; " + FALLBACK;
    }

    // 8) افتراضي: استخدم الترتيب المحدد في PROXIES ثم DIRECT كخيار أخير
    return PROXIES.join("; ") + "; " + FALLBACK;
}
