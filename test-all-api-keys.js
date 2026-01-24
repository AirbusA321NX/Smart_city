/**
 * API Key Testing Script
 * Tests all API keys to see which are working and which are being used
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// API Keys from .env
const API_KEYS = {
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    NEWS_DATA_API_KEY: process.env.NEWS_DATA_API_KEY,
    MEDIASTACK_API_KEY: process.env.MEDIASTACK_API_KEY,
    GNEWS_API_KEY: process.env.GNEWS_API_KEY,
    CURRENTS_API_KEY: process.env.CURRENTS_API_KEY,
    NEWSCATCHER_API_KEY: process.env.NEWSCATCHER_API_KEY,
    CONTEXTUALWEB_API_KEY: process.env.CONTEXTUALWEB_API_KEY,
    BING_NEWS_API_KEY: process.env.BING_NEWS_API_KEY,
    APIFY_API_KEY: process.env.APIFY_API_KEY,
    EVENTREGISTRY_API_KEY: process.env.EVENTREGISTRY_API_KEY,
    GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
};

// Test results
const results = {
    working: [],
    notWorking: [],
    placeholder: [],
    notUsed: []
};

console.log(`${colors.cyan}========================================`);
console.log(`API KEY TESTING REPORT`);
console.log(`========================================${colors.reset}\n`);

/**
 * Test Geoapify API
 */
