function FindProxyForURL(url, host) {
  /* ========= الإعدادات ========= */
  var FORBID_DIRECT     = true;   // ما في DIRECT بالنهاية
  var FORCE_ALL         = true;   // مرّر الباقي عبر بروكسي
  var LOCAL_VIA_PROXY   = true;   // لو true: المحلي عبر بروكسي
  var BLOCK_IR          = true;   // حظر .ir
  var PREFER_JO_FOR_JO  = true;   // فضّل الأردني لدومينات .jo

  /* ========= بروكسيات =========
     JO_TOKENS: فقط الأردني (لمسارات اللعب/المطابقة)
     ALL_TOKENS: باقي البروكسيات لاستخدام عام */
  var JO_PROXIES = [
    { ip: "61.109.106.12", socks: [1080,20001], http: [8080,3128] }
    // أضف بروكسيات أردنية أخرى هنا لو عندك
  ];
  var OTHER_PROXIES = [
    { ip: "91.106.109.12",       socks: [20001,20002,1080,8085],    http: [3128,8080] },
    { ip: "2a13:a5c7:25ff:7000", socks: [20001,20002,1080,8085],    http: [3128,8080] },
    { ip: "2a01:4f8:c17:2e3f::1",socks: [20001,20002,1080,8085,8000], http: [3128,8080,8000] },
    { ip: "213.186.179.25",      socks: [80,8000],                  http: [80,8000] }
  ];

  /* ========= نطاقات/كلمات PUBG والخدمات الداعمة ========= */
  var GAME_DOMAINS = [
    "igamecj.com","igamepubg.com","pubgmobile.com","tencentgames.com",
    "proximabeta.com","qcloudcdn.com","tencentyun.com","qcloud.com",
    "gtimg.com","game.qq.com","gameloop.com","proximabeta.net",
    "cdn-ota.qq.com","cdngame.tencentyun.com","qcloudcdn.com"
  ];
  var SUPPORT_DOMAINS = [
    "googleapis.com","gstatic.com","googleusercontent.com",
    "play.googleapis.com","firebaseinstallations.googleapis.com",
    "mtalk.google.com","android.clients.google.com",
    "apple.com","icloud.com","gamecenter.apple.com","gamekit.apple.com","apps.apple.com"
  ];
  var KEYWORDS = ["pubg","tencent","igame","proximabeta","qcloud","tencentyun","gcloud","gameloop","match","squad","party","team","rank"];

  /* ========= شبكات محلية ========= */
  var LOCAL_IP_RANGES = [
    { start:"10.0.0.0",    end:"10.255.255.255"  },
    { start:"172.16.0.0",  end:"172.31.255.255"  },
    { start:"192.168.0.0", end:"192.168.255.255" }
    // بإمكانك إضافة CIDR كنص "x.y.z.w/nn"
  ];

  /* ========= أدوات مساعدة متوافقة مع PAC ========= */
  function idx(s,ch){var i;for(i=0;i<s.length;i++)if(s.charAt(i)===ch)return i;return -1;}
  function isIPv6(h){return h && idx(h,":")>=0;}
  function ipToLong(ip){ if(!ip)return -1; var p=ip.split("."); if(p.length!==4)return -1;
    var a=+p[0],b=+p[1],c=+p[2],d=+p[3]; if(a<0||a>255||b<0||b>255||c<0||c>255||d<0||d>255)return -1;
    return (((a<<24)>>>0)+(b<<16)+(c<<8)+d)>>>0; }
  function inCIDRs(ipStr, list){
    var ip=ipToLong(ipStr); if(ip<0)return false; var i;
    for(i=0;i<list.length;i++){
      var it=list[i];
      if(typeof it==="string"){
        var s=it.indexOf("/"); if(s>0){
          var base=it.substring(0,s), bits=parseInt(it.substring(s+1),10);
          if(bits>=0&&bits<=32){var bL=ipToLong(base); if(bL>=0){
            var mask=bits===0?0:((0xFFFFFFFF<<(32-bits))>>>0);
            if((ip&mask)===(bL&mask)) return true; } }
        }
      } else if (it && it.start && it.end){
        var a=ipToLong(it.start), b=ipToLong(it.end);
        if(a>=0&&b>=0&&ip>=a&&ip<=b) return true;
      }
    }
    return false;
  }
  function endsWithDomain(h,d){return h===d || dnsDomainIs(h,"."+d) || dnsDomainIs(h,d);}
  function anyDomain(h,list){var i;for(i=0;i<list.length;i++) if(endsWithDomain(h,list[i])) return true; return false;}
  function getScheme(u){var k=idx(u,":"); return (k>0)?u.substring(0,k).toLowerCase():"";}
  function getPort(u){
    var sch=getScheme(u); var i2=u.indexOf("//"); var after=u.substring(i2>=0?i2+2:0);
    var c=idx(after,":"), s=idx(after,"/");
    if(c>=0 && (s<0||c<s)){var st=c+1,en=(s>=0)?s:after.length;var p=parseInt(after.substring(st,en),10); if(p>0&&p<=65535)return p;}
    if(sch==="http") return 80;
    if(sch==="https")return 443;
    if(sch==="ws")   return 80;
    if(sch==="wss")  return 443;
    return 0; // FTP مُلغى كما طلبت
  }
  function buildTokens(ip,socks,http){
    var h=isIPv6(ip)?("["+ip+"]"):ip, out=[],i;
    for(i=0;i<socks.length;i++){ out.push("SOCKS5 "+h+":"+socks[i]); out.push("SOCKS "+h+":"+socks[i]); }
    for(i=0;i<http.length;i++){  out.push("PROXY "+h+":"+http[i]); }
    return out;
  }
  function dedupe(arr){var seen={},o=[],i,t;for(i=0;i<arr.length;i++){t=arr[i];if(!seen[t]){seen[t]=1;o.push(t);}}return o;}
  function makeTokens(list){var i,acc=[];for(i=0;i<list.length;i++){acc=acc.concat(buildTokens(list[i].ip,list[i].socks||[],list[i].http||[]));}return dedupe(acc);}

  var JO_TOKENS   = makeTokens(JO_PROXIES);          // فقط أردني
  var OTHER_TOKENS= makeTokens(OTHER_PROXIES);       // بقية البروكسيات
  var ALL_TOKENS  = JO_TOKENS.concat(OTHER_TOKENS);  // ترتيب عام (JO أولًا)
  if (!FORBID_DIRECT) ALL_TOKENS.push("DIRECT");

  // سلاسل نهائية
  function chainJO()        { return JO_TOKENS.length ? JO_TOKENS.join("; ") : (FORBID_DIRECT ? "PROXY 0.0.0.0:0" : "DIRECT"); }
  function chainALL()       { return ALL_TOKENS.length? ALL_TOKENS.join("; "): (FORBID_DIRECT ? "PROXY 0.0.0.0:0" : "DIRECT"); }

  /* ========= منطق القرار ========= */
  host = host.toLowerCase();

  // (0) محلي
  if (isPlainHostName(host) || shExpMatch(host,"*.local")) {
    return LOCAL_VIA_PROXY ? chainALL() : "DIRECT";
  }

  // حل DNS لمرة
  var ip = dnsResolve(host);
  if (ip) {
    if (isInNet(ip,"10.0.0.0","255.0.0.0") ||
        isInNet(ip,"172.16.0.0","255.240.0.0") ||
        isInNet(ip,"192.168.0.0","255.255.0.0") ||
        inCIDRs(ip, LOCAL_IP_RANGES)) {
      return LOCAL_VIA_PROXY ? chainALL() : "DIRECT";
    }
  }

  // (1) حظر دولة .ir
  if (BLOCK_IR && (dnsDomainIs(host,".ir") || (host.length>=3 && host.substring(host.length-3)===".ir"))) {
    return "BLOCK";
  }

  // (2) مطابقة PUBG/الخدمات الداعمة → أردني فقط
  if (anyDomain(host, GAME_DOMAINS) || anyDomain(host, SUPPORT_DOMAINS)) {
    return chainJO();
  }
  // (3) كلمات تدل على مطابقة/لعب → أردني فقط
  for (var i=0;i<KEYWORDS.length;i++){ if(host.indexOf(KEYWORDS[i])>=0) return chainJO(); }

  // (4) نطاقات .jo → أردني أولًا (يفيد خدمات محليّة)
  if (PREFER_JO_FOR_JO && (dnsDomainIs(host,".jo") || (host.length>=3 && host.substring(host.length-3)===".jo"))) {
    return chainJO();
  }

  // (5) مرّر الباقي عبر أي بروكسي (JO ثم غيره)
  if (FORCE_ALL) return chainALL();

  // (6) افتراضي
  return FORBID_DIRECT ? chainALL() : "DIRECT";
}
