// Jordan-first: force lobby/recruit/match traffic through MATCH proxies (20001/20002)
// No DIRECT for game traffic

var PROXY_MATCH_PRIMARY = "SOCKS5 91.106.109.12:20001";
var PROXY_MATCH_BACKUP  = "SOCKS5 91.106.109.12:20002";
var PROXY_LOBBY_PRIMARY = "SOCKS5 91.106.109.12:5000";
var PROXY_LOBBY_BACKUP  = "SOCKS5 91.106.109.12:8000";

var CHAIN_MATCH = PROXY_MATCH_PRIMARY + "; " + PROXY_MATCH_BACKUP;
var CHAIN_LOBBY = CHAIN_MATCH + "; " + PROXY_LOBBY_PRIMARY + "; " + PROXY_LOBBY_BACKUP;

var JO_HOSTS = [
  "*.jo",
  "*.local.jo",
  "*jordan*",
  "amman.*",
  "aqaba.*",
  "irbid.*"
];

// كلمات/نطاقات مخصّصة للتجنيد/دعوات الفريق (حاولت أضم أشهر الكلمات)
var RECRUIT_KEYS = [
  "*recruit*",
  "*invite*",
  "*party*",
  "*group*",
  "*team*"
];

var LOBBY_HOSTS = [
  "match.pubg.com",
  "api.pubg.com",
  "hl.pubg.com",
  "me-hl.pubgmobile.com",
  "*.pubgmobile.com",
  "*.gpubgm.com",
  "*.igamecj.com",
  "*.tencentgames.com",
  "*.tencent.com",
  "*.game.qq.com",
  "*.gcloud.qq.com",
  "*.qcloud.com",
  "*.tencentyun.com"
];

var MATCH_HOSTS = [
  "*.battlegroundsmobile.com",
  "*.pubgmcdn.com",
  "*.akamaiedge.net",
  "*.cloudfront.net",
  "*.akamaized.net",
  "*.vtcdn.com",
  "*.gtimg.com",
  "*.cdngame.tencentyun.com"
];

var JO_RANGES = [
  ["185.34.16.0","255.255.252.0"],
  ["188.247.64.0","255.255.192.0"],
  ["95.141.32.0","255.255.240.0"],
  ["109.107.0.0","255.255.0.0"],
  ["82.212.64.0","255.255.192.0"],
  // أضف هنا أي نطاق أردني ثاني عندك
];

if (typeof __PAC_CACHE === "undefined") __PAC_CACHE = { dns:{}, proxyForHost:{} };

function lc(s){ return (s||"").toLowerCase(); }
function inList(host,arr){ host=lc(host); for(var i=0;i<arr.length;i++){ if(shExpMatch(host,lc(arr[i]))) return true; } return false; }
function dnsResolveCached(host){
  try{
    var n=(new Date()).getTime();
    var e=__PAC_CACHE.dns[host];
    if(e && (n-e.t)<60000) return e.ip;
    var ip = dnsResolve(host);
    if(ip) __PAC_CACHE.dns[host]={ip:ip,t:n};
    return ip;
  }catch(ex){ return null; }
}
function isInJoRanges(ip){
  if(!ip) return false;
  for(var i=0;i<JO_RANGES.length;i++){
    if(isInNet(ip, JO_RANGES[i][0], JO_RANGES[i][1])) return true;
  }
  return false;
}
function hostHash(host){
  host=lc(host)||""; var h=2166136261;
  for(var i=0;i<host.length;i++){ h^=host.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
  return Math.abs(h);
}
function chooseProxyForHost(host, arr){ if(!arr||arr.length===0) return null; return arr[hostHash(host)%arr.length]; }

function FindProxyForURL(url, host){
  host = lc(host||"");
  if(__PAC_CACHE.proxyForHost[host]) return __PAC_CACHE.proxyForHost[host];

  // محلي/خدمات نظامية -> لا نغير (لكن نتمر بالـ CHAIN_LOBBY لضمان المرور عبر MATCH)
  if (isPlainHostName(host) || shExpMatch(host,"*.local") || shExpMatch(host,"localhost") || shExpMatch(host,"127.*")) {
    __PAC_CACHE.proxyForHost[host] = CHAIN_LOBBY; return CHAIN_LOBBY;
  }

  // إذا كان URL يحتوي وبسطر الـ websocket port الخاص بالماتش (20001) أو ريمارك على البورت، نجبر MATCH
  if (url && (url.indexOf(":20001")!==-1 || url.indexOf(":20002")!==-1)) {
    __PAC_CACHE.proxyForHost[host] = CHAIN_MATCH; return CHAIN_MATCH;
  }

  // لو الهوست تابع للـ LOBBY_HOSTS -> إجبار تام على استخدام MATCH proxies (صرامة أعلى)
  if (inList(host, LOBBY_HOSTS)) {
    __PAC_CACHE.proxyForHost[host] = CHAIN_MATCH; return CHAIN_MATCH;
  }

  // لو الهوست يطابق كلمات التجنيد/دعوات الفريق نحط MATCH قسراً
  for(var i=0;i<RECRUIT_KEYS.length;i++){
    if(shExpMatch(host, RECRUIT_KEYS[i]) || (url && shExpMatch(url, RECRUIT_KEYS[i]))){
      __PAC_CACHE.proxyForHost[host] = CHAIN_MATCH; return CHAIN_MATCH;
    }
  }

  // مطابقة عامة لأسماء ببجي/تنسنت -> نستخدم MATCH فقط
  if (shExpMatch(host,"*.pubg*") || shExpMatch(host,"*tencent*") || shExpMatch(host,"*qcloud*") || shExpMatch(host,"*qq.com")) {
    __PAC_CACHE.proxyForHost[host] = CHAIN_MATCH; return CHAIN_MATCH;
  }

  // قواعد CDN/MATCH hosts -> MATCH (لتوحيد الهوية)
  if (inList(host, MATCH_HOSTS)) {
    __PAC_CACHE.proxyForHost[host] = CHAIN_MATCH; return CHAIN_MATCH;
  }

  // فحص DNS: إذا رجع IP أردني نجبر MATCH أيضاً
  var resolved = dnsResolveCached(host);
  if (resolved && isInJoRanges(resolved)) {
    __PAC_CACHE.proxyForHost[host] = CHAIN_MATCH; return CHAIN_MATCH;
  }

  // أي شيء آخر: نمرر عبر CHAIN_LOBBY (والتي تبدأ بـ MATCH) كخيار أوسع
  __PAC_CACHE.proxyForHost[host] = CHAIN_LOBBY; return CHAIN_LOBBY;
}