async function testGeoapify() {
    const key = API_KEYS.GEOAPIFY_API_KEY;
    if (!key || key.includes('YOUR_')) {
        return { status: 'placeholder', message: 'Placeholder key' };
    }

    try {
        const response = await axios.get(
            `https://api.geoapify.com/v1/geocode/search?text=Delhi&format=json&apiKey=${key}`,
            { timeout: 5000 }
        );
        
        if (response.status === 200 && response.data.results) {
            return { status: 'working', message: `✓ Working - Found ${response.data.results.length} results` };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (error) {
        if (error.response?.status === 401) {
            return { status: 'error', message: '401 Unauthorized - Invalid key' };
        }
        return { status: 'error', message: error.message };
    }
}

/**
 * Test Gemini API
 */
async function testGemini() {
    const key = API_KEYS.GEMINI_API_KEY;
    if (!key || key.includes('YOUR_')) {
        return { status: 'placeholder', message: 'Placeholder key' };
    }

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
            {
                contents: [{
                    parts: [{ text: 'Say hello' }]
                }]
            },
            { timeout: 10000 }
        );
        
        if (response.status === 200 && response.data.candidates) {
            return { status: 'working', message: '✓ Working - API responding correctly' };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (error) {
        if (error.response?.status === 400) {
            return { status: 'error', message: '400 Bad Request - Check API key or model name' };
        }
        if (error.response?.status === 403) {
            return { status: 'error', message: '403 Forbidden - Invalid key or quota exceeded' };
        }
        return { status: 'error', message: error.message };
    }
}

/**
 * Test GNews API
 */
async function testGNews() {
    const key = API_KEYS.GNEWS_API_KEY;
    if (!key || key.includes('YOUR_')) {
        return { status: 'placeholder', message: 'Placeholder key' };
    }

    try {
        const response = await axios.get(
            `https://gnews.io/api/v4/search?q=india&token=${key}&lang=en&max=1`,
            { timeout: 5000 }
        );
        
        if (response.status === 200 && response.data.articles) {
            return { status: 'working', message: `✓ Working - Found ${response.data.articles.length} articles` };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (error) {
        if (error.response?.status === 400) {
            return { status: 'error', message: '400 Bad Request - Invalid key or query' };
        }
        if (error.response?.status === 403) {
            return { status: 'error', message: '403 Forbidden - Invalid key or quota exceeded' };
        }
        return { status: 'error', message: error.message };
    }
}

/**
 * Test NewsData API
 */
async function testNewsData() {
    const key = API_KEYS.NEWS_DATA_API_KEY;
    if (!key || key.includes('YOUR_')) {
        return { status: 'placeholder', message: 'Placeholder key' };
    }

    try {
        const response = await axios.get(
            `https://newsdata.io/api/1/news?apikey=${key}&country=in&language=en&size=1`,
            { timeout: 5000 }
        );
        
        if (response.status === 200 && response.data.results) {
            return { status: 'working', message: `✓ Working - Found ${response.data.results.length} articles` };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (error) {
        if (error.response?.status === 401) {
            return { status: 'error', message: '401 Unauthorized - Invalid key' };
        }
        if (error.response?.status === 403) {
            return { status: 'error', message: '403 Forbidden - Quota exceeded' };
        }
        return { status: 'error', message: error.message };
    }
}

/**
 * Test Currents API
 */
async function testCurrents() {
    const key = API_KEYS.CURRENTS_API_KEY;
    if (!key || key.includes('YOUR_')) {
        return { status: 'placeholder', message: 'Placeholder key' };
    }

    try {
        const response = await axios.get(
            `https://api.currentsapi.services/v1/latest-news?apiKey=${key}&country=IN&language=en`,
            { timeout: 5000 }
        );
        
        if (response.status === 200 && response.data.news) {
            return { status: 'working', message: `✓ Working - Found ${response.data.news.length} articles` };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (error) {
        if (error.response?.status === 401) {
            return { status: 'error', message: '401 Unauthorized - Invalid key' };
        }
        return { status: 'error', message: error.message };
    }
}

/**
 * Test Mistral API
 */
async function testMistral() {
    const key = API_KEYS.MISTRAL_API_KEY;
    if (!key || key.includes('YOUR_')) {
        return { status: 'placeholder', message: 'Placeholder key' };
    }

    try {
        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: 'mistral-tiny',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        if (response.status === 200 && response.data.choices) {
            return { status: 'working', message: '✓ Working - API responding correctly' };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (error) {
        if (error.response?.status === 401) {
            return { status: 'error', message: '401 Unauthorized - Invalid key' };
        }
        if (error.response?.status === 403) {
            return { status: 'error', message: '403 Forbidden - Invalid key or quota exceeded' };
        }
        return { status: 'error', message: error.message };
    }
}

/**
 * Check if API is used in code
 */
function checkAPIUsage() {
    const fs = require('fs');
    const usageMap = {};

    // Files to check
    const filesToCheck = ['server.js', 'app.js', 'crawler.js', 'mistral-api.js', 'gemini-integration.js'];

    Object.keys(API_KEYS).forEach(keyName => {
        usageMap[keyName] = false;
        
        filesToCheck.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes(keyName) || content.includes(keyName.toLowerCase())) {
                    usageMap[keyName] = true;
                }
            } catch (error) {
                // File doesn't exist, skip
            }
        });
    });

    return usageMap;
}

/**
 * Main test function
 */
async function runTests() {
    console.log(`${colors.blue}Testing API Keys...${colors.reset}\n`);

    const tests = [
        { name: 'Geoapify (Geocoding)', key: 'GEOAPIFY_API_KEY', test: testGeoapify },
        { name: 'Gemini AI', key: 'GEMINI_API_KEY', test: testGemini },
        { name: 'GNews', key: 'GNEWS_API_KEY', test: testGNews },
        { name: 'NewsData.io', key: 'NEWS_DATA_API_KEY', test: testNewsData },
        { name: 'Currents API', key: 'CURRENTS_API_KEY', test: testCurrents },
        { name: 'Mistral AI', key: 'MISTRAL_API_KEY', test: testMistral }
    ];

    // Check usage in code
    console.log(`${colors.cyan}Checking API usage in code...${colors.reset}\n`);
    const usageMap = checkAPIUsage();

    for (const { name, key, test } of tests) {
        const keyValue = API_KEYS[key];
        const isUsed = usageMap[key];
        
        process.stdout.write(`Testing ${name}... `);

        if (!keyValue) {
            console.log(`${colors.yellow}⚠ Not configured${colors.reset}`);
            results.placeholder.push({ name, key, message: 'Not configured in .env' });
            continue;
        }

        if (keyValue.includes('YOUR_')) {
            console.log(`${colors.yellow}⚠ Placeholder${colors.reset}`);
            results.placeholder.push({ name, key, message: 'Placeholder value' });
            continue;
        }

        try {
            const result = await test();
            
            if (result.status === 'working') {
                console.log(`${colors.green}${result.message}${colors.reset}`);
                results.working.push({ name, key, message: result.message, used: isUsed });
            } else if (result.status === 'placeholder') {
                console.log(`${colors.yellow}⚠ ${result.message}${colors.reset}`);
                results.placeholder.push({ name, key, message: result.message });
            } else {
                console.log(`${colors.red}✗ ${result.message}${colors.reset}`);
                results.notWorking.push({ name, key, message: result.message, used: isUsed });
            }
        } catch (error) {
            console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
            results.notWorking.push({ name, key, message: error.message, used: isUsed });
        }
    }

    // Check for unused APIs
    Object.keys(API_KEYS).forEach(key => {
        if (!usageMap[key] && API_KEYS[key] && !API_KEYS[key].includes('YOUR_')) {
            const apiName = key.replace('_API_KEY', '').replace(/_/g, ' ');
            results.notUsed.push({ name: apiName, key });
        }
    });

    // Print summary
    console.log(`\n${colors.cyan}========================================`);
    console.log(`SUMMARY`);
    console.log(`========================================${colors.reset}\n`);

    console.log(`${colors.green}✓ Working APIs (${results.working.length}):${colors.reset}`);
    results.working.forEach(api => {
        const usageStatus = api.used ? '(USED IN CODE)' : '(NOT USED)';
        console.log(`  • ${api.name} ${colors.cyan}${usageStatus}${colors.reset}`);
    });

    console.log(`\n${colors.red}✗ Not Working APIs (${results.notWorking.length}):${colors.reset}`);
    results.notWorking.forEach(api => {
        const usageStatus = api.used ? '(USED IN CODE)' : '(NOT USED)';
        console.log(`  • ${api.name} ${colors.cyan}${usageStatus}${colors.reset} - ${api.message}`);
    });

    console.log(`\n${colors.yellow}⚠ Placeholder/Not Configured (${results.placeholder.length}):${colors.reset}`);
    results.placeholder.forEach(api => {
        console.log(`  • ${api.name} - ${api.message}`);
    });

    if (results.notUsed.length > 0) {
        console.log(`\n${colors.blue}ℹ APIs Not Used in Code (${results.notUsed.length}):${colors.reset}`);
        results.notUsed.forEach(api => {
            console.log(`  • ${api.name}`);
        });
    }

    console.log(`\n${colors.cyan}========================================${colors.reset}\n`);

    // Recommendations
    console.log(`${colors.yellow}RECOMMENDATIONS:${colors.reset}\n`);
    
    if (results.notWorking.length > 0) {
        console.log(`${colors.red}1. Fix or replace non-working API keys:${colors.reset}`);
        results.notWorking.forEach(api => {
            if (api.used) {
                console.log(`   • ${api.name} - Currently used in code but not working!`);
            }
        });
    }

    if (results.placeholder.length > 0) {
        console.log(`\n${colors.yellow}2. Configure placeholder API keys if needed:${colors.reset}`);
        results.placeholder.forEach(api => {
            console.log(`   • ${api.name}`);
        });
    }

    if (results.notUsed.length > 0) {
        console.log(`\n${colors.blue}3. Consider removing unused API keys from .env:${colors.reset}`);
        results.notUsed.forEach(api => {
            console.log(`   • ${api.key}`);
        });
    }

    console.log('\n');
}

// Run the tests
runTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});
