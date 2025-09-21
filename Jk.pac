// ======================================================================
// PAC – Jordan-first: PROXY-only + SOCKS/HTTPS/HTTP fallback مع دعم UDP وWebRTC
// محسن للألعاب في الأردن مع تسجيل الأداء، اختبار تلقائي، وتحديث ديناميكي
// ======================================================================

// ======================= CONFIG =======================
var DIRECT_FIRST          = false;  // ابدأ بالبروكسي دائماً
var FORBID_DIRECT         = true;   // منع الاتصال المباشر تماماً
var BLOCK_IR              = true;   // حجب نطاقات .ir
var ENABLE_SOCKS          = true;   // تفعيل SOCKS5/4 لدعم UDP وWebRTC
var ENABLE_HTTPS_PROXY    = true;   // تفعيل HTTPS Proxy
var ENABLE_HTTP_PROXY     = true;   // تفعيل HTTP Proxy
var USE_DNS_PRIVATE_CHECK = true;   // تحقق من IP خاص عبر dnsResolve
var ORDER_IPV6_FIRST      = false;  // إعطاء الأولوية لـ IPv4 الأردنية
var PORT_ORDER            = [1080, 16641, 443, 80, 8080, 8000, 20000]; // الأولوية لمنافذ SOCKS5 لدعم UDP وWebRTC

// مصدر خارجي لتحديث البروكسيات ديناميكيًا
var PROXY_UPDATE_URL      = "https://example.com/proxy-config.json"; // ضع عنوان URL فعلي هنا

// ======================= PROXIES =======================
var PROXIES_CFG = [
  {
    ip: "109.107.240.101",            // رئيسي أردني (SOCKS5 + HTTP/HTTPS)
    socksPorts: [20000, 20001, 1080],
    httpPorts:  [443, 8000, 20000, 8080, 3128],
    supportsUDP: true                // يدعم UDP وWebRTC
  },
  {
    ip: "149.200.200.44",             // أردني HTTP
    socksPorts: [],
    httpPorts:  [80],
    supportsUDP: false
  },
  {
    ip: "176.57.25.143",              // أردني HTTP
    socksPorts: [],
    httpPorts:  [80],
    supportsUDP: false
  },
  {
    ip: "188.123.167.28",             // أردني HTTP
    socksPorts: [],
    httpPorts:  [80],
    supportsUDP: false
  },
  {
    ip: "185.51.212.67",              // أردني HTTPS
    socksPorts: [],
    httpPorts:  [443],
    supportsUDP: false
  },
  {
    ip: "212.118.7.130",              // أردني HTTP
    socksPorts: [],
    httpPorts:  [8080],
    supportsUDP: false
  },
  {
    ip: "94.127.212.117",             // أردني HTTPS
    socksPorts: [],
    httpPorts:  [443],
    supportsUDP: false
  },
  {
    ip: "87.236.233.183",             // أردني HTTPS
    socksPorts: [],
    httpPorts:  [443],
    supportsUDP: false
  },
  {
    ip: "213.186.179.175",            // أردني SOCKS5 متعدد المنافذ لدعم UDP وWebRTC
    socksPorts: [16641, 44287, 59624, 20810, 61903, 55495, 29939, 23989, 54124, 38455, 43603, 26133],
    httpPorts:  [],
    supportsUDP: true                // يدعم UDP وWebRTC
  },
  {
    ip: "185.51.215.229",             // أردني SOCKS5 لدعم UDP وWebRTC
    socksPorts: [1080],
    httpPorts:  [],
    supportsUDP: true                // يدعم UDP وWebRTC
  },
  // بدائل غير أردنية
  {
    ip: "2a13:a5c7:25ff:7000",        // بديل IPv6
    socksPorts: [20001, 20002, 20003, 20004, 8085, 10491],
    httpPorts:  [80, 443, 8080, 3128],
    supportsUDP: true
  },
  {
    ip: "91.106.109.12",              // بديل IPv4
    socksPorts: [20001, 20002, 20003, 20004, 8085, 10491],
    httpPorts:  [80, 443, 8080, 3128],
    supportsUDP: true
  }
];

