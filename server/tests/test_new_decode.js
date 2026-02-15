const _m1 = "1c0f", _m2 = "3441-e3c2-", _m3 = "4023-9e8b-", _m4 = "bee77ff59adf";
const FRAMEWORK_HASH = _m1 + _m2 + _m3 + _m4;

function decodeServerUrl(resourceData, configSettings) {
    // Step 1: Reverse the string
    resourceData = resourceData.split('').reverse().join('');

    // Step 2: Clean non-base64 characters
    resourceData = resourceData.replace(/[^A-Za-z0-9+/=]/g, '');

    // Step 3: Get the offset from config
    const indexKey = Buffer.from(configSettings.k, 'base64').toString();
    const paramOffset = configSettings.d[parseInt(indexKey, 10)];

    // Step 4: Base64 decode and slice off the padding
    const decodedResource = Buffer.from(resourceData, 'base64').toString().slice(0, -paramOffset);

    // Step 5: Add API Key if needed
    const resourcePattern = /^https:\/\/yonaplay\.net\/embed\.php\?id=\d+$/;
    const resolvedResource = resourcePattern.test(decodedResource) ?
        decodedResource + "&apiKey=" + FRAMEWORK_HASH : decodedResource;

    return resolvedResource;
}

const resourceArray = [
    'i^FjM&0g!DNlNm^Z5AjN*zc@TPk!l2Pw~h!GcuQW&Z^i1WZ&vQX*Zu~5Sehx&Gch52*b5%9yL!6MHc%0^RHa',
    '==gZ&i^FWNy!IGM%1E^TNKxG#V5smW^ER*GZ0~gmax^J@zMX1j!d&/IXZ&5FG%bw#9Sdo5!SYlRW^a2~9yL^6MHc@0#RHa'
];

const configArray = [
    {
        d: [88, 84, 26, 28, 77, 85, 39, 73, 38, 10],
        k: 'OQ==',
        v: 'MzIzNg=='
    },
    {
        d: [86, 84, 10, 35, 32, 57, 55, 86, 29, 38],
        k: 'Mg==',
        v: 'NDk0MA=='
    }
];

console.log("Decoding servers...");
for (let i = 0; i < resourceArray.length; i++) {
    try {
        const url = decodeServerUrl(resourceArray[i], configArray[i]);
        console.log(`Server ${i}: ${url}`);
    } catch (e) {
        console.error(`Error decoding server ${i}:`, e.message);
    }
}
