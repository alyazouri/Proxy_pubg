function FindProxyForURL(url, host) {
  // --- 1) قوائم البروكسيات (بدون DIRECT) ---
  // رتّبها من الأسرع إلى الأبطأ حسب قياسك الواقعي
  var FAST_PROXIES = [
    "91.106.109.12:15038",
    "91.106.109.12:15040",
    "91.106.109.12:15042"
  ];
  var BULK_PROXIES = [
    "91.106.109.12:15044",
    "91.106.109.12:15001",
    "91.106.109.12:15006"
  ];

  // --- 2) نطاقات الألعاب (PUBG/Tencent) ---
  var GAME_DOMAINS = [
    "pubgmobile.com","igamecj.com","proximabeta.com","tencentgamingbuddy.com",
    "qq.com","qcloud.com","tencent.com","gcloudsdk.com","playfabapi.com","helpshift.com"
  ];

  // (اختياري) نطاقات ثقيلة نمرّرها على BULK دائمًا لتخفيف الحمل
  var HEAVY_DOMAINS = [
    "youtube.com","googlevideo.com","windowsupdate.com","microsoft.com"
  ];

  // --- 3) أدوات مساعدة ---
  function domainMatches(h, d) { return (h === d) || shExpMatch(h, "*." + d); }
  function isIPv4Literal(h) { return /^\d{1,3}(\.\d{1,3}){3}$/.test(h); }

  // هاش خفيف وثابت لإسناد نطاق لبروكسي محدد (Sticky)
  function djb2(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
      hash = hash & 0x7fffffff;
    }
    return hash;
  }

  // تدوير القائمة لتبدأ من عنصر معيّن ثم باقي العناصر كاحتياطي (Failover)
  function rotated(list, startIdx) {
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(list[(startIdx + i) % list.length]);
    return out;
  }

  // تحويل قائمة إلى سلسلة PAC
  function buildChain(list) {
    var parts = [];
    for (var i = 0; i < list.length; i++) parts.push("PROXY " + list[i]);
    return parts.join("; ");
  }

  // سلسلة بروكسي ثابتة لكل host: يبدأ ببروكسي محدد بالهاش ثم البقية كاحتياطي
  function stableProxyChain(hostname, baseList) {
    var idx = djb2(hostname) % baseList.length;
    return buildChain(rotated(baseList, idx));
  }

  // --- 4) سياسة التوجيه ---
  // أ) IP حرفي → استخدم BULK بثبات (غيّرها لFAST إذا رغبت)
  if (isIPv4Literal(host)) {
    return stableProxyChain(host, BULK_PROXIES);
  }

  // ب) نطاقات ثقيلة → BULK لتخفيف الضغط عن FAST (اختياري)
  for (var h = 0; h < HEAVY_DOMAINS.length; h++) {
    if (domainMatches(host, HEAVY_DOMAINS[h])) {
      return stableProxyChain(host, BULK_PROXIES);
    }
  }

  // ج) نطاقات الألعاب → FAST مع تثبيت
  for (var i = 0; i < GAME_DOMAINS.length; i++) {
    if (domainMatches(host, GAME_DOMAINS[i])) {
      return stableProxyChain(host, FAST_PROXIES);
    }
  }

  // د) باقي النطاقات → BULK مع تثبيت
  return stableProxyChain(host, BULK_PROXIES);
}
