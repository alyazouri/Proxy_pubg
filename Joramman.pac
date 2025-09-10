var PROXIES_CFG = [
    { ip: "2a13:a5c7:25ff:7000", socksPorts: [20001, 20002, 1080, 8085, 10491], httpPorts: [3128, 8080] },
    { ip: "91.106.109.12", socksPorts: [20001, 20002, 1080, 8085, 10491], httpPorts: [3128, 8080] },
    { ip: "2a01:4f8:c17:2e3f::1", socksPorts: [20001, 20002, 1080, 8085, 10491, 8000], httpPorts: [3128, 8080, 8000] },
    { ip: "213.186.179.25", socksPorts: [80, 8000], httpPorts: [80, 8000] }
];

const FORCE_ALL = true;
const BLOCK_IR = true;
const FORBID_DIRECT = true;
const ROTATE_INTERVAL = 45000;

// إضافة نطاقات IP الخاصة بمزودين محليين في الأردن
const LOCAL_IP_RANGES = [
    { start: "192.168.1.0", end: "192.168.1.255" }, // مثال على نطاق محلي
    // أضف المزيد من النطاقات حسب الاحتياج
];

const GAME_DOMAINS = [
    "igamecj.com", "igamepubg.com", "pubgmobile.com", "tencentgames.com",
    "proximabeta.com", "qcloudcdn.com", "tencentyun.com", "qcloud.com",
    "gtimg.com", "game.qq.com", "gameloop.com", "proximabeta.net", "cdn-ota.qq.com", "cdngame.tencentyun.com",
    "googleapis.com", "gstatic.com", "googleusercontent.com", "play.googleapis.com", "firebaseinstallations.googleapis.com",
    "mtalk.google.com", "android.clients.google.com",
    "apple.com", "icloud.com", "gamecenter.apple.com", "gamekit.apple.com", "apps.apple.com",
    "x.com", "twitter.com", "api.x.com", "abs.twimg.com", "pbs.twimg.com", "t.co"
];

const KEYWORDS = ["pubg", "tencent", "igame", "proximabeta", "qcloud", "tencentyun", "gcloud", "gameloop", "match", "squad", "party", "team", "rank"];

function isIPv6Literal(h) { return h && h.includes(":"); }

function proxyTokensFor(ip, socksPorts, httpPorts) {
    const host = isIPv6Literal(ip) ? `[${ip}]` : ip;
    const socksTokens = socksPorts.map(port => [`SOCKS5 ${host}:${port}`, `SOCKS ${host}:${port}`]).flat();
    const httpTokens = httpPorts.map(port => `PROXY ${host}:${port}`);
    return [...socksTokens, ...httpTokens];
}

const PROXY_LIST = (() => {
    const list = [];
    for (const p of PROXIES_CFG) {
        const toks = proxyTokensFor(p.ip, p.socksPorts || [], p.httpPorts || []);
        list.push(...toks);
    }
    return list;
})();

const LAST_SUCCESS = {};

function buildProxyChain(host) {
    const proxyOrder = [...PROXY_LIST];
    const lastIndex = LAST_SUCCESS[host];
    if (lastIndex !== undefined) {
        const last = proxyOrder.splice(lastIndex, 1)[0];
        proxyOrder.unshift(last);
    }
    return proxyOrder.join("; ");
}

function markSuccess(host, proxyIndex) {
    LAST_SUCCESS[host] = proxyIndex;
}

function ipToLong(ip) {
    return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part), 0);
}

// دالة للتحقق من النطاقات المحلية
function isInLocalIPRange(ip) {
    const ipNum = ipToLong(ip);
    return LOCAL_IP_RANGES.some(r => ipNum >= ipToLong(r.start) && ipNum <= ipToLong(r.end));
}

function FindProxyForURL(url, host) {
    host = host.toLowerCase();

    if (BLOCK_IR && host.includes(".ir")) return "BLOCK";

    for (const domain of GAME_DOMAINS) {
        if (shExpMatch(host, `*${domain}*`)) return buildProxyChain(host);
    }

    for (const keyword of KEYWORDS) {
        if (host.includes(keyword)) return buildProxyChain(host);
    }

    try {
        const ip = dnsResolve(host);
        if (ip && !isIPv6Literal(ip)) {
            // تحقق من النطاقات المحلية
            if (isInLocalIPRange(ip)) {
                return buildProxyChain(host); // استخدام البروكسي
            }
        }
    } catch (e) {
        console.error(`Error resolving DNS for ${host}: ${e.message}`);
        return buildProxyChain(host);
    }

    // استخدام البروكسي بشكل دائم
    return buildProxyChain(host);
}