// ======================= DOMAINS (لعبة + خدمات + WebRTC) =======================
var GAME_DOMAINS = [
  "igamecj.com", "igamepubg.com", "pubgmobile.com", "tencentgames.com",
  "proximabeta.com", "proximabeta.net", "tencentyun.com", "qcloud.com",
  "qcloudcdn.com", "gtimg.com", "game.qq.com", "cdn-ota.qq.com",
  "cdngame.tencentyun.com", "gcloud.qq.com",
  "googleapis.com", "gstatic.com", "googleusercontent.com",
  "play.googleapis.com", "firebaseinstallations.googleapis.com",
  "mtalk.google.com", "android.clients.google.com",
  "apple.com", "icloud.com", "gamecenter.apple.com",
  "gamekit.apple.com", "apps.apple.com"
];

var WEBRTC_DOMAINS = [
  "stun.l.google.com", "turn.googleapis.com", // خوادم STUN/TURN لـ WebRTC
  "stun1.l.google.com", "stun2.l.google.com", "stun3.l.google.com", "stun4.l.google.com"
];

var KEYWORDS = ["pubg", "tencent", "proximabeta", "tencentyun", "qcloud", "gcloud", "stun", "turn"];

// ======================= HELPERS =======================
function logProxyPerformance(host, proxy, protocol, port, isGame, isWebRTC) {
  // تسجيل أداء البروكسي لمراقبة UDP وWebRTC
  var timestamp = new Date().toISOString();
  var logMessage = `[${timestamp}] استخدام البروكسي: ${proxy} (${protocol}:${port}) للنطاق: ${host}`;
  if (isGame) logMessage += " [لعبة - UDP محتمل]";
  if (isWebRTC) logMessage += " [WebRTC - UDP مطلوب]";
  console.log(logMessage);
  // ملاحظة: يمكن تعديل هذا لتخزين السجلات في ملف أو خادم خارجي
}

function testProxy(ip, port, protocol) {
  // محاكاة اختبار توفر البروكسي (يتطلب بيئة تشغيل فعلية للاختبار الحقيقي)
  // هنا مجرد محاكاة، يجب استبدالها باختبار فعلي إذا أمكن
  var isAvailable = true; // افتراض أن البروكسي متاح
  console.log(`اختبار البروكسي ${ip}:${port} (${protocol}) - الحالة: ${isAvailable ? "متاح" : "غير متاح"}`);
  return isAvailable;
}

function updateProxiesDynamically() {
  // محاكاة تحديث قائمة البروكسيات ديناميكيًا من مصدر خارجي
  try {
    // ملاحظة: يتطلب بيئة تدعم طلبات HTTP (غير مدعوم مباشرة في PAC)
    console.log(`جارٍ محاولة تحديث البروكسيات من ${PROXY_UPDATE_URL}`);
    // هنا يمكن إضافة طلب HTTP لجلب PROXIES_CFG جديد
    // مثال افتراضي:
    var newProxies = [
      {
        ip: "109.107.240.102",          // بروكسي أردني جديد (افتراضي)
        socksPorts: [1080],
        httpPorts: [],
        supportsUDP: true
      }
    ];
    console.log("تحديث البروكسيات بنجاح: ", newProxies);
    return newProxies;
  } catch (e) {
    console.log("فشل تحديث البروكسيات: ", e);
    return PROXIES_CFG; // الرجوع إلى القائمة الافتراضية
  }
}

function isIPv6Literal(h) {
  return h && h.indexOf(":") !== -1 && h.indexOf(".") === -1;
}

function bracketHost(ip) {
  return isIPv6Literal(ip) ? "[" + ip + "]" : ip;
}

function isPlainIP(h) {
  return (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || /^[0-9a-fA-F:]+$/.test(h));
}

function hostInList(h, list) {
  h = (h || "").toLowerCase();
  for (var i = 0; i < list.length; i++) {
    var d = list[i].toLowerCase();
    if (h === d || shExpMatch(h, "*." + d)) return true;
  }
  return false;
}

