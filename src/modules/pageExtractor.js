const CTA_PATTERNS = [
  /book/i,
  /call/i,
  /schedule/i,
  /get\s+(a\s+)?quote/i,
  /contact/i,
  /free\s+estimate/i,
  /learn\s+more/i
];

function matchAll(pattern, text) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractByRegex(html, regex) {
  const out = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    out.push(match[1].replace(/<[^>]+>/g, "").trim());
  }
  return out.filter(Boolean);
}

export function extractPageData(url, html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const metaDescription =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] || "";

  const h1 = extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2 = extractByRegex(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h3 = extractByRegex(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi);
  const visibleText = stripTags(html);
  const words = visibleText ? visibleText.split(/\s+/).length : 0;

  const linkMatches = extractByRegex(html, /<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
  const internalLinks = linkMatches.filter((link) => !link.startsWith("http") || link.includes(new URL(url).hostname));

  const ctas = CTA_PATTERNS.flatMap((pattern) => {
    const found = visibleText.match(new RegExp(`.{0,35}${pattern.source}.{0,35}`, "gi")) || [];
    return found.slice(0, 3);
  });

  const forms = matchAll(/<form\b/gi, html);
  const phoneLinks = matchAll(/href=["']tel:/gi, html);
  const testimonials = matchAll(/testimonial|review|what\s+our\s+clients\s+say/gi, visibleText);
  const faqPatterns = matchAll(/\bFAQ\b|frequently\s+asked\s+questions|Q:\s|A:\s/gi, visibleText);
  const schema = matchAll(/application\/ld\+json|itemscope|itemtype/gi, html);
  const chatbotScripts = matchAll(/intercom|drift|tawk|livechat|chatbot|zendesk/gi, html);

  return {
    url,
    title,
    metaDescription,
    headings: { h1, h2, h3 },
    visibleText,
    wordCount: words,
    internalLinks,
    ctas,
    forms,
    phoneLinks,
    testimonials,
    faqPatterns,
    schema,
    chatbotScripts
  };
}
