// Jordan-first smart PAC with deterministic rotation + jitter
var PROXY_MATCH = [
  "SOCKS5 91.106.109.12:20001",
  "SOCKS5 91.106.109.12:20002"
];
var PROXY_LOBBY = [
  "SOCKS5 91.106.109.12:5000",
  "SOCKS5 91.106.109.12:5001"
];

var CHAIN_MATCH = PROXY_MATCH.join("; ");
var CHAIN_LOBBY = PROXY_LOBBY.join("; ");

var JO_RANGES = [
  ["185.34.16.0","255.255.252.0"],
  ["188.247.64.0","255.255.192.0"],
  ["95.141.32.0","255.255.240.0"],
  ["109.107.0.0","255.255.0.0"],
  ["82.212.64.0","255.255.192.0"]
];

var LOBBY_HOSTS = [
  "match.pubg.com","api.pubg.com","hl.pubg.com","api.pubgmobile.com",
  "me-hl.pubgmobile.com","www.pubgmobile.com","pubgmobile.com","pubgmobile.live",
  "cloud.gpubgm.com","gcloud.pubgmobile.com","tencent.com","*.gpubgm.com",
  "*.pubgmobile.com","*.tencent.com","*.tencentgames.com","*.gcloud.qq.com",
  "*.qcloud.com","*.game.qq.com","176.29.114.146","176.29.114.179",
  "52.72.49.79","43.137.211.13"
];

var MATCH_HOSTS = [
  "*.battlegroundsmobile.com","*.pubgmcdn.com","*.akamaiedge.net",
  "*.cloudfront.net","*.akamaized.net","*.vtcdn.com","*.gtimg.com",
  "*.cdngame.tencentyun.com"
];

var RECRUIT_KEYS = ["invite","recruit","party","team","group","lookingfor","looking-for","lfteam","lfm","join"];

// Rotation / jitter settings (tweak these)
var JITTER_PERIOD = 45; // seconds per rotation window (30-90 recommended)
var STICKY_TTL = 65 * 1000; // ms to keep sticky mapping (slightly larger than JITTER_PERIOD)

// simple cache
if (typeof __PAC_CACHE === "undefined") __PAC_CACHE = { dns:{}, sticky:{}, t:0 };

function lc(s){ return (s||"").toLowerCase(); }
function isIPv4(h){ return /^\d{1,3}(\.\d{1,3}){3}$/.test(h||""); }
function hostMatches(host,pat){ host=lc(host); pat=lc(pat); if(pat.indexOf("*.")===0){var b=pat.substring(2); return host===b || host.endsWith("."+b);} return host===pat; }
function inList(host,arr){ host=lc(host); for(var i=0;i<arr.length;i++){ if(hostMatches(host,arr[i])) return true; } return false; }
function containsAny(s,arr){ s=lc(s||""); for(var i=0;i<arr.length;i++){ if(s.indexOf(lc(arr[i]))!==-1) return true; } return false; }

function dnsResolveCached(host){
  try{
    var now = (new Date()).getTime();
    var e = __PAC_CACHE.dns[host];
    if(e && (now - e.t) < 60000) return e.ip;
    var ip = dnsResolve(host);
    if(ip) __PAC_CACHE.dns[host] = { ip: ip, t: now };
    return ip;
  } catch(ex) { return null; }
}

function isInJoRanges(ip){
  if(!ip) return false;
  for(var i=0;i<JO_RANGES.length;i++){
    if(isInNet(ip, JO_RANGES[i][0], JO_RANGES[i][1])) return true;
  }
  return false;
}

// deterministic host hash (FNV-like)
function hostHash(host){
  host = lc(host||"");
  var h = 2166136261;
  for(var i=0;i<host.length;i++){
    h ^= host.charCodeAt(i);
    h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24);
  }
  return Math.abs(h);
}

// rotation selector: uses hostHash ^ timeWindow to vary selection slowly
function selectIndex(host, poolLen){
  if(!poolLen || poolLen<=1) return 0;
  var nowSec = Math.floor((new Date()).getTime()/1000);
  var window = Math.floor(nowSec / JITTER_PERIOD);
  var mix = hostHash(host) ^ window;
  return mix % poolLen;
}

// sticky mapping to keep stability for STICKY_TTL ms
function stickyGet(host){
  var s = __PAC_CACHE.sticky[host];
  if(!s) return null;
  if((new Date()).getTime() - s.t > STICKY_TTL){
    delete __PAC_CACHE.sticky[host];
    return null;
  }
  return s.val;
}
function stickySet(host, val){
  __PAC_CACHE.sticky[host] = { val: val, t: (new Date()).getTime() };
  return val;
}

function chooseChainByPools(host, preferJO){
  // if prefer JO for this host, bias toward LOBBY pool first
  if(preferJO){
    // choose from lobby pool rotating
    var i = selectIndex(host, PROXY_LOBBY.length);
    return PROXY_LOBBY[i] + (PROXY_LOBBY.length>1 ? ("; " + PROXY_LOBBY[(i+1)%PROXY_LOBBY.length]) : "");
  }
  // otherwise choose match pool rotating
  var j = selectIndex(host, PROXY_MATCH.length);
  return PROXY_MATCH[j] + (PROXY_MATCH.length>1 ? ("; " + PROXY_MATCH[(j+1)%PROXY_MATCH.length]) : "");
}

function FindProxyForURL(url, host){
  host = lc(host||"");
  url  = lc(url||"");

  var s = stickyGet(host);
  if(s) return s;

  // local hosts always go through lobby (so local services remain local identity)
  if(isPlainHostName(host) || host.indexOf("localhost")===0 || host.indexOf("127.")===0) {
    return stickySet(host, CHAIN_LOBBY);
  }

  // if URL contains match ports -> force MATCH chain
  if(url.indexOf(":20001")!==-1 || url.indexOf(":20002")!==-1) {
    return stickySet(host, chooseChainByPools(host,false));
  }

  // recruit keywords (we want recruits to see you as local) -> prefer lobby (Jordan-first)
  if(containsAny(host, RECRUIT_KEYS) || containsAny(url, RECRUIT_KEYS)) {
    return stickySet(host, chooseChainByPools(host, true));
  }

  // explicit lobby hostnames -> prefer lobby (but use rotation)
  if(inList(host, LOBBY_HOSTS)) {
    // If DNS resolves to JO IP -> strong lobby preference
    var ip = dnsResolveCached(host);
    var jo = ip && isInJoRanges(ip);
    return stickySet(host, chooseChainByPools(host, jo));
  }

  // match CDNs -> match pool
  if(inList(host, MATCH_HOSTS)) {
    return stickySet(host, chooseChainByPools(host, false));
  }

  // explicit IP host -> treat as match (force same identity)
  if(isIPv4(host)) {
    return stickySet(host, chooseChainByPools(host, false));
  }

  // fallback: if DNS shows JO IP -> lobby, else match
  var resolved = dnsResolveCached(host);
  if(resolved && isInJoRanges(resolved)) {
    return stickySet(host, chooseChainByPools(host, true));
  }

  // default: prefer MATCH (so everything goes via match proxies and looks local)
  return stickySet(host, chooseChainByPools(host, false));
}
