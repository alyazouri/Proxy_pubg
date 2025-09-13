function FindProxyForURL(url, host) {
  // ===== إعدادات عامة =====
  var IP = "91.106.109.12"; // الآيبي الأردني
  // ملاحظة: عمداً لا نضع DIRECT في النهاية لزيادة نسبة المرور عبر الآيبي الأردني.

  // ===== استثناءات التصفّح المباشر (بدون بروكسي) =====
  // كما طلبت: Shahid / MBC / YouTube / WhatsApp / Facebook / Messenger
  var EXCLUDED_DOMAINS = [
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

  // ===== استثناءات للشبكات/الأسماء المحلية =====
  // IPs الخاصة/المحلية وأسماء مثل .local / .lan
  if (isPlainHostName(host) ||
      dnsDomainIs(host, ".local") ||
      dnsDomainIs(host, ".lan") ||
      isInNet(host, "10.0.0.0", "255.0.0.0") ||
      isInNet(host, "172.16.0.0", "255.240.0.0") ||
      isInNet(host, "192.168.0.0", "255.255.0.0") ||
      isInNet(host, "127.0.0.0", "255.0.0.0")) {
    return "DIRECT";
  }

  // تطبيق الاستثناءات التي زوّدتني بها
  for (var i = 0; i < EXCLUDED_DOMAINS.length; i++) {
    if (shExpMatch(host, EXCLUDED_DOMAINS[i])) {
      return "DIRECT";
    }
  }

  // ===== قائمة البورتات الأردنية (مُوحَّدة ومرتّبة) =====
  var PORTS = [
    8085,8086,8087,8088,8089,8090,
    8011,9030,
    10010,10012,10013,10039,10096,
    10491,10612,11000,11455,12235,13748,13894,13972,14000,
    17000,17500,20000,20001,20002
  ];

  // تجهيز قائمة البروكسيات (مرة واحدة)
  var PROXIES = [];
  for (var p = 0; p < PORTS.length; p++) {
    PROXIES.push("PROXY " + IP + ":" + PORTS[p]);
  }

  // ===== توزيع الحمل بين البورتات (Deterministic) =====
  // نحسب "بذرة" بسيطة من اسم المضيف لتغيير نقطة البداية في القائمة،
  // هذا يزيد فرصة نجاح الاتصال وتوزيع الضغط بدون عشوائية كاملة.
  function simpleHash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0; // تحويل إلى 32-بت
    }
    // نجعل القيمة موجبة
    if (h < 0) h = -h;
    return h;
  }

  var seed = simpleHash(host || "");
  var start = seed % PROXIES.length;

  // نُعيد القائمة بدءًا من موقع مختلف لكل host ثم نُكمّل لباقي العناصر
  var ordered = [];
  for (var k = 0; k < PROXIES.length; k++) {
    ordered.push(PROXIES[(start + k) % PROXIES.length]);
  }

  // ملاحظة مهمّة:
  // لا يوجد "DIRECT" في النهاية عمداً لزيادة نسبة المرور عبر الآيبي الأردني.
  // إذا أردت إضافة DIRECT كحل أخير عند فشل جميع البروكسيات، أضف "; DIRECT" في السطر التالي.
  return ordered.join(";");
}
