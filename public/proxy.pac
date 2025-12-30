function FindProxyForURL(url, host){
  host=host.toLowerCase();
  if(isPlainHostName(host)||shExpMatch(host,"localhost")||shExpMatch(host,"127.*")||shExpMatch(host,"10.*")||shExpMatch(host,"192.168.*")||shExpMatch(host,"172.16.*")||shExpMatch(host,"172.31.*") )return "DIRECT";
  if(
    dnsDomainIs(host,"apple.com") ||
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
    shExpMatch(host,"*.wellsfargo.com")
  )return "DIRECT";
  if(
    dnsDomainIs(host,"netflix.com") ||
    shExpMatch(host,"*.netflix.com") ||
    dnsDomainIs(host,"hulu.com") ||
    shExpMatch(host,"*.hulu.com") ||
    dnsDomainIs(host,"disneyplus.com") ||
    shExpMatch(host,"*.disneyplus.com") ||
    dnsDomainIs(host,"hbonow.com") ||
    shExpMatch(host,"*.hbonow.com") ||
    dnsDomainIs(host,"nflxvideo.net") ||
    shExpMatch(host,"*.nflxvideo.net")
  )return "PROXY 69.84.182.162:80; PROXY 69.84.182.46:80; PROXY 141.193.213.128:80; PROXY 159.112.235.36:80; PROXY 66.235.200.123:80; PROXY 159.112.235.231:80; PROXY 170.114.45.114:80; PROXY 216.24.57.146:80; DIRECT";
  return "PROXY 69.84.182.162:80; PROXY 69.84.182.46:80; PROXY 141.193.213.128:80; PROXY 159.112.235.36:80; PROXY 66.235.200.123:80; PROXY 159.112.235.231:80; PROXY 170.114.45.114:80; PROXY 216.24.57.146:80; DIRECT";
}