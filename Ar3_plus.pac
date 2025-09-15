// ==========================================================
// PAC - Jordan-first for PUBG (بدون BACKUP_1)
// ==========================================================
var FORCE_ALL     = false;
var FORBID_DIRECT = false;
var BLOCK_IR_TLD  = true;

var PRIMARY   = "PROXY 61.109.106.12:443";    // الرئيسي
var BACKUP_2  = "PROXY 61.109.106.12:8080";  // احتياطي وحيد

var PROXY_CHAIN_STRICT = PRIMARY + "; " + BACKUP_2;
var PROXY_CHAIN_RELAX  = PROXY_CHAIN_STRICT + "; DIRECT";

var LOCAL_BYPASS = ["*.local","*.lan","*.home","*.router","*.gateway","localhost"];
var PRIVATE_NETS = [
  ["10.0.0.0","255.0.0.0"],
  ["172.16.0.0","255.240.0.0"],
  ["192.168.0.0","255.255.0.0"],
  ["127.0.0.0","255.0.0.0"]
];

var PUBG_DOMAINS = [
  "*.pubgmobile.com","*.igamecj.com","*.igamepubg.com","*.tencent.com",
  "*.tencentgames.com","*.tencentyun.com","*.qcloud.com","*.qcloudcdn.com",
  "*.gtimg.com","*.gcloud.qq.com","*.game.qq.com","*.cdn-ota.qq.com",
  "*.cdngame.tencentyun.com","*.akamaized.net","*.vtcdn.com"
];
var GAME_AUX = [
  "*.googleapis.com","*.gstatic.com","*.googleusercontent.com",
  "play.googleapis.com","mtalk.google.com","android.clients.google.com",
  "firebaseinstallations.googleapis.com",
  "*.apple.com","*.icloud.com","gamecenter.apple.com","gamekit.apple.com","apps.apple.com"
];
var GLOBAL_EXCLUDES = [
  "*.youtube.com","*.googlevideo.com",
  "*.whatsapp.net","*.whatsapp.com",
  "*.facebook.com","*.fbcdn.net","*.messenger.com",
  "*.shahid.net","*.shahid.com","*.mbc.net"
];

function inList(host, arr){
  host = (host||"").toLowerCase();
  for (var i=0;i<arr.length;i++){
    if (shExpMatch(host, arr[i].toLowerCase())) return true;
  }
  return false;
}
function isIPv4(h){ return /^\d{1,3}(\.\d{1,3}){3}$/.test(h||""); }
function isIPv6(h){ return h && h.indexOf(":")!==-1 && h.indexOf(".")===-1; }
function isInPrivateNet(ip){
  for (var i=0;i<PRIVATE_NETS.length;i++){
    if (isInNet(ip, PRIVATE_NETS[i][0], PRIVATE_NETS[i][1])) return true;
  }
  return false;
}

function FindProxyForURL(url, host) {
  if (isPlainHostName(host) || inList(host, LOCAL_BYPASS)) return "DIRECT";
  var ip = null;
  if (!isIPv6(host)){
    try { ip = dnsResolve(host); } catch(e) { ip = null; }
    if (ip && isInPrivateNet(ip)) return "DIRECT";
  }
  if (BLOCK_IR_TLD && shExpMatch(host.toLowerCase(), "*.ir")) return "DIRECT";
  if (inList(host, PUBG_DOMAINS) || inList(host, GAME_AUX)) return PROXY_CHAIN_STRICT;
  if (inList(host, GLOBAL_EXCLUDES)) return "DIRECT";
  if (isIPv4(host) || isIPv6(host))
    return FORCE_ALL ? PROXY_CHAIN_STRICT : (FORBID_DIRECT ? PROXY_CHAIN_RELAX : "DIRECT");
  return FORCE_ALL ? PROXY_CHAIN_RELAX : (FORBID_DIRECT ? PROXY_CHAIN_RELAX : "DIRECT");
}
