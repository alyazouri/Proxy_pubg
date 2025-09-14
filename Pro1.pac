function FindProxyForURL(url, host) {
  var FORBID_DIRECT   = true;   // منع DIRECT نهائيًا
  var LOCAL_VIA_PROXY = true;   // تمرير المحلي عبر البروكسي

  // بروكسي أردني فقط: 443 (رئيسي)، 8080 و53 كاحتياط
  var JO_PROXIES = [
    {
      ip: "61.109.106.12",
      socks: [53,1080,20001],   // 53 DNS + 1080 + 20001 كـ SOCKS
      http:  [443,8080,3128]    // 443 TLS over HTTPS (رئيسي) + 8080 + 3128
    }
  ];

  function idx(s,ch){for(var i=0;i<s.length;i++)if(s.charAt(i)===ch)return i;return -1;}
  function isIPv6(h){return h && idx(h,":")>=0;}
  function buildTokens(ip,socks,http){
    var h=isIPv6(ip)?("["+ip+"]"):ip, out=[];
    for(var i=0;i<socks.length;i++){ out.push("SOCKS5 "+h+":"+socks[i]); out.push("SOCKS "+h+":"+socks[i]); }
    for(var j=0;j<http.length;j++){ out.push("PROXY "+h+":"+http[j]); }
    return out;
  }
  function dedupe(a){var seen={},o=[];for(var i=0;i<a.length;i++){if(!seen[a[i]]){seen[a[i]]=1;o.push(a[i]);}}return o;}

  var JO_TOKENS=(function(){
    var acc=[];for(var i=0;i<JO_PROXIES.length;i++){
      var p=JO_PROXIES[i];
      acc=acc.concat(buildTokens(p.ip,p.socks||[],p.http||[]));
    }
    return dedupe(acc);
  })();

  function chainJO(){ return JO_TOKENS.length ? JO_TOKENS.join("; ") : (FORBID_DIRECT ? "PROXY 0.0.0.0:0" : "DIRECT"); }

  host = host.toLowerCase();

  // أسماء محلية (.local أو بدون نقطة)
  if (isPlainHostName(host) || shExpMatch(host,"*.local")) {
    return LOCAL_VIA_PROXY ? chainJO() : "DIRECT";
  }

  // شبكات خاصة (10.x, 172.16/12, 192.168)
  var ip = dnsResolve(host);
  if (ip) {
    if (isInNet(ip,"10.0.0.0","255.0.0.0") ||
        isInNet(ip,"172.16.0.0","255.240.0.0") ||
        isInNet(ip,"192.168.0.0","255.255.0.0")) {
      return LOCAL_VIA_PROXY ? chainJO() : "DIRECT";
    }
  }

  // كل الترافيك عبر البروكسي الأردني فقط
  return chainJO();
}
