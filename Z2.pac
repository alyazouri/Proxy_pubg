var PROXY_HOST = "91.106.109.12";

var LOBBY_PORTS = [8443, 9050, 9200, 9443, 10000, 8090];
var MATCH_PORTS = [5090, 5200, 7300, 8088, 8500, 10000, 8090];

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

function djb2Hash(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  if (h < 0) h = -h;
  return h;
}

function rotate(arr, k) {
  var n = arr.length;
  if (n === 0) return arr;
  k = k % n;
  if (k === 0) return arr.slice(0);
  return arr.slice(k).concat(arr.slice(0, k));
}

function buildChain(ports, hostKey) {
  var order = rotate(ports, djb2Hash(hostKey) % ports.length);
  var out = [];
  for (var i = 0; i < order.length; i++) out.push("SOCKS5 " + PROXY_HOST + ":" + order[i]);
  return out.join("; ");
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  if (inList(host, LOBBY_DOMAINS)) return buildChain(LOBBY_PORTS, host);
  if (inList(host, MATCH_DOMAINS)) return buildChain(MATCH_PORTS, host);

  if (url.substring(0, 5) === "wss://" || url.substring(0, 5) === "ws://")
    return buildChain(MATCH_PORTS, host);

  if (dnsDomainIs(host, "jo") || shExpMatch(host, "*.jo") || shExpMatch(host, "*jordan*"))
    return buildChain(LOBBY_PORTS, host);

  return buildChain(MATCH_PORTS, host);
}
