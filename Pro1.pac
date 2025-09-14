function FindProxyForURL(url, host) {
  /* =========================
     إعدادات عامة (عدّلها براحتك)
     ========================= */
  var PROFILE          = "PERF";  // "PERF" للأداء فقط (لا قواعد خاصة بالألعاب), "JO_LOCK" لتمرير كل شيء عبر بروكسي أردني
  var FORBID_DIRECT    = false;   // في وضع PERF يُنصح false لتحسين الأداء والسماح DIRECT عند اللزوم
  var LOCAL_VIA_PROXY  = false;   // لو true سيمرّر المحلي عبر البروكسي (غالبًا أبطأ)
  var MAX_CHAIN_LEN    = 6;       // تقصير السلسلة: خُذ أول N فقط كـ Failover

  /* سياسة ترتيب المنافذ:
     "http"  = قدّم PROXY (HTTP CONNECT) أولًا
     "socks" = قدّم SOCKS5 أولًا
     "auto"  = بدون تفضيل خاص
  */
  var PORT_STRATEGY = {
    "443":  "http",  // HTTPS/TLS غالبًا أفضل عبر HTTP CONNECT
    "8080": "http",
    "80":   "socks", // اختياري: جرّب SOCKS أولًا على 80
    "53":   "socks", // تمويه/بديل أخير
    "0":    "auto"   // غير معروف
  };

  /* =========================
     تعريف البروكسيات (أردني + احتياطي)
     ========================= */
  var PROXIES_JO_ONLY = [ // تستعمل في JO_LOCK أو عند تفضيل الأردني في PERF
    { ip: "61.109.106.12", socks: [53,1080,20001], http: [443,8080,3128] }
  ];

  // يمكنك إضافة احتياطي غير أردني هنا للأداء فقط (لن يؤثر على المطابقة لأنه غير مخصص للألعاب)
  var PROXIES_OTHERS = [
    // مثال:
    // { ip: "91.106.109.12", socks: [1080,20001], http: [443,8080] }
  ];

  /* =========================
     أدوات مساعدة (متوافقة مع PAC)
     ========================= */
  function idx(s,ch){for(var i=0;i<s.length;i++)if(s.charAt(i)===ch)return i;return -1;}
  function isIPv6(h){return h && idx(h,":")>=0;}
  function buildTokens(ip,socks,http){
    var h=isIPv6(ip)?("["+ip+"]"):ip, out=[],i;
    for(i=0;i<socks.length;i++){ out.push("SOCKS5 "+h+":"+socks[i]); out.push("SOCKS "+h+":"+socks[i]); }
    for(i=0;i<http.length;i++){  out.push("PROXY "+h+":"+http[i]); }
    return out;
  }
  function dedupe(a){var s={},o=[],i,t;for(i=0;i<a.length;i++){t=a[i];if(!s[t]){s[t]=1;o.push(t);}}return o;}
  function concatTokens(list){
    var i,acc=[];for(i=0;i<list.length;i++){acc=acc.concat(buildTokens(list[i].ip,list[i].socks||[],list[i].http||[]));}
    return dedupe(acc);
  }
  function stableHash(s){var h=0,i,c;for(i=0;i<s.length;i++){c=s.charCodeAt(i);h=((h<<5)-h)+c;h|=0;} if(h<0)h=-h; return h;}
  function rotateByHash(list, key){
    if(list.length===0) return ["DIRECT"];
    var start = stableHash(key) % list.length, out=[], i;
    for(i=0;i<list.length;i++) out.push(list[(start+i)%list.length]);
    return out;
  }
  function getScheme(u){var k=idx(u,":"); return (k>0)?u.substring(0,k).toLowerCase():"";}
  // لا FTP افتراضيًا كما طلبت سابقًا
  function getPort(u){
    var sch=getScheme(u); var i2=u.indexOf("//"); var after=u.substring(i2>=0?i2+2:0);
    var c=idx(after,":"), s=idx(after,"/");
    if(c>=0 && (s<0||c<s)){var st=c+1,en=(s>=0)?s:after.length;var p=parseInt(after.substring(st,en),10); if(p>0&&p<=65535)return p;}
    if(sch==="http") return 80;
    if(sch==="https")return 443;
    if(sch==="ws")   return 80;
    if(sch==="wss")  return 443;
    return 0;
  }
  function reorderByPort(list, url){
    var p = ""+getPort(url);
    var pref = PORT_STRATEGY[p] || "auto";
    if (pref==="auto") return list;
    var i, http=[], socks=[], direct=[];
    for(i=0;i<list.length;i++){
      var t=list[i];
      if (t.indexOf("PROXY ")===0) http.push(t);
      else if (t.indexOf("SOCKS")===0) socks.push(t);
      else if (t==="DIRECT") direct.push(t);
    }
    var core = (pref==="http") ? http.concat(socks) : socks.concat(http);
    return core.concat(direct);
  }
  function clampChain(arr, n){
    var out=[], i;
    for(i=0;i<arr.length && i<n;i++) out.push(arr[i]);
    return out;
  }

  /* =========================
     بناء السلاسل حسب الملف الشخصي
     ========================= */
  var TOKENS_JO  = concatTokens(PROXIES_JO_ONLY);   // الأردني فقط
  var TOKENS_ANY = dedupe(TOKENS_JO.concat(concatTokens(PROXIES_OTHERS)));
  if (!FORBID_DIRECT) TOKENS_ANY.push("DIRECT");

  function chainFor(url, hostKey, preferJO){
    var base = preferJO ? TOKENS_JO : TOKENS_ANY;
    base = reorderByPort(base, url);
    base = rotateByHash(base, hostKey);
    base = clampChain(base, MAX_CHAIN_LEN);
    return base.join("; ");
  }

  /* =========================
     منطق القرار البسيط (Performance)
     ========================= */
  host = host.toLowerCase();

  // أسماء محلية / .local
  if (isPlainHostName(host) || shExpMatch(host, "*.local")) {
    return LOCAL_VIA_PROXY ? chainFor(url, host, (PROFILE==="JO_LOCK")) : "DIRECT";
  }

  // شبكات خاصة (LAN)
  var ip = dnsResolve(host);
  if (ip) {
    if (isInNet(ip,"10.0.0.0","255.0.0.0") ||
        isInNet(ip,"172.16.0.0","255.240.0.0") ||
        isInNet(ip,"192.168.0.0","255.255.0.0")) {
      return LOCAL_VIA_PROXY ? chainFor(url, host, (PROFILE==="JO_LOCK")) : "DIRECT";
    }
  }

  // وضع الملف الشخصي:
  if (PROFILE === "JO_LOCK") {
    // يمرر كل شيء عبر الأردني فقط (قد يؤثر على المنطقة؛ لا يُستخدم في PERF)
    return chainFor(url, host, true);
  }

  // PERF: أداء فقط — لا قواعد ألعاب — ترتيب ذكي + أقصر سلسلة
  return chainFor(url, host, false);
}
