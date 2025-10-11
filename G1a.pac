var PROXIES = [
  { address: "SOCKS5 91.106.109.12:5000", weight: 4, status: "active", lastChecked: 0 },
  { address: "SOCKS5 91.106.109.50:1080", weight: 3, status: "active", lastChecked: 0 }
];
var ROTATE_INTERVAL_MS = 10000;
var HEALTH_CHECK_INTERVAL_MS = 10000;
var DNS_CACHE_TTL_MS = 900000;
var DOMAIN_CACHE_TTL_MS = 14400000;
var MAX_RETRIES = 1;
var FORCE_ALL_TO_PROXY = false;
var ALLOW_DIRECT_FOR_COMMON = true;

var LOCAL_IP_RANGES = [
  "0.0.0.0/8", "10.0.0.0/8", "127.0.0.0/8", "169.254.0.0/16",
  "172.16.0.0/12", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16",
  "198.18.0.0/15", "224.0.0.0/4", "240.0.0.0/4",
  "188.247.0.0/16", "149.200.0.0/16", "185.83.60.0/22", "94.142.0.0/17",
  "94.249.0.0/16", "46.185.0.0/16", "92.253.0.0/16", "213.139.0.0/16",
  "46.32.0.0/16", "176.29.0.0/16", "92.241.0.0/16", "109.107.0.0/16"
];

var LOCAL_HOST_PATTERNS = [
  "localhost", "*.local", "*.lan", "*.home", "*.internal",
  "*.router", "*.gateway", "*.nas", "*.home.arpa", "*.localdomain",
  "*.intranet", "*.private", "*.corp", "*.orange.jo", "*.orange.com",
  "*.zain.com", "*.umniah.com", "*.ztec.jo", "*.jo"
];

var GAME_DOMAINS = [
  "*pubgmobile.com", "*tencentgames.com", "*qcloud.com", "*tencentyun.com",
  "*gtimg.com", "*game.qq.com", "*qcloudcdn.com", "*cdngame.tencentyun.com",
  "*cdn-ota.qq.com", "*igamecj.com", "*igamepubg.com", "*proximabeta.com",
  "*pubgmobile.global", "*levelinfinite.com"
];

var GAME_KEYWORDS = [
  "*pubg*", "*tencent*", "*igame*", "*proximabeta*", "*qcloud*",
  "*tencentyun*", "*gameloop*", "*match*", "*squad*", "*party*", "*team*", "*rank*"
];

var IGNORE_DOMAINS = ["*ads.*", "*.doubleclick.net", "*.analytics.*", "*.crashlytics.com"];

var GAME_PORTS = new Set([20001, 20003]);

var DYNAMIC_DOMAINS_URL = "https://raw.githubusercontent.com/alyazouri/Proxy_pubg/main/G1a.json";

function now() { return Date.now(); }

var dnsCache = {};
var proxyCache = {};
var localCache = new Set(LOCAL_HOST_PATTERNS);
var domainCache = { lastUpdated: 0, domains: GAME_DOMAINS, failed: false };
var localHostRegex = new RegExp(LOCAL_HOST_PATTERNS.map(p => p.replace(/\*/g, ".*")).join("|"), "i");
var gameDomainRegex = new RegExp(GAME_DOMAINS.map(d => d.replace(/\*/g, ".*")).join("|"), "i");
var gameKeywordRegex = new RegExp(GAME_KEYWORDS.map(k => k.replace(/\*/g, ".*")).join("|"), "i");
var ignoreDomainRegex = new RegExp(IGNORE_DOMAINS.map(d => d.replace(/\*/g, ".*")).join("|"), "i");

function safeResolve(host, retries = 0) {
  var cacheEntry = dnsCache[host];
  if (cacheEntry && now() - cacheEntry.timestamp < DNS_CACHE_TTL_MS) {
    return cacheEntry.ip;
  }
  try {
    var ip = dnsResolve(host) || backupDnsResolve(host);
    if (ip) {
      dnsCache[host] = { ip: ip, timestamp: now() };
      return ip;
    } else if (retries < MAX_RETRIES) {
      return safeResolve(host, retries + 1);
    }
    return null;
  } catch (e) {
    return null;
  }
}

