const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

const url = "https://witanime.you/anime/boruto-naruto-next-generations/";

(async () => {
    try {
        console.log(`Fetching ${url}...`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        fs.writeFileSync('debug.html', data);
        console.log("Saved to debug.html");

        const $ = cheerio.load(data);
        const title = $('h1.anime-details-title').text().trim();
        console.log("Title found:", title);

        // Log all div classes to see what we have
        const classes = new Set();
        $('div').each((i, el) => {
            const cls = $(el).attr('class');
            if (cls) cls.split(' ').forEach(c => classes.add(c));
        });
        console.log("Classes found:", Array.from(classes).slice(0, 50));

    } catch (e) {
        console.error(e);
    }
})();
