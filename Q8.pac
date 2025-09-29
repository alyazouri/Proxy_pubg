// PAC – Jordan Strong Aggressive (multi-IP fallback + no DIRECT)
// Primary: 91.106.109.11 (SOCKS5:20001/20002)
// Backup:  91.106.109.12 (SOCKS5:20001/20002, PROXY:8080/8085)
// No 1080 / 443, no DIRECT (always proxy)

function FindProxyForURL(url, host) {
    var PRIMARY = { ip: "91.106.109.11", socks: [20001,20002], http: [8080,8085] };
    var BACKUPS = [
        { ip: "91.106.109.12", socks: [20001,20002], http: [8080,8085] }
    ];

    var PRIORITY_HOSTS = [
        "match.pubg.com","api.pubg.com","*.pubgmobile.com","*.gpubgm.com","*.tencentgames.com",
        "*.pubgmcdn.com","*.battlegroundsmobile.com","*.igamecj.com","*.pubgmobileapi.com",
        "*.akamaiedge.net","*.cloudfront.net","*.akamaized.net","*.akamai.net"
    ];

    var REGION_PATTERNS = [
        "*.eu.*","*.na.*","*.us.*","*.asia.*","*.sg.*","*.jp.*","*.kr.*","*.au.*"
    ];

    var JORDAN_RANGES = [
        { ip: "91.106.109.0", mask: "255.255.255.0" },
        { ip: "109.107.240.0", mask: "255.255.248.0" },
        { ip: "149.200.0.0", mask: "255.255.0.0" },
        { ip: "185.34.16.0", mask: "255.255.252.0" },
        { ip: "188.247.64.0", mask: "255.255.192.0" }
    ];

    function socksList(entry) {
        var out = [];
        for (var i=0;i<entry.socks.length;i++) out.push("SOCKS5 " + entry.ip + ":" + entry.socks[i]);
        return out;
    }
    function httpList(entry) {
        var out = [];
        for (var i=0;i<entry.http.length;i++) out.push("PROXY " + entry.ip + ":" + entry.http[i]);
        return out;
    }
    function poolFor(entry) {
        return socksList(entry).concat(httpList(entry));
    }

    var PRIMARY_POOL = poolFor(PRIMARY);
    var BACKUP_POOL = [];
    for (var b=0;b<BACKUPS.length;b++) BACKUP_POOL = BACKUP_POOL.concat(poolFor(BACKUPS[b]));
    var DEFAULT_POOL = PRIMARY_POOL.concat(BACKUP_POOL);

    function chain(arr) { if (!arr || arr.length===0) return ""; var s=arr[0]; for (var i=1;i<arr.length;i++) s+="; "+arr[i]; return s; }
    function hash(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;}return Math.abs(h);}
    function rotate(list, seed){ if(!list||list.length===0)return[]; var idx=hash(seed)%list.length, out=[]; for(var i=0;i<list.length;i++) out.push(list[(idx+i)%list.length]); return out; }

    function hostMatchesList(h, arr) { var hl=h.toLowerCase(); for (var i=0;i<arr.length;i++) if (shExpMatch(hl, arr[i])) return true; return false; }
    function ipInRanges(ip, ranges) { if (!ip) return false; for (var i=0;i<ranges.length;i++) { if (isInNet(ip, ranges[i].ip, ranges[i].mask)) return true; } return false; }

    var seed = host + "|" + url;
    var clientIP = myIpAddress();

    if (ipInRanges(clientIP, JORDAN_RANGES)) {
        if (hostMatchesList(host, PRIORITY_HOSTS)) return chain(rotate(PRIMARY_POOL, seed));
        if (hostMatchesList(host, REGION_PATTERNS)) return chain(rotate(PRIMARY_POOL, seed));
        return chain(rotate(DEFAULT_POOL, seed));
    }

    if (hostMatchesList(host, PRIORITY_HOSTS)) return chain(rotate(PRIMARY_POOL, seed));
    if (hostMatchesList(host, REGION_PATTERNS)) return chain(rotate(PRIMARY_POOL, seed));

    // fallback: always return proxies (no DIRECT)
    return chain(rotate(DEFAULT_POOL, seed));
}
