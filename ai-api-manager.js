/**
 * AI API Manager with Automatic Fallback
 * Manages Gemini and Mistral APIs with automatic failover
 */

const GeminiIntegration = require('./gemini-integration');
const axios = require('axios');
const SimpleAnalyzer = require('./simple-analyzer');

class AIAPIManager {
    constructor(geminiKey, mistralKey) {
        this.gemini = new GeminiIntegration(geminiKey);
        this.mistralKey = mistralKey;
        this.mistralBaseUrl = 'https://api.mistral.ai/v1/chat/completions';
        this.simpleAnalyzer = new SimpleAnalyzer();
        
        // Track API status
        this.apiStatus = {
            gemini: { available: true, lastError: null, errorCount: 0 },
            mistral: { available: true, lastError: null, errorCount: 0 }
        };
        
        // Fallback settings
        this.maxRetries = 2;
        this.fallbackEnabled = true;
        
        console.log('AI API Manager initialized with Gemini (primary), Mistral (fallback), and Simple Analyzer (last resort)');
    }

    /**
     * Analyze text sentiment with automatic fallback
     */
    async analyzeTextSentiment(text, location, options = {}) {
        // Store articles for simple analyzer fallback
        this.lastArticles = options.articles || [];
        
        // Try Gemini first
        try {
            console.log('Attempting analysis with Gemini AI...');
            const result = await this.gemini.analyzeTextSentiment(text, location, options);
            
            // Reset error count on success
            this.apiStatus.gemini.errorCount = 0;
            this.apiStatus.gemini.available = true;
            
            console.log('✓ Gemini AI analysis successful');
            return { ...result, apiUsed: 'gemini' };
            
        } catch (error) {
            console.warn('Gemini AI failed:', error.message);
            this.apiStatus.gemini.lastError = error.message;
            this.apiStatus.gemini.errorCount++;
            
            // Check if it's a rate limit error
            if (error.response?.status === 429 || error.message.includes('429')) {
                console.log('⚠️  Gemini API rate limit hit - switching to Mistral...');
                this.apiStatus.gemini.available = false;
            }
            
            // Fallback to Mistral
            if (this.fallbackEnabled) {
                return await this.analyzeWithMistral(text, location, options);
            } else {
                throw error;
            }
        }
    }

    /**
     * Get crime timeline with automatic fallback
     */
    async getCrimeTimeline(location, newsArticles, months = 1) {
        // Store articles for simple analyzer fallback
        this.lastArticles = newsArticles || [];
        
        // Try Gemini first
        try {
            console.log('Fetching crime timeline with Gemini AI...');
            const result = await this.gemini.getCrimeTimeline(location, newsArticles, months);
            
            // Reset error count on success
            this.apiStatus.gemini.errorCount = 0;
            this.apiStatus.gemini.available = true;
            
            console.log('✓ Gemini AI timeline successful');
            return { ...result, apiUsed: 'gemini' };
            
        } catch (error) {
            console.warn('Gemini AI timeline failed:', error.message);
            this.apiStatus.gemini.lastError = error.message;
            this.apiStatus.gemini.errorCount++;
            
            // Check if it's a rate limit error
            if (error.response?.status === 429 || error.message.includes('429')) {
                console.log('⚠️  Gemini API rate limit hit - switching to Mistral...');
                this.apiStatus.gemini.available = false;
            }
            
            // Fallback to Mistral
            if (this.fallbackEnabled) {
                return await this.getCrimeTimelineWithMistral(location, newsArticles, months);
            } else {
                throw error;
            }
        }
    }

