const axios = require('axios');

const url = "https://witanime.you/episode/boruto-naruto-next-generations-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1/";

function decodeServer(resourceData, configSettings) {
    // Step 1: Reverse the string
    resourceData = resourceData.split('').reverse().join('');

    // Step 2: Clean non-base64 characters
    resourceData = resourceData.replace(/[^A-Za-z0-9+/=]/g, '');

    // Step 3: Get the offset from config
    const indexKey = Buffer.from(configSettings.k, 'base64').toString();
    const paramOffset = configSettings.d[parseInt(indexKey, 10)];

    // Step 4: Base64 decode and slice off the padding
    const decodedResource = Buffer.from(resourceData, 'base64').toString().slice(0, -paramOffset);

    return decodedResource;
}

(async () => {
    try {
        console.log(`Fetching ${url} ...\\n`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Extract the encoded data
        const _zGMatch = data.match(/var _zG="(.*?)";/);
        const _zHMatch = data.match(/var _zH="(.*?)";/);

        if (!_zGMatch || !_zHMatch) {
            console.log("Could not find server data");
            return;
        }

        // Decode the arrays
        const resourceArray = JSON.parse(Buffer.from(_zGMatch[1], 'base64').toString());
        const configArray = JSON.parse(Buffer.from(_zHMatch[1], 'base64').toString());

        console.log("\n===== STREAMING SERVERS =====");

        for (let i = 0; i < resourceArray.length && i < configArray.length; i++) {
            const url = decodeServer(resourceArray[i], configArray[i]);
            console.log(`Server ${i}: ${url}`);
        }

    } catch (e) {
        console.error("Error:", e.message);
        console.error(e.stack);
    }
})();
