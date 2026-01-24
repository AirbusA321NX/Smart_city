// Test Geoapify API Key
const https = require('https');

const API_KEY = 'ca590133e3034461b4b4e03d15dafe76';
const testUrl = `https://api.geoapify.com/v1/geocode/search?text=Delhi&format=json&apiKey=${API_KEY}`;

console.log('Testing Geoapify API key...\n');

https.get(testUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
            console.log('✅ SUCCESS! API key is valid and working!\n');
            const result = JSON.parse(data);
            if (result.results && result.results.length > 0) {
                console.log('Sample result:');
                console.log(`  Location: ${result.results[0].formatted}`);
                console.log(`  Coordinates: ${result.results[0].lat}, ${result.results[0].lon}`);
            }
        } else if (res.statusCode === 401) {
            console.log('❌ FAILED! API key is invalid (401 Unauthorized)');
        } else {
            console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
            console.log('Response:', data);
        }
    });
}).on('error', (err) => {
    console.error('❌ Error making request:', err.message);
});
