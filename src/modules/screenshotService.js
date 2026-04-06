export async function captureHomepageScreenshot(url) {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20_000 });
    const buffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: true });
    await browser.close();

    return {
      status: "ok",
      mimeType: "image/jpeg",
      dataUrl: `data:image/jpeg;base64,${buffer.toString("base64")}`
    };
  } catch (error) {
    return {
      status: "error",
      message: `Screenshot unavailable: ${error.message}`
    };
  }
}
