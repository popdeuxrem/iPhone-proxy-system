# iPhone Proxy System 🌍📱

Automated proxy system for iPhone with country-specific routing.

## Features
- **Country-specific proxies**: Route traffic through specific countries
- **Auto-updating**: Fresh proxies every 2 hours via GitHub Actions
- **iPhone optimized**: Tested with Apple services and iOS compatibility
- **Smart routing**: Bypass Apple/banking, force proxy for streaming
- **Easy configuration**: One-click country switching

## Quick Start

1. **Clone and setup**:
```bash
git clone <your-repo>
cd iphone-proxy-system
npm install
```

1. Configure (edit config.json):

```json
{
  "targetCountry": "US",
  "pacUrl": "https://YOUR_USERNAME.github.io/iPhone-proxy-system/proxy.pac"
}
```

1. Build:

```bash
npm run build
```

1. Deploy to GitHub Pages:

· Enable Pages in repo settings
· Set source to gh-pages branch

Country Switching

Switch proxy country easily:

```bash
# Switch to United States
npm run switch:us

# Switch to United Kingdom  
npm run switch:uk

# Switch to Germany
npm run switch:germany

# Switch to Japan
npm run switch:japan

# Switch to Canada
npm run switch:canada

# Switch to Australia
npm run switch:au

# Switch to Singapore
npm run switch:sg
```

Then rebuild:

```bash
npm run build
git add . && git commit -m "Switch to XX" && git push
```

iPhone Setup

1. Get your PAC URL from public/status.json
2. On iPhone: Settings → Wi-Fi → ⓘ → Configure Proxy → Automatic
3. Enter PAC URL
4. Save

Files

· config.json - Configuration (country, domains, sources)
· public/proxy.pac - Generated proxy auto-config
· public/status.json - Current system status
· data/proxies.json - Validated proxy list
· scripts/ - All automation scripts

GitHub Actions

· Auto-updates every 2 hours
· Deploys to GitHub Pages automatically
· Updates when config changes

Available Countries

· US 🇺🇸 - United States
· GB 🇬🇧 - United Kingdom
· DE 🇩🇪 - Germany
· FR 🇫🇷 - France
· JP 🇯🇵 - Japan
· CA 🇨🇦 - Canada
· AU 🇦🇺 - Australia
· SG 🇸🇬 - Singapore
· NL 🇳🇱 - Netherlands
· SE 🇸🇪 - Sweden
