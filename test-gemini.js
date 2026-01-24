/**
 * Test Gemini API Integration
 * Run: node test-gemini.js
 */

require('dotenv').config();
const GeminiIntegration = require('./gemini-integration');

async function testGemini() {
    console.log('🧪 Testing Gemini API Integration...\n');
    
    const gemini = new GeminiIntegration(process.env.GEMINI_API_KEY);
    
    console.log('✅ Gemini API Key:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Missing');
    console.log('✅ Model:', gemini.model);
    console.log('\n📝 Testing text sentiment analysis...\n');
    
    const testText = `
    Mumbai sees improvement in safety measures. 
    Police have increased patrols in key areas.
    Citizens report feeling more secure.
    Crime rates have decreased by 15% this month.
    `;
    
    try {
        const result = await gemini.analyzeTextSentiment(testText, 'Mumbai');
        
        console.log('✅ Analysis Result:');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n🎉 Gemini API integration successful!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testGemini();
