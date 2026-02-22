const https = require('https');
https.get('https://synergism.cc/', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const matches = data.match(/<script[^>]+src=["']([^"']+)["']/g);
        console.log(matches);
    });
});