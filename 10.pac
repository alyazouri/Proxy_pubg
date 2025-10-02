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

function tld(host) {
  var p = (host || "").split(".").pop();
  return p ? p.toLowerCase() : "";
}

function hostInList(host, list) {
  var h = (host || "").toLowerCase();
  for (var i = 0; i < list.length; i++) {
    var d = list[i];
    if (h === d || shExpMatch(host, "*." + d)) return true;
  }
  return false;
}

var GAME_DOMAINS = [
  "pubg.com","pubgmobile.com","gpubgm.com","igamecj.com",
  "battlegroundsmobile.com","tencent.com","tencentgames.com",
  "tencentcloud.com","qcloud.com","tencentyun.com","gtimg.com",
  "proximabeta.com","proximabeta.net","gameloop.com","qcloudcdn.com",
  "cdn-ota.qq.com","cdngame.tencentyun.com","pubgmcdn.com",
  "pubgmobileapi.com","pubgmobile.live"
];

var JO_V4 = [
  { ip:"212.34.0.0",  mask:"255.255.224.0" },
  { ip:"213.139.32.0", mask:"255.255.224.0" },
  { ip:"46.185.128.0", mask:"255.255.128.0" },
  { ip:"46.32.96.0",   mask:"255.255.224.0" },
  { ip:"185.12.244.0", mask:"255.255.252.0" },
  { ip:"185.14.132.0", mask:"255.255.252.0" },
  { ip:"91.106.109.0", mask:"255.255.255.0" }
];

var JO_V6 = [
  { ip:"2a13:a5c7::", mask:"ffff:ffff:ffff:ffff::" }
];

var LOBBY_SOCKS   = range(5000, 5015);
var MATCH_SOCKS   = range(20001, 20025);
var HTTP_FALLBACK = [8080];

var PROXIES_V6 = { ip:"2a13:a5c7:25ff:7000" };
var PROXIES_V4 = { ip:"91.106.109.12" };

var ROTATE_INTERVAL  = 5000;
var FAST_PORT_CACHE  = {};
var FAST_PORT_TTL_MS = 15000;
var WINDOW_SIZE      = 4;

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
  var rec = FAST_PORT_CACHE[host];
  var t   = (new Date()).getTime();
  if (rec && (t - rec.ts) < FAST_PORT_TTL_MS) return rec.p;
  var ord = timedOrder(host, ports);
  var p   = ord.length ? ord[0] : (ports.length ? ports[0] : 1080);
  FAST_PORT_CACHE[host] = { p:p, ts:t };
  return p;
}

function chainFor(ip, ports, host) {
  var addr = isIPv6Literal(ip) ? ("[" + ip + "]") : ip;
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

function clientInJordan() {
  var ip = myIpAddress();
  if (!ip) return false;
  for (var i = 0; i < JO_V4.length; i++) {
    if (isInNet(ip, JO_V4[i].ip, JO_V4[i].mask)) return true;
  }
  try {
    for (var j = 0; j < JO_V6.length; j++) {
      if (isInNet(ip, JO_V6[j].ip, JO_V6[j].mask)) return true;
    }
  } catch (e) {}
  return false;
}

function resolvesToJordan(host) {
  try {
    var r = dnsResolve(host);
    if (!r) return false;
    for (var i = 0; i < JO_V4.length; i++) {
      if (isInNet(r, JO_V4[i].ip, JO_V4[i].mask)) return true;
    }
    try {
      for (var j = 0; j < JO_V6.length; j++) {
        if (isInNet(r, JO_V6[j].ip, JO_V6[j].mask)) return true;
      }
    } catch (e) {}
  } catch (e) {}
  return false;
}

function jordanOnly(host) {
  if (!clientInJordan()) return false;
  if (!host) return false;
  if (tld(host) === "jo") return true;
  if (resolvesToJordan(host)) return true;
  if (hostInList(host, GAME_DOMAINS) && resolvesToJordan(host)) return true;
  return false;
}

function FindProxyForURL(url, host) {
  var isMatch = hostInList(host, GAME_DOMAINS);
  var ports   = isMatch ? MATCH_SOCKS : LOBBY_SOCKS;

  if (jordanOnly(host)) {
    var v6 = chainFor(PROXIES_V6.ip, ports, host);
    var v4 = chainFor(PROXIES_V4.ip, ports, host);
    return v6 + "; " + v4;
  }

  return chainFor(PROXIES_V4.ip, LOBBY_SOCKS, host);
}
