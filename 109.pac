// ==============================================
// PUBG PAC - Full Jordan Proxy (No Raw DIRECT)
// ==============================================
// الفكرة:
// - كل شيء يمر عبر البروكسي الأردني
// - ببجي: بورت متغير (Hybrid: تجنيد سريع + استقرار بالمباراة)
// - مباريات الكلاسيك: بورت ثابت أو نطاق خاص (Local Classic)
// - باقي الاتصالات: تظل عبر البروكسي نفسه (بورت مناسب)
// ==============================================

// ---------------- إعدادات ----------------
var proxyIP = "91.106.109.12";
var minPort = 10000;
var maxPort = 27015;
var classicMinPort = 27016;  // بورت بداية مباريات الكلاسيك
var classicMaxPort = 27020;  // بورت نهاية مباريات الكلاسيك
var stickyTTL = 60000; // ثبات البورت 60 ثانية
// -----------------------------------------

var hostMap = {}; // خريطة لحفظ البورتات

function generatePort(min, max) {
    var nowSec = Math.floor(Date.now() / 1000);
    var range = max - min + 1;
    return min + (nowSec % range);
}

function buildProxyString(port) {
    // نجرب SOCKS5 ثم SOCKS4 ثم HTTP PROXY
    return "SOCKS5 " + proxyIP + ":" + port +
           "; SOCKS4 " + proxyIP + ":" + port +
           "; PROXY " + proxyIP + ":" + port;
}

function isPubgHost(host) {
    host = host.toLowerCase();
    var pubgList = [
        "pubgmobile.com","pubgmobile.net","pubgmobile.org",
        "igamecj.com","tencent.com","tencentgames.com","tencentgames.net",
        "proximabeta.com","gpubgm.com","qcloud.com","qcloudcdn.com",
        "akamaized.net","gamepubgm.com","sg-global-pubg.com","tdatamaster.com"
    ];
    for (var i = 0; i < pubgList.length; i++) {
        var d = pubgList[i];
        if (host == d || dnsDomainIs(host, "." + d) || shExpMatch(host, "*." + d)) return true;
    }
    if (shExpMatch(host, "*pubg*") || shExpMatch(host, "*tencent*") ||
        shExpMatch(host, "*qcloud*") || shExpMatch(host, "*proximabeta*")) {
        return true;
    }
    return false;
}

// إضافة دالة لتحديد إذا كان الاتصال لمباريات الكلاسيك
function isClassicMatchHost(host) {
    host = host.toLowerCase();
    // مثال: أسماء نطاقات أو كلمات مفتاحية خاصة بمباريات الكلاسيك
    var classicList = [
        "classic.pubgmobile.com",
        "classicmatch.pubgmobile.net",
        "classic.tencentgames.com"
        // أضف نطاقات أو كلمات مفتاحية أخرى حسب الحاجة
    ];
    for (var i = 0; i < classicList.length; i++) {
        var d = classicList[i];
        if (host == d || dnsDomainIs(host, "." + d) || shExpMatch(host, "*." + d)) return true;
    }
    // أو يمكن استخدام كلمات مفتاحية عامة
    if (shExpMatch(host, "*classic*") || shExpMatch(host, "*classicmatch*")) {
        return true;
    }
    return false;
}

function FindProxyForURL(url, host) {
    host = host.toLowerCase();
    var now = Date.now();

    // 1) مباريات الكلاسيك → بورت ثابت أو نطاق بورتات خاص
    if (isClassicMatchHost(host)) {
        var entry = hostMap[host];
        if (entry && (now - entry.ts) <= stickyTTL) {
            return buildProxyString(entry.port);
        }
        var port = generatePort(classicMinPort, classicMaxPort);
        hostMap[host] = {port: port, ts: now};
        return buildProxyString(port);
    }

    // 2) نطاقات ببجي الأخرى → Hybrid Proxy (بورت متغير ضمن النطاق الرئيسي)
    if (isPubgHost(host)) {
        var entry = hostMap[host];
        if (entry && (now - entry.ts) <= stickyTTL) {
            return buildProxyString(entry.port);
        }
        var port = generatePort(minPort, maxPort);
        hostMap[host] = {port: port, ts: now};
        return buildProxyString(port);
    }

    // 3) باقي الاتصالات → البروكسي الأردني برضو (بورت متغير ضمن النطاق الرئيسي)
    var port = generatePort(minPort, maxPort);
    return buildProxyString(port);
}
