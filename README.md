# perpy

Social trading app: Hyperliquid perp trades shared as verified posts.

## Run it on your computer

You need Node.js 20 or newer (https://nodejs.org).

```bash
npm install      # first time only: downloads the libraries
npm run dev      # starts the app
```

Then open http://localhost:3000. Pages to try: `/` (the Pit), `/scores`,
`/u/<any wallet address>`, `/learn`.
All trades and prices are real, read from Hyperliquid's public API (no key needed).
