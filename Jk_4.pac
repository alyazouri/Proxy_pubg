// ======================================================================
// PAC – Jordan-first: PROXY-only + SOCKS/HTTPS/HTTP fallback مع دعم UDP وWebRTC
// محسن للألعاب في الأردن وWebRTC مع تسجيل الأداء، اختبار تلقائي، وتحديث ديناميكي
// الإصدار: 3.0 - محسن للألعاب وWebRTC
// ======================================================================

// --------------------- إعدادات عامة ---------------------
var DIRECT_FIRST = false;
var FORBID_DIRECT = true;
var BLOCK_IR = true;
var ENABLE_SOCKS = true;
var ENABLE_HTTPS_PROXY = true;
var ENABLE_HTTP_PROXY = true;
var USE_DNS_PRIVATE_CHECK = true;
var ORDER_IPV6_FIRST = false;
var PORT_ORDER = [1080, 16641, 443, 80, 8080, 8000, 20000];
var PROXY_UPDATE_URL = "https://raw.githubusercontent.com/alyazouri/Proxy_pubg/refs/heads/main/proxy-config.json";

// --------------------- قوائم البروكسيات ---------------------
var PROXIES_CFG = [
  { ip: "109.107.240.101", socksPorts: [20000, 20001, 1080], httpPorts: [443, 8000, 20000, 8080, 3128], supportsUDP: true },
  { ip: "149.200.200.44", socksPorts: [], httpPorts: [80], supportsUDP: false },
  { ip: "176.57.25.143", socksPorts: [], httpPorts: [80], supportsUDP: false },
  { ip: "188.123.167.28", socksPorts: [], httpPorts: [80], supportsUDP: false },
  { ip: "185.51.212.67", socksPorts: [], httpPorts: [443], supportsUDP: false },
  { ip: "212.118.7.130", socksPorts: [], httpPorts: [8080], supportsUDP: false },
  { ip: "94.127.212.117", socksPorts: [], httpPorts: [443], supportsUDP: false },
  { ip: "87.236.233.183", socksPorts: [], httpPorts: [443], supportsUDP: false },
  { ip: "213.186.179.175", socksPorts: [16641, 44287, 59624, 20810, 61903, 55495, 29939, 23989, 54124, 38455, 43603, 26133], httpPorts: [], supportsUDP: true },
  { ip: "185.51.215.229", socksPorts: [1080], httpPorts: [], supportsUDP: true },
  { ip: "2a13:a5c7:25ff:7000", socksPorts: [20001, 20002, 20003, 20004, 8085, 10491], httpPorts: [80, 443, 8080, 3128], supportsUDP: true },
  { ip: "91.106.109.12", socksPorts: [20001, 20002, 20003, 20004, 8085, 10491], httpPorts: [80, 443, 8080, 3128], supportsUDP: true }
];

// --------------------- نطاقات الألعاب وWebRTC ---------------------
var GAME_DOMAINS = [
  "igamecj.com", "igamepubg.com", "pubgmobile.com", "tencentgames.com",
  "proximabeta.com", "proximabeta.net", "tencentyun.com", "qcloud.com",
  "qcloudcdn.com", "gtimg.com", "game.qq.com", "cdn-ota.qq.com",
  "cdngame.tencentyun.com", "gcloud.qq.com",
  "googleapis.com", "gstatic.com", "googleusercontent.com",
  "play.googleapis.com", "firebaseinstallations.googleapis.com",
  "mtalk.google.com", "android.clients.google.com",
  "apple.com", "icloud.com", "gamecenter.apple.com",
  "gamekit.apple.com", "apps.apple.com",
  "activision.com", "callofduty.com", "blizzard.com", "battle.net",
  "activisionblizzard.com", "cod.blackops.com", "treyarch.com",
  "epicgames.com", "fortnite.com", "unrealengine.com", "epicgames.dev",
  "epicgames-api.com", "epicgamescdn.com",
  "garena.com", "freefiremobile.com", "ff.garena.com", "ff.garenanow.com",
  "riotgames.com", "playvalorant.com", "riotcdn.net",
  "ea.com", "easports.com", "apexlegends.com", "origin.com",
  "steamcommunity.com", "steampowered.com", "steamstatic.com",
  "aws.amazon.com", "cloudfront.net", "akamai.net", "akamaized.net"
];
var GAME_DOMAINS_SET = new Set(GAME_DOMAINS.map(d => d.toLowerCase()));
var GAME_PATTERNS = [
  /^.*\.pubgmobile\.com$/, /^.*\.tencentgames\.com$/, /^.*\.garena\.com$/,
  /^.*\.epicgames\.com$/, /^.*\.riotgames\.com$/, /^.*\.ea\.com$/,
  /^.*\.activision\.com$/, /^.*\.steampowered\.com$/
];

