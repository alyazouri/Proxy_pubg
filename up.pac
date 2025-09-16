// ===================== Jordan-first PUBG PAC (FINAL - SOCKS5 Only) =====================
// يقلّد سلوك Gear Up: يوجّه نطاقات PUBG عبر SOCKS5 الأردني مع دوران واحتياطي.
// ملاحظة: لا يستخدم خوادم Gear Up؛ يعتمد على بروكسياتك.

// ----------[CONFIG]----------
var USE_SOCKS = true;            // تفعيل SOCKS5
var USE_SOCKS_SAFWAH = true;     // وضع الصفّاح (تحسينات ودوران)
var FORCE_ALL = false;           // true = توجيه كل الترافيك عبر البروكسي

// (إبقاء القائمة الأصلية كمرجع؛ لن تُستخدم عند تفعيل SOCKS5)
var JO_PROXIES = [
  ["91.106.109.12", 8085]
];

// قائمة بروكسيات SOCKS5 (9050 أولاً ثم 1080)
var JO_PROXIES_SOCKS = [
  ["91.106.109.12", 9050],
  ["91.106.109.12", 1080]
];

// خيار يضمن أن ترافيك PUBG يمر عبر SOCKS5 فقط (لا HTTP بالخطأ)
var ENFORCE_SOCKS5_FOR_PUBG = true;

// ----------[DOMAINS]----------
// نطاقات PUBG + بعض شبكات CDN الشائعة
var PUBG = [
  "*.pubgmobile.com","*.cdn.pubgmobile.com","*.igamecj.com","*.proximabeta.com",
  "*.tencent.com","*.tencentgames.com","*.qcloud.com","*.qcloudcdn.com",
  "*.gcloud.qq.com","*.akamaized.net","*.akadns.net","*.alicdn.com",
  "*.cdn77.com","*.bytecdn.cn","*.vtcdn.com"
];

// مواقع تُترك DIRECT دائمًا
var EXEMPT = [
  "*.local","localhost",
  "*.youtube.com","*.googlevideo.com","*.ytimg.com",
  "*.facebook.com","*.fbcdn.net","*.messenger.com",
  "*.whatsapp.com","*.whatsapp.net","*.instagram.com","*.tiktokcdn.com",
  "*.netflix.com","*.nflxvideo.net","*.shahid.net","*.shahid.mbc.net","*.shahid.com",
  "*.apple.com","*.icloud.com","*.mzstatic.com","*.google.com","*.gvt1.com","*.gstatic.com",
  "*.microsoft.com","*.windowsupdate.com"
];

// شبكات محلية تُترك DIRECT
var LAN = [
  ["10.0.0.0","255.0.0.0"],
  ["172.16.0.0","255.240.0.0"],
  ["192.168.0.0","255.255.0.0"],
  ["127.0.0.0","255.0.0.0"]
];

// ----------[HELPERS]----------
function nowSec(){ return Math.floor((new Date()).getTime()/1000); }

// يبني سلسلة احتياطية مع دوران كل 60 ثانية
function pickProxyChain(list){
  var baseIdx = Math.floor(nowSec()/60) % list.length;
  var chain = [];
  for (var i=0;i<list.length;i++){
    var idx = (baseIdx + i) % list.length;
    chain.push("SOCKS " + list[idx][0] + ":" + list[idx][1]);
  }
  chain.push("DIRECT");
  return chain.join("; ");
}

function anyMatch(list, host){
  for (var i=0;i<list.length;i++){
    var pat = list[i];
    if (shExpMatch(host,pat)) return true;
    if (pat.indexOf("*.")===0 && dnsDomainIs(host,pat.substring(2))) return true;
    if (host===pat) return true;
  }
  return false;
}

function isLAN(host){
  if (isPlainHostName(host)) return true;
  var ip = dnsResolve(host);
  if (ip){
    for (var i=0;i<LAN.length;i++){
      if (isInNet(ip,LAN[i][0],LAN[i][1])) return true;
    }
  }
  return false;
}

function pickProxy(){
  // SOCKS5 فقط عند تفعيل الصفّاح/السلوك الحالي
  return pickProxyChain(JO_PROXIES_SOCKS);
}

// ----------[MAIN]----------
function FindProxyForURL(url,host){
  var h = host ? host.toLowerCase() : host;

  // LAN & مواقع مستثناة
  if (isLAN(h) || anyMatch(EXEMPT,h)) return "DIRECT";

  // نمط شامل (اختياري)
  if (FORCE_ALL) return pickProxy();

  // توجيه PUBG فقط عبر SOCKS5 الأردني
  if (anyMatch(PUBG,h)) {
    if (ENFORCE_SOCKS5_FOR_PUBG) {
      // يضمن SOCKS5 حصراً حتى لو كانت قائمة HTTP موجودة
      return pickProxyChain(JO_PROXIES_SOCKS);
    }
    return pickProxy();
  }

  // غير ذلك: مباشر
  return "DIRECT";
}
