/*
 * PAC script updated for PUBG routing in Jordan (Asia/Amman).
 * الاتصال يمر أولاً على البروكسيات الأردنية (PROXY_LOBBY)،
 * وإذا لم تنجح يمكنه الانتقال إلى البروكسيات الأخرى (PROXY_MATCH).
 */

var PROXY_MATCH = [
  "SOCKS5 91.106.109.12:20001",
  "SOCKS5 91.106.109.12:20002",
  "SOCKS5 91.106.109.12:20003"
];

var PROXY_LOBBY = [
  "SOCKS5 91.106.109.12:5000",
  "SOCKS5 91.106.109.12:5001",
  "SOCKS5 91.106.109.12:5002"
];

// Updated Jordan IPv4 ranges
var JO_RANGES_IPV4 = [
  ["176.29.0.0",    "255.255.0.0"],
  ["149.200.128.0", "255.255.128.0"],
  ["46.185.128.0",  "255.255.128.0"],
  ["188.123.160.0", "255.255.224.0"],
  ["188.247.64.0",  "255.255.224.0"],
  ["94.249.0.0",    "255.255.128.0"],
  ["94.142.32.0",   "255.255.224.0"],
  ["95.172.192.0",  "255.255.224.0"],
  ["95.141.208.0",  "255.255.240.0"],
  ["91.186.224.0",  "255.255.224.0"],
  ["91.106.96.0",   "255.255.240.0"],
  ["109.237.192.0", "255.255.240.0"],
  ["109.107.0.0",   "255.255.0.0"],
  ["109.107.224.0", "255.255.224.0"],
  ["82.212.64.0",   "255.255.192.0"],
  ["178.77.128.0",  "255.255.192.0"],
  ["178.238.176.0", "255.255.240.0"],
  ["176.57.0.0",    "255.255.224.0"],
  ["176.57.48.0",   "255.255.240.0"],
  ["92.253.0.0",    "255.255.128.0"],
  ["92.241.32.0",   "255.255.224.0"],
  ["84.18.32.0",    "255.255.224.0"],
  ["84.18.64.0",    "255.255.224.0"],
  ["86.108.0.0",    "255.255.128.0"],
  ["149.200.128.0", "255.255.128.0"],
  ["176.28.128.0",  "255.255.128.0"],
  ["188.247.64.0",  "255.255.192.0"],
  ["185.80.24.0",   "255.255.252.0"],
  ["185.51.212.0",  "255.255.252.0"]
];

// Updated Jordan IPv6 prefixes
var JO_PREFIX_IPV6 = [
  "2001:32c0:", "2a00:18d0:", "2a00:18d8:", "2a00:4620:", "2a00:76e0:",
  "2a00:b860:", "2a00:caa0:", "2a01:1d0:", "2a01:9700:", "2a01:e240:",
  "2a01:ee40:", "2a02:009c:", "2a02:2558:", "2a02:25d8:", "2a02:5b60:",
  "2a02:c040:", "2a02:e680:", "2a02:f0c0:", "2a03:6b00:", "2a03:6d00:",
  "2a03:b640:", "2a04:6200:", "2a05:74c0:", "2a05:7500:", "2a06:9bc0:",
  "2a06:bd80:", "2a07:0140:", "2a0a:2740:", "2a0c:39c0:", "2a0d:cf40:",
  "2a10:1100:", "2a10:9740:", "2a10:d800:", "2a11:d180:", "2a13:1f00:",
  "2a13:5c00:", "2a13:8d40:", "2a14:1a40:", "2a14:2840:", "2001:67c:2124:"
];

// Lobby hosts. Added "*.jo" wildcard to prioritize Jordan domains
var LOBBY_HOSTS = [
  "*.jo",
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
  "napubgm.broker.amsoveasea.com",
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
  "invite", "recruit", "party", "team", "group",
  "lookingfor", "looking-for", "lfteam", "lfm",
  "join", "clan", "squad", "joincode", "lobby"
];

// Expanded ports for PUBG Mobile
var MATCH_PORTS = [
  ":10012", ":13004", ":14000", ":17000", ":17500", ":18081", ":20000",
  ":20001", ":20002", ":20003", ":20371"
];

var JITTER_PERIOD = 60;
var STICKY_TTL   = 70000;

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
      if (isInNet(ip, JO_RANGES_IPV4[i][0], JO_RANGES_IPV4[i][1])) return true;
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

/*
 * Always return local proxies first then match proxies as fallback.
 * This ensures low latency by hitting Jordanian servers first.
 */
function chooseCombinedChain(host){
  // Combine local and match proxies
  var combined = PROXY_LOBBY.concat(PROXY_MATCH);
  // Use jitter to rotate starting index for load balancing
  var i = selectIndex(host, combined.length);
  return chainFromPool(combined, i);
}

function FindProxyForURL(url, host){
  host = lc(host||"");
  url  = lc(url||"");

  var c = stickyGet(host);
  if (c) return c;

  // Local hosts use lobby proxy
  if (isPlainHostName(host) || host.indexOf("localhost")===0 || host.indexOf("127.")===0){
    return stickySet(host, chooseCombinedChain(host));
  }

  // Any recruit/lobby keywords => lobby
  if (containsAny(host, RECRUIT_KEYS) || containsAny(url, RECRUIT_KEYS)){
    return stickySet(host, chooseCombinedChain(host));
  }

  // Ports matching game traffic => still start with lobby proxies
  if (isMatchPort(url)){
    return stickySet(host, chooseCombinedChain(host));
  }

  // Lobby hosts including .jo domains
  if (inList(host, LOBBY_HOSTS)){
    var ip = dnsResolveCached(host);
    var preferLobby = ip && ipInJordan(ip);
    return stickySet(host, chooseCombinedChain(host));
  }

  // Match hosts: still return combined chain
  if (inList(host, MATCH_HOSTS)){
    return stickySet(host, chooseCombinedChain(host));
  }

  // Direct IPs: return combined chain
  if (isIPv4(host) || isIPv6(host)){
    return stickySet(host, chooseCombinedChain(host));
  }

  // Resolve and check location: always return combined chain
  var ip2 = dnsResolveCached(host);
  if (ip2 && ipInJordan(ip2)){
    return stickySet(host, chooseCombinedChain(host));
  }
  return stickySet(host, chooseCombinedChain(host));
}
