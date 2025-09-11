// Jorammannn-fixed.pac
// نسخة محسنة — توجيه مرور PUBG وكل الإنترنت إلى بروكسي أردني
// ملاحظة: PAC لا يضمن توجيه UDP. لاستخدام UDP (ألعاب) يفضل SOCKS5 مع UDP أو VPN.

// === CONFIG ===
var JORDAN_PROXY = "SOCKS5 200.63.65.128:8080";   // بروكسي أردني أساسي
var FALLBACK_PROXIES = [
  "SOCKS5 200.63.65.128:8080"                     // بروكسي أردني احتياطي
];
var ROTATE_INTERVAL_MS = 45000; // تدوير كل 45 ثانية بين البروكسيات
var FORCE_ALL_TO_PROXY = true;  // true = إجبار كل الإنترنت عبر البروكسي
var ALLOW_DIRECT_FOR_COMMON = false; // false = لا يخرج أي ترافيك مباشر

// نطاقات IP محلية شائعة (LAN)
var LOCAL_HOST_PATTERNS = ["localhost", ".local", ".lan"];

// دومينات PUBG وخدمات Tencent
var GAME_DOMAINS = [
  "pubgmobile.com", "tencentgames.com", "qcloud.com", "tencentyun.com",
  "gtimg.com", "game.qq.com", "qcloudcdn.com", "cdngame.tencentyun.com",
  "cdn-ota.qq.com", "igamecj.com", "igamepubg.com", "proximabeta.com"
];

// كلمات مفتاحية مرتبطة باللعبة
var GAME_KEYWORDS = [
  "pubg","tencent","igame","proximabeta","qcloud",
  "tencentyun","gameloop","match","squad","party","team","rank"
];

// نطاقات البورتات للألعاب (TCP/UDP)
var GAME_PORTS = [
  [12000, 12443],
  [15000, 15071],
  [16000, 16050],
  [17000, 17774],
  [18000, 18199],
  [18888, 19240],
  [19443, 19999],
  [20000, 20207],
  [20600, 20903]
];

// ===== utilities =====
function toLower(s){ return (s||"").toLowerCase(); }
function now(){ return (new Date()).getTime(); }

var lastRotate = 0;
var rotateIndex = 0;
function getRotatedProxy() {
  var t = now();
  if (t - lastRotate > ROTATE_INTERVAL_MS) {
    rotateIndex = (rotateIndex + 1) % (1 + FALLBACK_PROXIES.length);
    lastRotate = t;
  }
  if (rotateIndex === 0) return JORDAN_PROXY;
  return FALLBACK_PROXIES[rotateIndex-1];
}

function hostMatchesAny(host, arr) {
  for (var i=0;i<arr.length;i++){
    var d = arr[i].toLowerCase();
    if (d.charAt(0)===".") {
      if (host===d.slice(1) || host.endsWith(d)) return true;
    } else {
      if (host.indexOf(d) !== -1) return true;
    }
  }
  return false;
}

function portMatchesGame(url) {
  if (url.indexOf(":") !== -1) {
    var port = parseInt(url.substring(url.lastIndexOf(":") + 1));
    for (var i=0; i<GAME_PORTS.length; i++) {
      if (port >= GAME_PORTS[i][0] && port <= GAME_PORTS[i][1]) {
        return true;
      }
    }
  }
  return false;
}

// ===== main =====
function FindProxyForURL(url, host) {
  host = toLower(host);

  // LAN أو localhost => DIRECT
  if (isPlainHostName(host) || hostMatchesAny(host, LOCAL_HOST_PATTERNS)) {
    return "DIRECT";
  }

  // دومينات اللعبة أو كلماتها => بروكسي
  if (hostMatchesAny(host, GAME_DOMAINS) || hostMatchesAny(host, GAME_KEYWORDS)) {
    return getRotatedProxy();
  }

  // إذا الرابط يحتوي على بورت ضمن نطاقات الألعاب => بروكسي
  if (portMatchesGame(url)) {
    return getRotatedProxy();
  }

  // محاولة DNS → لو IP LAN => DIRECT
  try {
    var ip = dnsResolve(host);
    if (ip && ip.indexOf(":") === -1) {
      if (isInNet(ip, "10.0.0.0", "255.0.0.0") ||
          isInNet(ip, "192.168.0.0", "255.255.0.0") ||
          isInNet(ip, "172.16.0.0", "255.240.0.0")) {
        return "DIRECT";
      }
    }
  } catch (e) {}

  // كل شيء غير الألعاب:
  if (FORCE_ALL_TO_PROXY) {
    return getRotatedProxy(); // إجباري عبر البروكسي
  }

   return "PROXY 200.63.65.128:8080";
}
