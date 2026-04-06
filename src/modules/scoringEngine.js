function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export function calculateScores(pages) {
  const combinedText = pages.map((p) => p.visibleText).join(" ").toLowerCase();
  const totalWordCount = pages.reduce((sum, p) => sum + p.wordCount, 0);
  const totalForms = pages.reduce((sum, p) => sum + p.forms, 0);
  const totalPhoneLinks = pages.reduce((sum, p) => sum + p.phoneLinks, 0);
  const totalFaq = pages.reduce((sum, p) => sum + p.faqPatterns, 0);
  const totalSchema = pages.reduce((sum, p) => sum + p.schema, 0);
  const totalTestimonials = pages.reduce((sum, p) => sum + p.testimonials, 0);
  const headingCoverage = pages.filter((p) => p.headings.h1.length > 0 && p.headings.h2.length > 0).length;
  const metaCoverage = pages.filter((p) => p.metaDescription.length >= 80).length;
  const titleCoverage = pages.filter((p) => p.title.length > 10).length;

  const designScore = clamp(
    35 +
      headingCoverage * 4 +
      (totalWordCount / Math.max(1, pages.length * 350)) * 15 +
      (pages.length >= 4 ? 10 : 0) +
      (totalTestimonials > 0 ? 8 : 0)
  );

  const seoScore = clamp(
    20 +
      metaCoverage * 6 +
      titleCoverage * 5 +
      headingCoverage * 5 +
      (totalWordCount / Math.max(1, pages.length * 500)) * 25 +
      (combinedText.match(/(texas|tx|near me|service area|city)/g)?.length || 0)
  );

  const conversionScore = clamp(
    20 +
      Math.min(20, totalForms * 6) +
      Math.min(15, totalPhoneLinks * 4) +
      Math.min(15, totalTestimonials * 2) +
      Math.min(20, pages.flatMap((p) => p.ctas).length * 2) +
      (combinedText.includes("free estimate") ? 10 : 0)
  );

  const aiReadinessSubScores = {
    contentClarity: clamp(5 + (headingCoverage / Math.max(1, pages.length)) * 20),
    serviceLocationStructure: clamp(
      5 + (combinedText.match(/(service|services|area|city|county|neighborhood)/g)?.length || 0) / 3
    ),
    trustAuthority: clamp(5 + totalTestimonials * 2 + (combinedText.match(/licensed|insured|certified/g)?.length || 0) * 3),
    answerContent: clamp(5 + totalFaq * 3 + (combinedText.match(/how|what|when|why/g)?.length || 0) / 5),
    technicalStructure: clamp(5 + totalSchema * 4)
  };

  const aiReadinessScore = clamp(
    aiReadinessSubScores.contentClarity * 0.25 +
      aiReadinessSubScores.serviceLocationStructure * 0.25 +
      aiReadinessSubScores.trustAuthority * 0.2 +
      aiReadinessSubScores.answerContent * 0.2 +
      aiReadinessSubScores.technicalStructure * 0.1
  );

  const overallScore = clamp(designScore * 0.2 + seoScore * 0.3 + conversionScore * 0.3 + aiReadinessScore * 0.2);

  return {
    overallScore,
    designScore,
    seoScore,
    conversionScore,
    aiReadiness: {
      total: aiReadinessScore,
      subScores: aiReadinessSubScores,
      explanation:
        "AI readiness reflects whether your site is structured so AI systems can clearly understand your services, locations, trust signals, and direct answers."
    }
  };
}
