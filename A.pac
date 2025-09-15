// ==========================================================
// PAC - Jordan-first routing for PUBG-related traffic (HTTP/HTTPS)
// ملاحظة: PAC لا يوجّه UDP ولا يضمن تغيير المطابقة داخل اللعبة.
// ==========================================================

// ------------------------ FLAGS ---------------------------
var FORCE_ALL      = false;  // true: مرّر كل شيء عبر البروكسي ما عدا الاستثناءات
var FORBID_DIRECT  = false;  // true: لا تستخدم DIRECT إطلاقاً إلا لو كل البروكسيات فشلت
var BLOCK_IR_TLD   = true;   // true: حظر نطاقات .ir
var ENABLE_SOCKS   = false;  // فعِّله فقط إذا لديك SOCKS فعّال
var ENABLE_HTTP    = true;   // إبقِه true للـ HTTP(S)

// -------------------- PROXY POOL (Your proxy) -------------
// فقط بروكسيك 154.159.243.117 على بورت 443
var PROXIES = [
  { ip: "154.159.243.117", http: [443], socks: [] }
  // يمكنك إضافة بروكسيات احتياطية هنا لاحقاً بنفس البنية
];

// --------------------- LOCAL EXCEPTIONS --------------------
var LOCAL_BYPASS = [
  "*.local", "*.lan", "*.home",
  "*.router", "*.gateway",
  "localhost"
];

// شبكات خاصة
var PRIVATE_NETS = [
  ["10.0.0.0",    "255.0.0.0"],
  ["172.16.0.0",  "255.240.0.0"],
  ["192.168.0.0", "255.255.0.0"],
  ["127.0.0.0",   "255.0.0.0"]
];

// --------------------- PUBG / SERVICES --------------------
var PUBG_DOMAINS = [
  // PUBG / Tencent
  "*.pubgmobile.com","*.igamecj.com","*.igamepubg.com","*.tencent.com",
  "*.tencentgames.com","*.tencentyun.com","*.qcloud.com","*.qcloudcdn.com",
  "*.gtimg.com","*.gcloud.qq.com","*.game.qq.com","*.cdn-ota.qq.com",
  "*.cdngame.tencentyun.com","*.akamaized.net","*.vtcdn.com",

  // Google services (قد تُستخدم لتسجيل الدخول/إشعارات)
  "*.googleapis.com","*.gstatic.com","*.googleusercontent.com","play.googleapis.com",
  "mtalk.google.com","android.clients.google.com","firebaseinstallations.googleapis.com",

  // Apple (Game Center / Auth / AppStore)
  "*.apple.com","*.icloud.com","gamecenter.apple.com","gamekit.apple.com","apps.apple.com",

  // شبكات اجتماعية (احياناً للتسجيل/التحقق)
  "*.x.com","*.twitter.com","api.x.com","api.twitter.com","abs.twimg.com","pbs.twimg.com","t.co"
];

// استثناءات إعلام/فيديو ومراسلة (تبقى DIRECT لتحسين التجربة العامة)
var GLOBAL_EXCLUDES = [
  "*.youtube.com","*.googlevideo.com",
  "*.whatsapp.net","*.whatsapp.com",
  "*.facebook.com","*.fbcdn.net","*.messenger.com",
  "*.shahid.net","*.shahid.com","*.mbc.net"
];

// ==========================================================
// Helpers
// ==========================================================
function isIPv6Literal(h) {
  return h && h.indexOf(":") !== -1 && h.indexOf(".") === -1;
}
function bracketHost(ip) {
  return isIPv6Literal(ip) ? "[" + ip + "]" : ip;
}
function isPlainIPv4(h) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(h || "");
}
function inList(host, arr) {
  host = (host || "").toLowerCase();
  for (var i=0;i<arr.length;i++) { if (shExpMatch(host, arr[i])) return true; }
  return false;
}
function privateNet(host) {
  var ip = dnsResolve(host);
  if (!ip) return false;
  for (var i=0;i<PRIVATE_NETS.length;i++) {
    if (isInNet(ip, PRIVATE_NETS[i][0], PRIVATE_NETS[i][1])) return true;
  }
  return false;
}
function hashStr(s) { // بسيط وثابت
  s = s || "";
  var h = 0;
  for (var i=0;i<s.length;i++) { h = ((h<<5) - h) + s.charCodeAt(i); h|=0; }
  return (h >>> 0);
}
function buildProxyChain(host) {
  // ترتيب مستقر بالاعتماد على hash(host) لتقليل تقلب المسار
  var order = [];
  for (var i=0;i<PROXIES.length;i++) order.push(i);
  var seed = hashStr(host);
  order.sort(function(a,b){ return ((a*1103515245+seed)>>>1) - ((b*1103515245+seed)>>>1); });

  var tokens = [];
  for (var k=0;k<order.length;k++) {
    var p = PROXIES[ order[k] ];
    if (ENABLE_HTTP && p.http && p.http.length) {
      for (var j=0;j<p.http.length;j++) tokens.push("PROXY " + bracketHost(p.ip) + ":" + p.http[j]);
    }
    if (ENABLE_SOCKS && p.socks && p.socks.length) {
      for (var t=0;t<p.socks.length;t++) tokens.push("SOCKS " + bracketHost(p.ip) + ":" + p.socks[t]);
    }
  }
  if (!FORBID_DIRECT) tokens.push("DIRECT");
  return tokens.join("; ");
}
function isIR(host) {
  host = (host || "").toLowerCase();
  return host.endsWith(".ir") || shExpMatch(host, "*.ir");
}

// ==========================================================
// Main
// ==========================================================
function FindProxyForURL(url, host) {
  host = host || "";

  // 0) bypass للأسماء/الشبكات المحلية
  if (isPlainHostName(host) || inList(host, LOCAL_BYPASS) || privateNet(host)) {
    return "DIRECT";
  }

  // 1) حظر نطاقات .ir عند التفعيل
  if (BLOCK_IR_TLD && isIR(host)) {
    return "DIRECT";
  }

  // 2) استثناءات عالمية (فيديو/مراسلة) دائماً DIRECT
  if (inList(host, GLOBAL_EXCLUDES)) {
    return "DIRECT";
  }

  // 3) إن كان ضمن نطاقات PUBG/الخدمات المساندة -> مرّره عبر البروكسي
  if (inList(host, PUBG_DOMAINS)) {
    return buildProxyChain(host);
  }

  // 4) التعامل مع الروابط عبر IP مباشر
  if (isPlainIPv4(host)) {
    return FORCE_ALL ? buildProxyChain(host) : (FORBID_DIRECT ? buildProxyChain(host) : "DIRECT");
  }

  // 5) باقي الترافيك
  if (FORCE_ALL) {
    return buildProxyChain(host);
  } else {
    return FORBID_DIRECT ? buildProxyChain(host) : "DIRECT";
  }
}
