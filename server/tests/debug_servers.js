const axios = require('axios');

const url = "https://witanime.you/episode/boruto-naruto-next-generations-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1/";

// XOR decode function (similar to the one we used for links)
function xorDecode(hexStr, secret) {
    const bytes = [];
    for (let i = 0; i < hexStr.length; i += 2) {
        bytes.push(parseInt(hexStr.substr(i, 2), 16));
    }

    let out = '';
    for (let i = 0; i < bytes.length; i++) {
        out += String.fromCharCode(bytes[i] ^ secret.charCodeAt(i % secret.length));
    }
    return out;
}

function decodeServers(html) {
    // Extract the encoded data
    const _zGMatch = html.match(/var _zG="(.*?)";/);
    const _zHMatch = html.match(/var _zH="(.*?)";/);

    if (!_zGMatch || !_zHMatch) {
        console.log("Could not find server data");
        return null;
    }

    // First level: base64 decode to get array
    const resourceArray = JSON.parse(Buffer.from(_zGMatch[1], 'base64').toString());
    const configArray = JSON.parse(Buffer.from(_zHMatch[1], 'base64').toString());

    console.log("Resource Array:", resourceArray);
    console.log("\nConfig Array:", configArray);

    // Now decode each resource using the config
    const servers = [];

    for (let i = 0; i < resourceArray.length && i < configArray.length; i++) {
        const resource = resourceArray[i];
        const config = configArray[i];

        // Decode the resource string
        const key = Buffer.from(config.k, 'base64').toString();
        console.log(`\n=== Server ${i} ===`);
        console.log(`Key: "${key}"`);
        console.log(`Encoded: "${resource}"`);

        // The resource is XOR encoded with the key
        const decoded = xorDecode(Buffer.from(resource, 'utf8').toString('hex'), key);
        console.log(`Decoded: "${decoded}"`);

        servers.push({
            url: decoded,
            config: config
        });
    }

    return servers;
}

(async () => {
    try {
        console.log(`Fetching ${url} ...\n`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const servers = decodeServers(data);

        if (servers) {
            console.log("\n\n===== FINAL STREAMING SERVERS =====");
            servers.forEach((server, idx) => {
                console.log(`Server ${idx}: ${server.url}`);
            });
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
