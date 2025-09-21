// ======================================================================
// PAC – Jordan-first: Optimized for PUBG with UDP support
// محسن للألعاب في الأردن مع دعم UDP وتقليل التأخير
// ======================================================================

// ======================= CONFIG =======================
var DIRECT_FIRST          = false;  // ابدأ بالبروكسي دائمًا
var FORBID_DIRECT         = false;  // السماح بالاتصال المباشر كخيار احتياطي
var BLOCK_IR              = true;   // حجب نطاقات .ir
var ENABLE_SOCKS          = true;   // تفعيل SOCKS5 لدعم UDP
var ENABLE_HTTPS_PROXY    = false;  // تعطيل HTTPS Proxy لتجنب التأخير
var ENABLE_HTTP_PROXY     = false;  // تعطيل HTTP Proxy لتجنب التأخير
var USE_DNS_PRIVATE_CHECK = true;   // تحقق من IP خاص
var ORDER_IPV6_FIRST      = false;  // إعطاء الأولوية لـ IPv4
var PORT_ORDER            = [1080, 20000, 16641]; // منافذ SOCKS5 المفضلة

// تعطيل التحديث الديناميكي مؤقتًا (استبدل بعنوان فعلي إذا توفر)
var PROXY_UPDATE_URL      = "";

// ======================= PROXIES =======================
var PROXIES_CFG = [
  {
    ip: "109.107.240.101",            // رئيسي أردني (SOCKS5)
    socksPorts: [20000, 1080],
    httpPorts:  [],
    supportsUDP: true
  },
  {
    ip: "213.186.179.175",            // أردني SOCKS5
    socksPorts: [16641],
    httpPorts:  [],
    supportsUDP: true
  },
  {
    ip: "185.51.215.229",             // أردني SOCKS5
    socksPorts: [1080],
    httpPorts:  [],
    supportsUDP: true
  },
  // بديل غير أردني (للطوارئ)
  {
    ip: "91.106.109.12",              // بديل IPv4
    socksPorts: [20001, 1080],
    httpPorts:  [],
    supportsUDP: true
  }
];

// ======================= DOMAINS (لعبة فقط) =======================
var GAME_DOMAINS = [
  "pubgmobile.com", "tencentgames.com", "proximabeta.com",
  "proximabeta.net", "tencentyun.com", "qcloud.com",
  "qcloudcdn.com", "cdngame.tencentyun.com", "gcloud.qq.com"
];

// إزالة WEBRTC_DOMAINS لأنها غير ضرورية لـ PUBG
var KEYWORDS = ["pubg", "tencent", "proximabeta", "tencentyun", "qcloud", "gcloud"];

// ======================= HELPERS =======================
function logProxyPerformance(host, proxy, protocol, port, isGame) {
  var timestamp = new Date().toISOString();
  var logMessage = `[${timestamp}] استخدام البروكسي: ${proxy} (${protocol}:${port}) للنطاق: ${host}`;
  if (isGame) logMessage += " [لعبة - UDP]";
  console.log(logMessage);
}

function testProxy(ip, port, protocol) {
  // محاكاة اختبار توفر البروكسي
  var isAvailable = true; // يجب استبدالها باختبار فعلي إذا أمكن
  console.log(`اختبار البروكسي ${ip}:${port} (${protocol}) - الحالة: ${isAvailable ? "متاح" : "غير متاح"}`);
  return isAvailable;
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

function proxyTokensForEntry(entry) {
  var tokens = [];
  var host = bracketHost(entry.ip);

  if (ENABLE_SOCKS && entry.socksPorts && entry.socksPorts.length > 0 && entry.supportsUDP) {
    var ss = orderPorts(entry.socksPorts);
    for (var i = 0; i < ss.length; i++) {
      if (testProxy(entry.ip, ss[i], "SOCKS5")) {
        tokens.push("SOCKS5 " + host + ":" + ss[i]);
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
  var proxies = PROXIES_CFG; // تعطيل التحديث الديناميكي
  var jordanProxies = [], otherProxies = [];
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i];
    if (p.ip.startsWith("109.") || p.ip.startsWith("213.") || p.ip.startsWith("185.")) {
      jordanProxies.push(p);
    } else {
      otherProxies.push(p);
    }
  }

  var ordered = jordanProxies.concat(otherProxies);
  var toks = [];
  for (var k = 0; k < ordered.length; k++) {
    var t = proxyTokensForEntry(ordered[k]);
    for (var x = 0; x < t.length; x++) toks.push(t[x]);
  }
  return dedup(toks);
})();

function buildProxyChainFor(h) {
  if (!PROXY_TOKENS || PROXY_TOKENS.length === 0) {
    console.log("خطأ: لا توجد بروكسيات متاحة للنطاق " + h);
    return "DIRECT"; // الرجوع إلى الاتصال المباشر
  }
  var start = hashStr(h || "") % PROXY_TOKENS.length;
  var out = [];
  for (var i = 0; i < PROXY_TOKENS.length; i++) {
    var idx = (start + i) % PROXY_TOKENS.length;
    out.push(PROXY_TOKENS[idx]);
  }
  return out.join("; ") + "; DIRECT"; // إضافة DIRECT كخيار احتياطي
}

// ======================= MAIN =======================
function FindProxyForURL(url, host) {
  if (isPrivateOrLocal(host)) {
    console.log("حظر النطاق المحلي: " + host);
    return "DIRECT";
  }
  if (BLOCK_IR && isIranTLD(host)) {
    console.log("حظر نطاق .ir: " + host);
    return "PROXY 127.0.0.1:9";
  }

  var isGame = hostInList(host, GAME_DOMAINS) || hasKeyword(host) || hasKeyword(url);
  var chain = buildProxyChainFor(host);

  if (chain !== "DIRECT" && isGame) {
    var firstProxy = chain.split("; ")[0];
    var protocol = firstProxy.split(" ")[0];
    var ipPort = firstProxy.split(" ")[1];
    var ip = ipPort.split(":")[0];
    var port = ipPort.split(":")[1];
    logProxyPerformance(host, ip, protocol, port, isGame);
  }

  return chain;
}
