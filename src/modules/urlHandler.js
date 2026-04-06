export function normalizeUrl(input) {
  if (!input || typeof input !== "string") {
    throw new Error("A valid URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  const url = new URL(withProtocol);

  url.hash = "";
  url.search = "";

  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

export function getProtocolFallbacks(normalizedUrl) {
  const parsed = new URL(normalizedUrl);
  const fallbacks = [parsed.toString()];

  if (parsed.protocol === "https:") {
    parsed.protocol = "http:";
    fallbacks.push(parsed.toString());
  } else if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
    fallbacks.push(parsed.toString());
  }

  return [...new Set(fallbacks)];
}

export function isSameDomain(baseUrl, candidateUrl) {
  return new URL(baseUrl).hostname === new URL(candidateUrl).hostname;
}

export function sanitizeCrawlUrl(baseUrl, href) {
  if (!href) return null;

  try {
    const absolute = new URL(href, baseUrl);
    absolute.hash = "";
    absolute.search = "";

    if (["mailto:", "tel:", "javascript:"].includes(absolute.protocol)) {
      return null;
    }

    if (!isSameDomain(baseUrl, absolute.toString())) {
      return null;
    }

    let normalized = absolute.toString();
    if (normalized.endsWith("/") && normalized.length > absolute.origin.length + 1) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return null;
  }
}
