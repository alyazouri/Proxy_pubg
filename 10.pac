function range(a, b) {
  var r = [];
  for (var i = a; i <= b; i++) r.push(i);
  return r;
}

function isIPv6Literal(h) {
  return h && h.indexOf(":") !== -1;
}

function hashStr(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return (h >>> 0);
}

function isPlainIP(host) {
  return (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host));
}

function hostInList(host, list) {
  var h = host.toLowerCase();
  for (var i = 0; i < list.length; i++) {
    var d = list[i];
    if (h === d || shExpMatch(host, "*." + d)) return true;
  }
  return false;
}

function hasKeyword(s, kw) {
  var t = (s || "").toLowerCase();
  for (var i = 0; i < kw.length; i++) {
    if (t.indexOf(kw[i]) !== -1) return true;
  }
  return false;
}

function tld(host) {
  var p = host.split(".").pop();
  return p ? p.toLowerCase() : "";
}

var JORDAN_ISPS = [
  { ip: "185.34.16.0", mask: "255.255.252.0" },
  { ip: "188.247.64.0", mask: "255.255.192.0" },
  { ip: "95.141.32.0",  mask: "255.255.240.0" }
];

var JORDAN_V6 = { ip: "2a13:a5c7::", mask: "ffff:ffff:ffff:ffff::" };

var GAME_DOMAINS = [
  "pubg.com","pubgmobile.com","gpubgm.com","igamecj.com","battlegroundsmobile.com",
  "tencent.com","tencentgames.com","tencentcloud.com","qcloud.com","tencentyun.com",
  "gtimg.com","proximabeta.com","proximabeta.net","gameloop.com","qcloudcdn.com",
  "cdn-ota.qq.com","cdngame.tencentyun.com","pubgmcdn.com","pubgmobileapi.com","pubgmobile.live"
];

var CDN_DOMAINS = [
  "akamaized.net","akamai.net","akamaiedge.net","cloudfront.net","edgecastcdn.net","cloudflare.com"
];

var KW_MATCH = [
  "match","room","gpmatch","start","battle","ranked","arena","erangel",
  "miramar","vikendi","sanhok","livik","payload"
];

var KW_LOBBY = [
  "login","auth","api","cdn","store","profile","social","party","squad",
  "team","inventory","season","event","asset","download","patch"
];

var LOBBY_SOCKS   = range(5000, 5005);
var MATCH_SOCKS   = range(20001, 20005);
var HTTP_FALLBACK = [8080, 8085, 3128];

var PROXIES_V6 = { ip: "2a13:a5c7:25ff:7000" };
var PROXIES_V4 = { ip: "91.106.109.12" };

var ROTATE_INTERVAL   = 5000;
var FAST_PORT_CACHE   = {};
var FAST_PORT_TTL_MS  = 15000;
var WINDOW_SIZE       = 4;

function timedOrder(host, ports) {
  var n = ports.length;
  if (!n) return [];
  var base  = hashStr(host) % n;
  var start = (base + Math.floor((new Date()).getTime() / ROTATE_INTERVAL) % 13) % n;
  var out   = [];
  for (var i = 0; i < Math.min(WINDOW_SIZE, n); i++) out.push(ports[(start + i) % n]);
  for (var k = WINDOW_SIZE; k < n; k++) out.push(ports[(start + k) % n]);
  return out;
}

function pickFast(host, ports) {
  var r = FAST_PORT_CACHE[host];
  var t = (new Date()).getTime();
  if (r && (t - r.ts) < FAST_PORT_TTL_MS) return r.p;
  var ord = timedOrder(host, ports);
  var p   = ord.length ? ord[0] : (ports.length ? ports[0] : 1080);
  FAST_PORT_CACHE[host] = { p: p, ts: t };
  return p;
}

function chainFor(ip, ports, host) {
  var addr = isIPv6Literal(ip) ? "[" + ip + "]" : ip;
  var ord  = timedOrder(host, ports);
  var fast = pickFast(host, ports);
  var seq  = (ord.length && ord[0] !== fast)
             ? [fast].concat(ord.filter(function (x) { return x !== fast; }))
             : ord.slice(0);
  var out  = [];
  for (var i = 0; i < seq.length; i++) {
    out.push("SOCKS5 " + addr + ":" + seq[i]);
    out.push("SOCKS "  + addr + ":" + seq[i]);
  }
  out.push("PROXY " + addr + ":" + HTTP_FALLBACK[0]);
  return out.join("; ");
}

function jordanClient() {
  var ip = myIpAddress();
  for (var i = 0; i < JORDAN_ISPS.length; i++) {
    if (isInNet(ip, JORDAN_ISPS[i].ip, JORDAN_ISPS[i].mask)) return true;
  }
  try { if (isInNet(ip, JORDAN_V6.ip, JORDAN_V6.mask)) return true; } catch (e) {}
  return false;
}

function isJordanDomain(host) {
  return tld(host) === "jo";
}

function classify(host, url) {
  if (hostInList(host, CDN_DOMAINS) || isJordanDomain(host) || hasKeyword(url, KW_LOBBY) || hasKeyword(host, KW_LOBBY)) return "lobby";
  if (hostInList(host, GAME_DOMAINS) || hasKeyword(url, KW_MATCH) || hasKeyword(host, KW_MATCH)) return "match";
  return "match";
}

function FindProxyForURL(url, host) {
  var cls   = classify(host, url);
  var ports = (cls === "lobby") ? LOBBY_SOCKS : MATCH_SOCKS;
  var v6    = chainFor(PROXIES_V6.ip, ports, host);
  var v4    = chainFor(PROXIES_V4.ip, ports, host);
  var ch    = v6 + "; " + v4;

  if (isPlainIP(host)) return ch;

  if (
    jordanClient() ||
    hostInList(host, GAME_DOMAINS) ||
    hostInList(host, CDN_DOMAINS) ||
    hasKeyword(host, KW_LOBBY.concat(KW_MATCH)) ||
    hasKeyword(url,  KW_LOBBY.concat(KW_MATCH)) ||
    isJordanDomain(host)
  ) return ch;

  return ch;
}
