// ======================================================================
// PAC – Jordan-first: PROXY-only + SOCKS/HTTPS/HTTP fallback (UDP/WebRTC aware)
// Compatible PAC (no console/logs, no dynamic fetch), optimized ordering
// ======================================================================

// ======================= CONFIG =======================
var DIRECT_FIRST          = false;  // ابدأ بالبروكسي دائماً
var FORBID_DIRECT         = true;   // منع الاتصال المباشر تماماً
var BLOCK_IR              = true;   // حجب نطاقات .ir
var ENABLE_SOCKS          = true;   // تفعيل SOCKS5/4 لدعم UDP وWebRTC
var ENABLE_HTTPS_PROXY    = true;   // تفعيل HTTPS Proxy
var ENABLE_HTTP_PROXY     = true;   // تفعيل HTTP Proxy
var USE_DNS_PRIVATE_CHECK = true;   // تحقق من IP خاص عبر dnsResolve
var ORDER_IPV6_FIRST      = false;  // إعطاء الأولوية لـ IPv4 الأردنية
var PORT_ORDER            = [1080, 16641, 443, 80, 8080, 8000, 20000]; // ترتيب افتراضي للمنافذ

// ملاحظة: PAC لا يستطيع جلب URL خارجي. نُبقي المتغيّر توثيقيّاً فقط.
var PROXY_UPDATE_URL      = "https://example.com/proxy-config.json";

// ======================= PROXIES =======================
var PROXIES_CFG = [
  { ip: "109.107.240.101", socksPorts: [20000,20001,1080], httpPorts:[443,8000,20000,8080,3128], supportsUDP:true },
  { ip: "149.200.200.44",  socksPorts: [],                 httpPorts:[80],                       supportsUDP:false },
  { ip: "176.57.25.143",   socksPorts: [],                 httpPorts:[80],                       supportsUDP:false },
  { ip: "188.123.167.28",  socksPorts: [],                 httpPorts:[80],                       supportsUDP:false },
  { ip: "185.51.212.67",   socksPorts: [],                 httpPorts:[443],                      supportsUDP:false },
  { ip: "212.118.7.130",   socksPorts: [],                 httpPorts:[8080],                     supportsUDP:false },
  { ip: "94.127.212.117",  socksPorts: [],                 httpPorts:[443],                      supportsUDP:false },
  { ip: "87.236.233.183",  socksPorts: [],                 httpPorts:[443],                      supportsUDP:false },
  { ip: "213.186.179.175", socksPorts: [16641,44287,59624,20810,61903,55495,29939,23989,54124,38455,43603,26133], httpPorts:[], supportsUDP:true },
  { ip: "185.51.215.229",  socksPorts: [1080],             httpPorts:[],                        supportsUDP:true },
  // بدائل غير أردنية
  { ip: "2a13:a5c7:25ff:7000", socksPorts:[20001,20002,20003,20004,8085,10491], httpPorts:[80,443,8080,3128], supportsUDP:true },
  { ip: "91.106.109.12",      socksPorts:[20001,20002,20003,20004,8085,10491],  httpPorts:[80,443,8080,3128], supportsUDP:true }
];

// ======================= DOMAINS (لعبة + خدمات + WebRTC) =======================
var GAME_DOMAINS = [
  "igamecj.com","igamepubg.com","pubgmobile.com","tencentgames.com",
  "tencent.com","proximabeta.com","proximabeta.net","tencentyun.com",
  "qcloud.com","qcloudcdn.com","gtimg.com","game.qq.com","cdn-ota.qq.com",
  "cdngame.tencentyun.com","gcloud.qq.com","cdn.pubgmobile.com",
  "akamaized.net","akamaiedge.net",
  // خدمات اعتمادية على iOS/Android
  "googleapis.com","gstatic.com","googleusercontent.com",
  "play.googleapis.com","firebaseinstallations.googleapis.com",
  "mtalk.google.com","android.clients.google.com",
  "apple.com","icloud.com","gamecenter.apple.com","gamekit.apple.com","apps.apple.com"
];

var WEBRTC_DOMAINS = [
  "stun.l.google.com","turn.googleapis.com",
  "stun1.l.google.com","stun2.l.google.com","stun3.l.google.com","stun4.l.google.com"
];

var KEYWORDS = ["pubg","tencent","proximabeta","tencentyun","qcloud","gcloud","stun","turn"];

// ======================= HELPERS =======================
function _startsWith(s, pre){ return s && pre && s.indexOf(pre)===0; }
function _endsWith(s, suf){ return s && suf && s.substring(s.length - suf.length) === suf; }

