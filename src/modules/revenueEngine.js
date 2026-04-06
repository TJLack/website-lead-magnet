const INDUSTRY_MAP = {
  roofing: 10000,
  hvac: 6000,
  plumbing: 600,
  electrical: 800,
  "pressure washing": 300,
  landscaping: 2000,
  fencing: 4000,
  remodeling: 15000,
  concrete: 6000,
  "junk removal": 300,
  cleaning: 200,
  "foundation repair": 12000,
  "pest control": 250,
  "pool service": 500,
  "pool services": 500
};

function detectIndustry(text) {
  const lower = text.toLowerCase();
  let best = "fallback";
  let bestCount = 0;

  for (const key of Object.keys(INDUSTRY_MAP)) {
    const count = (lower.match(new RegExp(key, "g")) || []).length;
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }

  return { industry: best, confidence: bestCount >= 5 ? "high" : bestCount >= 2 ? "medium" : "low" };
}

function adjustJobValue(baseValue, text) {
  let adjusted = baseValue;
  const lower = text.toLowerCase();

  if (/install|replacement|premium|custom|luxury/.test(lower)) adjusted *= 1.25;
  if (/repair|maintenance|tune-up|inspection/.test(lower)) adjusted *= 0.9;
  if (/emergency|24\/7|same-day/.test(lower)) adjusted *= 1.1;

  return Math.round(adjusted);
}

export function buildRevenueModel({ combinedText, overallScore }) {
  const { industry, confidence } = detectIndustry(combinedText);
  const baseJobValue = INDUSTRY_MAP[industry] || 500;
  const suggestedJobValue = adjustJobValue(baseJobValue, combinedText);

  let trafficRange;
  if (overallScore < 45) trafficRange = [100, 300];
  else if (overallScore < 75) trafficRange = [300, 800];
  else trafficRange = [800, 2000];

  const currentCVR = overallScore < 45 ? [0.005, 0.012] : overallScore < 75 ? [0.012, 0.03] : [0.02, 0.03];
  const optimizedCVR =
    industry === "roofing" || industry === "remodeling" ? [0.03, 0.06] : overallScore < 45 ? [0.035, 0.08] : [0.03, 0.065];

  const lowMonthly = Math.round(trafficRange[0] * (optimizedCVR[0] - currentCVR[1]) * suggestedJobValue);
  const highMonthly = Math.round(trafficRange[1] * (optimizedCVR[1] - currentCVR[0]) * suggestedJobValue);

  return {
    detectedIndustry: industry,
    confidence,
    baseJobValue,
    suggestedJobValue,
    userAdjustable: {
      min: Math.round(suggestedJobValue * 0.5),
      max: Math.round(suggestedJobValue * 2.5),
      quickButtons: [
        Math.round(suggestedJobValue * 0.75),
        suggestedJobValue,
        Math.round(suggestedJobValue * 1.25)
      ]
    },
    assumptions: {
      monthlyTraffic: { low: trafficRange[0], high: trafficRange[1] },
      currentConversionRate: { low: currentCVR[0], high: currentCVR[1] },
      optimizedConversionRate: { low: optimizedCVR[0], high: optimizedCVR[1] }
    },
    monthlyOpportunity: { low: Math.max(0, lowMonthly), high: Math.max(lowMonthly, highMonthly) },
    annualOpportunity: { low: Math.max(0, lowMonthly * 12), high: Math.max(0, highMonthly * 12) }
  };
}
