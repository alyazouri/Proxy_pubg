function FindProxyForURL(url, host) {
  // ===== تنبيه مهم =====
  // PAC يوجّه TCP فقط (HTTP/HTTPS). لا يمكنه التأثير على UDP.
  // قائمة UDP_PORTS أدناه للتوثيق لا غير، استخدمها في الراوتر/VPN.

  // بورتات UDP الشائعة لـ PUBG Mobile (للراوتر/QoS):
  // 8011, 9030, 10010, 10013, 10039, 10096, 10491, 10612,
  // 11455, 12235, 13748, 13894, 13972, 17000, 17500, 20000-20002
  var UDP_PORTS = [8011,9030,10010,10013,10039,10096,10491,10612,11455,12235,13748,13894,13972,17000,17500];

  var FORBID_DIRECT   = true;   // مرّر كل شيء عبر البروكسي
  var LOCAL_VIA_PROXY = true;   // حتى المحلي عبر البروكسي (خلّها false لو بدك الداخلي DIRECT)

  // بروكسي أردني (443 رئيسي، 8080 و3128 احتياط, SOCKS احتياطي)
  var JO_PROXIES = [
    { ip: "61.109.106.12", socks: [1080,20001], http: [443,8080,3128] }
  ];

  var GAME_DOMAINS = [
    "igamecj.com","igamepubg.com","pubgmobile.com","tencentgames.com",
    "proximabeta.com","tencentyun.com","qcloud.com","qcloudcdn.com",
    "gtimg.com","game.qq.com","gameloop.com","proximabeta.net",
    "cdn-ota.qq.com","cdngame.tencentyun.com"
  ];
  var SUPPORT_DOMAINS = [
    "googleapis.com","gstatic.com","googleusercontent.com",
    "play.googleapis.com","firebaseinstallations.googleapis.com",
    "mtalk.google.com","android.clients.google.com",
    "apple.com","icloud.com","gamecenter.apple.com","gamekit.apple.com","apps.apple.com"
  ];

  function idx(s,ch){for(var i=0;i<s.length;i++)if(s.charAt(i)===ch)return i;return -1;}
  function isIPv6(h){return h && idx(h,":")>=0;}
  function endsWithDomain(h,d){return h===d || dnsDomainIs(h,"."+d) || dnsDomainIs(h,d);}
  function anyDomain(h,list){for (var i=0;i<list.length;i++){if(endsWithDomain(h,list[i])) return true;} return false;}
  function buildTokens(ip,socks,http){
    var h=isIPv6(ip)?("["+ip+"]"):ip, out=[],i;
    // قدّم HTTP/CONNECT (443) أولًا ثم الباقي، ثم SOCKS احتياطي
    for(i=0;i<http.length;i++){  out.push("PROXY "+h+":"+http[i]); }
    for(i=0;i<socks.length;i++){ out.push("SOCKS5 "+h+":"+socks[i]); out.push("SOCKS "+h+":"+socks[i]); }
    return out;
  }
  function dedupe(a){var seen={},o=[],i,t;for(i=0;i<a.length;i++){t=a[i];if(!seen[t]){seen[t]=1;o.push(a[i]);}}return o;}

  var JO_TOKENS=(function(){
    var acc=[],i; for(i=0;i<JO_PROXIES.length;i++){
      var p=JO_PROXIES[i]; acc=acc.concat(buildTokens(p.ip,p.socks||[],p.http||[]));
    }
    return dedupe(acc);
  })();

  function chainJO(){
    return JO_TOKENS.length ? JO_TOKENS.join("; ")
                            : (FORBID_DIRECT ? "PROXY 0.0.0.0:0" : "DIRECT");
  }

  host = host.toLowerCase();

  if (isPlainHostName(host) || shExpMatch(host,"*.local"))
    return LOCAL_VIA_PROXY ? chainJO() : "DIRECT";

  var ip = dnsResolve(host);
  if (ip) {
    if (isInNet(ip,"10.0.0.0","255.0.0.0") ||
        isInNet(ip,"172.16.0.0","255.240.0.0") ||
        isInNet(ip,"192.168.0.0","255.255.0.0")) {
      return LOCAL_VIA_PROXY ? chainJO() : "DIRECT";
    }
  }

  if (anyDomain(host, GAME_DOMAINS) || anyDomain(host, SUPPORT_DOMAINS))
    return chainJO();

  return chainJO();
}