function isIPv6Literal(h){ return h && h.indexOf(":")!==-1 && h.indexOf(".")===-1; }
function bracketHost(ip){ return isIPv6Literal(ip) ? "["+ip+"]" : ip; }
function isPlainIP(h){ return (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || /^[0-9a-fA-F:]+$/.test(h)); }

function hostInList(h, list){
  h = (h||"").toLowerCase();
  var i;
  for(i=0;i<list.length;i++){
    var d = list[i].toLowerCase();
    if (h===d) return true;
    if (shExpMatch(h,"*."+d)) return true;
  }
  return false;
}

function hasKeyword(s){
  s = (s||"").toLowerCase();
  var i;
  for(i=0;i<KEYWORDS.length;i++){
    if (s.indexOf(KEYWORDS[i])!==-1) return true;
  }
  return false;
}

function isIranTLD(h){
  h = (h||"").toLowerCase();
  // بديل endsWith
  if (_endsWith(h,".ir")) return true;
  return shExpMatch(h,"*.ir");
}

function endsWithAny(h, arr){
  h = (h||"").toLowerCase();
  var i,s;
  for(i=0;i<arr.length;i++){
    s = arr[i].toLowerCase();
    if (h===s) return true;
    if (s.charAt(0)==="." && shExpMatch(h,"*"+s)) return true;
    if (s.charAt(0)!=="." && shExpMatch(h,"*."+s)) return true;
  }
  return false;
}

function isLikelyLocalName(h){
  if (isPlainHostName(h)) return true;
  var low = (h||"").toLowerCase();
  if (low==="localhost") return true;
  var localTlds = [".local",".lan",".home",".intranet",".internal",".invalid"];
  return endsWithAny(low, localTlds);
}

function isPrivateIPv4(ip){
  if (isInNet(ip,"127.0.0.0","255.0.0.0")) return true;
  if (isInNet(ip,"10.0.0.0","255.0.0.0")) return true;
  if (isInNet(ip,"172.16.0.0","255.240.0.0")) return true;
  if (isInNet(ip,"192.168.0.0","255.255.0.0")) return true;
  if (isInNet(ip,"169.254.0.0","255.255.0.0")) return true;
  if (isInNet(ip,"100.64.0.0","255.192.0.0")) return true;
  return false;
}

function isPrivateOrLocal(h){
  if (isLikelyLocalName(h)) return true;
  if (isIPv6Literal(h)){
    var low = h.toLowerCase();
    if (low==="::1" || shExpMatch(low,"fe80::*") || shExpMatch(low,"fc*::*") || shExpMatch(low,"fd*::*")) return true;
    return false;
  }
  if (!USE_DNS_PRIVATE_CHECK) return false;
  var ip = null;
  try { ip = dnsResolve(h); } catch(e){ ip = null; }
  if (!ip) return false;
  return isPrivateIPv4(ip);
}

function orderPorts(list){
  if (!list || !list.length) return [];
  var map={}, out=[], i,j,k;
  for(i=0;i<list.length;i++) map[list[i]]=1;
  for(j=0;j<PORT_ORDER.length;j++) if (map[PORT_ORDER[j]]) out.push(PORT_ORDER[j]);
  for(k=0;k<list.length;k++) if (PORT_ORDER.indexOf(list[k])===-1) out.push(list[k]);
  return out;
}

function dedup(arr){
  var seen={}, out=[], i, v;
  for(i=0;i<arr.length;i++){ v=arr[i]; if(!seen[v]){ seen[v]=1; out.push(v);} }
  return out;
}

function hashStr(s){
  var h=5381, i;
  for(i=0;i<s.length;i++){ h=((h<<5)+h)+s.charCodeAt(i); }
  return (h>>>0);
}

// PAC لا يستطيع تحديث من URL؛ نُعيد القائمة كما هي (مكان جاهز مستقبلاً لو أردت دمج/توليد مسبق).
function updateProxiesDynamically(){ return PROXIES_CFG; }

// تجهيز ترتيب البروكسيات مرة واحدة (أردني أولاً، ثم IPv4/IPv6 حسب الإعداد)
var ORDERED_PROXIES = (function(){
  var proxies = updateProxiesDynamically();
  var jo=[], other=[], i, p, ip;
  for(i=0;i<proxies.length;i++){
    p = proxies[i]; ip = p.ip+"";
    if (_startsWith(ip,"109.")||_startsWith(ip,"149.")||_startsWith(ip,"176.")||
        _startsWith(ip,"188.")||_startsWith(ip,"185.")||_startsWith(ip,"212.")||
        _startsWith(ip,"94.") ||_startsWith(ip,"87.") ||_startsWith(ip,"213.")){
      jo.push(p);
    } else { other.push(p); }
  }
  // ترتيب IPv6 مقابل IPv4
  function split46(arr){
    var v6=[], v4=[], j;
    for(j=0;j<arr.length;j++){ if (isIPv6Literal(arr[j].ip)) v6.push(arr[j]); else v4.push(arr[j]); }
    return ORDER_IPV6_FIRST ? v6.concat(v4) : v4.concat(v6);
  }
  var joOrdered    = split46(jo);
  var otherOrdered = split46(other);
  return joOrdered.concat(otherOrdered);
})();

