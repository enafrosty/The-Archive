const fs = require('fs');

function decodeEpisodeData(encoded) {
    const parts = encoded.split('.');
    if (parts.length < 2) return null;

    const p1 = Buffer.from(parts[0], 'base64').toString('binary');
    const key = Buffer.from(parts[1], 'base64').toString('binary');

    let decoded = '';
    for (let i = 0; i < p1.length; i++) {
        decoded += String.fromCharCode(p1.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }

    try {
        return JSON.parse(decoded);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return null;
    }
}

const html = fs.readFileSync('debug.html', 'utf8');
const match = html.match(/var processedEpisodeData = '(.*?)'/);

if (match) {
    console.log("Found processedEpisodeData!");
    const encoded = match[1];
    console.log("Encoded length:", encoded.length);
    const episodes = decodeEpisodeData(encoded);
    if (episodes) {
        console.log("Success! Found", episodes.length, "episodes.");
        console.log("First episode:", episodes[0]);
    } else {
        console.log("Failed to decode.");
    }
} else {
    console.log("Could not find processedEpisodeData in html.");
}
