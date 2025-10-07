// Jordan-Only PAC — Match & Lobby prioritized by city (Amman / Salt / Karak / Deir Alla)
// No DIRECT anywhere. Replace IP:PORT حسب بروكسياتك الحقيقية إذا أردت.

function ipToNum(ip){
  var p = ip.split(".");
  return ((parseInt(p[0])<<24)>>>0) + ((parseInt(p[1])<<16)>>>0 + ((parseInt(p[2])<<8)>>>0) + (parseInt(p[3])>>>0);
}
function maskToNum(bits){
  bits = parseInt(bits);
  if(bits===32) return 0xFFFFFFFF>>>0;
  return (0xFFFFFFFF << (32-bits))>>>0;
}
function cidrMatch(ip, cidr){
  var parts = cidr.split("/");
  if(parts.length!==2) return false;
  var net = ipToNum(parts[0]);
  var ipn = ipToNum(ip);
  var mask = maskToNum(parts[1]);
  return (ipn & mask) === (net & mask);
}
function shAny(host, patterns){
  for(var i=0;i<patterns.length;i++){
    if(shExpMatch(host, patterns[i])) return true;
  }
  return false;
}
function deterministicPick(list, key){
  // stable hash -> index (same inputs -> same pick)
  var h = 2166136261;
  for(var i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); h = h >>> 0; }
  return list[h % list.length];
}
function hourSeed(){ return (new Date()).getUTCHours(); }

/* ---------------- CONFIG: ادخل بروكسياتك الحقيقية هنا (IP:PORT) ---------------- */

/* عمّان - بروكسيات مفضلة للماتش/اللوبي داخل عمّان */
var PROXIES_AMMAN_MATCH = [
  "SOCKS5 91.106.109.12:20001",
  "SOCKS5 91.106.109.12:20002"
];
var PROXIES_AMMAN_LOBBY = [
  "SOCKS5 91.106.109.12:5000",
  "SOCKS5 91.106.109.12:5001"
];

/* السلط */
var PROXIES_SALT_MATCH = [
  "SOCKS5 46.185.233.20:20001"
];
var PROXIES_SALT_LOBBY = [
  "SOCKS5 46.185.233.20:5000"
];

/* الكرك */
var PROXIES_KARAK_MATCH = [
  "SOCKS5 37.220.118.15:20001"
];
var PROXIES_KARAK_LOBBY = [
  "SOCKS5 37.220.118.15:5000"
];

/* دير علا / مناطق البلقاء */
var PROXIES_DEIR_MATCH = [
  "SOCKS5 5.198.241.5:20001"
];
var PROXIES_DEIR_LOBBY = [
  "SOCKS5 5.198.241.5:5000"
];

/* مجموعة احتياطية عامة أردنية */
var PROXIES_FALLBACK_MATCH = [
  "SOCKS5 91.106.109.12:20003",
  "SOCKS5 46.185.233.20:20002"
];
var PROXIES_FALLBACK_LOBBY = [
  "SOCKS5 91.106.109.12:5002",
  "SOCKS5 46.185.233.20:5001"
];

/* ----------------------------------------------------------------------------- */

/* خرائط CIDR تقريبية لتمييز المدينة بحسب IP (أضف أو حرِّر حسب شبكتك) */
var CITY_RANGES = {
  "Amman": [
    "37.202.71.0/24",
    "46.185.233.0/24",
    "176.29.0.0/16"
  ],
  "Salt": [
    "46.248.213.0/24",
    "5.198.241.0/24"
  ],
  "Karak": [
    "37.220.118.0/24",
    "37.140.243.0/24"
  ],
  "DeirAlla": [
    "5.198.241.0/24"
  ]
};

/* نطاقات واستماعات ببجي */
var LOBBY_HOSTS = [
  "*.pubgmobile.com",
  "me-hl.pubgmobile.com",
  "match.pubg.com",
  "api.pubg.com",
  "*.gpubgm.com",
  "*.igamecj.com",
  "*.tencentgames.com",
  "*.tencent.com",
  "*.battlegroundsmobile.com",
  "*.pubgmobile.live"
];
var MATCH_HOSTS = [
  "*.pubgmcdn.com",
  "*.tencentcloud.com",
  "*.tencentcloudapi.com",
  "*.gcloudstatic.com",
  "game.pubgmobile.com",
  "hl.pubgmobile.com",
  "cdn.pubgmobile.com"
];

/* سلسلة سهلة البناء */
function chain(list){ var s=""; for(var i=0;i<list.length;i++) s += list[i] + "; "; return s; }

