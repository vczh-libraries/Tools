import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = "http://localhost:8888";

async function fetchJson(urlPath, options) {
    const res = await fetch(`${BASE}${urlPath}`, options);
    return res.json();
}

// Verify the entry is already installed (by api.test.mjs which runs earlier)
async function verifyEntryInstalled() {
    const data = await fetchJson("/api/copilot/job");
    assert.ok(Array.isArray(data.grid), "grid should be an array (entry must be installed by api.test.mjs)");
    assert.ok(data.grid.length > 0, "grid should have rows (entry must be installed by api.test.mjs)");
}

describe("Web: jobs.html redirect", () => {
    let browser;
    let page;

    before(async () => {
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
    });

    after(async () => {
        await browser?.close();
    });

    it("redirects to index.html when no wd parameter", async () => {
        await page.goto(`${BASE}/jobs.html`);
        await page.waitForTimeout(1000);
        const url = new URL(page.url());
        assert.strictEqual(url.pathname, "/index.html", "should redirect to index.html");
    });
});

describe("Web: jobs.html layout", () => {
    let browser;
    let page;

    before(async () => {
        await verifyEntryInstalled();
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
        await page.goto(`${BASE}/jobs.html?wd=C%3A%5CCode%5CVczhLibraries%5CTools`);
        await page.waitForTimeout(2000);
    });

    after(async () => {
        await browser?.close();
    });

    it("loads jobs.css stylesheet", async () => {
        const links = await page.evaluate(() =>
            Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => l.getAttribute("href"))
        );
        assert.ok(links.includes("jobs.css"), "should include jobs.css");
    });

    it("has left-part and right-part", async () => {
        const leftVisible = await page.locator("#left-part").isVisible();
        const rightVisible = await page.locator("#right-part").isVisible();
        assert.ok(leftVisible, "left part should be visible");
        assert.ok(rightVisible, "right part should be visible");
    });

    it("has horizontal resize bar", async () => {
        const visible = await page.locator("#resize-bar").isVisible();
        assert.ok(visible, "resize bar should be visible");
    });

    it("matrix-part is visible at start", async () => {
        const visible = await page.locator("#matrix-part").isVisible();
        assert.ok(visible, "matrix part should be visible");
    });

    it("job-part is hidden at start", async () => {
        const display = await page.evaluate(() =>
            document.getElementById("job-part").style.display
        );
        assert.strictEqual(display, "none", "job part should be hidden");
    });

    it("user-input-part is visible at start", async () => {
        const visible = await page.locator("#user-input-part").isVisible();
        assert.ok(visible, "user input part should be visible");
    });

    it("session-response-part is hidden at start", async () => {
        const display = await page.evaluate(() =>
            document.getElementById("session-response-part").style.display
        );
        assert.strictEqual(display, "none", "session response part should be hidden");
    });
});

describe("Web: jobs.html matrix rendering", () => {
    let browser;
    let page;

    before(async () => {
        await verifyEntryInstalled();
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
        await page.goto(`${BASE}/jobs.html?wd=C%3A%5CCode%5CVczhLibraries%5CTools`);
        await page.waitForTimeout(2000);
    });

    after(async () => {
        await browser?.close();
    });

    it("renders matrix table with title", async () => {
        const title = await page.locator(".matrix-title").textContent();
        assert.strictEqual(title, "Available Jobs", "should have title row");
    });

    it("renders keyword columns", async () => {
        const keywords = await page.locator(".matrix-keyword").allTextContents();
        assert.ok(keywords.includes("test"), "should have 'test' keyword");
        assert.ok(keywords.includes("batch"), "should have 'batch' keyword");
    });

    it("renders automate button only for rows with automate=true", async () => {
        const automateButtons = await page.locator(".matrix-automate-btn").count();
        // Only "batch" row has automate=true
        assert.strictEqual(automateButtons, 1, "should have exactly 1 automate button");
    });

    it("renders job buttons with correct text", async () => {
        const jobBtnTexts = await page.locator(".matrix-job-btn").allTextContents();
        assert.ok(jobBtnTexts.includes("run"), "should have 'run' button");
        assert.ok(jobBtnTexts.includes("fail"), "should have 'fail' button");
        assert.ok(jobBtnTexts.includes("sequence"), "should have 'sequence' button");
        assert.ok(jobBtnTexts.includes("parallel"), "should have 'parallel' button");
    });

    it("job buttons have data-job-name attribute", async () => {
        const jobNames = await page.evaluate(() =>
            Array.from(document.querySelectorAll(".matrix-job-btn")).map(b => b.dataset.jobName)
        );
        assert.ok(jobNames.includes("simple-job"), "should have simple-job");
        assert.ok(jobNames.includes("fail-job"), "should have fail-job");
        assert.ok(jobNames.includes("seq-job"), "should have seq-job");
        assert.ok(jobNames.includes("par-job"), "should have par-job");
    });
});

describe("Web: jobs.html job selection", () => {
    let browser;
    let page;

    before(async () => {
        await verifyEntryInstalled();
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
        await page.goto(`${BASE}/jobs.html?wd=C%3A%5CCode%5CVczhLibraries%5CTools`);
        await page.waitForTimeout(2000);
    });

    after(async () => {
        await browser?.close();
    });

    it("Start Job button shows 'Job Not Selected' and is disabled initially", async () => {
        const text = await page.locator("#start-job-button").textContent();
        assert.strictEqual(text, "Job Not Selected");
        const disabled = await page.locator("#start-job-button").isDisabled();
        assert.ok(disabled, "start job button should be disabled");
    });

    it("clicking a job button selects it and enables start button", async () => {
        const btn = page.locator('.matrix-job-btn[data-job-name="simple-job"]');
        await btn.click();
        const hasSelected = await btn.evaluate(el => el.classList.contains("selected"));
        assert.ok(hasSelected, "clicked button should have selected class");
        const startText = await page.locator("#start-job-button").textContent();
        assert.strictEqual(startText, "Start Job: simple-job");
        const disabled = await page.locator("#start-job-button").isDisabled();
        assert.ok(!disabled, "start job button should be enabled");
    });

    it("clicking the same job button deselects it", async () => {
        const btn = page.locator('.matrix-job-btn[data-job-name="simple-job"]');
        await btn.click(); // deselect
        const hasSelected = await btn.evaluate(el => el.classList.contains("selected"));
        assert.ok(!hasSelected, "button should not have selected class");
        const startText = await page.locator("#start-job-button").textContent();
        assert.strictEqual(startText, "Job Not Selected");
        const disabled = await page.locator("#start-job-button").isDisabled();
        assert.ok(disabled, "start job button should be disabled");
    });

    it("clicking a different job button switches selection", async () => {
        const btn1 = page.locator('.matrix-job-btn[data-job-name="simple-job"]');
        const btn2 = page.locator('.matrix-job-btn[data-job-name="seq-job"]');
        await btn1.click(); // select simple-job
        await btn2.click(); // select seq-job (deselects simple-job)
        const has1 = await btn1.evaluate(el => el.classList.contains("selected"));
        const has2 = await btn2.evaluate(el => el.classList.contains("selected"));
        assert.ok(!has1, "first button should not be selected");
        assert.ok(has2, "second button should be selected");
        const startText = await page.locator("#start-job-button").textContent();
        assert.strictEqual(startText, "Start Job: seq-job");
    });

    it("user input textarea is visible", async () => {
        const visible = await page.locator("#user-input-textarea").isVisible();
        assert.ok(visible, "user input textarea should be visible");
    });
});
