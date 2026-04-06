import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";

function chooseClient(url) {
  return url.startsWith("https:") ? https : http;
}

function decodeBuffer(buffer, encoding = "") {
  const enc = encoding.toLowerCase();
  if (enc.includes("gzip")) return zlib.gunzipSync(buffer).toString("utf8");
  if (enc.includes("deflate")) return zlib.inflateSync(buffer).toString("utf8");
  if (enc.includes("br")) return zlib.brotliDecompressSync(buffer).toString("utf8");
  return buffer.toString("utf8");
}

export function requestHtml(url, { timeoutMs = 12000, maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const visit = (currentUrl, redirectsLeft) => {
      const client = chooseClient(currentUrl);
      const req = client.get(
        currentUrl,
        {
          headers: {
            "user-agent": "KeyCityDigitalBot/1.1 (+https://keycitydigital.com)",
            accept: "text/html,application/xhtml+xml",
            "accept-encoding": "gzip,deflate,br"
          }
        },
        (res) => {
          const status = res.statusCode || 0;
          const location = res.headers.location;

          if (status >= 300 && status < 400 && location) {
            res.resume();
            if (redirectsLeft <= 0) return reject(new Error(`Too many redirects for ${url}`));
            const nextUrl = new URL(location, currentUrl).toString();
            return visit(nextUrl, redirectsLeft - 1);
          }

          if (status < 200 || status >= 300) {
            res.resume();
            return reject(new Error(`Failed to fetch ${currentUrl}: ${status}`));
          }

          const contentType = String(res.headers["content-type"] || "");
          if (!contentType.includes("text/html")) {
            res.resume();
            return reject(new Error(`Skipped non-HTML page ${currentUrl}`));
          }

          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            try {
              const body = decodeBuffer(Buffer.concat(chunks), String(res.headers["content-encoding"] || ""));
              resolve(body);
            } catch (error) {
              reject(new Error(`Failed to decode response for ${currentUrl}: ${error.message}`));
            }
          });
        }
      );

      req.on("error", reject);
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Timeout fetching ${currentUrl}`));
      });
    };

    visit(url, maxRedirects);
  });
}
