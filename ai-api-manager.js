/**
 * AI API Manager with Automatic Fallback
 * Manages Gemini and Mistral APIs with automatic failover
 */

const GeminiIntegration = require('./gemini-integration');
const axios = require('axios');
const SimpleAnalyzer = require('./simple-analyzer');

class AIAPIManager {
    constructor(geminiKey, mistralKey, cerebrasKey = null) {
        this.gemini = new GeminiIntegration(geminiKey);
        this.mistralKey = mistralKey;
        this.mistralBaseUrl = 'https://api.mistral.ai/v1/chat/completions';
        this.cerebrasKey = cerebrasKey;
        this.cerebrasBaseUrl = 'https://api.cerebras.ai/v1/chat/completions';
        this.simpleAnalyzer = new SimpleAnalyzer();

        // Track API status
        this.apiStatus = {
            cerebras: { available: !!cerebrasKey, lastError: null, errorCount: 0 },
            mistral: { available: true, lastError: null, errorCount: 0 },
            gemini: { available: true, lastError: null, errorCount: 0 }
        };

        // Fallback settings
        this.maxRetries = 2;
        this.fallbackEnabled = true;
        
        // Priority order: Cerebras -> Mistral -> Gemini -> Simple Analyzer
        const apis = [];
        if (cerebrasKey) apis.push('Cerebras (primary)');
        apis.push('Mistral', 'Gemini', 'Simple Analyzer');

        console.log(`AI API Manager initialized with ${apis.join(' -> ')}`);
    }

