// ===================== Jordan-first PUBG PAC (SOCKS5 - مع بدائل JO عامة) =====================
// يوجّه نطاقات PUBG عبر SOCKS5 الأردني باستخدام بورت 1080 وبروكسيات بديلة من القوائم العامة.

// ----------[CONFIG]----------
var USE_SOCKS = true;           
var USE_SOCKS_SAFWAH = true;    
var FORCE_ALL = false;

var JO_PROXIES = [
  ["91.106.109.12", 8085] // مرجع فقط (غير مستخدم عند SOCKS5)
];

// SOCKS5 أساسي + بدائل أردنية عامة
var JO_PROXIES_SOCKS = [
  ["91.106.109.12", 1080],   // أساسي خاص بك

  // بدائل عامة (قد تتغير فعاليتها)
  ["185.51.215.229", 1080],
  ["213.186.179.175", 43603],
  ["213.186.179.175", 29939],
  ["213.186.179.175", 16641],
  ["213.186.179.175", 26133]
];

// يضمن أن ترافيك PUBG يمر عبر SOCKS5 فقط
var ENFORCE_SOCKS5_FOR_PUBG = true;

// ----------[DOMAINS]----------
var PUBG = [
  "*.pubgmobile.com","*.cdn.pubgmobile.com","*.igamecj.com","*.proximabeta.com",
  "*.tencent.com","*.tencentgames.com","*.qcloud.com","*.qcloudcdn.com",
  "*.gcloud.qq.com","*.akamaized.net","*.akadns.net","*.alicdn.com",
  "*.cdn77.com","*.bytecdn.cn","*.vtcdn.com"
];

var EXEMPT = [
  "*.local","localhost",
  "*.youtube.com","*.googlevideo.com","*.ytimg.com",
  "*.facebook.com","*.fbcdn.net","*.messenger.com",
  "*.whatsapp.com","*.whatsapp.net","*.instagram.com","*.tiktokcdn.com",
  "*.netflix.com","*.nflxvideo.net","*.shahid.net","*.shahid.mbc.net","*.shahid.com",
  "*.apple.com","*.icloud.com","*.mzstatic.com","*.google.com","*.gvt1.com","*.gstatic.com",
  "*.microsoft.com","*.windowsupdate.com"
];

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
  return pickProxyChain(JO_PROXIES_SOCKS);
}

// ----------[MAIN]----------
function FindProxyForURL(url,host){
  var h = host ? host.toLowerCase() : host;
  if (isLAN(h) || anyMatch(EXEMPT,h)) return "DIRECT";
  if (FORCE_ALL) return pickProxy();
  if (anyMatch(PUBG,h)){
    if (ENFORCE_SOCKS5_FOR_PUBG){
      return pickProxyChain(JO_PROXIES_SOCKS);
    }
    return pickProxy();
  }
  return "DIRECT";
}
