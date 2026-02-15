const scraper = require('./scraper');

(async () => {
    try {
        const eid = "boruto-naruto-next-generations-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1";
        console.log(`Fetching DL links for episode: ${eid}`);
        const servers = await scraper.getEpisodeDl(eid);
        console.log("Servers found:", JSON.stringify(servers, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
})();
