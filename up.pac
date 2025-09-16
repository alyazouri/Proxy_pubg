// ===================== Jordan-first PUBG PAC (SOCKS5 فقط - Final) =====================
// يقلّد سلوك Gear Up: يوجّه نطاقات PUBG عبر SOCKS5 الأردني مع دوران واحتياطي.
// لا يستخدم خوادم Gear Up الفعلية — يعتمد على بروكسياتك فقط.

// ----------[CONFIG]----------
var USE_SOCKS = true;           // تفعيل SOCKS5
var USE_SOCKS_SAFWAH = true;    // إبقاء وضع الصفّاح مفعّل
var FORCE_ALL = false;          // true = يمرر كل الترافيك عبر البروكسي

// قائمة بروكسيات HTTP الأصلية (موجودة كمرجع فقط، لن تُستخدم عند تفعيل SOCKS5)
var JO_PROXIES = [
  ["91.106.109.12", 8085]
];

// قائمة بروكسيات SOCKS5 الفعلية (رتّب من الأفضل للأسوأ)
var JO_PROXIES_SOCKS = [
  ["91.106.109.12", 1080],  // أساسي
  ["91.106.109.12", 9050]   // بديل
];

// ----------[DOMAINS]----------
// نطاقات PUBG الأساسية + CDN شائعة
var PUBG = [
  "*.pubgmobile.com","*.cdn.pubgmobile.com","*.igamecj.com","*.proximabeta.com",
  "*.tencent.com","*.tencentgames.com","*.qcloud.com","*.qcloudcdn.com",
  "*.gcloud.qq.com","*.akamaized.net","*.akadns.net","*.alicdn.com",
  "*.cdn77.com","*.bytecdn.cn","*.vtcdn.com"
];

// مواقع تُترك مباشرة
var EXEMPT = [
  "*.local","localhost",
  "*.youtube.com","*.googlevideo.com","*.ytimg.com",
  "*.facebook.com","*.fbcdn.net","*.messenger.com",
  "*.whatsapp.com","*.whatsapp.net","*.instagram.com","*.tiktokcdn.com",
  "*.netflix.com","*.nflxvideo.net","*.shahid.net","*.shahid.mbc.net","*.shahid.com",
  "*.apple.com","*.icloud.com","*.mzstatic.com","*.google.com","*.gvt1.com","*.gstatic.com",
  "*.microsoft.com","*.windowsupdate.com"
];

// شبكات محلية
var LAN = [
  ["10.0.0.0","255.0.0.0"],
  ["172.16.0.0","255.240.0.0"],
  ["192.168.0.0","255.255.0.0"],
  ["127.0.0.0","255.0.0.0"]
];

// ----------[HELPERS]----------
function nowSec(){ return Math.floor((new Date()).getTime()/1000); }

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
  // يعمل فقط على SOCKS5 عند تفعيل الصفّاح
  return pickProxyChain(JO_PROXIES_SOCKS);
}

// ----------[MAIN]----------
function FindProxyForURL(url,host){
  var h = host ? host.toLowerCase() : host;
  if (isLAN(h) || anyMatch(EXEMPT,h)) return "DIRECT";
  if (FORCE_ALL) return pickProxy();
  if (anyMatch(PUBG,h)) return pickProxy();
  return "DIRECT";
}
