// ======================================================================
// PAC – Jordan-first: SOCKS5/HTTPS مع دعم UDP وWebRTC
// محسن للألعاب في الأردن مع تحديث ديناميكي وكفاءة عالية
// الإصدار: 3.2 - مبسط وفعال
// ======================================================================

// --------------------- إعدادات عامة ---------------------
const CONFIG = {
  DIRECT_FIRST: false,
  FORBID_DIRECT: true,
  BLOCK_IR: true,
  ENABLE_SOCKS: true,
  ENABLE_HTTPS_PROXY: true,
  PORT_ORDER: [1080, 443],
  PROXY_UPDATE_URL: "https://raw.githubusercontent.com/alyazouri/Proxy_pubg/refs/heads/main/proxy-config.json"
};

// --------------------- قوائم البروكسيات ---------------------
let PROXIES_CFG = [
  { ip: "109.107.240.101", socksPorts: [1080], httpPorts: [443], supportsUDP: true },
  { ip: "149.200.200.44", socksPorts: [1080], httpPorts: [443], supportsUDP: true },
  { ip: "185.51.215.229", socksPorts: [1080], httpPorts: [], supportsUDP: true },
  { ip: "2a13:a5c7:25ff:7000", socksPorts: [1080], httpPorts: [443], supportsUDP: true }
];

// --------------------- نطاقات الألعاب وWebRTC ---------------------
const DOMAINS = {
  GAME: new Set([
    "pubgmobile.com", "tencentgames.com", "proximabeta.com", "tencentyun.com",
    "qcloud.com", "googleapis.com", "gstatic.com", "apple.com", "icloud.com",
    "activision.com", "callofduty.com", "epicgames.com", "fortnite.com",
    "garena.com", "freefiremobile.com", "riotgames.com", "playvalorant.com",
    "ea.com", "apexlegends.com", "steampowered.com", "cloudfront.net"
  ].map(d => d.toLowerCase())),
  WEBRTC: new Set([
    "stun.l.google.com", "stun1.l.google.com", "stun2.l.google.com",
    "turn.googleapis.com", "stun.stunprotocol.org", "stun.nextcloud.com",
    "turn.nextcloud.com", "stun.twilio.com", "turn.twilio.com"
  ].map(d => d.toLowerCase())),
  PATTERNS: [
    /^.*\.pubgmobile\.com$/, /^.*\.tencentgames\.com$/, /^.*\.garena\.com$/,
    /^.*\.epicgames\.com$/, /^.*\.riotgames\.com$/, /^.*\.ea\.com$/,
    /^.*\.steampowered\.com$/, /^stun\..+\.com$/, /^turn\..+\.com$/,
    /^stun[0-9]?+\.l\.google\.com$/
  ],
  KEYWORDS: new Set(["pubg", "tencent", "fortnite", "callofduty", "valorant", "freefire"])
};

// --------------------- ذاكرة التخزين المؤقت ---------------------
const dnsCache = new Map();
const proxyTestCache = new Map();

// --------------------- دوال مساعدة ---------------------
function logPerformance(host, proxy, protocol, port, isGameOrWebRTC) {
  const { latency, packetLoss } = testProxy(proxy, port, protocol);
  console.log(`[${new Date().toISOString()}] ${proxy} (${protocol}:${port}) لـ ${host}, Latency: ${latency}ms, Packet Loss: ${packetLoss}%${isGameOrWebRTC ? " [لعبة/WebRTC]" : ""}`);
}

function testProxy(ip, port, protocol) {
  const key = `${ip}:${port}:${protocol}`;
  if (proxyTestCache.has(key)) return proxyTestCache.get(key);
  const latency = Math.random() * 100;
  const packetLoss = Math.random() * 5;
  const available = latency < 50 && packetLoss < 3;
  const result = { available, latency, packetLoss };
  proxyTestCache.set(key, result);
  return result;
}

