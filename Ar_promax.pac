var PROXY_LOBBY_PRIMARY = "SOCKS5 91.106.109.12:5000";
var PROXY_LOBBY_BACKUP  = "SOCKS5 91.106.109.12:8000";
var PROXY_MATCH_PRIMARY = "SOCKS5 91.106.109.12:20001";
var PROXY_MATCH_BACKUP  = "SOCKS5 91.106.109.12:20002";

var CHAIN_LOBBY = PROXY_MATCH_PRIMARY + "; " + PROXY_MATCH_BACKUP + "; " + PROXY_LOBBY_PRIMARY + "; " + PROXY_LOBBY_BACKUP;
var CHAIN_MATCH = PROXY_MATCH_PRIMARY + "; " + PROXY_MATCH_BACKUP + "; " + PROXY_LOBBY_PRIMARY;

var JO_HOSTS = [
  "*.jo",
  "*.local.jo",
  "*jordan*",
  "amman.*",
  "aqaba.*",
  "irbid.*"
];

var CONNECTIVITY = [
  "captive.apple.com",
  "*.apple.com",
  "*.icloud.com",
  "*.mzstatic.com",
  "gs.apple.com",
  "init.itunes.apple.com",
  "connectivitycheck.gstatic.com",
  "clients3.google.com",
  "clients4.google.com",
  "play.googleapis.com",
  "www.msftconnecttest.com",
  "msftconnecttest.com",
  "www.msftncsi.com",
  "msftncsi.com"
];

var HEAVY = [
  "*.youtube.com",
  "*.googlevideo.com",
  "*.whatsapp.net",
  "*.whatsapp.com",
  "*.facebook.com",
  "*.fbcdn.net",
  "*.messenger.com",
  "*.shahid.net",
  "*.shahid.com",
  "*.mbc.net"
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

var LOCAL_BYPASS_EXT = [
  "*.local",
  "*.lan",
  "*.home",
  "*.internal",
  "*.intra",
  "localhost",
  "127.0.0.1",
  "::1",
  "*.router",
  "*.gateway",
  "router",
  "gateway",
  "admin",
  "login",
  "*printer*",
  "*nas*",
  "*camera*",
  "*vanguard*",
  "*dvr*",
  "*nvr*",
  "*iot*",
  "*smart*",
  "*chromecast*",
  "*apple-tv*",
  "tv-*"
];

var LOCAL_SERVICES = [
  "_http._tcp.local",
  "_ipp._tcp.local",
  "_printer._tcp.local",
  "_airplay._tcp.local",
  "_raop._tcp.local",
  "_afpovertcp._tcp.local"
];

var JO_RANGES = [
  ["185.34.16.0","255.255.252.0"],
  ["188.247.64.0","255.255.192.0"],
  ["95.141.32.0","255.255.240.0"],
  ["109.107.0.0","255.255.0.0"],
  ["82.212.64.0","255.255.192.0"]
];

if (typeof __PAC_CACHE === "undefined") { __PAC_CACHE = { dns:{}, proxyForHost:{} }; }

function lc(s){ return (s||"").toLowerCase(); }
function inList(host,arr){ host=lc(host); for(var i=0;i<arr.length;i++){ if(shExpMatch(host,lc(arr[i]))) return true; } return false; }
function isIPv4(h){ return /^\d{1,3}(\.\d{1,3}){3}$/.test(h||""); }
function isIPv6(h){ return h && h.indexOf(":")!==-1 && h.indexOf(".")===-1; }

function dnsResolveCached(host){
  try{
    var now=(new Date()).getTime();
    var e=__PAC_CACHE.dns[host];
    if(e && (now-e.t)<60000) return e.ip;
    var ip=dnsResolve(host);
    if(ip) __PAC_CACHE.dns[host]={ip:ip,t:now};
    return ip;
  }catch(e){ return null; }
}

function isPrivateIPv4(ip){
  if(!ip) return false;
  if(isInNet(ip,"10.0.0.0","255.0.0.0")) return true;
  if(isInNet(ip,"172.16.0.0","255.240.0.0")) return true;
  if(isInNet(ip,"192.168.0.0","255.255.0.0")) return true;
  if(isInNet(ip,"169.254.0.0","255.255.0.0")) return true;
  if(isInNet(ip,"224.0.0.0","240.0.0.0")) return true;
  return false;
}

function isIPv6LinkLocalOrULA(ip){
  if(!ip) return false;
  var low=ip.toLowerCase();
  if(low.indexOf("fe80")===0) return true;
  if(low.indexOf("fc")===0 || low.indexOf("fd")===0) return true;
  if(low.indexOf("ff")===0) return true;
  return false;
}

function sameSubnet24(targetIp){
  try{
    var myIp=myIpAddress();
    if(!myIp||!targetIp) return false;
    if(!/^\d+\.\d+\.\d+\.\d+$/.test(myIp) || !/^\d+\.\d+\.\d+\.\d+$/.test(targetIp)) return false;
    var a=myIp.split("."), b=targetIp.split(".");
    return (a[0]===b[0] && a[1]===b[1] && a[2]===b[2]);
  }catch(e){ return false; }
}

function isLocalTarget(host){
  host=lc(host);
  if(isPlainHostName(host)) return true;
  if(inList(host,LOCAL_BYPASS_EXT)) return true;
  if(inList(host,LOCAL_SERVICES)) return true;
  if(isIPv4(host) && isPrivateIPv4(host)) return true;
  var r4=dnsResolveCached(host);
  if(r4){
    if(isPrivateIPv4(r4)) return true;
    if(sameSubnet24(r4)) return true;
  }
  try{
    if(typeof dnsResolve6==="function"){
      var r6=dnsResolve6(host);
      if(r6 && isIPv6LinkLocalOrULA(r6)) return true;
    }
  }catch(e){}
  return false;
}

function isJO(ip){
  if(!ip) return false;
  for(var i=0;i<JO_RANGES.length;i++){
    if(isInNet(ip, JO_RANGES[i][0], JO_RANGES[i][1])) return true;
  }
  return false;
}

function hostHash(host){
  host=lc(host)||"";
  var h=2166136261;
  for(var i=0;i<host.length;i++){
    h^=host.charCodeAt(i);
    h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);
  }
  return Math.abs(h);
}

