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

var JO_IPV4 = [
  { ip: "185.34.16.0", mask: "255.255.252.0" },
  { ip: "188.247.64.0", mask: "255.255.192.0" },
  { ip: "95.141.32.0",  mask: "255.255.240.0" }
];

var JO_IPV6 = [
  { ip: "2a13:a5c7::", mask: "ffff:ffff:ffff:ffff::" }
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
  var n = arr.length; if (!n) return arr;
  k = k % n; if (k === 0) return arr.slice(0);
  return arr.slice(k).concat(arr.slice(0, k));
}

function buildChain(ports, key) {
  var order = rotate(ports, hsh(key) % ports.length);
  var out = [];
  for (var i = 0; i < order.length; i++) out.push("SOCKS5 " + PROXY_HOST + ":" + order[i]);
  return out.join("; ");
}

function ipIsInJordan(ip) {
  if (!ip) return false;
  for (var i = 0; i < JO_IPV4.length; i++) if (isInNet(ip, JO_IPV4[i].ip, JO_IPV4[i].mask)) return true;
  for (var j = 0; j < JO_IPV6.length; j++) { try { if (isInNet(ip, JO_IPV6[j].ip, JO_IPV6[j].mask)) return true; } catch (e) {} }
  return false;
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  if (inList(host, LOBBY_DOMAINS) || shExpMatch(host, "*.jo") || shExpMatch(host, "*jordan*")) {
    var ip = null; try { ip = dnsResolve(host); } catch (e) { ip = null; }
    if (ip && ipIsInJordan(ip)) return buildChain(LOBBY_PORTS, host);
    return "PROXY 127.0.0.1:9";
  }

  if (inList(host, MATCH_DOMAINS) || url.substring(0,5) === "wss://" || url.substring(0,5) === "ws://")
    return buildChain(MATCH_PORTS, host);

  if (shExpMatch(host, "*.jo") || shExpMatch(host, "*jordan*"))
    return buildChain(LOBBY_PORTS, host);

  return buildChain(MATCH_PORTS, host);
}
