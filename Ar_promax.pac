var PROXY_MATCH = [
  "SOCKS5 91.106.109.12:20001", "SOCKS5 91.106.109.12:20002", "SOCKS5 91.106.109.12:20003"
];

var PROXY_LOBBY = [
  "SOCKS5 91.106.109.12:5000", "SOCKS5 91.106.109.12:5001", "SOCKS5 91.106.109.12:5002"
];

// Original, narrower Jordan IPv4 ranges
var JO_RANGES_IPV4 = [
  ["185.34.16.0","255.255.252.0"],
  ["188.247.64.0","255.255.192.0"],
  ["95.141.32.0","255.255.240.0"],
  ["109.107.0.0","255.255.0.0"],
  ["82.212.64.0","255.255.192.0"]
];

// Original IPv6 prefixes used by the previous PAC file
var JO_PREFIX_IPV6 = [
  "2a02:2e80:",
  "2a02:2f00:",
  "2a02:2e40:",
  "2a02:26f0:",
  "2a02:2e60:",
  "2a02:2f80:"
];

var LOBBY_HOSTS = [
  "match.pubg.com",
  "api.pubg.com",
  "hl.pubg.com",
  "me.pubg.com",
  "api.pubgmobile.com",
  "me-hl.pubgmobile.com",
  "www.pubgmobile.com",
  "pubgmobile.com",
  "pubgmobile.live",
  "cloud.gpubgm.com",
  "gcloud.pubgmobile.com",
  "*.gpubgm.com",
  "*.pubgmobile.com",
  "*.tencent.com",
  "*.tencentgames.com",
  "*.gcloud.qq.com",
  "*.qcloud.com",
  "*.game.qq.com",
  "176.29.114.146",
  "176.29.114.179",
  "52.72.49.79",
  "43.137.211.13"
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

var RECRUIT_KEYS = [
  "invite","recruit","party","team","group",
  "lookingfor","looking-for","lfteam","lfm",
  "join","clan","squad","joincode","lobby"
];

var MATCH_PORTS = [":20001",":20002",":20003"];

// Increase jitter period and sticky TTL to reduce proxy switching frequency
var JITTER_PERIOD = 120;        // seconds between hash-based proxy rotation
var STICKY_TTL    = 300000;     // milliseconds to stick to chosen proxy (5 minutes)

if (typeof __PAC_CACHE === "undefined") __PAC_CACHE = { dns:{}, sticky:{}, t:0 };

function lc(s){ return (s||"").toLowerCase(); }
function isIPv4(h){ return /^\d{1,3}(\.\d{1,3}){3}$/.test(h||""); }
function isIPv6(h){ return /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(h||"") || /::/.test(h||""); }

function hostMatches(host, pat){
  host = lc(host); pat = lc(pat);
  if (pat.indexOf("*.") === 0){
    var bare = pat.slice(2);
    return host === bare || host.endsWith("."+bare);
  }
  return host === pat;
}

function inList(host, arr){
  for (var i=0;i<arr.length;i++) if (hostMatches(host, arr[i])) return true;
  return false;
}

function containsAny(s, arr){
  s = lc(s||"");
  for (var i=0;i<arr.length;i++) if (s.indexOf(arr[i]) !== -1) return true;
  return false;
}

function isMatchPort(url){
  for (var i=0;i<MATCH_PORTS.length;i++) if (url.indexOf(MATCH_PORTS[i]) !== -1) return true;
  return false;
}

function dnsResolveCached(host){
  try{
    var now = Date.now();
    var e = __PAC_CACHE.dns[host];
    if (e && (now - e.t) < 30000) return e.ip;
    var ip = dnsResolve(host);
    if (ip) __PAC_CACHE.dns[host] = { ip: ip, t: now };
    return ip;
  }catch(ex){ return null; }
}

function ipInJordan(ip){
  if (!ip) return false;
  if (isIPv4(ip)){
    for (var i=0;i<JO_RANGES_IPV4.length;i++){
      var range = JO_RANGES_IPV4[i];
      if (isInNet(ip, range[0], range[1])) return true;
    }
  } else if (isIPv6(ip)){
    var low = lc(ip);
    for (var j=0;j<JO_PREFIX_IPV6.length;j++){
      if (low.indexOf(lc(JO_PREFIX_IPV6[j])) === 0) return true;
    }
  }
  return false;
}

function hostHash(host){
  host = lc(host||"");
  var h = 2166136261>>>0;
  for (var i=0;i<host.length;i++){
    h ^= host.charCodeAt(i);
    h = (h + (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24))>>>0;
  }
  return h>>>0;
}

function selectIndex(host, n){
  if (!n || n<=1) return 0;
  var nowSec = Math.floor(Date.now()/1000);
  var w = Math.floor(nowSec / JITTER_PERIOD);
  return (hostHash(host) ^ w) % n;
}

function stickyGet(host){
  var s = __PAC_CACHE.sticky[host];
  if (!s || (Date.now()-s.t)>STICKY_TTL){ delete __PAC_CACHE.sticky[host]; return null; }
  return s.val;
}

function stickySet(host,val){
  __PAC_CACHE.sticky[host] = { val: val, t: Date.now() };
  return val;
}

function chainFromPool(pool, start){
  var out = [];
  for (var k=0;k<pool.length;k++) out.push(pool[(start+k)%pool.length]);
  return out.join("; ");
}

function chooseChain(host, preferLobby){
  var pool = preferLobby ? PROXY_LOBBY : PROXY_MATCH;
  var i = selectIndex(host, pool.length);
  return chainFromPool(pool, i);
}

function FindProxyForURL(url, host){
  host = lc(host||"");
  url  = lc(url||"");

  var c = stickyGet(host);
  if (c) return c;

  if (isPlainHostName(host) || host.indexOf("localhost")===0 || host.indexOf("127.")===0){
    return stickySet(host, chooseChain(host, true));
  }

  if (containsAny(host, RECRUIT_KEYS) || containsAny(url, RECRUIT_KEYS)){
    return stickySet(host, chooseChain(host, true));
  }

  if (isMatchPort(url)){
    return stickySet(host, chooseChain(host, false));
  }

  if (inList(host, LOBBY_HOSTS)){
    var ip = dnsResolveCached(host);
    var preferLobby = ip && ipInJordan(ip);
    return stickySet(host, chooseChain(host, !!preferLobby));
  }

  if (inList(host, MATCH_HOSTS)){
    return stickySet(host, chooseChain(host, false));
  }

  if (isIPv4(host) || isIPv6(host)){
    return stickySet(host, chooseChain(host, false));
  }

  var ip2 = dnsResolveCached(host);
  if (ip2 && ipInJordan(ip2)){
    return stickySet(host, chooseChain(host, true));
  }

  return stickySet(host, chooseChain(host, false));
}