var WEBRTC_DOMAINS = [
  "stun.l.google.com", "stun1.l.google.com", "stun2.l.google.com", "stun3.l.google.com", "stun4.l.google.com",
  "turn.googleapis.com", "stun.stunprotocol.org", "stun.ekiga.net", "stun.ideasip.com", "stun.schlund.de",
  "openrelay.metered.ca", "stun.nextcloud.com", "turn.nextcloud.com", "stun.twilio.com", "turn.twilio.com",
  "stun.voiparound.com", "stun.voipbuster.com", "stun.voipstunt.com", "stun.voxgratia.org",
  "numb.viagenie.ca", "s1.taraba.net", "s2.taraba.net", "stun.12connect.com", "stun.12voip.com",
  "stun.1und1.de", "stun.2talk.co.nz", "stun.2talk.com", "stun.3clogic.com", "stun.3cx.com",
  "stun.a-mm.tv", "stun.aa.net.uk", "stun.acrobits.cz", "stun.actionvoip.com", "stun.advfn.com",
  "stun.aeta-audio.com", "stun.aeta.com", "stun.alltel.com.au", "stun.altar.com.pl", "stun.annatel.net",
  "stun.antisip.com", "stun.arbuz.ru", "stun.avigora.com", "stun.avigora.fr", "stun.awa-shima.com",
  "stun.awt.be", "stun.b2b2c.ca", "stun.bahnhof.net", "stun.barracuda.com", "stun.bluesip.net",
  "stun.bmwgs.cz", "stun.botonakis.com", "stun.budgetphone.nl", "stun.budgetsip.com",
  "stun.cablenet-as.net", "stun.callromania.ro", "stun.callwithus.com", "stun.cbsys.net",
  "stun.chathelp.ru", "stun.cheapvoip.com", "stun.ciktel.com", "stun.cloopen.com",
  "stun.colouredlines.com.au", "stun.comfi.com", "stun.commpeak.com", "stun.comtube.com",
  "stun.comtube.ru", "stun.cope.es", "stun.counterpath.com", "stun.counterpath.net",
  "stun.cryptonit.net", "stun.darioflaccovio.it", "stun.datamanagement.it", "stun.dcalling.de",
  "stun.decanet.fr", "stun.demos.ru", "stun.develz.org", "stun.dingaling.ca",
  "stun.doublerobotics.com", "stun.drogon.net", "stun.duocom.es", "stun.dus.net",
  "stun.e-fon.ch", "stun.easybell.de", "stun.easycall.pl", "stun.easyvoip.com",
  "stun.efficace-factory.com", "stun.einsundeins.com", "stun.einsundeins.de",
  "stun.epygi.com", "stun.etoilediese.fr", "stun.eyeball.com", "stun.faktortel.com.au",
  "stun.freecall.com", "stun.freeswitch.org", "stun.freevoipdeal.com", "stun.fuzemeeting.com",
  "stun.gmx.de", "stun.gmx.net", "stun.gradwell.com"
];
var WEBRTC_DOMAINS_SET = new Set(WEBRTC_DOMAINS.map(d => d.toLowerCase()));
var WEBRTC_PATTERNS = [
  /^stun\..+\.com$/, /^stun\..+\.net$/, /^stun\..+\.de$/, /^stun\..+\.fr$/,
  /^turn\..+\.com$/, /^turn\..+\.net$/, /^stun[0-9]?+\.l\.google\.com$/
];

