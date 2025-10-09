// TikTok unblock - improved PAC (SOCKS5 rotation, ws/wss support, no DIRECT)
// Replace/add SOCKS5 proxies in PROXIES array with trusted/residential ones.

var PROXIES = [
  "SOCKS5 51.38.232.101:443",    // primary (your proxy)
  "SOCKS5 PROXY_BACKUP_1:PORT",  // add backup proxies (residential recommended)
  "SOCKS5 PROXY_BACKUP_2:PORT"
];

// big list of TikTok / CDN / webcast / api host patterns
var TIKTOK_PATTERNS = [
  "*.tiktok.com","tiktok.com",
  "*.tiktok.net","tiktok.net",
  "*.tiktokv.com","tiktokv.com",
  "*.tiktokcdn.com","tiktokcdn.com",
  "*.p16-tiktokcdn.com","p16-tiktokcdn.com",
  "*.p16-tiktokcdn-com.akamaized.net",
  "*.muscdn.com","muscdn.com",
  "*.ibyteimg.com","ibyteimg.com",
  "*.ibytedtos.com","ibytedtos.com",
  "*.byteoversea.com","byteoversea.com",
  "*.bytecdn.cn","bytecdn.cn",
  "*.v16m.tiktokcdn.com","v16a.tiktokcdn.com","v19.tiktokcdn.com",
  "web.tiktok.com",
  "*.api.tiktokv.com","api.tiktokv.com",
  "*.api-h2.tiktokv.com",
  "*.webcast*.tiktokv.com","webcast*.tiktokv.com",
  "video-*.tiktokv.com","rtc-*.tiktokv.com",
  "api*-quic*.tiktokv.com","api*-h2-*.tiktokv.com",
  "*.akamaized.net","*.cloudfront.net","*.myqcloud.com",
  "*.footprint.net","*.worldfcdn.com","*.ibcdn.com",
  "*.amplify-edge.net","*.wsdvs.com"
];

// helper: wildcard match (simple, fast)
function hostMatchesPatterns(host, patterns) {
  host = host.toLowerCase();
  for (var i = 0; i < patterns.length; i++) {
    var p = patterns[i].toLowerCase();
    if (p.indexOf("*.") === 0) {
      var root = p.substring(2);
      if (host === root || host.endsWith("." + root)) return true;
    } else if (p.indexOf("*") !== -1) {
      // very general wildcard -> fallback to regex-like match
      var patt = "^" + p.replace(/\./g,"\\.").replace(/\*/g,".*") + "$";
      try { if ((new RegExp(patt)).test(host)) return true; } catch(e){}
    } else {
      if (host === p) return true;
    }
  }
  return false;
}

// simple pseudo-hash to pick rotating proxy index (changes every minute)
function pickProxyIndex(seed) {
  var s = seed + ":" + Math.floor((new Date()).getTime() / 60000); // rotate per minute
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = (h<<5) - h + s.charCodeAt(i); h |= 0; }
  h = Math.abs(h);
  if (!PROXIES || PROXIES.length === 0) return -1;
  return h % PROXIES.length;
}

// build proxy chain: primary; backup...
function buildProxyChain(idx) {
  if (PROXIES.length === 0) return "PROXY 127.0.0.1:0";
  var chain = PROXIES[idx];
  if (PROXIES.length > 1) {
    // add one immediate fallback to improve reliability
    chain += "; " + PROXIES[(idx+1) % PROXIES.length];
  }
  return chain;
}

function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  // quick route for WebSocket-based streams (ws/wss)
  if (url.indexOf("ws://") === 0 || url.indexOf("wss://") === 0) {
    var idx = pickProxyIndex(host);
    if (idx >= 0) return buildProxyChain(idx);
  }

  // If host matches TikTok/CDN patterns -> route via rotating SOCKS5 chain
  if (hostMatchesPatterns(host, TIKTOK_PATTERNS)) {
    var idx = pickProxyIndex(host);
    if (idx >= 0) return buildProxyChain(idx);
  }

  // As requested: do NOT allow DIRECT for TikTok usage — route everything through primary proxy
  // If you want non-TikTok traffic to be direct, change the following line to "return 'DIRECT';"
  var idxAll = pickProxyIndex(host + ":all");
  if (idxAll >= 0) return buildProxyChain(idxAll);

  // fallback safe return (shouldn't reach here)
  return PROXIES.length ? PROXIES[0] : "PROXY 127.0.0.1:0";
}
