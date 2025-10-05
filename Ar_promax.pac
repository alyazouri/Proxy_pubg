var PROXY_MATCH_PRIMARY = "SOCKS5 91.106.109.12:20001";
var PROXY_MATCH_BACKUP  = "SOCKS5 91.106.109.12:20002";
var PROXY_LOBBY_PRIMARY = "SOCKS5 91.106.109.12:5000";
var PROXY_LOBBY_BACKUP  = "SOCKS5 91.106.109.12:5001";

var CHAIN_MATCH = PROXY_MATCH_PRIMARY + "; " + PROXY_MATCH_BACKUP;
var CHAIN_LOBBY = PROXY_LOBBY_PRIMARY + "; " + PROXY_LOBBY_BACKUP;

var LOBBY_HOSTS = [
  "match.pubg.com",
  "api.pubg.com",
  "hl.pubg.com",
  "api.pubgmobile.com",
  "me-hl.pubgmobile.com",
  "www.pubgmobile.com",
  "pubgmobile.com",
  "pubgmobile.live",
  "cloud.gpubgm.com",
  "gcloud.pubgmobile.com",
  "tencent.com",
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
  "invite",
  "recruit",
  "party",
  "team",
  "group",
  "lookingfor",
  "looking-for",
  "lfteam",
  "lfm",
  "join"
];

function lc(s){
  return (s||"").toLowerCase();
}

function hostMatches(host, pat){
  host = lc(host);
  pat  = lc(pat);
  if (pat.indexOf("*.") === 0) {
    var base = pat.substring(2);
    return host === base || host.endsWith("." + base);
  }
  return host === pat;
}

function inList(host, arr){
  host = lc(host);
  for (var i=0;i<arr.length;i++){
    if (hostMatches(host, arr[i])) return true;
  }
  return false;
}

function containsAny(s, arr){
  s = lc(s||"");
  for (var i=0;i<arr.length;i++){
    if (s.indexOf(lc(arr[i])) !== -1) return true;
  }
  return false;
}

function FindProxyForURL(url, host){
  host = lc(host||"");
  url  = lc(url||"");

  if (inList(host, LOBBY_HOSTS)) {
    return CHAIN_LOBBY;
  }

  if (containsAny(host, RECRUIT_KEYS) || containsAny(url, RECRUIT_KEYS)) {
    return CHAIN_LOBBY;
  }

  if (inList(host, MATCH_HOSTS)) {
    return CHAIN_MATCH;
  }

  if (url.indexOf(":20001") !== -1 || url.indexOf(":20002") !== -1) {
    return CHAIN_MATCH;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return CHAIN_MATCH;
  }

  return CHAIN_MATCH;
}