    /**
     * Analyze with Mistral API
     */
    async analyzeWithMistral(text, location, options = {}) {
        try {
            console.log('Using Mistral AI as fallback...');
            
            const prompt = `
Analyze the emotional sentiment and safety metrics for ${location} based on these news articles:

${text}

Provide a comprehensive analysis in JSON format:
{
  "location": "${location}",
  "safetyIndex": number (0-100),
  "aggregatedEmotions": {
    "calm": percentage,
    "angry": percentage,
    "depressed": percentage,
    "fear": percentage,
    "happy": percentage
  },
  "crimeStats": {
    "theft": count,
    "assault": count,
    "harassment": count,
    "robbery": count,
    "vandalism": count,
    "other": count
  },
  "monthlyTrends": [],
  "currentPeriod": {
    "name": "current month",
    "totalCrimes": number,
    "status": "better/worse/same"
  }
}
`;

            const response = await axios.post(
                this.mistralBaseUrl,
                {
                    model: 'mistral-large-latest',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.mistralKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                const content = response.data.choices[0].message.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    
                    // Reset error count on success
                    this.apiStatus.mistral.errorCount = 0;
                    this.apiStatus.mistral.available = true;
                    
                    console.log('✓ Mistral AI analysis successful');
                    return { ...result, apiUsed: 'mistral' };
                }
            }
            
            throw new Error('Invalid response from Mistral API');
            
        } catch (error) {
            console.error('Mistral AI also failed:', error.message);
            this.apiStatus.mistral.lastError = error.message;
            this.apiStatus.mistral.errorCount++;
            
            // Use simple analyzer as last resort
            if (this.lastArticles && this.lastArticles.length > 0) {
                console.log('⚠️  Both AI APIs failed - using Simple Analyzer (keyword-based)');
                const result = this.simpleAnalyzer.analyze(this.lastArticles, location);
                return { ...result, apiUsed: 'simple-analyzer' };
            }
            
            // Return fallback data
            return this.getFallbackAnalysis(location);
        }
    }

    /**
     * Get crime timeline with Mistral API
     */
    async getCrimeTimelineWithMistral(location, newsArticles, months = 1) {
        try {
            console.log('Fetching crime timeline with Mistral AI...');
            
            const articlesText = newsArticles.map(a => 
                `Date: ${a.publishedAt || 'recent'}\nTitle: ${a.title}\nContent: ${a.description || ''}`
            ).join('\n\n');

            const prompt = `
Analyze crime patterns and trends for ${location} over the past ${months} month(s) based on these news articles:

${articlesText}

Provide a detailed monthly breakdown in JSON format:
{
  "location": "${location}",
  "timeframe": "${months} month(s)",
  "monthlyData": [
    {
      "month": "Month Year",
      "totalCrimes": number,
      "crimeBreakdown": {
        "theft": number,
        "assault": number,
        "harassment": number,
        "robbery": number,
        "vandalism": number,
        "other": number
      },
      "safetyIndex": number (0-100),
      "trend": "increasing/decreasing/stable",
      "peakHours": ["hour1", "hour2"],
      "safestHours": ["hour1", "hour2"]
    }
  ],
  "overallTrend": {
    "direction": "improving/worsening/stable",
    "percentageChange": number,
    "mostCommonCrime": "crime type",
    "leastCommonCrime": "crime type"
  },
  "currentMonth": {
    "name": "current month",
    "totalCrimes": number,
    "comparedToLastMonth": number (percentage),
    "status": "better/worse/same"
  },
  "recommendations": ["recommendation 1", "recommendation 2"]
}
`;

            const response = await axios.post(
                this.mistralBaseUrl,
                {
                    model: 'mistral-large-latest',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 3000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.mistralKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                const content = response.data.choices[0].message.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    
                    // Reset error count on success
                    this.apiStatus.mistral.errorCount = 0;
                    this.apiStatus.mistral.available = true;
                    
                    console.log('✓ Mistral AI timeline successful');
                    return { ...result, apiUsed: 'mistral' };
                }
            }
            
            throw new Error('Invalid response from Mistral API');
            
        } catch (error) {
            console.error('Mistral AI timeline also failed:', error.message);
            this.apiStatus.mistral.lastError = error.message;
            this.apiStatus.mistral.errorCount++;
            
            // Use simple analyzer as last resort
            if (this.lastArticles && this.lastArticles.length > 0) {
                console.log('⚠️  Both AI APIs failed - using Simple Analyzer for timeline');
                const result = this.simpleAnalyzer.analyze(this.lastArticles, location);
                return {
                    ...result.monthlyTrends[0],
                    monthlyData: result.monthlyTrends,
                    currentMonth: result.currentPeriod,
                    overallTrend: result.overallTrend || { direction: 'stable' },
                    recommendations: result.recommendations || [],
                    apiUsed: 'simple-analyzer'
                };
            }
            
            // Return fallback timeline
            return this.getFallbackTimeline(location, months);
        }
    }

