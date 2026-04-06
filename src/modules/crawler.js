import { sanitizeCrawlUrl } from "./urlHandler.js";
import { extractPageData } from "./pageExtractor.js";

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

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "KeyCityDigitalBot/1.0 (+https://keycitydigital.com)"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Skipped non-HTML page ${url}`);
  }

  return res.text();
}

export async function crawlSite(rootUrl, maxPages = 10, maxDepth = 2) {
  const queue = [{ url: rootUrl, depth: 0 }];
  const visited = new Set();
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    queue.sort((a, b) => scorePriority(b.url) - scorePriority(a.url));
    const current = queue.shift();
    if (!current || visited.has(current.url) || current.depth > maxDepth) continue;

    visited.add(current.url);

    try {
      const html = await fetchHtml(current.url);
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
