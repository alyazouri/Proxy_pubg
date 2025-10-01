function FindProxyForURL(url, host) {
  host = host.toLowerCase();

  var GAME = [
    "*.pubgmobile.com","*.gpubgm.com","*.tencentgames.com","*.pubgmcdn.com",
    "*.battlegroundsmobile.com","match.pubg.com","api.pubg.com",
    "*.igamecj.com","*.pubgmobileapi.com","*.pubgmobile.live"
  ];
  var CDN = [
    "*.akamaiedge.net","*.akamaized.net","*.akamai.net",
    "*.cloudfront.net","*.edgecastcdn.net","*.tencentcdn.com","*.tencentcloud.com"
  ];
  var DNSH = ["dns.google","one.one.one.one","cloudflare-dns.com"];

  var P_GAME = ["SOCKS5 91.106.109.12:20005", "SOCKS5 91.106.109.12:20003"];
  var P_CDN  = ["SOCKS5 91.106.109.12:8085"];
  var P_DNS  = ["SOCKS5 91.106.109.12:20001", "SOCKS5 91.106.109.12:10000"];
  var P_DEF  = P_CDN;

  function m(h, list){for (var i=0;i<list.length;i++) if (shExpMatch(h,list[i])) return true; return false;}
  function chain(arr){var s=""; for (var i=0;i<arr.length;i++) s += (i?", ":"") + arr[i]; return s;}

  if (isPlainHostName(host) || shExpMatch(host,"*.local") || host==="localhost") return "DIRECT";
  var ip = dnsResolve(host);
  if (ip && (isInNet(ip,"10.0.0.0","255.0.0.0")||isInNet(ip,"172.16.0.0","255.240.0.0")||isInNet(ip,"192.168.0.0","255.255.0.0"))) return "DIRECT";

  if (m(host, GAME)) return chain(P_GAME);
  if (m(host, CDN))  return chain(P_CDN);
  if (m(host, DNSH) || shExpMatch(url,"https://*.dns*")) return chain(P_DNS);

  if (ip && (isInNet(ip,"49.0.0.0","255.0.0.0") || isInNet(ip,"103.0.0.0","255.0.0.0"))) return chain(P_GAME);

  return chain(P_DEF);
}
