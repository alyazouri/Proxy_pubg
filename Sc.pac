function FindProxyForURL(url, host) {
    // تحويل الـ host إلى صيغة صغيرة للمقارنة
    host = host.toLowerCase();

    // تحديد دقيق لـ domains PUBG Mobile وMENA
    if (shExpMatch(host, "api.pubgmobile.com") || 
        shExpMatch(host, "game.pubgmobile.com") || 
        shExpMatch(host, "pgsl.tencent.com") || 
        shExpMatch(host, "pubgmobile.live") || 
        shExpMatch(host, "*.tencent.com") || 
        shExpMatch(host, "91.106.109.12")) {
        return "PROXY 91.106.109.12:20001"; // توجيه للـ proxy المحلي
    }

    // تحديد إضافي لـ WebSocket والبورت 20001
    if ((url.indexOf("ws://") !== -1 || url.indexOf("wss://") !== -1) && 
        (url.indexOf(":20001") !== -1 || url.indexOf("91.106.109.12") !== -1)) {
        return "PROXY 91.106.109.12:20001";
    }

    // فحص دقيق لكلمات مفتاحية PUBG في الـ URL
    if ((url.indexOf("pubg") !== -1) || 
        (url.indexOf("battlegrounds") !== -1) || 
        (url.indexOf("mena") !== -1)) {
        return "PROXY 91.106.109.12:20001";
    }

    // توجيه افتراضي للاتصالات المتعلقة باللعبة
    return "PROXY 91.106.109.12:20001"; // ركز على السيرفر المحلي
}
