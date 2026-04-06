import { calculateScores } from "./scoringEngine.js";
import { buildRevenueModel } from "./revenueEngine.js";

export function analyzePages(pages) {
  const scores = calculateScores(pages);
  const combinedText = pages.map((p) => p.visibleText).join(" ");

  const revenue = buildRevenueModel({ combinedText, overallScore: scores.overallScore });

  const issues = [];

  if (scores.conversionScore < 60) {
    issues.push({
      title: "Weak conversion paths",
      explanation: "Visitors are not seeing enough high-intent calls to action, forms, or phone-first paths.",
      revenueImpact: "Missed booked calls and quote requests from existing traffic.",
      fix: "Add sticky mobile CTA, clear quote buttons above the fold, and a short 3-field form on core pages."
    });
  }

  if (scores.seoScore < 65) {
    issues.push({
      title: "Low local SEO relevance",
      explanation: "Service and location signals are inconsistent, limiting visibility for high-intent local searches.",
      revenueImpact: "Lower qualified traffic from homeowners searching nearby.",
      fix: "Create service + city pages with stronger titles, meta descriptions, and structured headings."
    });
  }

  if (scores.aiReadiness.total < 60) {
    issues.push({
      title: "Not AI-search ready",
      explanation: "Content lacks clear answer-driven structure and trust cues that AI systems prioritize.",
      revenueImpact: "Reduced mentions in AI-assisted search experiences and fewer inbound leads.",
      fix: "Add FAQs, schema, trust badges, and concise service explanations per location."
    });
  }

  if (scores.designScore < 55) {
    issues.push({
      title: "Design friction hurts trust",
      explanation: "Page structure and readability likely create drop-off before users contact you.",
      revenueImpact: "Prospects bounce before calling or filling forms.",
      fix: "Simplify layout hierarchy and tighten copy blocks for mobile skimmers."
    });
  }

  while (issues.length < 3) {
    issues.push({
      title: "Insufficient service depth",
      explanation: "High-intent visitors need clearer service details and proof to convert.",
      revenueImpact: "Traffic may not convert at profitable rates.",
      fix: "Expand service pages with outcomes, pricing cues, and process transparency."
    });
  }

  const recommendations = [
    "Add dedicated service pages for each core offer and target city.",
    "Place one dominant CTA and click-to-call option on every key page.",
    "Publish FAQ blocks that answer buyer objections and local concerns.",
    "Increase trust signals (reviews, badges, guarantees, before/after proof).",
    "Strengthen AI-friendly structure with schema and concise answer sections."
  ];

  return {
    scores,
    revenue,
    issues: issues.slice(0, 5),
    recommendations
  };
}
