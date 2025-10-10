// ===== Final PAC (PAC-safe, SOCKS5, deterministic rotation) =====

var PROXY_HOST = "91.106.109.12";
var DEFAULT_PORT = "20001";

var PORTS = {
  LOBBY:   ["5000","5001"],
  MATCH:   ["20001","20002","20003"],
  TDM:     ["9999","10000"],
  RECRUIT: ["8085","1080","5000"]
};

// (base, mask) — قابلة للاستخدام مباشرة مع isInNet
var GLOBAL_NETWORKS = [
  ["95.141.32.0", "255.255.240.0"],
  ["176.29.0.0",  "255.255.0.0"]
];

// شبكات موثوقة (تحويل CIDR إلى (base,mask))
var TRUSTED_NETS = [
  ["185.143.224.0","255.255.224.0"], // 185.143.224.0/19 (SA)
  ["185.159.24.0", "255.255.252.0"], // 185.159.24.0/22 (AE)
  ["82.102.0.0",   "255.255.0.0"]    // 82.102.0.0/16 (KW)
];

// نطاقات اللعب
var HOST_RULES = {
  LOBBY: [
    "*.pubg.com",
    "*.pubgmobile.com",
    "*.broker.amsoveasea.com",
    "*.vasdgame.com"
  ],
  MATCH: [
    "*.pubgmobile.com",
    "*.battlegroundsmobile.com",
    "*.igamecj.com",
    "*.tencentgames.com"
  ],
  RECRUIT: [
    "api.pubgmobile.com",
    "game.pubgmobile.com",
    "www.pubgmobile.com"
  ]
};

// DNS cache بسيط (بدون Map)
var DNS_TTL_MS = 30000; // غيّرها لو بدك استجابة أسرع/أبطأ
var _dns_cache_hosts = [];
var _dns_cache_ips   = [];
var _dns_cache_time  = [];

function dns_cached(host) {
  var now = new Date().getTime();
  for (var i=0; i<_dns_cache_hosts.length; i++) {
    if (_dns_cache_hosts[i] === host) {
      if ((now - _dns_cache_time[i]) < DNS_TTL_MS) return _dns_cache_ips[i];
      break;
    }
  }
  var ip = dnsResolve(host);
  if (ip) {
    if (i < _dns_cache_hosts.length) {
      _dns_cache_ips[i]  = ip;
      _dns_cache_time[i] = now;
    } else {
      _dns_cache_hosts.push(host);
      _dns_cache_ips.push(ip);
      _dns_cache_time.push(now);
    }
  }
  return ip;
}

// أدوات
function hashString(s) {
  var h = 0;
  for (var i=0; i<s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h = h | 0;
  }
  return Math.abs(h);
}

function uniq(arr) {
  var out = [], seen = {};
  for (var i=0; i<arr.length; i++) {
    var v = String(arr[i]);
    if (v && !seen[v]) { seen[v] = 1; out.push(v); }
  }
  return out;
}

function chainFor(ports, k1, k2) {
  var p = uniq(ports);
  if (p.length === 0) return "SOCKS5 " + PROXY_HOST + ":" + DEFAULT_PORT;
  var start = hashString(String(k1)+String(k2)) % p.length;
  var parts = [];
  for (var i=0; i<p.length; i++) {
    var idx = (start + i) % p.length;
    parts.push("SOCKS5 " + PROXY_HOST + ":" + p[idx]);
  }
  return parts.join("; ");
}

function matchHost(host, list) {
  host = host.toLowerCase();
  for (var i=0; i<list.length; i++) {
    if (shExpMatch(host, list[i].toLowerCase())) return true;
  }
  return false;
}

function isGameTraffic(url, host) {
  var u = url.toLowerCase(), h = host.toLowerCase();
  var pats = ["/tdm","/arena","/team","/invite","/recruit","/room","/squad"];
  for (var i=0; i<pats.length; i++) {
    var p = pats[i];
    if (u.indexOf(p) !== -1 || h.indexOf(p) !== -1) return true;
  }
  return false;
}

function inAnyNet(ip, nets) {
  for (var i=0; i<nets.length; i++) {
    if (isInNet(ip, nets[i][0], nets[i][1])) return true;
  }
  return false;
}

// ===== الموجه الرئيسي =====
function FindProxyForURL(url, host) {
  if (!host) return "SOCKS5 " + PROXY_HOST + ":" + DEFAULT_PORT;

  var h = host.toLowerCase();

  // استثناء ثقيل — يوتيوب (كما هو في سكربتك)
  if (h === "youtube.com" || shExpMatch(h, "*.youtube.com")) {
    return "DIRECT";
  }

  // إذا الـ IP ضمن الشبكات المعطاة (GLOBAL أو TRUSTED) -> اعتبره لوبـي
  var ip = dns_cached(h);
  if (ip && (inAnyNet(ip, GLOBAL_NETWORKS) || inAnyNet(ip, TRUSTED_NETS))) {
    return chainFor(PORTS.LOBBY, url, host);
  }

  // تجنيد محلي: لو كان ضمن RECRUIT -> استخدم سلسلة RECRUIT (بدل DIRECT حتى يضل عبر SOCKS5)
  if (matchHost(h, HOST_RULES.RECRUIT)) {
    return chainFor(PORTS.RECRUIT, url, host);
  }

  // لوبي
  if (matchHost(h, HOST_RULES.LOBBY)) {
    return chainFor(PORTS.LOBBY, url, host);
  }

  // TDM/ARENA
  if (isGameTraffic(url, h)) {
    return chainFor(PORTS.TDM, url, host);
  }

  // كلاسيك/ماتش
  if (matchHost(h, HOST_RULES.MATCH)) {
    return chainFor(PORTS.MATCH, url, host);
  }

  // افتراضي
  return "SOCKS5 " + PROXY_HOST + ":" + DEFAULT_PORT;
}
