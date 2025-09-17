// ========================
// PAC: PUBG via proxy only
// يمنع التقطيع بجعل النظامي DIRECT دائماً
// ========================

var PRIMARY = "PROXY 91.109.106.12:1080";
var BACKUP  = "PROXY 91.109.106.12:443";   // بديل للأجهزة/الشبكات الضعيفة
var PROXY_CHAIN = PRIMARY + "; " + BACKUP + "; DIRECT";

// ——— شبكات/أسماء محلية
var LOCAL_BYPASS = ["*.local","*.lan","*.home","*.router","*.gateway","localhost"];
var PRIVATE_NETS = [
  ["10.0.0.0","255.0.0.0"],
  ["172.16.0.0","255.240.0.0"],
  ["192.168.0.0","255.255.0.0"],
  ["127.0.0.0","255.0.0.0"]
];

// ——— PUBG فقط على البروكسي
var PUBG = [
  "*.pubgmobile.com","*.igamecj.com","*.igamepubg.com",
  "*.tencent.com","*.tencentgames.com","*.tencentyun.com",
  "*.qcloud.com","*.qcloudcdn.com","*.gtimg.com",
  "*.gcloud.qq.com","*.game.qq.com","*.cdn-ota.qq.com",
  "*.cdngame.tencentyun.com","*.akamaized.net","*.vtcdn.com"
];

// ——— استثناءات نظام iOS/Android (دائمًا DIRECT حتى لا يقطع النت)
var CONNECTIVITY = [
  // Apple Wi-Fi check / خدمات أساسية
  "captive.apple.com","*.apple.com","*.icloud.com","*.mzstatic.com",
  "gsa.apple.com","init.itunes.apple.com","gs.apple.com",
  // Google Android/Chrome connectivity checks
  "connectivitycheck.gstatic.com","clients3.google.com","clients4.google.com",
  "mtalk.google.com","play.googleapis.com","android.clients.google.com",
  // Microsoft (لو على ويندوز/كمبيوتر)
  "www.msftconnecttest.com","msftconnecttest.com","www.msftncsi.com","msftncsi.com"
];

// ——— ترافيك ثقيل/شائع (خليه DIRECT)
var HEAVY = [
  "*.youtube.com","*.googlevideo.com",
  "*.whatsapp.net","*.whatsapp.com",
  "*.facebook.com","*.fbcdn.net","*.messenger.com",
  "*.shahid.net","*.shahid.com","*.mbc.net"
];

// Helpers
function inList(host, arr){
  host = (host||"").toLowerCase();
  for (var i=0;i<arr.length;i++){ if (shExpMatch(host, arr[i].toLowerCase())) return true; }
  return false;
}
function isIPv4(h){ return /^\d{1,3}(\.\d{1,3}){3}$/.test(h||""); }
function isIPv6(h){ return h && h.indexOf(":")!==-1 && h.indexOf(".")===-1; }
function isInPrivateNet(ip){
  for (var i=0;i<PRIVATE_NETS.length;i++){ if (isInNet(ip, PRIVATE_NETS[i][0], PRIVATE_NETS[i][1])) return true; }
  return false;
}

function FindProxyForURL(url, host) {
  if (isPlainHostName(host) || inList(host, LOCAL_BYPASS)) return "DIRECT";

  var ip = null;
  if (!isIPv6(host)) {
    try { ip = dnsResolve(host); } catch(e) { ip = null; }
    if (ip && isInPrivateNet(ip)) return "DIRECT";
  }

  // لا تمرر فحوصات الاتصال والخدمات الأساسية على البروكسي
  if (inList(host, CONNECTIVITY)) return "DIRECT";

  // لعبة ببجي وخدماتها عبر البروكسي، مع DIRECT كملاذ أخير لمنع انقطاع كامل
  if (inList(host, PUBG)) return PROXY_CHAIN;

  // ترافيك ثقيل/فيديو ومراسلة يظل DIRECT
  if (inList(host, HEAVY)) return "DIRECT";

  // طلبات بعنوان IP مباشرة: خلها DIRECT لمنع التقطيع
  if (isIPv4(host) || isIPv6(host)) return "DIRECT";

  // البقية DIRECT لتجنّب تحميل البروكسي وتعطيله
  return "DIRECT";
}
