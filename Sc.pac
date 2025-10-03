function FindProxyForURL(url, host) {
    // تحويل الـ host إلى صيغة صغيرة للمقارنة
    host = host.toLowerCase();

    // تحديد دقيق لـ domains PUBG Mobile (مثل pubgmobile.com و tencent.com)
    if (shExpMatch(host, "*.pubgmobile.com") || shExpMatch(host, "*.tencent.com") || shExpMatch(host, "91.106.109.12")) {
        // توجيه لـ proxy محلي في الأردن لتقليل ping في MENA
        return "PROXY 91.106.109.12:20001";
    }

    // تحديد إضافي لو البورت 20001 موجود في الـ URL (لدعم WebSocket في اللعبة)
    if (url.indexOf(":20001") !== -1 || url.indexOf("pubg") !== -1 || url.indexOf("battlegrounds") !== -1) {
        return "PROXY 91.106.109.12:20001";
    }

    // توجيه افتراضي لكل الاتصالات اللي مرتبطة باللعبة (لضمان تقليل ping في البحث والتجنيد)
    return "PROXY 91.106.109.12:20001";
}
