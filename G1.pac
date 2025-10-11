// Jorammannn-fixed-robust-ports.pac
// نسخة معززة لتوجيه حركة مرور PUBG إلى بروكسي أردني مع دعم بورتات 20001 و20003
// ملاحظة: PAC يدعم TCP فقط. لـ UDP (مطلوب للألعاب)، استخدم Shadowsocks أو V2Ray مع SOCKS5 على 127.0.0.1:1080.
// تحسينات: ترتيب الشروط للسرعة، DNS cache، failover، shExpMatch للدومينات، ومعالجة أخطاء قوية.

// === CONFIG ===
// بروكسيات مع failover
var PROXIES = [
  "SOCKS5 91.106.109.12:1080",
  "SOCKS5 91.106.109.50:1080"
];
var ROTATE_INTERVAL_MS = 45000; // تدوير كل 45 ثانية
var FORCE_ALL_TO_PROXY = true; // إجبار كل الإنترنت عبر البروكسي
var ALLOW_DIRECT_FOR_COMMON = false; // السماح بالاتصال المباشر للدومينات العامة

// نطاقات IP محلية وغير routable (RFC 3330)
var LOCAL_IP_RANGES = [
  "0.0.0.0/8", "10.0.0.0/8", "127.0.0.0/8", "169.254.0.0/16",
  "172.16.0.0/12", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16",
  "198.18.0.0/15", "224.0.0.0/4", "240.0.0.0/4"
];

// دومينات محلية شائعة
var LOCAL_HOST_PATTERNS = ["localhost", "*.local", "*.lan"];

// دومينات PUBG (بأنماط shExpMatch للسرعة)
var GAME_DOMAINS = [
  "*pubgmobile.com", "*tencentgames.com", "*qcloud.com", "*tencentyun.com",
  "*gtimg.com", "*game.qq.com", "*qcloudcdn.com", "*cdngame.tencentyun.com",
  "*cdn-ota.qq.com", "*igamecj.com", "*igamepubg.com", "*proximabeta.com"
];

// كلمات مفتاحية للألعاب (أنماط shExpMatch)
var GAME_KEYWORDS = [
  "*pubg*", "*tencent*", "*igame*", "*proximabeta*", "*qcloud*",
  "*tencentyun*", "*gameloop*", "*match*", "*squad*", "*party*", "*team*", "*rank*"
];

// بورتات الألعاب (محددة: 20001 و20003 فقط)
var GAME_PORTS = [20001, 20003];

// === UTILITIES ===
function now() { return (new Date()).getTime(); }

// Cache لـ DNS مع تنظيف
var dnsCache = {};
function resolveWithCache(host) {
  if (dnsCache[host]) return dnsCache[host];
  try {
    var ip = dnsResolve(host);
    if (ip) {
      dnsCache[host] = ip;
      setTimeout(function() { delete dnsCache[host]; }, 60000); // تنظيف بعد دقيقة
    }
    return ip;
  } catch (e) {
    return null;
  }
}

// تدوير ذكي مع random لتوزيع الحمل
var lastRotate = 0;
var rotateIndex = 0;
function getRotatedProxy() {
  var t = now();
  if (t - lastRotate > ROTATE_INTERVAL_MS) {
    rotateIndex = Math.floor(Math.random() * PROXIES.length); // random لتوزيع أفضل
    lastRotate = t;
  }
  // إضافة failover: "PROXY1; PROXY2"
  return PROXIES.join("; ");
}

// مطابقة باستخدام shExpMatch للسرعة
function hostMatchesAny(host, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (shExpMatch(host, arr[i])) return true;
  }
  return false;
}

// التحقق من بورتات الألعاب (محددة: 20001 و20003)
function portMatchesGame(url) {
  var colonIndex = url.lastIndexOf(":");
  if (colonIndex !== -1) {
    var portStr = url.substring(colonIndex + 1);
    var port = parseInt(portStr, 10);
    if (!isNaN(port)) {
      return GAME_PORTS.indexOf(port) !== -1; // تحقق مباشر من البورتات
    }
  }
  return false;
}

// تسجيل الأخطاء
function log(message) {
  alert("[PAC Log] " + message); // أو console.log إذا في بيئة تطوير
}

// === MAIN ===
function FindProxyForURL(url, host) {
  try {
    // تحويل إلى lowercase للتوافق (سريع)
    url = url.toLowerCase();
    host = host.toLowerCase();

    // تحققات سريعة أولاً: plain hostname أو local patterns => DIRECT
    if (isPlainHostName(host) || hostMatchesAny(host, LOCAL_HOST_PATTERNS)) {
      return "DIRECT";
    }

    // دومينات الألعاب أو كلمات مفتاحية => بروكسي
    if (hostMatchesAny(host, GAME_DOMAINS) || hostMatchesAny(host, GAME_KEYWORDS)) {
      log("Routing " + host + " to proxy for game domain");
      return getRotatedProxy();
    }

    // بورتات الألعاب (20001، 20003) => بروكسي (TCP فقط؛ UDP يحتاج Shadowsocks/VPN)
    if (portMatchesGame(url)) {
      log("Routing " + url + " to proxy for game port (20001 or 20003)");
      return getRotatedProxy();
    }

    // DNS resolve مع cache، ثم تحقق IPs محلية/غير routable
    var ip = resolveWithCache(host);
    if (ip) {
      for (var i = 0; i < LOCAL_IP_RANGES.length; i++) {
        var range = LOCAL_IP_RANGES[i].split("/");
        if (isInNet(ip, range[0], cidrToMask(parseInt(range[1], 10)))) {
          return "DIRECT";
        }
      }
    } else {
      // إذا فشل DNS => بروكسي كـ fallback
      log("DNS resolution failed for " + host + ", using proxy");
      return getRotatedProxy();
    }

    // إجبار كل الإنترنت عبر البروكسي إذا مفعل
    if (FORCE_ALL_TO_PROXY) {
      return getRotatedProxy();
    }

    return "DIRECT";
  } catch (e) {
    log("Error processing " + host + ": " + e.message);
    return "DIRECT"; // fallback آمن
  }
}

// دالة لتحويل CIDR إلى mask (لـ isInNet)
function cidrToMask(cidr) {
  var mask = "";
  for (var i = 0; i < 4; i++) {
    var n = Math.min(cidr, 8);
    mask += (256 - Math.pow(2, 8 - n)).toString();
    if (i < 3) mask += ".";
    cidr -= n;
  }
  return mask;
}
