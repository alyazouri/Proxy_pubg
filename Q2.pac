function FindProxyForURL(url, host) {
    // نطاقات IP لمزودي الإنترنت الأردنيين (أمثلة، يجب استبدالها بنطاقات حقيقية)
    var jordanISPs = [
        { ip: "185.34.16.0", mask: "255.255.252.0" }, // Orange Jordan (مثال)
        { ip: "188.247.64.0", mask: "255.255.192.0" }, // Zain Jordan (مثال)
        { ip: "95.141.32.0", mask: "255.255.240.0" }   // Umniah Jordan (مثال)
    ];

    // تحقق مما إذا كان عنوان IP الخاص بالجهاز ينتمي إلى مزود أردني
    var clientIP = myIpAddress();
    for (var i = 0; i < jordanISPs.length; i++) {
        if (isInNet(clientIP, jordanISPs[i].ip, jordanISPs[i].mask)) {
            // إذا كان النطاق مرتبطًا بـ PUBG، استخدم الوكيل الأردني
            if (dnsDomainIs(host, "pubg.com") ||
                dnsDomainIs(host, "pubgmobile.com") ||
                dnsDomainIs(host, "tencent.com")) {
                return "PROXY 91.106.109.12:8081";
            }
            // إذا كان النطاق أردنيًا (.jo)، استخدم الوكيل أيضًا
            if (dnsDomainIs(host, ".jo")) {
                return "PROXY 91.106.109.12:8081";
            }
        }
    }

    // إذا لم يكن الجهاز على شبكة أردنية أو النطاق غير مطابق، تجاوز الوكيل
    return "DIRECT";
}