    /**
     * Analyze text sentiment with automatic fallback
     */
    async analyzeTextSentiment(text, location, options = {}) {
        // Store articles for simple analyzer fallback
        this.lastArticles = options.articles || [];

        // Try Cerebras first if available
        if (this.cerebrasKey && this.apiStatus.cerebras.available) {
            try {
                console.log('Attempting analysis with Cerebras AI...');
                const result = await this.analyzeWithCerebras(text, location, options);

                // Reset error count on success
                this.apiStatus.cerebras.errorCount = 0;
                this.apiStatus.cerebras.available = true;

                console.log('✓ Cerebras AI analysis successful');
                return result;

            } catch (error) {
                console.warn('Cerebras AI failed:', error.message);
                this.apiStatus.cerebras.lastError = error.message;
                this.apiStatus.cerebras.errorCount++;

                // Check if it's a rate limit error
                if (error.response?.status === 429 || error.message.includes('429')) {
                    console.log('⚠️  Cerebras API rate limit hit - switching to Mistral...');
                    this.apiStatus.cerebras.available = false;
                }
            }
        }

        // Try Mistral as fallback
        try {
            console.log('Attempting analysis with Mistral AI...');
            const result = await this.analyzeWithMistral(text, location, options);

            // Reset error count on success
            this.apiStatus.mistral.errorCount = 0;
            this.apiStatus.mistral.available = true;

            console.log('✓ Mistral AI analysis successful');
            return result;

        } catch (error) {
            console.warn('Mistral AI failed:', error.message);
            this.apiStatus.mistral.lastError = error.message;
            this.apiStatus.mistral.errorCount++;

            // Check if it's a rate limit error
            if (error.response?.status === 429 || error.message.includes('429')) {
                console.log('⚠️  Mistral API rate limit hit - switching to Gemini...');
                this.apiStatus.mistral.available = false;
            }

            // Fallback to Gemini
            if (this.fallbackEnabled) {
                return await this.analyzeWithGemini(text, location, options);
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

        // Try Cerebras first if available
        if (this.cerebrasKey && this.apiStatus.cerebras.available) {
            try {
                console.log('Fetching crime timeline with Cerebras AI...');
                const result = await this.getCrimeTimelineWithCerebras(location, newsArticles, months);

                // Reset error count on success
                this.apiStatus.cerebras.errorCount = 0;
                this.apiStatus.cerebras.available = true;

                console.log('✓ Cerebras AI timeline successful');
                return result;

            } catch (error) {
                console.warn('Cerebras AI timeline failed:', error.message);
                this.apiStatus.cerebras.lastError = error.message;
                this.apiStatus.cerebras.errorCount++;

                // Check if it's a rate limit error
                if (error.response?.status === 429 || error.message.includes('429')) {
                    console.log('⚠️  Cerebras API rate limit hit - switching to Mistral...');
                    this.apiStatus.cerebras.available = false;
                }
            }
        }

        // Try Mistral as fallback
        try {
            console.log('Fetching crime timeline with Mistral AI...');
            const result = await this.getCrimeTimelineWithMistral(location, newsArticles, months);

            // Reset error count on success
            this.apiStatus.mistral.errorCount = 0;
            this.apiStatus.mistral.available = true;

            console.log('✓ Mistral AI timeline successful');
            return result;

        } catch (error) {
            console.warn('Mistral AI timeline failed:', error.message);
            this.apiStatus.mistral.lastError = error.message;
            this.apiStatus.mistral.errorCount++;

            // Check if it's a rate limit error
            if (error.response?.status === 429 || error.message.includes('429')) {
                console.log('⚠️  Mistral API rate limit hit - switching to Gemini...');
                this.apiStatus.mistral.available = false;
            }

            // Fallback to Gemini
            if (this.fallbackEnabled) {
                return await this.getCrimeTimelineWithGemini(location, newsArticles, months);
            } else {
                throw error;
            }
        }
    }

    /**
     * Analyze with Gemini API (fallback)
     */
    async analyzeWithGemini(text, location, options = {}) {
        try {
            console.log('Using Gemini AI as fallback...');
            const result = await this.gemini.analyzeTextSentiment(text, location, options);

            // Reset error count on success
            this.apiStatus.gemini.errorCount = 0;
            this.apiStatus.gemini.available = true;

            console.log('✓ Gemini AI analysis successful');
            return { ...result, apiUsed: 'gemini' };

        } catch (error) {
            console.error('Gemini AI also failed:', error.message);
            this.apiStatus.gemini.lastError = error.message;
            this.apiStatus.gemini.errorCount++;

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
     * Analyze with Mistral API
     */
    async analyzeWithMistral(text, location, options = {}) {
        try {
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
                    return { ...result, apiUsed: 'mistral' };
                }
            }

            throw new Error('Invalid response from Mistral API');

        } catch (error) {
            throw error;
        }
    }

    /**
     * Analyze with Cerebras API
     */
    async analyzeWithCerebras(text, location, options = {}) {
        try {
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
                this.cerebrasBaseUrl,
                {
                    model: 'llama-3.3-70b',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.cerebrasKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                const content = response.data.choices[0].message.content;
                console.log('🤖 Cerebras sentiment analysis response:', content.substring(0, 300));
                const jsonMatch = content.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    console.log('📊 Parsed crimeStats:', result.crimeStats);
                    console.log('📊 Parsed aggregatedEmotions:', result.aggregatedEmotions);
                    return { ...result, apiUsed: 'cerebras' };
                }
            }

            throw new Error('Invalid response from Cerebras API');

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get crime timeline with Gemini API (fallback)
     */
    async getCrimeTimelineWithGemini(location, newsArticles, months = 1) {
        try {
            console.log('Fetching crime timeline with Gemini AI...');
            const result = await this.gemini.getCrimeTimeline(location, newsArticles, months);

            // Reset error count on success
            this.apiStatus.gemini.errorCount = 0;
            this.apiStatus.gemini.available = true;

            console.log('✓ Gemini AI timeline successful');
            return { ...result, apiUsed: 'gemini' };

        } catch (error) {
            console.error('Gemini AI timeline also failed:', error.message);
            this.apiStatus.gemini.lastError = error.message;
            this.apiStatus.gemini.errorCount++;

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
     * Get crime timeline with Mistral API
     */
    async getCrimeTimelineWithMistral(location, newsArticles, months = 1) {
        try {
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
                    return { ...result, apiUsed: 'mistral' };
                }
            }

            throw new Error('Invalid response from Mistral API');

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get crime timeline with Cerebras API
     */
    async getCrimeTimelineWithCerebras(location, newsArticles, months = 1) {
        try {
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
                this.cerebrasBaseUrl,
                {
                    model: 'llama-3.3-70b',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 3000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.cerebrasKey}`,
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
                    return { ...result, apiUsed: 'cerebras' };
                }
            }

            throw new Error('Invalid response from Cerebras API');

        } catch (error) {
            throw error;
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
     * Verify location hierarchy with automatic fallback
     */
    async verifyLocation(locationName) {
        // Try Cerebras first if available
        if (this.cerebrasKey && this.apiStatus.cerebras.available) {
            try {
                console.log(`Verifying location "${locationName}" with Cerebras AI...`);

                const prompt = `Verify if "${locationName}" is a valid location and determine its type.
            
Respond in JSON format:
{
  "valid": true/false,
  "locationType": "city/state/country/neighborhood/invalid",
  "locationName": "${locationName}",
  "confidence": number (0-100),
  "note": "brief explanation"
}`;

                const response = await axios.post(
                    this.cerebrasBaseUrl,
                    {
                        model: 'llama-3.3-70b',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        max_tokens: 500
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.cerebrasKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    }
                );

                if (response.data?.choices?.[0]?.message?.content) {
                    const content = response.data.choices[0].message.content;
                    const jsonMatch = content.match(/\{[\s\S]*\}/);

                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log(`✓ Location verification successful for "${locationName}"`);
                        return result;
                    }
                }

                throw new Error('Invalid response from Cerebras API');

            } catch (error) {
                console.warn('Location verification with Cerebras failed:', error.message);
                this.apiStatus.cerebras.lastError = error.message;
            }
        }

        // Try Mistral as fallback
        try {
            console.log(`Verifying location "${locationName}" with Mistral AI...`);

            const prompt = `Verify if "${locationName}" is a valid location and determine its type.
            
Respond in JSON format:
{
  "valid": true/false,
  "locationType": "city/state/country/neighborhood/invalid",
  "locationName": "${locationName}",
  "confidence": number (0-100),
  "note": "brief explanation"
}`;

            const response = await axios.post(
                this.mistralBaseUrl,
                {
                    model: 'mistral-large-latest',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.mistralKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                const content = response.data.choices[0].message.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    console.log(`✓ Location verification successful for "${locationName}"`);
                    return result;
                }
            }

            throw new Error('Invalid response from Mistral API');

        } catch (error) {
            console.warn('Location verification with Mistral failed:', error.message);

            // Fallback to Gemini if enabled
            if (this.fallbackEnabled) {
                try {
                    console.log(`Verifying location "${locationName}" with Gemini (fallback)...`);
                    const result = await this.gemini.verifyLocationHierarchy(locationName);
                    console.log(`✓ Location verification successful for "${locationName}"`);
                    return result;
                } catch (geminiError) {
                    console.warn('Location verification with Gemini also failed:', geminiError.message);
                }
            }

            // Return a default invalid response on error
            return {
                valid: false,
                locationType: 'invalid',
                locationName: locationName,
                confidence: 0,
                note: 'Error verifying location'
            };
        }
    }

    /**
     * Get API status report
     */
    getStatus() {
        return {
            cerebras: {
                available: this.apiStatus.cerebras.available,
                errorCount: this.apiStatus.cerebras.errorCount,
                lastError: this.apiStatus.cerebras.lastError
            },
            mistral: {
                available: this.apiStatus.mistral.available,
                errorCount: this.apiStatus.mistral.errorCount,
                lastError: this.apiStatus.mistral.lastError
            },
            gemini: {
                available: this.apiStatus.gemini.available,
                errorCount: this.apiStatus.gemini.errorCount,
                lastError: this.apiStatus.gemini.lastError
            },
            fallbackEnabled: this.fallbackEnabled
        };
    }

    /**
     * Reset API status (useful after quota resets)
     */
    resetStatus() {
        this.apiStatus.cerebras = { available: !!this.cerebrasKey, lastError: null, errorCount: 0 };
        this.apiStatus.mistral = { available: true, lastError: null, errorCount: 0 };
        this.apiStatus.gemini = { available: true, lastError: null, errorCount: 0 };
        console.log('API status reset - all APIs marked as available');
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