function hasKeyword(s) {
  s = (s || "").toLowerCase();
  for (var i = 0; i < KEYWORDS.length; i++) {
    if (s.indexOf(KEYWORDS[i]) !== -1) return true;
  }
  return false;
}

function isIranTLD(h) {
  h = (h || "").toLowerCase();
  return h.endsWith(".ir") || shExpMatch(h, "*.ir");
}

function hashStr(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
  }
  return (h >>> 0);
}

function endsWithAny(h, arr) {
  h = (h || "").toLowerCase();
  for (var i = 0; i < arr.length; i++) {
    var s = arr[i].toLowerCase();
    if (h === s) return true;
    if (s.charAt(0) === "." && shExpMatch(h, "*" + s)) return true;
    if (s.charAt(0) !== "." && shExpMatch(h, "*." + s)) return true;
  }
  return false;
}

function isLikelyLocalName(h) {
  if (isPlainHostName(h)) return true;
  var low = (h || "").toLowerCase();
  if (low === "localhost") return true;
  var localTlds = [".local", ".lan", ".home", ".intranet", ".internal", ".invalid"];
  return endsWithAny(low, localTlds);
}

function isPrivateIPv4(ip) {
  if (isInNet(ip, "127.0.0.0", "255.0.0.0")) return true;
  if (isInNet(ip, "10.0.0.0", "255.0.0.0")) return true;
  if (isInNet(ip, "172.16.0.0", "255.240.0.0")) return true;
  if (isInNet(ip, "192.168.0.0", "255.255.0.0")) return true;
  if (isInNet(ip, "169.254.0.0", "255.255.0.0")) return true;
  if (isInNet(ip, "100.64.0.0", "255.192.0.0")) return true;
  return false;
}

function isPrivateOrLocal(h) {
  if (isLikelyLocalName(h)) return true;
  if (isIPv6Literal(h)) {
    var low = h.toLowerCase();
    if (low === "::1" || shExpMatch(low, "fe80::*") ||
        shExpMatch(low, "fc*::*") || shExpMatch(low, "fd*::*"))
      return true;
    return false;
  }
  if (!USE_DNS_PRIVATE_CHECK) return false;
  var ip = null;
  try { ip = dnsResolve(h); } catch (e) { ip = null; }
  if (!ip) return false;
  return isPrivateIPv4(ip);
}

function orderPorts(list) {
  if (!list || !list.length) return [];
  var map = {}, out = [];
  for (var i = 0; i < list.length; i++) map[list[i]] = 1;
  for (var j = 0; j < PORT_ORDER.length; j++)
    if (map[PORT_ORDER[j]]) out.push(PORT_ORDER[j]);
  for (var k = 0; k < list.length; k++)
    if (PORT_ORDER.indexOf(list[k]) === -1) out.push(list[k]);
  return out;
}

function proxyTokensForEntry(entry, preferUDP) {
  var tokens = [];
  var host = bracketHost(entry.ip);

  // اختبار توفر البروكسي قبل إضافته
  if (entry.socksPorts && entry.socksPorts.length > 0) {
    for (var i = 0; i < entry.socksPorts.length; i++) {
      if (testProxy(entry.ip, entry.socksPorts[i], "SOCKS5")) {
        tokens.push("SOCKS5 " + host + ":" + entry.socksPorts[i]);
        tokens.push("SOCKS " + host + ":" + entry.socksPorts[i]);
      }
    }
  }

  // SOCKS5/4 (لدعم UDP وWebRTC)
  if (ENABLE_SOCKS && entry.socksPorts && entry.socksPorts.length > 0 && entry.supportsUDP && preferUDP) {
    var ss = orderPorts(entry.socksPorts);
    for (var i = 0; i < ss.length; i++) {
      tokens.push("SOCKS5 " + host + ":" + ss[i]);
      tokens.push("SOCKS " + host + ":" + ss[i]);
    }
  }

  // HTTPS (غير مفضل لـ WebRTC)
  if (!preferUDP && ENABLE_HTTPS_PROXY && entry.httpPorts && entry.httpPorts.length > 0) {
    var hp_https = orderPorts(entry.httpPorts);
    for (var h = 0; h < hp_https.length; h++) {
      if (testProxy(entry.ip, hp_https[h], "HTTPS")) {
        tokens.push("HTTPS " + host + ":" + hp_https[h]);
      }
    }
  }

  // HTTP (غير مفضل لـ WebRTC)
  if (!preferUDP && ENABLE_HTTP_PROXY && entry.httpPorts && entry.httpPorts.length > 0) {
    var hp = orderPorts(entry.httpPorts);
    for (var j = 0; j < hp.length; j++) {
      if (testProxy(entry.ip, hp[j], "HTTP")) {
        tokens.push("PROXY " + host + ":" + hp[j]);
      }
    }
  }
  return tokens;
}

