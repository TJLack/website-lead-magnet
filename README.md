# Website Revenue Leak Detector

Conversion-focused lead magnet web app for Key City Digital.

## Run

```bash
npm start
```

Open `http://localhost:3000`.

Health check: `GET /api/health`

## Architecture

- `urlHandler` - URL normalization and domain-safe filtering
- `crawler` - depth-limited same-domain crawler (max 10 pages)
- `pageExtractor` - metadata/content extraction
- `screenshotService` - Puppeteer mobile screenshot (fails gracefully)
- `analyzer` + `scoringEngine` - Design/SEO/Conversion/AI scoring
- `revenueEngine` - industry detection + opportunity model
- `reportBuilder` - final structured JSON report
