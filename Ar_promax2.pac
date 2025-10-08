var JO_POOL = [
  {proxy:"SOCKS5 91.106.109.12:20001", weight:6},
  {proxy:"SOCKS5 91.106.109.12:20002", weight:5},
  {proxy:"SOCKS5 91.106.109.12:5000",  weight:4},
  {proxy:"SOCKS5 91.106.109.12:5001",  weight:3}
];

var BLOCK = "PROXY 0.0.0.0:0; PROXY 127.0.0.1:0";

var GAME_RE = /^(.*\.)?(pubgmobile\.com|pubg\.com|gpubgm\.com|pgsl\.tencent\.com|tencentgames\.com|tencent\.com|pubgmcdn\.com|battlegroundsmobile\.com|me-hl\.pubgmobile\.com|api\.pubgmobile\.com|match\.pubg\.com|cloud\.gpubgm\.com|pubgmobile\.live|me\.pubg\.com|igame\.(qq|cj)\.com|pg\.qq\.com|tdm\.qq\.com|ak\.pubgmobile\.com|cdn\.pubgmobile\.com|hl\.pubgmobile\.com|lobby\.pubgmobile\.com|party\.pubgmobile\.com|session\.pubgmobile\.com|game\.api\.pubgmobile\.com|match\.api\.pubgmobile\.com|classic\.pubgmobile\.com|recruit\.pubgmobile\.com|partypubg\.com)$/i;

var JO_NAME_PATTERNS = [/\.jo$/i, /\.local\.jo$/i, /jordan/i];

var JO_V4 = [
  ["185.34.16.0","255.255.252.0"],
  ["91.106.0.0","255.255.0.0"],
  ["176.28.128.0","255.255.128.0"],
  ["194.165.128.0","255.255.252.0"],
  ["213.139.32.0","255.255.224.0"],
  ["94.249.70.0","255.255.255.0"],
  ["212.118.21.0","255.255.255.0"],
  ["176.29.72.0","255.255.255.0"]
];

var JO_V6_PREFIXES = ["2a13:a5c7:", "2a02:ed0:"];

var GAME_PORTS = {"10012":1,"13004":1,"14000":1,"17000":1,"17500":1,"18081":1,"20000":1,"20001":1,"20002":1,"20371":1,"5001":1};

var DNS_CACHE = {};
var DNS_TTL_MS = 5 * 1000;

var STICKY = {};
var STICKY_TTL_MS = 30 * 1000;

function nowMs(){ return (new Date()).getTime(); }

function portFromUrl(u){
  var m = u.match(/:(\d+)(?:[\/]|$)/);
  return m ? m[1] : null;
}

function fnv1aHash(s){
  var h = 2166136261 >>> 0;
  for(var i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h,16777619) >>> 0;
  }
  return h >>> 0;
}

function totalWeight(){
  var t = 0;
  for(var i=0;i<JO_POOL.length;i++) t += JO_POOL[i].weight;
  return t;
}

function pickChain(host){
  var windowSec = Math.floor(nowMs()/1000/12);
  var key = host + "|" + windowSec;
  var h = fnv1aHash(key);
  var t = totalWeight();
  var v = h % t;
  var s = 0;
  for(var i=0;i<JO_POOL.length;i++){
    s += JO_POOL[i].weight;
    if(v < s){
      var a = JO_POOL[i].proxy;
      var b = JO_POOL[(i+1) % JO_POOL.length].proxy;
      return a + "; " + b;
    }
  }
  return JO_POOL[0].proxy;
}

function getSticky(host){
  var e = STICKY[host];
  if(e && (nowMs() - e.ts) < STICKY_TTL_MS) return e.chain;
  return null;
}

function setSticky(host, chain){
  STICKY[host] = {chain: chain, ts: nowMs()};
}

function dnsResolveCached(host){
  var e = DNS_CACHE[host];
  if(e && (nowMs() - e.ts) < DNS_TTL_MS) return e.ip;
  try{
    var ip = dnsResolve(host);
    DNS_CACHE[host] = {ip: ip, ts: nowMs()};
    return ip;
  }catch(ex){
    DNS_CACHE[host] = {ip: null, ts: nowMs()};
    return null;
  }
}

function isV4Jo(ip){
  if(!ip) return false;
  if(ip.indexOf(".") === -1) return false;
  for(var i=0;i<JO_V4.length;i++){
    if(isInNet(ip, JO_V4[i][0], JO_V4[i][1])) return true;
  }
  return false;
}

function isV6Jo(ip){
  if(!ip) return false;
  if(ip.indexOf(":") === -1) return false;
  var low = ip.toLowerCase();
  for(var i=0;i<JO_V6_PREFIXES.length;i++){
    if(low.indexOf(JO_V6_PREFIXES[i]) === 0) return true;
  }
  return false;
}

function hostNameSuggestsJo(host){
  for(var i=0;i<JO_NAME_PATTERNS.length;i++) if(JO_NAME_PATTERNS[i].test(host)) return true;
  return false;
}

function isWebSocketUrl(url){
  return url.indexOf("ws://") === 0 || url.indexOf("wss://") === 0 || url.indexOf("/websocket") !== -1;
}

function forceToJoChain(host){
  var chain = pickChain(host);
  setSticky(host, chain);
  return chain;
}

function decide(url, host){
  host = host.toLowerCase();
  var port = portFromUrl(url);

  var sticky = getSticky(host);
  if(sticky) return sticky;

  if(hostNameSuggestsJo(host)){
    return forceToJoChain(host);
  }

  var resolved = dnsResolveCached(host);
  if(resolved){
    if(isV4Jo(resolved) || isV6Jo(resolved)) return forceToJoChain(host);
  }

  if(GAME_RE.test(host) || (port && (port in GAME_PORTS)) || isWebSocketUrl(url)){
    return forceToJoChain(host);
  }

  return BLOCK;
}

function FindProxyForURL(url, host){
  try{
    return decide(url, host);
  }catch(e){
    return BLOCK;
  }
}