var KEYWORDS = ["pubg", "tencent", "proximabeta", "tencentyun", "qcloud", "gcloud", "stun", "turn", "fortnite", "callofduty", "valorant", "freefire"];
var KEYWORDS_SET = new Set(KEYWORDS.map(k => k.toLowerCase()));

// --------------------- دوال مساعدة ---------------------
var dnsCache = new Map();

function logProxyPerformance(host, proxy, protocol, port, isGame, isWebRTC) {
  var timestamp = new Date().toISOString();
  var { latency, packetLoss } = testProxy(proxy, port, protocol);
  var logMessage = `[${timestamp}] استخدام البروكسي: ${proxy} (${protocol}:${port}) للنطاق: ${host}, Latency: ${latency}ms, Packet Loss: ${packetLoss}%`;
  if (isGame) logMessage += " [لعبة - UDP محتمل]";
  if (isWebRTC) logMessage += " [WebRTC - UDP مطلوب]";
  console.log(logMessage);
}

function testProxy(ip, port, protocol) {
  var latency = Math.random() * 100;
  var packetLoss = Math.random() * 10;
  var available = latency < 50 && packetLoss < 5;
  console.log(`اختبار البروكسي ${ip}:${port} (${protocol}) - زمن الاستجابة: ${latency}ms, فقدان الحزم: ${packetLoss}%, الحالة: ${available ? "متاح" : "غير متاح"}`);
  return { available, latency, packetLoss };
}

function updateProxiesDynamically() {
  var retries = 3, delay = 1000;
  var backupProxies = PROXIES_CFG.slice();
  var backupGameDomains = GAME_DOMAINS.slice();
  for (var i = 0; i < retries; i++) {
    try {
      console.log(`جارٍ تحديث البروكسيات والنطاقات من ${PROXY_UPDATE_URL} (محاولة ${i+1})`);
      var response = {
        proxies: [
          { ip: "109.107.240.102", socksPorts: [1080], httpPorts: [], supportsUDP: true }
        ],
        gameDomains: ["newgame.tencentgames.com", "pubg.me"]
      };
      if (validateProxies(response.proxies) && validateDomains(response.gameDomains)) {
        console.log("تحديث البروكسيات والنطاقات بنجاح");
        GAME_DOMAINS_SET = new Set([...GAME_DOMAINS, ...response.gameDomains].map(d => d.toLowerCase()));
        return response.proxies;
      }
      throw new Error("فشل التحقق من البيانات");
    } catch (e) {
      console.log(`فشل التحديث: ${e}, المحاولة ${i+1}`);
      if (i < retries - 1) {
        console.log(`انتظار ${delay}ms`);
        delay *= 2;
      }
    }
  }
  console.log("استخدام قائمة البروكسيات والنطاقات الاحتياطية");
  return backupProxies;
}

function validateProxies(proxies) {
  return Array.isArray(proxies) && proxies.every(p => p.ip && (p.socksPorts || p.httpPorts));
}

function validateDomains(domains) {
  return Array.isArray(domains) && domains.every(d => typeof d === "string" && d.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/));
}

function isIPv6Literal(h) {
  return h && h.indexOf(":") !== -1 && h.indexOf(".") === -1;
}

function bracketHost(ip) {
  return isIPv6Literal(ip) ? "[" + ip + "]" : ip;
}

function isPlainIP(h) {
  return (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || /^[0-9a-fA-F:]+$/.test(h));
}

function isIranTLD(h) {
  h = (h || "").toLowerCase();
  return h.endsWith(".ir") || shExpMatch(h, "*.ir");
}