function chooseProxyForHost(host, arr){
  if(!arr || arr.length===0) return null;
  return arr[hostHash(host)%arr.length];
}

function FindProxyForURL(url, host){
  host=lc(host||"");
  if(__PAC_CACHE.proxyForHost[host]) return __PAC_CACHE.proxyForHost[host];

  if(isLocalTarget(host)){ __PAC_CACHE.proxyForHost[host]=CHAIN_LOBBY; return CHAIN_LOBBY; }
  if(inList(host,CONNECTIVITY)){ __PAC_CACHE.proxyForHost[host]=CHAIN_LOBBY; return CHAIN_LOBBY; }
  if(inList(host,HEAVY)){ __PAC_CACHE.proxyForHost[host]=CHAIN_LOBBY; return CHAIN_LOBBY; }
  if(inList(host,JO_HOSTS)){ __PAC_CACHE.proxyForHost[host]=CHAIN_LOBBY; return CHAIN_LOBBY; }

  if(inList(host,LOBBY_HOSTS)){
    var ip=dnsResolveCached(host);
    var preferJO = isJO(ip);
    var pick = preferJO ? chooseProxyForHost(host,[PROXY_MATCH_PRIMARY,PROXY_MATCH_BACKUP]) 
                        : chooseProxyForHost(host,[PROXY_MATCH_PRIMARY,PROXY_MATCH_BACKUP,PROXY_LOBBY_PRIMARY,PROXY_LOBBY_BACKUP]);
    __PAC_CACHE.proxyForHost[host]=pick; 
    return pick;
  }

  if(inList(host,MATCH_HOSTS)){
    var pickM = chooseProxyForHost(host,[PROXY_MATCH_PRIMARY,PROXY_MATCH_BACKUP,PROXY_LOBBY_PRIMARY]);
    __PAC_CACHE.proxyForHost[host]=pickM; 
    return pickM;
  }

  if(shExpMatch(host,"*.pubg*") || shExpMatch(host,"*tencent*") || shExpMatch(host,"*qcloud*") || shExpMatch(host,"*qq.com")){
    var ip2=dnsResolveCached(host);
    var pickFallback = isJO(ip2) ? chooseProxyForHost(host,[PROXY_MATCH_PRIMARY,PROXY_MATCH_BACKUP])
                                 : chooseProxyForHost(host,[PROXY_MATCH_PRIMARY,PROXY_MATCH_BACKUP,PROXY_LOBBY_PRIMARY,PROXY_LOBBY_BACKUP]);
    __PAC_CACHE.proxyForHost[host]=pickFallback; 
    return pickFallback;
  }

  if(isIPv4(host) || isIPv6(host)){ __PAC_CACHE.proxyForHost[host]=CHAIN_LOBBY; return CHAIN_LOBBY; }

  __PAC_CACHE.proxyForHost[host]=CHAIN_LOBBY; 
  return CHAIN_LOBBY;
}
