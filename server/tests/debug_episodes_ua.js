const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

const url = "https://witanime.you/anime/boruto-naruto-next-generations/";

(async () => {
    try {
        console.log(`Fetching ${url} with NO User-Agent (Axios default)...`);
        // Axios default UA is usually `axios/version`
        const { data } = await axios.get(url, {
            // headers: { 'User-Agent': ... } // Intentionally omitted
        });

        const $ = cheerio.load(data);
        const count = $('.episodes-card').length;
        console.log(`Found ${count} elements with class .episodes-card`);

        if (count > 0) {
            console.log("SUCCESS! Found episodes with default UA.");
            console.log($('.episodes-card').first().html().substring(0, 200));
        } else {
            console.log("Still 0. Trying 'python-requests/2.25.1'...");
            const { data: data2 } = await axios.get(url, {
                headers: { 'User-Agent': 'python-requests/2.25.1' }
            });
            const $2 = cheerio.load(data2);
            const count2 = $2('.episodes-card').length;
            console.log(`Found ${count2} elements with python UA.`);
            if (count2 > 0) {
                console.log("SUCCESS! Found episodes with Python UA.");
            }
        }

    } catch (e) {
        console.error(e);
    }
})();
