var PROXY = "SOCKS5 51.38.232.101:443";

var TIKTOK_HOSTS = [
  "*.tiktok.com",
  "tiktok.com",
  "*.tiktok.net",
  "tiktok.net",
  "*.tiktokv.com",
  "tiktokv.com",
  "*.tiktokcdn.com",
  "tiktokcdn.com",
  "*.p16-tiktokcdn.com",
  "p16-tiktokcdn.com",
  "*.p16-tiktokcdn-com.akamaized.net",
  "p16-tiktokcdn-com.akamaized.net",
  "*.muscdn.com",
  "muscdn.com",
  "*.musical.ly",
  "musical.ly",
  "*.ibyteimg.com",
  "ibyteimg.com",
  "*.ibytedtos.com",
  "ibytedtos.com",
  "*.byteoversea.com",
  "byteoversea.com",
  "*.bytecdn.cn",
  "bytecdn.cn",
  "*.byted.org",
  "byted.org",
  "*.v16m.tiktokcdn.com",
  "v16m.tiktokcdn.com",
  "v16a.tiktokcdn.com",
  "v19.tiktokcdn.com",
  "v.tiktok.net",
  "web.tiktok.com",
  "*.api.tiktokv.com",
  "*.api-h2.tiktokv.com",
  "*.api21-h2.musical.ly",
  "*.api2-16-h2.musical.ly",
  "*.api2.musical.ly",
  "*.log.tiktokv.com",
  "*.log2.musical.ly",
  "*.mon.musical.ly",
  "webcast*.tiktokv.com",
  "*.webcast*.tiktokv.com",
  "video-*.tiktokv.com",
  "rtc-*.tiktokv.com",
  "api*-va.tiktokv.com",
  "api*-normal-*.tiktokv.com",
  "api*-core-*.tiktokv.com",
  "api*-quic*.tiktokv.com",
  "api*-h2-*.tiktokv.com",
  "upload*-normal-*.tiktokv.com",
  "*.akamaized.net",
  "*.cloudfront.net",
  "*.footprint.net",
  "*.worldfcdn.com",
  "*.myqcloud.com",
  "*.ibcdn.com",
  "*.amplify-edge.net",
  "*.wsdvs.com"
];

function matchAnyPattern(host, patterns) {
  host = host.toLowerCase();
  for (var i = 0; i < patterns.length; i++) {
    var p = patterns[i].toLowerCase();
    if (p.indexOf("*.") === 0) {
      var q = p.substring(2);
      if (host === q || host.endsWith("." + q)) return true;
    } else {
      if (host === p) return true;
    }
  }
  return false;
}

function FindProxyForURL(url, host) {
  if (matchAnyPattern(host, TIKTOK_HOSTS)) return PROXY;
  return PROXY;
}
