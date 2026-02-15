const axios = require('axios');
const cheerio = require('cheerio');

const url = "https://witanime.you/episode/boruto-naruto-next-generations-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-1/";

function toArray(str) {
    const bytes = new Uint8Array(str.length / 2);
    for (let i = 0; i < str.length; i += 2) {
        bytes[i / 2] = parseInt(str.substr(i, 2), 16);
    }
    return bytes;
}

function process(raw, secret) {
    let out = '';
    const data = toArray(raw);
    const keylen = secret.length;

    for (let i = 0; i < data.length; i++) {
        out += String.fromCharCode(data[i] ^ secret.charCodeAt(i % keylen));
    }

    return out;
}

function extractLinks(html) {
    // Extract the global variables from the HTML
    const _mMatch = html.match(/var _m = ({.*?});/);
    const _p0Match = html.match(/var _p0 = (\[.*?\]);/);
    const _p1Match = html.match(/var _p1 = (\[.*?\]);/);
    const _sMatch = html.match(/var _s = (\[.*?\]);/);
    const _tMatch = html.match(/var _t = ({.*?});/);

    if (!_mMatch || !_p0Match || !_p1Match || !_sMatch || !_tMatch) {
        console.log("Could not find required variables");
        return {};
    }

    const _m = JSON.parse(_mMatch[1]);
    const _p0 = JSON.parse(_p0Match[1]);
    const _p1 = JSON.parse(_p1Match[1]);
    const _s = JSON.parse(_sMatch[1]);
    const _t = JSON.parse(_tMatch[1]);

    const secret = Buffer.from(_m.r, 'base64').toString();
    console.log("Secret:", secret);

    const count = parseInt(_t.l);
    const cache = [];

    for (let i = 0; i < count; i++) {
        const chunks = i === 0 ? _p0 : _p1;
        const seqRaw = _s[i];
        const seq = JSON.parse(process(seqRaw, secret));

        const decrypted = chunks.map(chunk => process(chunk, secret));

        const arranged = [];
        for (let j = 0; j < seq.length; j++) {
            arranged[seq[j]] = decrypted[j];
        }

        const final = arranged.join('');
        cache[i] = final;
    }

    return cache;
}

(async () => {
    try {
        console.log(`Fetching ${url} ...`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const links = extractLinks(data);
        console.log("\n===== EXTRACTED LINKS =====");
        links.forEach((link, idx) => {
            console.log(`Link ${idx}:`, link);
        });

    } catch (e) {
        console.error(e);
    }
})();