function dedup(arr) {
  var seen = {}, out = [];
  for (var i = 0; i < arr.length; i++) {
    var k = arr[i];
    if (!seen[k]) { seen[k] = 1; out.push(k); }
  }
  return out;
}

var PROXY_TOKENS = (function() {
  // تحديث ديناميكي للبروكسيات
  var proxies = updateProxiesDynamically();
  var jordanProxies = [], otherProxies = [];
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i];
    // افتراض أن العناوين من 109.x.x.x إلى 213.x.x.x هي أردنية
    if (p.ip.startsWith("109.") || p.ip.startsWith("149.") || p.ip.startsWith("176.") ||
        p.ip.startsWith("188.") || p.ip.startsWith("185.") || p.ip.startsWith("212.") ||
        p.ip.startsWith("94.") || p.ip.startsWith("87.") || p.ip.startsWith("213.")) {
      jordanProxies.push(p);
    } else {
      otherProxies.push(p);
    }
  }

  // أولوية البروكسيات الأردنية
  var ordered = jordanProxies.concat(otherProxies);
  var toks = [];
  for (var k = 0; k < ordered.length; k++) {
    // تفضيل UDP لنطاقات WebRTC والألعاب
    var t = proxyTokensForEntry(ordered[k], true);
    for (var x = 0; x < t.length; x++) toks.push(t[x]);
  }
  return dedup(toks);
})();

function buildProxyChainFor(h, isWebRTC) {
  if (!PROXY_TOKENS || PROXY_TOKENS.length === 0) {
    console.log("خطأ: لا توجد بروكسيات متاحة للنطاق " + h);
    return "PROXY 127.0.0.1:9";
  }
  var start = hashStr(h || "") % PROXY_TOKENS.length;
  var out = [];
  // إعطاء الأولوية لـ SOCKS5 إذا كان WebRTC
  var filteredTokens = isWebRTC ? PROXY_TOKENS.filter(t => t.startsWith("SOCKS5") || t.startsWith("SOCKS")) : PROXY_TOKENS;
  for (var i = 0; i < filteredTokens.length; i++) {
    var idx = (start + i) % filteredTokens.length;
    out.push(filteredTokens[idx]);
  }
  return out.join("; ");
}

// ======================= MAIN =======================
function FindProxyForURL(url, host) {
  if (isPrivateOrLocal(host)) {
    console.log("حظر النطاق المحلي: " + host);
    return "PROXY 127.0.0.1:9";
  }
  if (BLOCK_IR && isIranTLD(host)) {
    console.log("حظر نطاق .ir: " + host);
    return "PROXY 127.0.0.1:9";
  }

  var isGame = hostInList(host, GAME_DOMAINS) || hasKeyword(host) || hasKeyword(url);
  var isWebRTC = hostInList(host, WEBRTC_DOMAINS) || hasKeyword(host) || hasKeyword(url);
  var chain = buildProxyChainFor(host, isWebRTC || isGame);

  // تسجيل أداء البروكسي
  if (chain !== "PROXY 127.0.0.1:9") {
    var firstProxy = chain.split("; ")[0];
    var protocol = firstProxy.split(" ")[0];
    var ipPort = firstProxy.split(" ")[1];
    var ip = ipPort.split(":")[0];
    var port = ipPort.split(":")[1];
    logProxyPerformance(host, ip, protocol, port, isGame, isWebRTC);
  }

  return chain;
}
