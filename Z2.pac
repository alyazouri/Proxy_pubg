var PROXY_HOST = "91.106.109.12";

var LOBBY_PORTS = [8443, 9050, 9200, 9443];
var MATCH_PORTS = [5090, 5200, 7300, 8088, 8500];

var LOBBY_DOMAINS = [
  "api.pubgmobile.com",
  "me-hl.pubgmobile.com",
  "match.pubg.com",
  "pubgmobile.live",
  "igamecj.com",
  "gpubgm.com"
];

var MATCH_DOMAINS = [
  "*.pubgmcdn.com",
  "*.tencentcloud.com",
  "*.tencentgames.com",
  "cloud.gpubgm.com",
  "game.pubgmobile.com"
];

function inList(h, patterns) {
  h = h.toLowerCase();
  for (var i = 0; i < patterns.length; i++) if (shExpMatch(h, patterns[i])) return true;
  return false;
}

function hsh(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h < 0 ? -h : h;
}

function rotate(arr, k) {
  var n = arr.length;
  if (!n) return arr;
  k = k % n;
  return k ? arr.slice(k).concat(arr.slice(0, k)) : arr.slice(0);
}

function chain(ports, key) {
  var order = rotate(ports, hsh(key) % ports.length);
  var out = [];
  for (var i = 0; i < order.length; i++) out.push("SOCKS5 " + PROXY_HOST + ":" + order[i]);
  return out.join("; ");
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  if (inList(host, LOBBY_DOMAINS)) return chain(LOBBY_PORTS, host);
  if (inList(host, MATCH_DOMAINS)) return chain(MATCH_PORTS, host);

  if (url.substring(0, 5) === "wss://" || url.substring(0, 5) === "ws://")
    return chain(MATCH_PORTS, host);

  if (shExpMatch(host, "*.jo") || shExpMatch(host, "*jordan*"))
    return chain(LOBBY_PORTS, host);

  return chain(MATCH_PORTS, host);
}
