const steps = [
  "Capturing website…",
  "Analyzing SEO…",
  "Checking conversions…",
  "Evaluating AI readiness…",
  "Calculating revenue…"
];

const scanBtn = document.querySelector("#scan-btn");
const unlockBtn = document.querySelector("#unlock-btn");
const loadingList = document.querySelector("#loading-steps");
const leadGate = document.querySelector("#lead-gate");
const resultsEl = document.querySelector("#results");
const urlInput = document.querySelector("#url");

let latestReport = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renderLoading() {
  loadingList.innerHTML = "";
  for (const step of steps) {
    const li = document.createElement("li");
    li.textContent = step;
    loadingList.appendChild(li);
    await sleep(280);
  }
}

function renderResults(report, blurred = false) {
  const score = report.scores;
  const revenue = report.revenue;

  resultsEl.innerHTML = `
    <h2>Your Website Revenue Report</h2>
    <div class="revenue ${blurred ? "blur" : ""}">
      <h3>Estimated Revenue Opportunity</h3>
      <p><strong>$${revenue.monthlyOpportunity.low.toLocaleString()} - $${revenue.monthlyOpportunity.high.toLocaleString()} / month</strong></p>
      <p>$${revenue.annualOpportunity.low.toLocaleString()} - $${revenue.annualOpportunity.high.toLocaleString()} annually</p>
      <p>Industry detected: ${revenue.detectedIndustry}</p>
    </div>

    <div class="metric-grid ${blurred ? "blur" : ""}">
      <div class="metric"><strong>Overall Score</strong><br/>${score.overallScore}/100</div>
      <div class="metric"><strong>Design Score</strong><br/>${score.designScore}/100</div>
      <div class="metric"><strong>SEO Score</strong><br/>${score.seoScore}/100</div>
      <div class="metric"><strong>Conversion Score</strong><br/>${score.conversionScore}/100</div>
      <div class="metric"><strong>AI Search Readiness</strong><br/>${score.aiReadiness.total}/100</div>
    </div>

    <h3>Top Issues</h3>
    <ol class="${blurred ? "blur" : ""}">
      ${report.issues
        .slice(0, 3)
        .map((issue) => `<li><strong>${issue.title}</strong> — ${issue.explanation}</li>`)
        .join("")}
    </ol>

    <h3>Recommended Fixes</h3>
    <ul class="${blurred ? "blur" : ""}">
      ${report.recommendations.map((r) => `<li>${r}</li>`).join("")}
    </ul>

    <h3>Let Us Fix This For You</h3>
    <a class="book" href="${report.cta.bookingLink}" target="_blank" rel="noopener">Book My Free Strategy Call</a>
  `;

  resultsEl.classList.remove("hidden");
}

scanBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url) {
    alert("Please enter your website URL.");
    return;
  }

  scanBtn.disabled = true;
  await renderLoading();

  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Scan failed");

    latestReport = payload;
    renderResults(payload, true);
    leadGate.classList.remove("hidden");
  } catch (error) {
    alert(error.message);
  } finally {
    scanBtn.disabled = false;
  }
});

unlockBtn.addEventListener("click", async () => {
  if (!latestReport) return;

  const lead = {
    name: document.querySelector("#lead-name").value.trim(),
    email: document.querySelector("#lead-email").value.trim(),
    phone: document.querySelector("#lead-phone").value.trim(),
    businessName: document.querySelector("#lead-business").value.trim(),
    city: document.querySelector("#lead-city").value.trim(),
    marketingBudget: document.querySelector("#lead-budget").value.trim() || null
  };

  if (!lead.name || !lead.email || !lead.phone || !lead.businessName || !lead.city) {
    alert("Please complete required lead details.");
    return;
  }
  latestReport.lead = lead;
  leadGate.classList.add("hidden");
  renderResults(latestReport, false);
});
