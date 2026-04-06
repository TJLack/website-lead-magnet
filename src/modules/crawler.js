import { sanitizeCrawlUrl } from "./urlHandler.js";
import { extractPageData } from "./pageExtractor.js";
import { requestHtml } from "./httpClient.js";

const PRIORITY_KEYS = ["service", "services", "contact", "about", "faq", "review", "testimonials"];

function scorePriority(url) {
  const lower = url.toLowerCase();
  return PRIORITY_KEYS.reduce((score, key) => score + (lower.includes(key) ? 1 : 0), 0);
}

function extractHrefs(html) {
  const matches = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

export async function crawlSite(rootUrl, maxPages = 10, maxDepth = 2, maxRuntimeMs = 20_000) {
  const queue = [{ url: rootUrl, depth: 0 }];
  const visited = new Set();
  const pages = [];
  const startedAt = Date.now();

  while (queue.length > 0 && pages.length < maxPages) {
    if (Date.now() - startedAt > maxRuntimeMs) break;
    queue.sort((a, b) => scorePriority(b.url) - scorePriority(a.url));
    const current = queue.shift();
    if (!current || visited.has(current.url) || current.depth > maxDepth) continue;

    visited.add(current.url);

    try {
      let html;
      if (typeof fetch === "function") {
        try {
          const res = await fetch(current.url, {
            headers: { "user-agent": "KeyCityDigitalBot/1.1 (+https://keycitydigital.com)" },
            redirect: "follow"
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("text/html")) throw new Error("Non-HTML");
          html = await res.text();
        } catch {
          html = await requestHtml(current.url);
        }
      } else {
        html = await requestHtml(current.url);
      }
      const page = extractPageData(current.url, html);
      pages.push(page);

      if (current.depth < maxDepth) {
        const hrefs = extractHrefs(html);
        for (const href of hrefs) {
          const normalized = sanitizeCrawlUrl(rootUrl, href);
          if (!normalized || visited.has(normalized)) continue;
          queue.push({ url: normalized, depth: current.depth + 1 });
        }
      }
    } catch {
      // intentionally tolerant for lead-magnet UX
    }
  }

  return pages;
}
