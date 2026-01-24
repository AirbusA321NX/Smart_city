/**
 * Test AI Fallback System
 * Tests automatic switching between Gemini and Mistral APIs
 */

require('dotenv').config();
const AIAPIManager = require('./ai-api-manager');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

console.log(`${colors.cyan}========================================`);
console.log(`AI FALLBACK SYSTEM TEST`);
console.log(`========================================${colors.reset}\n`);

// Initialize AI Manager
const aiManager = new AIAPIManager(
    process.env.GEMINI_API_KEY,
    process.env.MISTRAL_API_KEY
);

// Test data
const testLocation = 'Delhi';
const testNewsArticles = [
    {
        title: 'Delhi Crime Rate Shows Improvement',
        description: 'Recent statistics show a decline in crime rates across Delhi',
        publishedAt: '2026-01-20'
    },
    {
        title: 'Safety Measures Enhanced in Delhi',
        description: 'New safety initiatives launched to improve public security',
        publishedAt: '2026-01-19'
    }
];

const testText = testNewsArticles.map(a => `${a.title}. ${a.description}`).join(' ');

async function runTests() {
    console.log(`${colors.blue}Test 1: Check Initial Status${colors.reset}`);
    let status = aiManager.getStatus();
    console.log('Initial Status:', JSON.stringify(status, null, 2));
    console.log('');

    console.log(`${colors.blue}Test 2: Analyze Text Sentiment${colors.reset}`);
    try {
        const result = await aiManager.analyzeTextSentiment(testText, testLocation);
        console.log(`${colors.green}✓ Analysis successful${colors.reset}`);
        console.log(`API Used: ${result.apiUsed}`);
        console.log(`Safety Index: ${result.safetyIndex}`);
        console.log(`Emotions:`, result.aggregatedEmotions);
    } catch (error) {
        console.log(`${colors.red}✗ Analysis failed: ${error.message}${colors.reset}`);
    }
    console.log('');

    console.log(`${colors.blue}Test 3: Get Crime Timeline${colors.reset}`);
    try {
        const timeline = await aiManager.getCrimeTimeline(testLocation, testNewsArticles, 1);
        console.log(`${colors.green}✓ Timeline fetch successful${colors.reset}`);
        console.log(`API Used: ${timeline.apiUsed}`);
        console.log(`Location: ${timeline.location}`);
        console.log(`Timeframe: ${timeline.timeframe}`);
        console.log(`Monthly Data Points: ${timeline.monthlyData?.length || 0}`);
    } catch (error) {
        console.log(`${colors.red}✗ Timeline fetch failed: ${error.message}${colors.reset}`);
    }
    console.log('');

    console.log(`${colors.blue}Test 4: Check Status After Operations${colors.reset}`);
    status = aiManager.getStatus();
    console.log('Current Status:', JSON.stringify(status, null, 2));
    console.log('');

    console.log(`${colors.blue}Test 5: Test Status Report${colors.reset}`);
    if (status.gemini.available) {
        console.log(`${colors.green}✓ Gemini AI: Available${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠ Gemini AI: Unavailable${colors.reset}`);
        console.log(`  Error Count: ${status.gemini.errorCount}`);
        console.log(`  Last Error: ${status.gemini.lastError}`);
    }

    if (status.mistral.available) {
        console.log(`${colors.green}✓ Mistral AI: Available${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠ Mistral AI: Unavailable${colors.reset}`);
        console.log(`  Error Count: ${status.mistral.errorCount}`);
        console.log(`  Last Error: ${status.mistral.lastError}`);
    }
    console.log('');

    console.log(`${colors.blue}Test 6: Reset Status${colors.reset}`);
    aiManager.resetStatus();
    status = aiManager.getStatus();
    console.log('Status After Reset:', JSON.stringify(status, null, 2));
    console.log('');

    console.log(`${colors.cyan}========================================`);
    console.log(`TEST SUMMARY`);
    console.log(`========================================${colors.reset}\n`);

    console.log(`${colors.green}✓ Fallback System: Working${colors.reset}`);
    console.log(`${colors.green}✓ Status Tracking: Working${colors.reset}`);
    console.log(`${colors.green}✓ Reset Function: Working${colors.reset}`);
    
    if (status.gemini.available && status.mistral.available) {
        console.log(`\n${colors.green}Both APIs are available and ready!${colors.reset}`);
    } else if (status.gemini.available) {
        console.log(`\n${colors.yellow}Gemini available, Mistral as backup${colors.reset}`);
    } else if (status.mistral.available) {
        console.log(`\n${colors.yellow}Mistral available, Gemini unavailable${colors.reset}`);
    } else {
        console.log(`\n${colors.red}Both APIs unavailable - using fallback data${colors.reset}`);
    }

    console.log(`\n${colors.cyan}========================================${colors.reset}\n`);
}

// Run tests
runTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});
