var JO_POOL = [
  { proxy: "SOCKS5 91.106.109.12:20001", weight: 6 },
  { proxy: "SOCKS5 91.106.109.12:20002", weight: 5 },
  { proxy: "SOCKS5 91.106.109.12:5000",  weight: 4 },
  { proxy: "SOCKS5 91.106.109.12:5001",  weight: 3 }
];

var BLOCK = "PROXY 0.0.0.0:0; PROXY 127.0.0.1:0";

var JO_DNS = [
  "dns.jo",
  "resolver1.dns.jo",
  "resolver2.dns.jo"
];

var GAME_HOSTS_RE = /^(.*\.)?(pubgmobile\.com|pubg\.com|gpubgm\.com|tencentgames\.com|tencent\.com|pubgmcdn\.com|battlegroundsmobile\.com|api\.pubgmobile\.com|match\.pubg\.com|lobby\.pubgmobile\.com|party\.pubgmobile\.com|session\.pubgmobile\.com|classic\.pubgmobile\.com|recruit\.pubgmobile\.com|tdm\.pubgmobile\.com|arena\.pubgmobile\.com|arcade\.pubgmobile\.com|event\.pubgmobile\.com|me-hl\.pubgmobile\.com|me\.pubgmobile\.com|matchmaker\.pubgmobile\.com|pubgmobileapi\.com|pgsl\.tencent\.com|igame\.(qq|cj)\.com|pg\.qq\.com|cloud\.gpubgm\.com|hl\.pubgmobile\.com|search\.pubgmobile\.com|game\.api\.pubgmobile\.com|match\.api\.pubgmobile\.com)$/i;

var STUN_DOMAINS = [
  "stun.l.google.com",
  "stun1.l.google.com",
  "stun2.l.google.com",
  "stun3.l.google.com",
  "stun4.l.google.com",
  "stun.voipbuster.com",
  "stun.stunprotocol.org",
  "stunserver.org"
];

var GAME_PORTS = {
  "10012": 1,
  "13004": 1,
  "14000": 1,
  "17000": 1,
  "17500": 1,
  "18081": 1,
  "20000": 1,
  "20001": 1,
  "20002": 1,
  "20371": 1,
  "5001": 1
};

var JO_V4 = [
  ["185.34.16.0", "255.255.252.0"],
  ["91.106.0.0", "255.255.0.0"],
  ["176.28.128.0", "255.255.128.0"],
  ["194.165.128.0", "255.255.252.0"],
  ["213.139.32.0", "255.255.224.0"],
  ["94.249.70.0", "255.255.255.0"],
  ["212.118.21.0", "255.255.255.0"],
  ["176.29.72.0", "255.255.255.0"]
];

var JO_V6_PREFIXES = [
  "2a13:a5c7:",
  "2a02:ed0:"
];

var JO_HOST_PATTERNS = [
  /\.jo$/i,
  /\.local\.jo$/i,
  /jordan/i
];

var DNS_CACHE = {};

var DNS_TTL_MS = 3000;

var STICKY = {};

var STICKY_TTL_MS = 35000;

function nowMs() {
  return (new Date()).getTime();
}

function portFromUrl(u) {
  var m = u.match(/:(\d+)(?:[\/]|$)/);
  return m ? m[1] : null;
}

function fnv1a(s) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function totalWeight() {
  var sum = 0;
  for (var i = 0; i < JO_POOL.length; i++) {
    sum += JO_POOL[i].weight;
  }
  return sum;
}

function pickProxyChain(host, port) {
  var window = Math.floor(nowMs() / 1000 / 10);
  var key = host + ":" + (port || "") + "|" + window;
  var h = fnv1a(key);
  var t = totalWeight();
  var v = h % t;
  var s = 0;
  for (var i = 0; i < JO_POOL.length; i++) {
    s += JO_POOL[i].weight;
    if (v < s) {
      var a = JO_POOL[i].proxy;
      var b = JO_POOL[(i + 1) % JO_POOL.length].proxy;
      return a + "; " + b;
    }
  }
  return JO_POOL[0].proxy;
}

function setSticky(host, port, chain) {
  var k = host + "|" + (port || "");
  STICKY[k] = { chain: chain, ts: nowMs() };
}

function getSticky(host, port) {
  var k = host + "|" + (port || "");
  var e = STICKY[k];
  if (e && (nowMs() - e.ts) < STICKY_TTL_MS) return e.chain;
  return null;
}

function dnsResolveCached(host) {
  var rec = DNS_CACHE[host];
  if (rec && (nowMs() - rec.ts) < DNS_TTL_MS) return rec.ip;
  try {
    var ip = dnsResolve(host);
    DNS_CACHE[host] = { ip: ip, ts: nowMs(), attempts: 0 };
    return ip;
  } catch (err) {
    if (!rec) rec = { ip: null, ts: nowMs(), attempts: 0 };
    rec.attempts = (rec.attempts || 0) + 1;
    rec.ts = nowMs();
    DNS_CACHE[host] = rec;
    return null;
  }
}

function isV4InRanges(ip, ranges) {
  if (!ip || ip.indexOf(".") === -1) return false;
  for (var i = 0; i < ranges.length; i++) {
    if (isInNet(ip, ranges[i][0], ranges[i][1])) return true;
  }
  return false;
}

function isV6InPrefixes(ip, prefixes) {
  if (!ip || ip.indexOf(":") === -1) return false;
  var low = ip.toLowerCase();
  for (var i = 0; i < prefixes.length; i++) {
    if (low.indexOf(prefixes[i]) === 0) return true;
  }
  return false;
}

function hostLooksJoByName(host) {
  for (var i = 0; i < JO_HOST_PATTERNS.length; i++) {
    if (JO_HOST_PATTERNS[i].test(host)) return true;
  }
  return false;
}

function isStunDomain(host) {
  var h = host.toLowerCase();
  for (var i = 0; i < STUN_DOMAINS.length; i++) {
    if (h.indexOf(STUN_DOMAINS[i]) !== -1) return true;
  }
  return false;
}

function isGameHost(host) {
  return GAME_HOSTS_RE.test(host);
}

function decideChain(url, host) {
  host = host.toLowerCase();
  var port = portFromUrl(url);
  var sticky = getSticky(host, port);
  if (sticky) return sticky;
  for (var i = 0; i < JO_DNS.length; i++) {
    if (shExpMatch(host, "*" + JO_DNS[i])) {
      var c0 = pickProxyChain(host, port);
      setSticky(host, port, c0);
      return c0;
    }
  }
  if (hostLooksJoByName(host)) {
    var c1 = pickProxyChain(host, port);
    setSticky(host, port, c1);
    return c1;
  }
  var resolved = dnsResolveCached(host);
  if (resolved) {
    if (isV4InRanges(resolved, JO_V4) || isV6InPrefixes(resolved, JO_V6_PREFIXES)) {
      var c2 = pickProxyChain(host, port);
      setSticky(host, port, c2);
      return c2;
    }
  }
  var portIsGame = port && (port in GAME_PORTS);
  if (isGameHost(host) || portIsGame || (url.indexOf("ws://") === 0 || url.indexOf("wss://") === 0)) {
    var c3 = pickProxyChain(host, port);
    setSticky(host, port, c3);
    return c3;
  }
  if (isStunDomain(host) || (port && (port === "3478" || port === "19302" || port === "5349"))) return BLOCK;
  return BLOCK;
}

function FindProxyForURL(url, host) {
  try {
    return decideChain(url, host);
  } catch (e) {
    return BLOCK;
  }
}
