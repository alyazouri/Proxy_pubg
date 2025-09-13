function FindProxyForURL(url, host) {
  var IP = "91.106.109.12";

  // بورتات مختارة قليلة (أفضل الأربعة)
  var PORTS = [8085, 8086, 8087, 14000];

  // نطاقات مستثناة للتصفح المباشر
  var EX = [
    "*.shahid.net", "*.shahid.com", "*.mbc.net",
    "*.youtube.com", "*.googlevideo.com",
    "*.whatsapp.net", "*.whatsapp.com",
    "*.facebook.com", "*.fbcdn.net", "*.messenger.com"
  ];

  // نطاقات ببجي/تينسنت
  var PUBG = [
    "*.pubgmobile.com", "*.igamecj.com", "*.proximabeta.com",
    "*.tencent.com", "*.tencentgames.com",
    "*.gcloud.qq.com", "*.qcloud.com",
    "*.cdn.pubgmobile.com", "*.akamaized.net", "*.vtcdn.com"
  ];

  // استثناءات الشبكات المحلية
  if (
    isPlainHostName(host) ||
    dnsDomainIs(host, ".local") ||
    dnsDomainIs(host, ".lan") ||
    isInNet(host, "10.0.0.0", "255.0.0.0") ||
    isInNet(host, "172.16.0.0", "255.240.0.0") ||
    isInNet(host, "192.168.0.0", "255.255.0.0") ||
    isInNet(host, "127.0.0.0", "255.0.0.0")
  ) {
    return "DIRECT";
  }

  // استثناءات التصفح المباشر
  for (var i = 0; i < EX.length; i++) {
    if (shExpMatch(host, EX[i])) {
      return "DIRECT";
    }
  }

  // حظر نطاقات إيران
  if (shExpMatch(host, "*.ir") || host === "ir") {
    return "PROXY 0.0.0.0:0";
  }

  // دالة هاش بسيطة لتوزيع الحمل
  function H(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return h < 0 ? -h : h;
  }

  // تجهيز قائمة البروكسيات
  var s = H(host || "") % PORTS.length;
  var L = [];
  for (var k = 0; k < PORTS.length; k++) {
    L.push("PROXY " + IP + ":" + PORTS[(s + k) % PORTS.length]);
  }

  // توجيه خاص ببجي/تينسنت
  for (var j = 0; j < PUBG.length; j++) {
    if (shExpMatch(host, PUBG[j])) {
      return L.join(";");
    }
  }

  // التوجيه الافتراضي
  return L.join(";");
}
