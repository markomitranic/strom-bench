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
 * | 08 | Google Maps            | 2 min    | Search address, zoom, 3D, Street View, navigate   |
 * | 07 | Google Sheets          | 1 min    | Open existing sheet, scroll, edit cells            |
 * | 09 | News article           | 30s      | Google → news site, scroll article, copy URL       |
 * | 11 | E-commerce             | 2 min    | Google → site, category, filters, product, gallery |
 * | 12 | Food delivery          | 2 min    | Google → Wolt/similar, find sushi, browse items    |
 * | 13 | Discord                | 1 min    | Switch between 2-3 static channels, scroll history |
 * | 14 | GitHub                 | 1.5 min  | Google → repo, browse code, open a PR/diff         |
 * | 15 | PDF reading            | 1 min    | Google → ANOUR price list, scroll 20p, read        |
 * | 16 | Hackernews             | 1.5 min  | Google → hackernews scroll, open threads           |
 * | 17 | Pinterest              | 1.5 min  | Google → search, scroll image grid, open pins      |
 *
 * Login requirements: Google, Notion, Discord.
 */
export const ACTION_PHASES = [
	// Video & calls block (no PiP)
	{ name: "01. Notion", endSecond: timetoSeconds("1:03") },
	{ name: "02. YouTube 4K HDR", endSecond: timetoSeconds("3:18") },
	{ name: "03. YouTube Shorts", endSecond: timetoSeconds("4:28") },
	{ name: "04. Google Meet", endSecond: timetoSeconds("5:54") },
	// PiP starts — YouTube playlist, stays on for all remaining phases
	{ name: "05. Start PiP", endSecond: timetoSeconds("6:30") },
	// Browsing with PiP (background video decode + audio)
	{ name: "06. Google AI", endSecond: timetoSeconds("7:22") },
	{ name: "08. Google Maps", endSecond: timetoSeconds("8:40") },
	{ name: "07. Google Sheets", endSecond: timetoSeconds("9:42") },
	{ name: "09. News article", endSecond: timetoSeconds("11:25") },
	{ name: "11. E-commerce", endSecond: timetoSeconds("12:28") },
	{ name: "12. Food delivery", endSecond: timetoSeconds("13:08") },
	{ name: "13. Discord", endSecond: timetoSeconds("13:54") },
	{ name: "14. GitHub", endSecond: timetoSeconds("14:37") },
	{ name: "15. PDF reading", endSecond: timetoSeconds("15:31") },
	{ name: "16. Reddit", endSecond: timetoSeconds("16:19") },
	{ name: "17. Pinterest", endSecond: timetoSeconds("17:16") },
] as const;

function timetoSeconds(time: string): number {
	const [minutes, seconds] = time.split(":").map(Number);
	return minutes * 60 + seconds;
}
