const https = require('https');
https.get('https://synergism.cc/dist/out.js', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const findFunctionBodyContaining = (src, headerRegex, anchorStr, windowSize = 1500) => {
            const re = new RegExp(headerRegex.source, 'g');
            let m;
            while ((m = re.exec(src)) !== null) {
                const bodyStart = m.index + m[0].length;
                const slice = src.slice(bodyStart, bodyStart + windowSize);
                if (slice.includes(anchorStr)) return { bodyStart, match: m };
            }
            return null;
        };
        const res = findFunctionBodyContaining(data, /([a-zA-Z_$][\w$]*)\s*=\s*async\s*\([^)]*!0[^)]*\)\s*=>\s*\{/, '"Synergysave2"');
        if (res) {
            console.log(res.match[0]);
            console.log(res.match[1]);
        } else {
            console.log('null');
        }
    });
});
