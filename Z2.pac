var PROXY_HOST    = "91.106.109.12";
var GENERAL_PORT  = "20001";

var LOBBY_PORTS   = ["2001","2002","7777"];
var CLASSIC_PORTS = ["2003","2016","8888"];
var TDM_PORTS     = ["2019","2020","10000"];
var RECRUIT_PORTS = ["4000","4003","10001"];

var H_LOBBY = [
  "match.pubg.com",
  "me-hl.pubgmobile.com",
  "hl.pubgmobile.com",
  "me.pubg.com",
  "napubgm.broker.amsoveasea.com",
  "nawzryhwatm.broker.amsoveasea.com",
  "*.broker.amsoveasea.com",
  "broker-*.vasdgame.com",
  "*.broker.*.vasdgame.com",
  "atm-broker-ws-*-sg.vasdgame.com",
  "napubgm-broker.*.eo.dnse1.com",
  "lobby*.eo.dnse1.com",
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
  "*.kunlungr.com",
  "mgl.lobby.igamecj.com",
  "api.club.gpubgm.com",
  "cloudctrl.igamecj.com",
  "ig-us-sdkapi.igamecj.com"
];

var H_RECRUIT = [
  "api.pubgmobile.com",
  "game.pubgmobile.com",
  "www.pubgmobile.com"
];

var JO_NETS = [
  ["95.141.32.0","255.255.240.0"],
  ["176.29.0.0","255.255.0.0"],
  ["37.123.64.0","255.255.224.0"],
  ["185.109.192.0","255.255.252.0"],
  ["188.247.64.0","255.255.255.0"],
  ["213.139.32.0","255.255.224.0"],
  ["149.200.128.0","255.255.128.0"],
  ["213.186.160.0","255.255.224.0"]
];

function anyMatch(host, arr) {
  for (var i = 0; i < arr.length; i++) if (shExpMatch(host, arr[i])) return true;
  return false;
}

function inAnyNet(host, nets) {
  var ip = dnsResolve(host) || host;
  if (!ip) return false;
  for (var i = 0; i < nets.length; i++) if (isInNet(ip, nets[i][0], nets[i][1])) return true;
  return false;
}

function hashString(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
  return Math.abs(h);
}

function buildChain(ports, keyA, keyB) {
  if (!ports || ports.length === 0) return "";
  var start = hashString(keyA + "|" + keyB) % ports.length;
  var out = [];
  for (var i = 0; i < ports.length; i++) out.push("SOCKS5 " + PROXY_HOST + ":" + ports[(start + i) % ports.length]);
  return out.join("; ");
}

function isTDM(url, host) {
  var u = url.toLowerCase(), h = host.toLowerCase();
  return (u.indexOf("/tdm") !== -1 || u.indexOf("/arena") !== -1 || shExpMatch(h, "tdm.*") || shExpMatch(h, "*.tdm.*"));
}

function isRecruit(url) {
  var u = url.toLowerCase();
  return (u.indexOf("/team") !== -1 || u.indexOf("/invite") !== -1 || u.indexOf("/recruit") !== -1 || u.indexOf("/room") !== -1 || u.indexOf("/squad") !== -1);
}

function isWS(url) {
  var u = url.toLowerCase();
  return (u.indexOf("ws://") === 0 || u.indexOf("wss://") === 0);
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  if (shExpMatch(host,"*.youtube.com") || shExpMatch(host,"youtube.com") || shExpMatch(host,"*.youtu.be") || shExpMatch(host,"youtu.be") || shExpMatch(host,"*.googlevideo.com") || shExpMatch(host,"*.ytimg.com") || shExpMatch(host,"youtube-nocookie.com")) return "DIRECT";

  if (inAnyNet(host, JO_NETS)) return buildChain(LOBBY_PORTS, url, host);

  if (anyMatch(host, H_LOBBY)) {
    if (isWS(url)) return buildChain(LOBBY_PORTS, url, host);
    return buildChain(LOBBY_PORTS, url, host);
  }

  if (isTDM(url, host)) return buildChain(TDM_PORTS, url, host);

  if (anyMatch(host, H_RECRUIT) && isRecruit(url)) return buildChain(RECRUIT_PORTS, url, host);

  if (anyMatch(host, H_MATCH)) return buildChain(CLASSIC_PORTS, url, host);

  return "SOCKS5 " + PROXY_HOST + ":" + GENERAL_PORT;
}
