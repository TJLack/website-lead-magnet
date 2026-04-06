export function buildReport({ targetUrl, pages, analysis, screenshot, lead }) {
  return {
    app: "Website Revenue Leak Detector",
    generatedAt: new Date().toISOString(),
    targetUrl,
    lead,
    scores: analysis.scores,
    revenue: analysis.revenue,
    issues: analysis.issues,
    recommendations: analysis.recommendations,
    screenshots: {
      homepageMobile: screenshot
    },
    pageData: pages.map((p) => ({
      url: p.url,
      title: p.title,
      metaDescription: p.metaDescription,
      wordCount: p.wordCount,
      headings: p.headings,
      ctaCount: p.ctas.length,
      forms: p.forms,
      phoneLinks: p.phoneLinks,
      testimonials: p.testimonials,
      faqPatterns: p.faqPatterns,
      schema: p.schema
    })),
    cta: {
      headline: "Let Us Fix This For You",
      buttonText: "Book My Free Strategy Call",
      bookingLink: "https://api.leadconnectorhq.com/widget/bookings/digital-marketing-consultation-apykl"
    }
  };
}
