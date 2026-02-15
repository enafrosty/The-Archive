const axios = require('axios');
const cheerio = require('cheerio');

const url = "https://witanime.you/anime/boruto-naruto-next-generations/";

(async () => {
    try {
        console.log(`Fetching ${url} ...\n`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);

        // Look for anime poster/logo
        console.log("=== ANIME POSTER/LOGO ===");

        // Check meta tags
        const ogImage = $('meta[property="og:image"]').attr('content');
        console.log("og:image:", ogImage);

        // Check for anime poster
        const poster = $('.anime-poster img').attr('src');
        console.log("Poster (.anime-poster img):", poster);

        const thumbnail = $('.anime-thumbnail img').attr('src');
        console.log("Thumbnail (.anime-thumbnail img):", thumbnail);

        const cover = $('.anime-cover').attr('style');
        console.log("Cover (.anime-cover style):", cover);

        // Check all images in anime-info
        console.log("\n=== ALL IMAGES IN ANIME INFO ===");
        $('.anime-info img, .anime-card img, .anime-image img').each(function () {
            console.log($(this).attr('src') || $(this).attr('data-src'));
        });

        console.log("\n=== ANIME TITLE ===");
        console.log($('.anime-title, .entry-title, h1').first().text().trim());

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
