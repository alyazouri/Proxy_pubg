function FindProxyForURL(url, host) {
    // تحويل الـ host إلى صيغة صغيرة للمقارنة
    host = host.toLowerCase();

    // تحديد دقيق لـ domains PUBG Mobile وMENA مع التركيز على الأردن
    if (shExpMatch(host, "api.pubgmobile.com") || 
        shExpMatch(host, "game.pubgmobile.com") || 
        shExpMatch(host, "api.mena.pubgmobile.com") || 
        shExpMatch(host, "pgsl.tencent.com") || 
        shExpMatch(host, "pubgmobile.live") || 
        shExpMatch(host, "*.tencent.com") || 
        shExpMatch(host, "91.106.109.12")) {
        if (isResolvable("91.106.109.12")) {
            return "PROXY 91.106.109.12:20001"; // توجيه لسيرفر محلي في الأردن
        }
        return "PROXY 203.205.159.240:20001"; // بديل MENA
    }

    // تحديد إضافي لـ WebSocket آمن (wss://) والبورت 20001
    if (url.indexOf("wss://") !== -1 && 
        (url.indexOf(":20001") !== -1 || url.indexOf("91.106.109.12") !== -1)) {
        if (isResolvable("91.106.109.12")) {
            return "PROXY 91.106.109.12:20001";
        }
        return "PROXY 203.205.159.240:20001";
    }

    // فحص دقيق لكلمات مفتاحية PUBG في الـ URL مع التركيز على MENA
    if ((url.indexOf("pubg") !== -1) || 
        (url.indexOf("battlegrounds") !== -1) || 
        (url.indexOf("mena") !== -1) || 
        (url.indexOf("jordan") !== -1)) { // إضافة كلمة "jordan" للتركيز
        if (isResolvable("91.106.109.12")) {
            return "PROXY 91.106.109.12:20001";
        }
        return "PROXY 203.205.159.240:20001";
    }

    // توجيه افتراضي للاتصالات المتعلقة باللعبة
    if (isResolvable("91.106.109.12")) {
        return "PROXY 91.106.109.12:20001";
    }
    return "PROXY 203.205.159.240:20001";
}
