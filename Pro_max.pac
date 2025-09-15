// ======================= CONFIG =======================
// ضع هنا عناوين بروكسي أردنية فعلًا موجودة في عمّان/طبربور
var PROXY4  = "91.106.109.12";           // استبدله إن توفّر بروكسي أقرب
var PROXY6  = "2a13:a5c7:25ff:7000";     // استبدله إن توفر IPv6 أقرب
var PORTS   = [8085,10491,20001,20002];
var DNS_SERVERS = ["82.212.64.20","87.236.233.3"]; // Orange + Zain

var JORDAN_V4 = [
  "91.106.","82.212.","87.236.","185.5.","185.28.",
  "188.247.","193.188.","176.29.","212.118."
];
var JORDAN_V6 = ["2a02:2788:","2a13:a5c7:","2a0c:9a40:"];

var PUBG_DOMAINS = [
  "igamecj.com","igamepubg.com","pubgmobile.com",
  "tencentgames.com","proximabeta.com","gcloudsdk.com",
  "qq.com","qcloudcdn.com"
];

// ======================= HELPERS =======================
function jordanResolve(host){
  var ip=null;
  for(var i=0;i<DNS_SERVERS.length;i++){
    try{ip=dnsResolve(host);}catch(e){}
    if(ip)break;
  }
  return ip;
}

function isJordanIP(ip){
  if(!ip)return false;
  if(ip.indexOf(".")>-1){
    for(var i=0;i<JORDAN_V4.length;i++){
      if(ip.indexOf(JORDAN_V4[i])===0)return true;
    }
  }else if(ip.indexOf(":")>-1){
    for(var j=0;j<JORDAN_V6.length;j++){
      if(ip.indexOf(JORDAN_V6[j])===0)return true;
    }
  }
  return false;
}

function pickFastestProxy(){
  var fastestHost=PROXY4,fastestPort=PORTS[0],best=999999;
  for(var i=0;i<PORTS.length;i++){
    var p=PORTS[i],latency=999999;
    try{
      var s=new Date().getTime();
      jordanResolve(PROXY4+":"+p);
      latency=new Date().getTime()-s;
    }catch(e){}
    if(latency<best){best=latency;fastestHost=PROXY4;fastestPort=p;}
    try{
      var s6=new Date().getTime();
      jordanResolve("["+PROXY6+"]:"+p);
      var latency6=new Date().getTime()-s6;
      if(latency6<best){best=latency6;fastestHost=PROXY6;fastestPort=p;}
    }catch(e){}
  }
  return fastestHost.indexOf(":")>-1
    ? "SOCKS5 ["+fastestHost+"]:"+fastestPort
    : "SOCKS5 "+fastestHost+":"+fastestPort;
}

// ======================= MAIN =======================
function FindProxyForURL(url,host){
  if(isPlainHostName(host)) return "DIRECT";
  var ip=jordanResolve(host);

  // إذا السيرفر أردني (أقرب مسار متاح) → DIRECT
  if(ip && isJordanIP(ip)) return "DIRECT";

  // نطاقات PUBG → أسرع بروكسي أردني (يفضّل أن يكون موقعه عمّان/طبربور)
  for(var i=0;i<PUBG_DOMAINS.length;i++){
    if(dnsDomainIs(host,PUBG_DOMAINS[i]) || shExpMatch(host,"*."+PUBG_DOMAINS[i])){
      return pickFastestProxy()+"; DIRECT";
    }
  }

  // باقي المواقع → مباشر للحفاظ على الاستقرار
  return "DIRECT";
}
