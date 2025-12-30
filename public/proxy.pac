function FindProxyForURL(url, host) {
  host=host.toLowerCase();
  if(isPlainHostName(host)||shExpMatch(host,"localhost")||shExpMatch(host,"127.*")||shExpMatch(host,"10.*")||shExpMatch(host,"192.168.*")||shExpMatch(host,"172.16.*")||shExpMatch(host,"172.17.*")||shExpMatch(host,"172.18.*")||shExpMatch(host,"172.19.*")||shExpMatch(host,"172.20.*")||shExpMatch(host,"172.21.*")||shExpMatch(host,"172.22.*")||shExpMatch(host,"172.23.*")||shExpMatch(host,"172.24.*")||shExpMatch(host,"172.25.*")||shExpMatch(host,"172.26.*")||shExpMatch(host,"172.27.*")||shExpMatch(host,"172.28.*")||shExpMatch(host,"172.29.*")||shExpMatch(host,"172.30.*")||shExpMatch(host,"172.31.*")) return "DIRECT";
  if(    dnsDomainIs(host,"apple.com") ||
    shExpMatch(host,"*.apple.com") ||
    dnsDomainIs(host,"icloud.com") ||
    shExpMatch(host,"*.icloud.com") ||
    dnsDomainIs(host,"mzstatic.com") ||
    shExpMatch(host,"*.mzstatic.com") ||
    dnsDomainIs(host,"appstore.com") ||
    shExpMatch(host,"*.appstore.com") ||
    dnsDomainIs(host,"paypal.com") ||
    shExpMatch(host,"*.paypal.com") ||
    dnsDomainIs(host,"bank") ||
    shExpMatch(host,"*.bank") ||
    dnsDomainIs(host,"chase.com") ||
    shExpMatch(host,"*.chase.com") ||
    dnsDomainIs(host,"wellsfargo.com") ||
    shExpMatch(host,"*.wellsfargo.com")) return "DIRECT";
  if(    dnsDomainIs(host,"netflix.com") ||
    shExpMatch(host,"*.netflix.com") ||
    dnsDomainIs(host,"hulu.com") ||
    shExpMatch(host,"*.hulu.com") ||
    dnsDomainIs(host,"disneyplus.com") ||
    shExpMatch(host,"*.disneyplus.com") ||
    dnsDomainIs(host,"hbonow.com") ||
    shExpMatch(host,"*.hbonow.com") ||
    dnsDomainIs(host,"nflxvideo.net") ||
    shExpMatch(host,"*.nflxvideo.net")) return "DIRECT";
  return "DIRECT";
}