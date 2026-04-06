import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeUrl } from "./modules/urlHandler.js";
import { crawlSite } from "./modules/crawler.js";
import { captureHomepageScreenshot } from "./modules/screenshotService.js";
import { analyzePages } from "./modules/analyzer.js";
import { buildReport } from "./modules/reportBuilder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function handleApi(req, res) {
  if (req.method !== "POST" || req.url !== "/api/scan") return false;

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body || "{}");
      const targetUrl = normalizeUrl(parsed.url);

      const pages = await crawlSite(targetUrl, 10, 2);
      if (pages.length === 0) {
        return json(res, 422, { error: "Unable to crawl this website. Please try another URL." });
      }

      const screenshot = await captureHomepageScreenshot(targetUrl);
      const analysis = analyzePages(pages);
      const report = buildReport({
        targetUrl,
        pages,
        analysis,
        screenshot,
        lead: parsed.lead || null
      });

      return json(res, 200, report);
    } catch (error) {
      return json(res, 400, { error: error.message || "Scan failed." });
    }
  });

  return true;
}

const server = http.createServer(async (req, res) => {
  if (await handleApi(req, res)) return;

  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestPath).replace(/^\.\.(\/|\\|$)/, "");
  const filePath = path.join(publicDir, safePath);

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentType =
      ext === ".html"
        ? "text/html"
        : ext === ".css"
          ? "text/css"
          : ext === ".js"
            ? "application/javascript"
            : "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Website Revenue Leak Detector running on http://localhost:${port}`);
});
