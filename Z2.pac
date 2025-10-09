// PAC — Ultra-Strict Jordan Lobby (Blackhole non-JO lobby targets)
var PROXY_HOST = "91.106.109.12";

// Lobby (منافسات التجنيد) — بنية تلائم خروج أردني قوي
var LOBBY_PORTS = [8443, 9050, 9200, 9443];

// Match (داخل اللعبة) — استخدام منفصل للاستقرار أثناء اللعب
var MATCH_PORTS = [5090, 5200, 7300, 8088, 8500];

// دومينات التجنيد/اللوبي الشائعة
var LOBBY_DOMAINS = [
  "api.pubgmobile.com",
  "me-hl.pubgmobile.com",
  "match.pubg.com",
  "pubgmobile.live",
  "igamecj.com",
  "gpubgm.com"
];

// دومينات الماتش/CDN
var MATCH_DOMAINS = [
  "*.pubgmcdn.com",
  "*.tencentcloud.com",
  "*.tencentgames.com",
  "cloud.gpubgm.com",
  "game.pubgmobile.com"
];

// --- أهم كتلات IPv4/IPv6 أردنية (قابلة للتعديل لاحقاً) ---
var JO_IPV4 = [
  { ip: "185.34.16.0", mask: "255.255.252.0" },  // Orange / general examples
  { ip: "188.247.64.0", mask: "255.255.192.0" }, // Zain-ish block
  { ip: "95.141.32.0",  mask: "255.255.240.0" }  // Umniah-ish block
];
// IPv6 example (PAC engines vary in IPv6 support)
var JO_IPV6 = [
  { ip: "2a13:a5c7::", mask: "ffff:ffff:ffff:ffff::" }
];

// --- Helpers ---
function inList(h, patterns) {
  h = h.toLowerCase();
  for (var i = 0; i < patterns.length; i++) if (shExpMatch(h, patterns[i])) return true;
  return false;
}
function hsh(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h < 0 ? -h : h;
}
function rotate(arr, k) {
  var n = arr.length; if (!n) return arr;
  k = k % n; if (k === 0) return arr.slice(0);
  return arr.slice(k).concat(arr.slice(0, k));
}
function buildChain(ports, key) {
  var order = rotate(ports, hsh(key) % ports.length);
  var out = [];
  for (var i = 0; i < order.length; i++) out.push("SOCKS5 " + PROXY_HOST + ":" + order[i]);
  return out.join("; ");
}

// --- Geo-check: هل الـ IP الذي حلّناه يقع داخل كتلات الأردن؟ ---
function ipIsInJordan(ip) {
  if (!ip) return false;
  // IPv4 checks via isInNet
  for (var i = 0; i < JO_IPV4.length; i++) {
    if (isInNet(ip, JO_IPV4[i].ip, JO_IPV4[i].mask)) return true;
  }
  // IPv6: بعض محركات PAC قد لا تدعم isInNet على IPv6 بشكل صحيح;
  // نحاول أيضاً مقارنة مباشرة (works only on some engines)
  for (var j = 0; j < JO_IPV6.length; j++) {
    try {
      if (isInNet(ip, JO_IPV6[j].ip, JO_IPV6[j].mask)) return true;
    } catch (e) {}
  }
  return false;
}

// --- رئيسية FindProxyForURL ---
function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  // 1) لوبي — حنحاول نحل الـ host ونشوف إذا IP ضمن الأردن
  if (inList(host, LOBBY_DOMAINS) || shExpMatch(host, "*.jo") || shExpMatch(host, "*jordan*")) {
    // نجرب الوصول إلى IP للدومين
    var resolved = null;
    try { resolved = dnsResolve(host); } catch (e) { resolved = null; }

    // لو حلّنا وطلعت أردنية => نوجّه للّوبي الطبيعي (Jordan exit)
    if (resolved && ipIsInJordan(resolved)) {
      return buildChain(LOBBY_PORTS, host);
    }

    // لو مش أردنية أو لم نستطع حلّها => نعمل BLACKHOLE
    // هذا السطر يُسقِط الاتصال على هذا المسار ويجبر اللعبة تعيد محاولة/تبحث عن خوادم أخرى
    return "PROXY 127.0.0.1:9";
  }

  // 2) WebSocket أو دومينات الماتش => توجيه لمجموعة الماتش (ثبات أثناء اللعب)
  if (inList(host, MATCH_DOMAINS) || url.substring(0,5) === "wss://" || url.substring(0,5) === "ws://")
    return buildChain(MATCH_PORTS, host);

  // 3) افتراضي — إذا هو نطاق أردني
  if (shExpMatch(host, "*.jo") || shExpMatch(host, "*jordan*"))
    return buildChain(LOBBY_PORTS, host);

  // 4) باقي الحالات: رُدّ افتراضياً للماتش
  return buildChain(MATCH_PORTS, host);
}