/* اكتشاف المدينة حسب IP الجهاز */
function detectCity(myIP){
  if(!myIP) return null;
  for(var city in CITY_RANGES){
    var ranges = CITY_RANGES[city];
    for(var i=0;i<ranges.length;i++){
      if(cidrMatch(myIP, ranges[i])) return city;
    }
  }
  return null;
}

/* دوال لاختيار قائمة البروكسي حسب المدينة والنوع (match/lobby) */
function proxiesFor(city, kind){
  if(kind==="match"){
    if(city==="Amman") return PROXIES_AMMAN_MATCH.concat(PROXIES_FALLBACK_MATCH);
    if(city==="Salt") return PROXIES_SALT_MATCH.concat(PROXIES_FALLBACK_MATCH);
    if(city==="Karak") return PROXIES_KARAK_MATCH.concat(PROXIES_FALLBACK_MATCH);
    if(city==="DeirAlla") return PROXIES_DEIR_MATCH.concat(PROXIES_FALLBACK_MATCH);
    return PROXIES_FALLBACK_MATCH.concat(PROXIES_AMMAN_MATCH);
  } else {
    if(city==="Amman") return PROXIES_AMMAN_LOBBY.concat(PROXIES_FALLBACK_LOBBY);
    if(city==="Salt") return PROXIES_SALT_LOBBY.concat(PROXIES_FALLBACK_LOBBY);
    if(city==="Karak") return PROXIES_KARAK_LOBBY.concat(PROXIES_FALLBACK_LOBBY);
    if(city==="DeirAlla") return PROXIES_DEIR_LOBBY.concat(PROXIES_FALLBACK_LOBBY);
    return PROXIES_FALLBACK_LOBBY.concat(PROXIES_AMMAN_LOBBY);
  }
}

/* اختيار عنصر من القائمة مع "خفة" دورانية تعتمد على host + ساعة (لتفادي التشبُّع) */
function pickWithHour(list, key){
  var seed = hourSeed() + key.length;
  // stable pseudo-random index based on key and hour
  var h = 2166136261;
  for(var i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); h = h >>> 0; }
  var idx = (h + seed) % list.length;
  return list[idx];
}

/* الدالة الرئيسية */
function FindProxyForURL(url, host){
  host = host.toLowerCase();
  var myIP = myIpAddress();      // محاولة اكتشاف IP المحلي العام
  var resolved = dnsResolve(host); // قد يكون null في بعض البيئات

  var city = detectCity(myIP);

  // 1) لوبي (تجنيد/matchmaking) -> استخدم لوبي بروكسيات مفضلة للمدينة
  if(shAny(host, LOBBY_HOSTS)){
    var list = proxiesFor(city, "lobby");
    var primary = pickWithHour(list, host + (myIP?myIP:""));
    return primary + "; " + chain(list);
  }

  // 2) ماتش / CDN -> استخدم بروكسيات المطابقة المفضلة للمدينة
  if(shAny(host, MATCH_HOSTS)){
    var list2 = proxiesFor(city, "match");
    var primary2 = pickWithHour(list2, host + (resolved?resolved:""));
    return primary2 + "; " + chain(list2);
  }

  // 3) إذا كان الدومين محلي (.jo) أو يحتوى jordan فاعطِ أولوية لبروكسيات المدينة/الأردن
  if(shExpMatch(host, "*.jo") || host.indexOf("jordan") !== -1){
    var list3 = proxiesFor(city, "match").concat(proxiesFor(city, "lobby"));
    var primary3 = deterministicPick(list3, host + (myIP?myIP:""));
    return primary3 + "; " + chain(list3);
  }

  // 4) إذا الـ IP المحلول تابع لنطاق أردني -> أرسل عبر بروكسي أردني
  if(resolved){
    // تفحص سريع: هل الـ resolved يطابق أي من CIDR المدن؟
    var city2 = detectCity(resolved);
    if(city2){
      var ls = proxiesFor(city2, "match").concat(proxiesFor(city2, "lobby"));
      var p = pickWithHour(ls, host + resolved);
      return p + "; " + chain(ls);
    }
  }

  // 5) افتراضي صارم: كل شيء يمر عبر باقة البروكسي الأردنية (fallback)
  var defaultList = PROXIES_FALLBACK_MATCH.concat(PROXIES_FALLBACK_LOBBY).concat(PROXIES_AMMAN_MATCH);
  var pDefault = deterministicPick(defaultList, host + (myIP?myIP:"") + (resolved?resolved:""));
  return pDefault + "; " + chain(defaultList);
}
