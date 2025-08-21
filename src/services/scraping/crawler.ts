import { chromium, type Browser } from "playwright";

export type RawJob = {
  source: string;
  externalId?: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  url: string;
  postedAt?: string;
};

export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({ headless: true });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

// Simple generic scraper for job listing pages. For production, add per-site scrapers.
export async function scrapeListingPage(source: string, url: string): Promise<RawJob[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Try a few common selectors heuristically
    const jobs = await page.evaluate(() => {
      const results: any[] = [];
      const candidates = Array.from(document.querySelectorAll(
        [
          "a.result",
          "a.tapItem",
          "a.jobTitle",
          "div.jobsearch-SerpJobCard a",
          "a[href*='jobs'][href*='view']",
          "a.css-1m4cuuf",
          "a[data-job-id]",
        ].join(",")
      ));
      for (const a of candidates) {
        const el = a as HTMLAnchorElement;
        const card = el.closest("article, li, div") || el;
        const title = (card.querySelector("h2, h3, .jobTitle, .title")?.textContent || "").trim();
        const company = (card.querySelector(".company, .companyName, [data-company]")?.textContent || "").trim();
        const location = (card.querySelector(".location, .companyLocation")?.textContent || "").trim();
        const desc = (card.querySelector(".summary, .job-snippet")?.textContent || "").trim();
        const href = el.getAttribute("href") || "";
        const absoluteUrl = href.startsWith("http") ? href : new URL(href, window.location.href).toString();
        if (absoluteUrl && title) {
          results.push({ title, company, location, description: desc, url: absoluteUrl });
        }
      }
      return results;
    });
    return jobs.map((j: any) => ({ source, ...j }));
  });
}


