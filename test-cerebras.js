/**
 * Test Cerebras API Integration
 * Tests the Cerebras API for location verification and sentiment analysis
 */

require('dotenv').config();
const AIAPIManager = require('./ai-api-manager');

async function testCerebrasAPI() {
    console.log('=== Testing Cerebras API Integration ===\n');

    // Initialize AI Manager with Cerebras
    const aiManager = new AIAPIManager(
        process.env.GEMINI_API_KEY,
        process.env.MISTRAL_API_KEY,
        process.env.CEREBRAS_API_KEY
    );

    // Test 1: Location Verification
    console.log('Test 1: Location Verification');
    console.log('Testing location: "New York, USA"');
    try {
        const locationResult = await aiManager.verifyLocation('New York, USA');
        console.log('✓ Location verification result:', JSON.stringify(locationResult, null, 2));
    } catch (error) {
        console.error('✗ Location verification failed:', error.message);
    }

    console.log('\n---\n');

    // Test 2: Sentiment Analysis
    console.log('Test 2: Sentiment Analysis');
    const testArticles = [
        {
            title: 'Crime Rate Drops in Downtown Area',
            description: 'Local police report a 15% decrease in theft incidents this month.',
            publishedAt: '2025-01-20'
        },
        {
            title: 'Assault Reported Near Central Park',
            description: 'An assault incident was reported yesterday evening near the park entrance.',
            publishedAt: '2025-01-19'
        }
    ];

    const testText = testArticles.map(a => `${a.title}\n${a.description}`).join('\n\n');

    try {
        const analysisResult = await aiManager.analyzeTextSentiment(
            testText,
            'New York, USA',
            { articles: testArticles }
        );
        console.log('✓ Sentiment analysis result:');
        console.log(`  - API Used: ${analysisResult.apiUsed}`);
        console.log(`  - Safety Index: ${analysisResult.safetyIndex}`);
        console.log(`  - Emotions:`, analysisResult.aggregatedEmotions);
    } catch (error) {
        console.error('✗ Sentiment analysis failed:', error.message);
    }

    console.log('\n---\n');

    // Test 3: Crime Timeline
    console.log('Test 3: Crime Timeline');
    try {
        const timelineResult = await aiManager.getCrimeTimeline(
            'New York, USA',
            testArticles,
            1
        );
        console.log('✓ Crime timeline result:');
        console.log(`  - API Used: ${timelineResult.apiUsed}`);
        console.log(`  - Location: ${timelineResult.location}`);
        console.log(`  - Timeframe: ${timelineResult.timeframe}`);
        console.log(`  - Monthly Data:`, timelineResult.monthlyData?.length || 0, 'months');
    } catch (error) {
        console.error('✗ Crime timeline failed:', error.message);
    }

    console.log('\n---\n');

    // Test 4: API Status
    console.log('Test 4: API Status Check');
    const status = aiManager.getStatus();
    console.log('API Status:');
    console.log('  - Cerebras:', status.cerebras.available ? '✓ Available' : '✗ Unavailable');
    console.log('  - Mistral:', status.mistral.available ? '✓ Available' : '✗ Unavailable');
    console.log('  - Gemini:', status.gemini.available ? '✓ Available' : '✗ Unavailable');
    console.log('  - Fallback Enabled:', status.fallbackEnabled);

    console.log('\n=== Test Complete ===');
}

// Run the test
testCerebrasAPI().catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
});