function updateDynamicDomains() {
  if (now() - domainCache.lastUpdated < DOMAIN_CACHE_TTL_MS || domainCache.failed) return;
  try {
    var newDomains = fetchDomainsFromURL(DYNAMIC_DOMAINS_URL);
    if (newDomains && Array.isArray(newDomains)) {
      domainCache.domains = newDomains.concat(GAME_DOMAINS);
      domainCache.lastUpdated = now();
      domainCache.failed = false;
      gameDomainRegex = new RegExp(domainCache.domains.map(d => d.replace(/\*/g, ".*")).join("|"), "i");
    } else {
      domainCache.failed = true;
    }
  } catch (e) {
    domainCache.failed = true;
  }
}

var lastHealthCheck = 0;
function checkProxyHealth() {
  if (now() - lastHealthCheck < HEALTH_CHECK_INTERVAL_MS) return;
  lastHealthCheck = now;
  PROXIES.forEach(function(proxy) {
    var cached = proxyCache[proxy.address];
    if (cached && now() - cached.timestamp < HEALTH_CHECK_INTERVAL_MS) {
      proxy.status = cached.status;
    } else {
      proxy.status = testProxy(proxy.address) ? "active" : "inactive";
      proxyCache[proxy.address] = { status: proxy.status, timestamp: now() };
    }
  });
}

var currentWeightIndex = 0;
function getRotatedProxy() {
  checkProxyHealth();
  var activeProxies = PROXIES.filter(function(p) { return p.status === "active"; });
  if (activeProxies.length === 0) return "DIRECT";
  var totalWeight = activeProxies.reduce(function(sum, p) { return sum + p.weight; }, 0);
  var selected = Math.floor(Math.random() * totalWeight);
  var current = 0;
  for (var i = 0; i < activeProxies.length; i++) {
    current += activeProxies[i].weight;
    if (selected < current) {
      currentWeightIndex = (currentWeightIndex + 1) % activeProxies.length;
      return activeProxies[i].address;
    }
  }
  return activeProxies[0].address;
}

function hostMatchesRegex(host, regex) {
  return regex.test(host);
}

function portMatchesGame(url) {
  var colonIndex = url.lastIndexOf(":");
  if (colonIndex !== -1) {
    var port = parseInt(url.substring(colonIndex + 1), 10);
    return !isNaN(port) && GAME_PORTS.has(port);
  }
  return false;
}

function isWebSocket(url) {
  return url.startsWith("ws://") || url.startsWith("wss://");
}

function smartRedirect(url, host) {
  if (hostMatchesRegex(host, ignoreDomainRegex)) return "DIRECT";
  return null;
}

function log(message) {}

function FindProxyForURL(url, host) {
  try {
    updateDynamicDomains();
    url = url.toLowerCase();
    host = host.toLowerCase();

    var redirect = smartRedirect(url, host);
    if (redirect) return redirect;

    if (isPlainHostName(host) || localCache.has(host) || hostMatchesRegex(host, localHostRegex)) return "DIRECT";

    if (isWebSocket(url) || hostMatchesRegex(host, gameDomainRegex) || hostMatchesRegex(host, gameKeywordRegex) || portMatchesGame(url)) {
      return getRotatedProxy();
    }

    var ip = safeResolve(host);
    if (ip) {
      for (var i = 0; i < LOCAL_IP_RANGES.length; i++) {
        var range = LOCAL_IP_RANGES[i].split("/");
        if (isInNet(ip, range[0], cidrToMask(parseInt(range[1], 10)))) return "DIRECT";
      }
    } else {
      return getRotatedProxy();
    }

    return ALLOW_DIRECT_FOR_COMMON ? "DIRECT" : getRotatedProxy();
  } catch (e) {
    return "DIRECT";
  }
}

function cidrToMask(cidr) {
  var mask = "";
  for (var i = 0; i < 4; i++) {
    var n = Math.min(cidr, 8);
    mask += (256 - Math.pow(2, 8 - n)).toString();
    if (i < 3) mask += ".";
    cidr -= n;
  }
  return mask;
}

function testProxy(address) { return true; }
function backupDnsResolve(host) { return null; }
function fetchDomainsFromURL(url) { return null; }
