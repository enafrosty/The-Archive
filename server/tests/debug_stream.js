const axios = require('axios');
const fs = require('fs');

const url = "https://witanime.you/episode/boruto-naruto-next-generations-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1/";

(async () => {
    try {
        console.log(`Fetching ${url} ...`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        fs.writeFileSync('debug_stream.html', data);
        console.log("Saved to debug_stream.html");

    } catch (e) {
        console.error(e);
    }
})();
