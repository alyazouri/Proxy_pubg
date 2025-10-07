var PROXY_MATCH=[
"SOCKS5 91.106.109.12:20001",
"SOCKS5 91.106.109.12:20002",
"SOCKS5 91.106.109.12:20003"
];

var PROXY_LOBBY=[
"SOCKS5 91.106.109.12:5000",
"SOCKS5 91.106.109.12:5001",
"SOCKS5 91.106.109.12:5002"
];

var BLACKHOLE="PROXY 0.0.0.0:0";

// نفس قوائم الأردن (IPv4 + IPv6 + Hosts) مثل النسخة السابقة

function combinedChain(host){
  var c=PROXY_LOBBY.concat(PROXY_MATCH);
  var i=Math.floor((Date.now()/1000)/60)%c.length;
  return c[i]+"; "+c[(i+1)%c.length]+"; "+c[(i+2)%c.length];
}

function ipInJordan(ip){
  // نفس فحص الرينجات زي قبل
  // ...
  return true; // استبدلها بنفس الدالة المفصلة
}

function jordanOnlyDecision(host){
  var ip=dnsResolve(host);
  if(ipInJordan(ip)) return combinedChain(host);
  return BLACKHOLE;
}

function FindProxyForURL(url,host){
  host=(host||"").toLowerCase();
  url=(url||"").toLowerCase();

  // أي دومين/آيبي أردني (حسب الرينجات) يمر بالبروكسيات
  var ip=(/^\d{1,3}(\.\d{1,3}){3}$/.test(host)||/::/.test(host))?host:dnsResolve(host);
  if(ipInJordan(ip)) return combinedChain(host);

  // كل شيء مش أردني → ينقطع
  return BLACKHOLE;
}
