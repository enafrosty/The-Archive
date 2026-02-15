const scraper = require('./scraper');

(async () => {
    console.log("Testing Scraper...");

    try {
        console.log("\n--- Latest Episodes ---");
        const latest = await scraper.latestEpisodes();
        console.log(`Found ${latest.length} episodes.`);
        if (latest.length > 0) console.log("Sample:", latest[0]);

        console.log("\n--- Search 'Naruto' ---");
        const search = await scraper.searchAnime("Naruto");
        console.log(`Found ${search.length} results.`);
        if (search.length > 0) {
            console.log("Sample:", search[0]);
            // Test getting details for first result
            const firstAnime = search[0];
            if (firstAnime.url) {
                // url is absolute or relative? Python: item.select("h3 > a")[0]["href"]
                // usually absolute.
                // We need ID for getEpisodes.
                // witanime url structure: https://witanime.you/anime/name-of-anime/
                // ID is `name-of-anime`.
                // Let's parse it.
                const parts = firstAnime.url.split('/');
                // url might end with slash
                let id = parts[parts.length - 1] || parts[parts.length - 2];
                if (firstAnime.url.includes('anime/')) {
                    // Extract after anime/
                    const match = firstAnime.url.match(/anime\/([^\/]+)/);
                    if (match) id = match[1];
                }

                console.log(`\n--- Anime Details for ID: ${id} ---`);
                const info = await scraper.getAnimeInfo(id);
                console.log("Title:", info.title);
                console.log("Genres:", info.genres);

                console.log(`\n--- Episodes for ID: ${id} ---`);
                const episodes = await scraper.getEpisodes(id);
                console.log(`Found ${episodes.length} episodes.`);
                if (episodes.length > 0) {
                    console.log("Sample Episode:", episodes[0]);

                    // Test Video Link for first episode
                    const firstEp = episodes[0];
                    if (firstEp.episode_url) {
                        const epParts = firstEp.episode_url.split('/');
                        let epId = epParts[epParts.length - 1] || epParts[epParts.length - 2];
                        if (firstEp.episode_url.includes('episode/')) {
                            const match = firstEp.episode_url.match(/episode\/([^\/]+)/);
                            if (match) epId = match[1];
                        }

                        console.log(`\n--- Video Sources for Episode ID: ${epId} ---`);
                        const sources = await scraper.getEpisodeDl(epId);
                        console.log("Sources:", Object.keys(sources));
                    }
                }
            }
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
})();
