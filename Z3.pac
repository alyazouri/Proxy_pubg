var LOBBY   = "SOCKS5 91.106.109.12:20091";
var CLASSIC = "SOCKS5 91.106.109.12:20033";
var TDM     = "SOCKS5 91.106.109.12:20088";
var RECRUIT = "SOCKS5 91.106.109.12:20067";
var GENERAL = "SOCKS5 91.106.109.12:20001";

var H_LOBBY = [
  "match.pubg.com",
  "me-hl.pubgmobile.com",
  "hl.pubgmobile.com",
  "me.pubg.com",
  "napubgm.broker.amsoveasea.com",
  "*.gpubgm.com"
];

var H_MATCH = [
  "*.pubgmobile.com",
  "*.battlegroundsmobile.com",
  "*.pubgmcdn.com",
  "*.igamecj.com",
  "*.tencentgames.com",
  "*.tencentcloud.com",
  "*.gcloudstatic.com",
  "*.qcloudcdn.com",
  "*.kunlungr.com"
];

var H_RECRUIT = [
  "api.pubgmobile.com",
  "game.pubgmobile.com",
  "www.pubgmobile.com"
];

function anyMatch(host, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (shExpMatch(host, arr[i])) return true;
  }
  return false;
}

function isTDM(url) {
  var u = url.toLowerCase();
  return (u.indexOf("/tdm") !== -1 || u.indexOf("tdm.") !== -1 || u.indexOf("/arena") !== -1 || u.indexOf("arena.") !== -1);
}

function isRecruit(url) {
  var u = url.toLowerCase();
  return (u.indexOf("/team") !== -1 || u.indexOf("/invite") !== -1 || u.indexOf("/recruit") !== -1 || u.indexOf("/room") !== -1 || u.indexOf("/squad") !== -1);
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();
  if (anyMatch(host, H_LOBBY)) return LOBBY;
  if (isTDM(url)) return TDM;
  if (anyMatch(host, H_RECRUIT) && isRecruit(url)) return RECRUIT;
  if (anyMatch(host, H_MATCH)) return CLASSIC;
  return GENERAL;
}