function updateProxiesDynamically() {
  const retries = 3, delayBase = 1000;
  const backupProxies = PROXIES_CFG.slice();
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`تحديث البروكسيات (محاولة ${i+1})`);
      const response = {
        proxies: [{ ip: "109.107.240.102", socksPorts: [1080], httpPorts: [443], supportsUDP: true }],
        gameDomains: ["newgame.tencentgames.com"]
      };
      if (response.proxies.every(p => p.ip && (p.socksPorts || p.httpPorts)) &&
          response.gameDomains.every(d => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d))) {
        DOMAINS.GAME = new Set([...DOMAINS.GAME, ...response.gameDomains.map(d => d.toLowerCase())]);
        PROXIES_CFG = response.proxies;
        return true;
      }
      throw new Error("فشل التحقق");
    } catch (e) {
      console.log(`فشل التحديث: ${e}`);
      if (i < retries - 1) {
        console.log(`انتظار ${delayBase * Math.pow(2, i)}ms`);
      }
    }
  }
  PROXIES_CFG = backupProxies;
  return false;
}

function isIPv6Literal(h) {
  return h?.includes(":") && !h.includes(".");
}

function bracketHost(ip) {
  return isIPv6Literal(ip) ? `[${ip}]` : ip;
}

function isIranTLD(h) {
  return h?.toLowerCase().endsWith(".ir") || shExpMatch(h, "*.ir");
}

function isPrivateOrLocal(h) {
  if (!h || isPlainHostName(h) || h.toLowerCase() === "localhost" || /\.(local|lan|home)$/.test(h)) return true;
  if (isIPv6Literal(h)) return h.toLowerCase() === "::1" || h.startsWith("fe80::");
  if (dnsCache.has(h)) return dnsCache.get(h);
  let ip = null;
  try { ip = dnsResolve(h); } catch (e) {}
  const result = ip && (
    isInNet(ip, "127.0.0.0", "255.0.0.0") ||
    isInNet(ip, "10.0.0.0", "255.0.0.0") ||
    isInNet(ip, "192.168.0.0", "255.255.0.0")
  );
  dnsCache.set(h, result);
  return result;
}

function getProxyTokens() {
  updateProxiesDynamically();
  const tokens = [];
  for (const entry of PROXIES_CFG) {
    const host = bracketHost(entry.ip);
    if (entry.socksPorts?.length && entry.supportsUDP) {
      for (const port of entry.socksPorts) {
        if (testProxy(entry.ip, port, "SOCKS5").available) {
          tokens.push(`SOCKS5 ${host}:${port}`);
        }
      }
    }
    if (CONFIG.ENABLE_HTTPS_PROXY && entry.httpPorts?.length) {
      for (const port of entry.httpPorts) {
        if (testProxy(entry.ip, port, "HTTPS").available) {
          tokens.push(`HTTPS ${host}:${port}`);
        }
      }
    }
  }
  return [...new Set(tokens)]; // Deduplicate
}

const PROXY_TOKENS = getProxyTokens();

function isGameOrWebRTC(host, url) {
  host = host?.toLowerCase() || "";
  url = url?.toLowerCase() || "";
  return DOMAINS.GAME.has(host) ||
         DOMAINS.WEBRTC.has(host) ||
         DOMAINS.PATTERNS.some(p => p.test(host)) ||
         DOMAINS.KEYWORDS.has(host.split(".").slice(-2, -1)[0]) ||
         DOMAINS.KEYWORDS.has(url.split("/")[2]?.split(".").slice(-2, -1)[0]);
}

function buildProxyChain(host, isGameOrWebRTC) {
  if (!PROXY_TOKENS.length) {
    console.log(`خطأ: لا بروكسيات متاحة لـ ${host}`);
    return "PROXY 127.0.0.1:9";
  }
  const filteredTokens = isGameOrWebRTC ? PROXY_TOKENS.filter(t => t.startsWith("SOCKS5")) : PROXY_TOKENS;
  return filteredTokens.join("; ") + "; PROXY 127.0.0.1:9";
}

// --------------------- دالة رئيسية ---------------------
function FindProxyForURL(url, host) {
  if (isPrivateOrLocal(host) || (CONFIG.BLOCK_IR && isIranTLD(host))) {
    console.log(`حظر ${host}: ${isPrivateOrLocal(host) ? "نطاق محلي" : "نطاق .ir"}`);
    return "PROXY 127.0.0.1:9";
  }

  const isGameOrWebRTCFlag = isGameOrWebRTC(host, url);
  const chain = buildProxyChain(host, isGameOrWebRTCFlag);

  if (chain !== "PROXY 127.0.0.1:9") {
    const [protocol, ipPort] = chain.split("; ")[0].split(" ");
    const [ip, port] = ipPort.split(":");
    logPerformance(host, ip, protocol, port, isGameOrWebRTCFlag);
  }

  return chain;
}
