function FindProxyForURL(url, host) {
  var MATCH = [
    "SOCKS5 91.106.109.11:8000",
    "SOCKS5 91.106.109.12:20001"
  ];
  var LOBBY = [
    "SOCKS5 91.106.109.11:8000",
    "SOCKS5 91.106.109.12:8085"
  ];
  var RECRUIT = [
    "SOCKS5 91.106.109.11:8000",
    "SOCKS5 91.106.109.12:8085"
  ];

  var H_MATCH = [
    "*.pubgmobile.com","*.gpubgm.com","*.battlegroundsmobile.com",
    "*.pubg.com","match.pubg.com","api.pubg.com",
    "*.igamecj.com","*.tencentcloud.com","cloud.tencent.com"
  ];
  var H_LOBBY = [
    "*.pubgmcdn.com","*.akamaiedge.net","*.akamaized.net",
    "*.cloudfront.net","*.fastly.net","*.edgekey.net"
  ];
  var H_RECRUIT = [
    "*.tencentgames.com","*.pubgmobileapi.com","*.pubgmobile.live",
    "*.gamecommunity.qq.com","*.sns.qq.com"
  ];

  var H_ANTI_LEAK = [
    "ipinfo.io","ifconfig.me","api.ipify.org","checkip.amazonaws.com",
    "*.stun.cloudflare.com","stun.l.google.com","global.stun.twilio.com","*.stun.*"
  ];

  function hashKey(k){
    var h=0; for(var i=0;i<k.length;i++){ h=(h<<5)-h + k.charCodeAt(i); h |= 0; } return Math.abs(h);
  }
  function seq(list, key){
    if(!list || list.length===0) return failClosed();
    var start = hashKey(key) % list.length;
    var out = [];
    for(var i=0;i<list.length;i++){ out.push(list[(start+i)%list.length]); }
    return out.join("; ");
  }
  function failClosed(){ return "PROXY 127.0.0.1:9"; }
  function matchAny(h, arr){
    for(var i=0;i<arr.length;i++){ if(shExpMatch(h, arr[i])) return true; }
    return false;
  }

  if (matchAny(host, H_MATCH))   return seq(MATCH, host);
  if (matchAny(host, H_LOBBY))   return seq(LOBBY, host);
  if (matchAny(host, H_RECRUIT)) return seq(RECRUIT, host);
  if (matchAny(host, H_ANTI_LEAK)) return seq(MATCH, host);

  // افتراضي: كل شيء يمر عبر بروكسي أردني (لا DIRECT)
  var GLOBAL = [
    "SOCKS5 91.106.109.11:8000",
    "SOCKS5 91.106.109.12:20001"
  ];
  return seq(GLOBAL, host);
}