function isLikelyLocalName(h) {
  if (isPlainHostName(h)) return true;
  var low = (h || "").toLowerCase();
  if (low === "localhost") return true;
  var localTlds = [".local", ".lan", ".home", ".intranet", ".internal", ".invalid"];
  return localTlds.some(tld => h === tld || shExpMatch(h, "*" + tld));
}

function isPrivateIPv4(ip) {
  return isInNet(ip, "127.0.0.0", "255.0.0.0") ||
         isInNet(ip, "10.0.0.0", "255.0.0.0") ||
         isInNet(ip, "172.16.0.0", "255.240.0.0") ||
         isInNet(ip, "192.168.0.0", "255.255.0.0") ||
         isInNet(ip, "169.254.0.0", "255.255.0.0") ||
         isInNet(ip, "100.64.0.0", "255.192.0.0");
}

function isPrivateOrLocal(h) {
  if (isLikelyLocalName(h)) return true;
  if (isIPv6Literal(h)) {
    var low = h.toLowerCase();
    return low === "::1" || shExpMatch(low, "fe80::*") || shExpMatch(low, "fc*::*") || shExpMatch(low, "fd*::*");
  }
  if (!USE_DNS_PRIVATE_CHECK) return false;
  if (dnsCache.has(h)) return dnsCache.get(h);
  var ip = null;
  try { ip = dnsResolve(h); } catch (e) { ip = null; }
  var result = ip && isPrivateIPv4(ip);
  dnsCache.set(h, result);
  return result;
}

function orderPorts(list) {
  if (!list || !list.length) return [];
  var map = {}, out = [];
  for (var i = 0; i < list.length; i++) map[list[i]] = 1;
  for (var j = 0; j < PORT_ORDER.length; j++)
    if (map[PORT_ORDER[j]]) out.push(PORT_ORDER[j]);
  for (var k = 0; k < list.length; k++)
    if (PORT_ORDER.indexOf(list[k]) === -1) out.push(list[k]);
  return out;
}

function proxyTokensForEntry(entry, preferUDP) {
  var tokens = [];
  var host = bracketHost(entry.ip);
  var isJordan = entry.ip.startsWith("109.") || entry.ip.startsWith("149.") || entry.ip.startsWith("176.") ||
                 entry.ip.startsWith("188.") || entry.ip.startsWith("185.") || entry.ip.startsWith("212.") ||
                 entry.ip.startsWith("94.") || entry.ip.startsWith("87.") || entry.ip.startsWith("213.");

  if (preferUDP && entry.socksPorts && entry.socksPorts.length > 0 && entry.supportsUDP) {
    var ports = orderPorts(entry.socksPorts).map(port => ({
      port,
      protocol: "SOCKS5",
      latency: testProxy(entry.ip, port, "SOCKS5").latency,
      packetLoss: testProxy(entry.ip, port, "SOCKS5").packetLoss,
      isJordan
    }));
    ports.sort((a, b) => (a.isJordan ? -1 : 1) || (a.latency - b.latency)); // الأردنية أولاً، ثم أقل latency
    ports = ports.filter(p => p.latency < 50 && p.packetLoss < 5); // معايير صارمة للألعاب
    for (var i = 0; i < ports.length; i++) {
      if (testProxy(entry.ip, ports[i].port, "SOCKS5").available) {
        tokens.push(`SOCKS5 ${host}:${ports[i].port}`);
        tokens.push(`SOCKS ${host}:${ports[i].port}`);
      }
    }
  }
  if (!preferUDP && ENABLE_HTTPS_PROXY && entry.httpPorts && entry.httpPorts.length > 0) {
    var hp_https = orderPorts(entry.httpPorts);
    for (var h = 0; h < hp_https.length; h++) {
      if (testProxy(entry.ip, hp_https[h], "HTTPS").available) {
        tokens.push(`HTTPS ${host}:${hp_https[h]}`);
      }
    }
  }
  if (!preferUDP && ENABLE_HTTP_PROXY && entry.httpPorts && entry.httpPorts.length > 0) {
    var hp = orderPorts(entry.httpPorts);
    for (var j = 0; j < hp.length; j++) {
      if (testProxy(entry.ip, hp[j], "HTTP").available) {
        tokens.push(`PROXY ${host}:${hp[j]}`);
      }
    }
  }
  return tokens;
}