    /**
     * Get fallback analysis when both APIs fail
     */
    getFallbackAnalysis(location) {
        console.log('⚠️ Using fallback data - both APIs unavailable');
        
        return {
            location: location,
            safetyIndex: 50,
            aggregatedEmotions: {
                calm: 20,
                angry: 20,
                depressed: 20,
                fear: 20,
                happy: 20
            },
            crimeStats: {
                theft: 0,
                assault: 0,
                harassment: 0,
                robbery: 0,
                vandalism: 0,
                other: 0
            },
            monthlyTrends: [],
            currentPeriod: {
                name: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                totalCrimes: 0,
                status: 'unknown'
            },
            apiUsed: 'fallback',
            warning: 'Both AI APIs are currently unavailable. Showing default data.'
        };
    }

    /**
     * Get fallback timeline when both APIs fail
     */
    getFallbackTimeline(location, months) {
        console.log('⚠️ Using fallback timeline - both APIs unavailable');
        
        const currentDate = new Date();
        const monthlyData = [];
        
        for (let i = 0; i < months; i++) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);
            
            monthlyData.push({
                month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
                totalCrimes: 0,
                crimeBreakdown: {
                    theft: 0,
                    assault: 0,
                    harassment: 0,
                    robbery: 0,
                    vandalism: 0,
                    other: 0
                },
                safetyIndex: 50,
                trend: 'stable',
                peakHours: ['Unknown'],
                safestHours: ['Unknown']
            });
        }
        
        return {
            location: location,
            timeframe: `${months} month(s)`,
            monthlyData: monthlyData.reverse(),
            overallTrend: {
                direction: 'stable',
                percentageChange: 0,
                mostCommonCrime: 'Unknown',
                leastCommonCrime: 'Unknown'
            },
            currentMonth: {
                name: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                totalCrimes: 0,
                comparedToLastMonth: 0,
                status: 'unknown'
            },
            recommendations: ['Data unavailable - both AI APIs are currently unavailable'],
            apiUsed: 'fallback',
            warning: 'Both AI APIs are currently unavailable. Showing default data.'
        };
    }

    /**
     * Get API status report
     */
    getStatus() {
        return {
            gemini: {
                available: this.apiStatus.gemini.available,
                errorCount: this.apiStatus.gemini.errorCount,
                lastError: this.apiStatus.gemini.lastError
            },
            mistral: {
                available: this.apiStatus.mistral.available,
                errorCount: this.apiStatus.mistral.errorCount,
                lastError: this.apiStatus.mistral.lastError
            },
            fallbackEnabled: this.fallbackEnabled
        };
    }

    /**
     * Reset API status (useful after quota resets)
     */
    resetStatus() {
        this.apiStatus.gemini = { available: true, lastError: null, errorCount: 0 };
        this.apiStatus.mistral = { available: true, lastError: null, errorCount: 0 };
        console.log('API status reset - both APIs marked as available');
    }

    /**
     * Enable/disable fallback
     */
    setFallbackEnabled(enabled) {
        this.fallbackEnabled = enabled;
        console.log(`Fallback ${enabled ? 'enabled' : 'disabled'}`);
    }
}

module.exports = AIAPIManager;
