/**
 * Test scenario: ~21.5 minutes of real-world browsing.
 *
 * Google Search is used as the entry point for most steps (type query, click result),
 * mirroring how people actually navigate the web.
 *
 * | #  | Phase                  | Duration | Notes                                              |
 * |----|------------------------|----------|----------------------------------------------------|
 * |    | **Video & calls**      |          | *Full-attention tasks, no PiP*                     |
 * | 01 | Notion                 | 1 min    | Google "notion" → open specific page, scroll, read |
 * | 02 | YouTube 4K HDR         | 2 min    | Google → YouTube, fullscreen, specific video (TBD) |
 * | 03 | YouTube Shorts         | 1.5 min  | Navigate to Shorts, scroll ~4-5, autoplay          |
 * | 04 | Google Meet            | 1.5 min  | Solo meeting, camera + mic on, nobody else         |
 * |    | **PiP starts**         | 30s      | *YouTube playlist into PiP — stays on for rest*    |
 * | 05 | Start PiP              | 30s      | Open playlist (TBD), pop into PiP                  |
 * |    | **Browsing with PiP**  |          | *Background video decode + audio running*           |
 * | 06 | Google AI              | 1 min    | Type specific prompt into Google AI Overview       |
 * | 07 | Google Sheets          | 1 min    | Open existing sheet, scroll, edit cells            |
 * | 08 | Google Maps            | 2 min    | Search address, zoom, 3D, Street View, navigate   |
 * | 09 | News article           | 30s      | Google → news site, scroll article, copy URL       |
 * | 10 | Google Translate       | 1 min    | New tab, paste URL into Translate, read page       |
 * | 11 | E-commerce             | 2 min    | Google → site, category, filters, product, gallery |
 * | 12 | Food delivery          | 2 min    | Google → Wolt/similar, find sushi, browse items    |
 * | 13 | Discord                | 1 min    | Switch between 2-3 static channels, scroll history |
 * | 14 | GitHub                 | 1.5 min  | Google → repo, browse code, open a PR/diff         |
 * | 15 | PDF reading            | 1 min    | Open PDF from this repo in browser, scroll, read   |
 * | 16 | Reddit                 | 1.5 min  | Google → subreddit, scroll, open threads           |
 * | 17 | Pinterest              | 1.5 min  | Google → search, scroll image grid, open pins      |
 *
 * Login requirements: Google (Meet, Sheets, Translate, AI), Notion, Discord, GitHub.
 * YouTube Shorts works logged-in via Google. Reddit and Pinterest may work without login.
 *
 * The PDF file is committed to this repo so it's identical across all test runs.
 * All specific URLs, prompts, and search terms to be filled in before the benchmark run.
 */
export const ACTION_PHASES = [
	// Video & calls block (no PiP)
	{ name: "01. Notion", endSecond: 60 },
	{ name: "02. YouTube 4K HDR", endSecond: 180 },
	{ name: "03. YouTube Shorts", endSecond: 270 },
	{ name: "04. Google Meet", endSecond: 360 },
	// PiP starts — YouTube playlist, stays on for all remaining phases
	{ name: "05. Start PiP", endSecond: 390 },
	// Browsing with PiP (background video decode + audio)
	{ name: "06. Google AI", endSecond: 450 },
	{ name: "07. Google Sheets", endSecond: 510 },
	{ name: "08. Google Maps", endSecond: 630 },
	{ name: "09. News article", endSecond: 660 },
	{ name: "10. Google Translate", endSecond: 720 },
	{ name: "11. E-commerce", endSecond: 840 },
	{ name: "12. Food delivery", endSecond: 960 },
	{ name: "13. Discord", endSecond: 1020 },
	{ name: "14. GitHub", endSecond: 1110 },
	{ name: "15. PDF reading", endSecond: 1170 },
	{ name: "16. Reddit", endSecond: 1260 },
	{ name: "17. Pinterest", endSecond: 1350 },
] as const;