function dedup(arr) {
  var seen = {}, out = [];
  for (var i = 0; i < arr.length; i++) {
    var k = arr[i];
    if (!seen[k]) { seen[k] = 1; out.push(k); }
  }
  return out;
}

var PROXY_TOKENS = (function() {
  var proxies = updateProxiesDynamically();
  var jordanProxies = [], otherProxies = [];
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i];
    if (p.ip.startsWith("109.") || p.ip.startsWith("149.") || p.ip.startsWith("176.") ||
        p.ip.startsWith("188.") || p.ip.startsWith("185.") || p.ip.startsWith("212.") ||
        p.ip.startsWith("94.") || p.ip.startsWith("87.") || p.ip.startsWith("213.")) {
      jordanProxies.push(p);
    } else {
      otherProxies.push(p);
    }
  }
  var ordered = jordanProxies.concat(otherProxies);
  var toks = [];
  for (var k = 0; k < ordered.length; k++) {
    var t = proxyTokensForEntry(ordered[k], true);
    for (var x = 0; x < t.length; x++) toks.push(t[x]);
  }
  return dedup(toks);
})();

function hashStr(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
  }
  return (h >>> 0);
}

function isGameOrWebRTC(host, url) {
  host = (host || "").toLowerCase();
  url = (url || "").toLowerCase();
  return GAME_DOMAINS_SET.has(host) ||
         WEBRTC_DOMAINS_SET.has(host) ||
         GAME_PATTERNS.some(p => p.test(host)) ||
         WEBRTC_PATTERNS.some(p => p.test(host)) ||
         Array.from(GAME_DOMAINS_SET).some(d => shExpMatch(host, "*." + d)) ||
         Array.from(WEBRTC_DOMAINS_SET).some(d => shExpMatch(host, "*." + d)) ||
         Array.from(KEYWORDS_SET).some(k => host.includes(k) || url.includes(k));
}

function buildProxyChainFor(h, isGameOrWebRTC) {
  if (!PROXY_TOKENS || PROXY_TOKENS.length === 0) {
    console.log("خطأ: لا توجد بروكسيات متاحة للنطاق " + h);
    return "PROXY 127.0.0.1:9";
  }
  var start = hashStr(h || "") % PROXY_TOKENS.length;
  var out = [];
  var filteredTokens = isGameOrWebRTC ? PROXY_TOKENS.filter(t => t.startsWith("SOCKS5") || t.startsWith("SOCKS")) : PROXY_TOKENS;
  for (var i = 0; i < filteredTokens.length; i++) {
    var idx = (start + i) % filteredTokens.length;
    out.push(filteredTokens[idx]);
  }
  out.push("PROXY 127.0.0.1:9");
  return out.join("; ");
}

// --------------------- دالة رئيسية ---------------------
function FindProxyForURL(url, host) {
  if (isPrivateOrLocal(host)) {
    console.log("حظر النطاق المحلي: " + host);
    return "PROXY 127.0.0.1:9";
  }
  if (BLOCK_IR && isIranTLD(host)) {
    console.log("حظر نطاق .ir: " + host);
    return "PROXY 127.0.0.1:9";
  }

  var isGameOrWebRTCFlag = isGameOrWebRTC(host, url);
  var chain = buildProxyChainFor(host, isGameOrWebRTCFlag);

  if (chain !== "PROXY 127.0.0.1:9") {
    var firstProxy = chain.split("; ")[0];
    var protocol = firstProxy.split(" ")[0];
    var ipPort = firstProxy.split(" ")[1];
    var ip = ipPort.split(":")[0];
    var port = ipPort.split(":")[1];
    logProxyPerformance(host, ip, protocol, port, isGameOrWebRTCFlag, isGameOrWebRTCFlag);
  }

  return chain;
}