function tokensForEntry(entry, preferUDPFirst){
  var tokens=[], host = bracketHost(entry.ip), i;

  // عندما نُفضّل UDP (لعبة/WebRTC): قدّم SOCKS أولاً ثم HTTPS/HTTP كاحتياط
  // عندما لا نُفضّل UDP: قدّم HTTPS/HTTP أولاً ثم SOCKS كاحتياط

  function pushSOCKS(){
    if (!ENABLE_SOCKS) return;
    if (!entry.socksPorts || !entry.socksPorts.length) return;
    var ss = orderPorts(entry.socksPorts);
    for(i=0;i<ss.length;i++){
      tokens.push("SOCKS5 "+host+":"+ss[i]);
      tokens.push("SOCKS "+host+":"+ss[i]);
    }
  }
  function pushHTTPS_HTTP(){
    if (entry.httpPorts && entry.httpPorts.length){
      var hp = orderPorts(entry.httpPorts);
      var j;
      if (ENABLE_HTTPS_PROXY){
        for(j=0;j<hp.length;j++){ tokens.push("HTTPS "+host+":"+hp[j]); }
      }
      if (ENABLE_HTTP_PROXY){
        for(j=0;j<hp.length;j++){ tokens.push("PROXY "+host+":"+hp[j]); }
      }
    }
  }

  if (preferUDPFirst){
    pushSOCKS();
    pushHTTPS_HTTP();
  } else {
    pushHTTPS_HTTP();
    pushSOCKS();
  }
  return tokens;
}

function buildProxyChain(isUDPPreferred, host){
  var allTokens = [], i, tks;

  for(i=0;i<ORDERED_PROXIES.length;i++){
    var e = ORDERED_PROXIES[i];
    // إذا نُفضّل UDP، اشترط وجود SOCKS فعلياً؛ وإلا سنضيف بروتوكولات HTTP/HTTPS
    tks = tokensForEntry(e, isUDPPreferred && !!(e.socksPorts && e.socksPorts.length && e.supportsUDP));
    if (tks.length){ allTokens = allTokens.concat(tks); }
  }

  allTokens = dedup(allTokens);

  // إضافة DIRECT كخيار أخير فقط إذا مسموح وكان DIRECT_FIRST مفعّل (ومفيد للاختبار)
  if (!FORBID_DIRECT && DIRECT_FIRST){
    allTokens.push("DIRECT");
  }

  if (!allTokens.length){
    // إذا لا يوجد أي بروكسي صالح:
    if (!FORBID_DIRECT) return "DIRECT";
    return "PROXY 127.0.0.1:9"; // حظر (blackhole)
  }

  // تشتيت بسيط بالهاش لكي لا تضرب كل الدومينات نفس أول بروكسي دائماً
  var start = hashStr(host||"") % allTokens.length;
  var out=[], c;
  for(c=0;c<allTokens.length;c++){
    var idx = (start + c) % allTokens.length;
    out.push(allTokens[idx]);
  }
  return out.join("; ");
}

// ======================= MAIN =======================
function FindProxyForURL(url, host){
  // منع أي تسريب لشبكات/أسماء محلية
  if (isPrivateOrLocal(host)){
    // مع FORBID_DIRECT=true: نحظر الوصول المحلي بدل DIRECT
    return FORBID_DIRECT ? "PROXY 127.0.0.1:9" : "DIRECT";
  }
  if (BLOCK_IR && isIranTLD(host)){
    return "PROXY 127.0.0.1:9";
  }

  // تصنيف الترافيك
  var isGame   = hostInList(host, GAME_DOMAINS) || hasKeyword(host) || hasKeyword(url);
  var isWebRTC = hostInList(host, WEBRTC_DOMAINS) || hasKeyword(host) || hasKeyword(url);

  // نُفضّل UDP (SOCKS) عند الألعاب و/أو WebRTC
  var preferUDP = (isGame || isWebRTC);

  // بنى السلسلة حسب التفضيل
  var chain = buildProxyChain(preferUDP, host);

  // لو أردت DIRECT قبل البروكسي في بعض الحالات (مثلاً مواقع غير ألعاب) عكس الإعداد:
  // إن أردتها: فعّل DIRECT_FIRST=false (حالياً false) مع FORBID_DIRECT=true ليبقى عبر البروكسي فقط.
  return chain;
}
