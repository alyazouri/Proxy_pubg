var PROXY_HOST   = "91.106.109.12"
var DEFAULT_PORT = "20001"

var PORTS = {
  LOBBY:   ["5000","5001"],
  MATCH:   ["20001","20002","20003"],
  TDM:     ["9999","10000"],
  RECRUIT: ["8085","1080","5000"]
}

var TRUSTED_NETS = [
  ["212.34.0.0","255.255.224.0"],
  ["213.139.32.0","255.255.224.0"],
  ["185.98.220.0","255.255.252.0"],
  ["46.32.96.0","255.255.224.0"],
  ["77.245.0.0","255.255.240.0"],
  ["80.90.160.0","255.255.240.0"],
  ["87.238.128.0","255.255.248.0"],
  ["176.29.0.0","255.255.0.0"],
  ["185.109.192.0","255.255.252.0"],
  ["188.247.64.0","255.255.224.0"],
  ["109.107.224.0","255.255.224.0"],
  ["95.172.192.0","255.255.224.0"]
]

var HOST_RULES = {
  LOBBY: [
    "*.pubg.com",
    "*.pubgmobile.com",
    "*.broker.amsoveasea.com",
    "napubgm.broker.amsoveasea.com",
    "nawzryhwatm.broker.amsoveasea.com",
    "broker-*.vasdgame.com",
    "*.broker.*.vasdgame.com",
    "atm-broker-ws-*-sg.vasdgame.com",
    "napubgm-broker.*.eo.dnse1.com",
    "mgl.lobby.igamecj.com",
    "lobby*.igamecj.com"
  ],
  MATCH: [
    "*.pubgmobile.com",
    "*.battlegroundsmobile.com",
    "*.igamecj.com",
    "*.tencentgames.com"
  ],
  RECRUIT: [
    "api.pubgmobile.com",
    "game.pubgmobile.com",
    "www.pubgmobile.com",
    "napubgm-broker.*.eo.dnse1.com"
  ]
}

function hashStr(s){
  var h=0,i,c
  s=String(s)
  for(i=0;i<s.length;i++){
    c=s.charCodeAt(i)
    h=((h<<5)-h)+c
    h=h&0xFFFFFFFF
  }
  if(h<0)h=-h
  return h
}

function uniq(a){
  var o={},r=[],i,k
  for(i=0;i<a.length;i++){
    k=String(a[i])
    if(k&&!o[k]){o[k]=1;r.push(k)}
  }
  return r
}

function buildChain(ports,k1,k2){
  var p=uniq(ports||[])
  if(p.length===0)return "SOCKS5 "+PROXY_HOST+":"+DEFAULT_PORT
  var s=hashStr(String(k1)+":"+String(k2))%p.length
  var out=[],i
  for(i=0;i<p.length;i++){
    out.push("SOCKS5 "+PROXY_HOST+":"+p[(s+i)%p.length])
  }
  return out.join("; ")
}

function matchHost(host,pats){
  for(var i=0;i<pats.length;i++){
    if(shExpMatch(host,pats[i])) return true
  }
  return false
}

function isGameTraffic(url,host){
  var ps=["/tdm","/arena","/team","/invite","/recruit","/room","/squad"]
  url=String(url).toLowerCase()
  host=String(host).toLowerCase()
  for(var i=0;i<ps.length;i++){
    if(url.indexOf(ps[i])!==-1||host.indexOf(ps[i].substr(1))!==-1) return true
  }
  return false
}

function inTrusted(ip){
  for(var i=0;i<TRUSTED_NETS.length;i++){
    var n=TRUSTED_NETS[i]
    if(isInNet(ip,n[0],n[1])) return true
  }
  return false
}

function FindProxyForURL(url,host){
  if(!host) return "SOCKS5 "+PROXY_HOST+":"+DEFAULT_PORT
  host=String(host).toLowerCase()
  if(host==="youtube.com"||shExpMatch(host,"*.youtube.com")) return "DIRECT"
  var ip=dnsResolve(host)
  if(ip&&inTrusted(ip)) return buildChain(PORTS.LOBBY,url,host)
  if(matchHost(host,HOST_RULES.LOBBY))   return buildChain(PORTS.LOBBY,url,host)
  if(isGameTraffic(url,host))            return buildChain(PORTS.TDM,url,host)
  if(matchHost(host,HOST_RULES.MATCH))   return buildChain(PORTS.MATCH,url,host)
  if(matchHost(host,HOST_RULES.RECRUIT)) return buildChain(PORTS.RECRUIT,url,host)
  return "SOCKS5 "+PROXY_HOST+":"+DEFAULT_PORT
}
