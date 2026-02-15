const axios = require('axios');

async function testApi() {
    try {
        console.log('Testing /api/home...');
        const homeRes = await axios.get('http://localhost:5000/api/home');
        console.log('Home Data Keys:', Object.keys(homeRes.data));
        console.log('Trending Count:', homeRes.data.trending?.length);
        if (homeRes.data.trending?.length > 0) {
            console.log('First Trending Item:', homeRes.data.trending[0]);
        }

        console.log('\nTesting /api/users/1/continue-watching...');
        const historyRes = await axios.get('http://localhost:5000/api/users/1/continue-watching');
        console.log('History Count:', historyRes.data.length);
        if (historyRes.data.length > 0) {
            console.log('First History Item:', historyRes.data[0]);
        }
    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testApi();
