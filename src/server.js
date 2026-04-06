import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProtocolFallbacks, normalizeUrl } from "./modules/urlHandler.js";
import { crawlSite } from "./modules/crawler.js";
import { captureHomepageScreenshot } from "./modules/screenshotService.js";
import { analyzePages } from "./modules/analyzer.js";
import { buildReport } from "./modules/reportBuilder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

async function handleApi(req, res) {
  const requestUrl = new URL(req.url || "/", "http://localhost");
  if (req.method === "OPTIONS" && requestUrl.pathname.startsWith("/api/")) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    });
    res.end();
    return true;
  }

  if (req.method !== "POST" || requestUrl.pathname !== "/api/scan") return false;

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      req.destroy(new Error("Payload too large"));
    }
  });

  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body || "{}");
      const targetUrl = normalizeUrl(parsed.url);
      const candidates = getProtocolFallbacks(targetUrl);
      let pages = [];
      let resolvedUrl = targetUrl;

      for (const candidateUrl of candidates) {
        pages = await crawlSite(candidateUrl, 10, 2, 20_000);
        if (pages.length > 0) {
          resolvedUrl = candidateUrl;
          break;
        }
      }

      if (pages.length === 0) {
        return json(res, 422, { error: "Unable to crawl this website. Please try another URL." });
      }

      const screenshot = await captureHomepageScreenshot(resolvedUrl);
      const analysis = analyzePages(pages);
      const report = buildReport({
        targetUrl: resolvedUrl,
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
  const requestUrl = new URL(req.url || "/", "http://localhost");
  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    return json(res, 200, { status: "ok", timestamp: new Date().toISOString() });
  }

  if (await handleApi(req, res)) return;

  const requestPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
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
