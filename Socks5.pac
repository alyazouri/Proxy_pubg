// proxy_local_only.pac
// السماح بالاتصال المحلي فقط ومنع الإنترنت الخارجي

function FindProxyForURL(url, host) {

    // السماح بالاتصال المحلي: localhost و loopback
    if (isPlainHostName(host) || host === "localhost" || host === "127.0.0.1") {
        return "DIRECT";
    }

    // شبكات RFC1918 (داخلية)
    if (isInNet(host, "10.0.0.0", "255.0.0.0") ||
        isInNet(host, "172.16.0.0", "255.240.0.0") ||
        isInNet(host, "192.168.0.0", "255.255.0.0")) {
        return "DIRECT";
    }

    // link-local (169.254.*.*)
    if (isInNet(host, "169.254.0.0", "255.255.0.0")) {
        return "DIRECT";
    }

    // loopback IPv6
    if (host === "::1") {
        return "DIRECT";
    }

    // كل شيء آخر (الاتصال الخارجي) يُرفض
    // الطريقة الصحيحة: إعادة بروكسي غير صالح
    return "PROXY 0.0.0.0:0";
}
