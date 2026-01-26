/**
 * Google Gemini API Integration
 * Can be used as alternative or complement to Mistral AI
 */

const axios = require('axios');

class GeminiIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-2.0-flash-exp'; // Using latest flash model
        this.maxRetries = 3;
    }

    /**
     * Make API request with retry logic
     */
    async makeRequest(url, data, retries = 0) {
        try {
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response;
        } catch (error) {
            // Handle rate limiting (429) with retry (no delay)
            if (error.response?.status === 429 && retries < this.maxRetries) {
                console.log(`Rate limited. Retrying immediately... (Attempt ${retries + 1}/${this.maxRetries})`);
                return this.makeRequest(url, data, retries + 1);
            }
            throw error;
        }
    }

    /**
     * Analyze text sentiment using Gemini
     * @param {string} text - Text to analyze
     * @param {string} location - Location context
     * @param {Object} options - Additional options (timeframe, etc.)
     * @returns {Promise<Object>} - Analysis results
     */
    async analyzeTextSentiment(text, location, options = {}) {
        try {
            const { includeTimeline = true, timeframe = 'current_month' } = options;
            
            const prompt = `
Analyze the emotional sentiment of the following news content about ${location}.
Classify emotions into: calm, angry, depressed, fear, happy, neutral.
Provide a confidence score (0-100) and identify safety concerns.

${includeTimeline ? `Also analyze crime trends over time and provide monthly breakdown for the past 6 months.` : ''}

Text: "${text}"

Respond in JSON format:
{
  "safetyIndex": number (0-100),
  "aggregatedEmotions": {
    "calm": number (0-100),
    "angry": number (0-100),
    "depressed": number (0-100),
    "fear": number (0-100),
    "happy": number (0-100)
  },
  "crimeStats": {
    "theft": number,
    "assault": number,
    "harassment": number,
    "robbery": number,
    "other": number
  },
  "monthlyTrends": [
    {
      "month": "January 2024",
      "totalCrimes": number,
      "crimeTypes": {"theft": number, "assault": number},
      "safetyIndex": number,
      "trend": "increasing/decreasing/stable"
    }
  ],
  "currentPeriod": {
    "month": "current month name",
    "totalCrimes": number,
    "comparedToLastMonth": "percentage change",
    "mostCommonCrime": "crime type",
    "safestTime": "time of day",
    "riskiestTime": "time of day"
  },
  "safetyConcerns": boolean,
  "summary": "brief summary"
}
`;

            const response = await this.makeRequest(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                }
            );

            const result = response.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response
            const jsonMatch = result.match(/```(?:json)?\n([\s\S]*?)\n```|({[\s\S]*?})/);
            if (jsonMatch) {
                const jsonData = jsonMatch[1] || jsonMatch[2];
                return JSON.parse(jsonData);
            }

            return this.getDefaultAnalysis();
        } catch (error) {
            console.error('Error with Gemini API:', error.message);
            // Throw error instead of returning default - let AI Manager handle fallback
            throw error;
        }
    }

    /**
     * Analyze image using Gemini Vision (Pro Vision model)
     * @param {string} imageBase64 - Base64 encoded image
     * @param {string} location - Location context
     * @returns {Promise<Object>} - Image analysis results
     */
    async analyzeImage(imageBase64, location) {
        try {
            const prompt = `
Analyze this image from ${location} for:
1. Crowd emotions and behavior
2. Safety indicators
3. Any visible concerns

Respond in JSON format:
{
  "crowdEmotions": {
    "calm": number,
    "angry": number,
    "fear": number,
    "happy": number
  },
  "crowdDensity": "low/medium/high",
  "safetyIndicators": ["indicator1", "indicator2"],
  "concerns": ["concern1", "concern2"],
  "overallMood": "description"
}
`;

            const response = await this.makeRequest(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: imageBase64
                                }
                            }
                        ]
                    }]
                }
            );

            const result = response.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response
            const jsonMatch = result.match(/```(?:json)?\n([\s\S]*?)\n```|({[\s\S]*?})/);
            if (jsonMatch) {
                const jsonData = jsonMatch[1] || jsonMatch[2];
                return JSON.parse(jsonData);
            }

            return null;
        } catch (error) {
            console.error('Error with Gemini Vision API:', error.message);
            return null;
        }
    }

    /**
     * Compare analysis from multiple AI providers
     * @param {string} text - Text to analyze
     * @param {string} location - Location context
     * @param {Function} mistralAnalyzer - Mistral analysis function
     * @returns {Promise<Object>} - Combined analysis
     */
    async compareWithMistral(text, location, mistralAnalyzer) {
        try {
            // Get both analyses in parallel
            const [geminiResult, mistralResult] = await Promise.all([
                this.analyzeTextSentiment(text, location),
                mistralAnalyzer(text, location)
            ]);

            // Average the results for more accurate analysis
            return {
                safetyIndex: Math.round((geminiResult.safetyIndex + mistralResult.safetyIndex) / 2),
                aggregatedEmotions: {
                    calm: Math.round((geminiResult.aggregatedEmotions.calm + mistralResult.aggregatedEmotions.calm) / 2),
                    angry: Math.round((geminiResult.aggregatedEmotions.angry + mistralResult.aggregatedEmotions.angry) / 2),
                    depressed: Math.round((geminiResult.aggregatedEmotions.depressed + mistralResult.aggregatedEmotions.depressed) / 2),
                    fear: Math.round((geminiResult.aggregatedEmotions.fear + mistralResult.aggregatedEmotions.fear) / 2),
                    happy: Math.round((geminiResult.aggregatedEmotions.happy + mistralResult.aggregatedEmotions.happy) / 2)
                },
                crimeStats: this.mergeCrimeStats(geminiResult.crimeStats, mistralResult.crimeStats),
                aiProviders: ['gemini', 'mistral'],
                confidence: 'high' // Higher confidence with multiple AI providers
            };
        } catch (error) {
            console.error('Error comparing AI providers:', error.message);
            return null;
        }
    }

    /**
     * Generate insights and recommendations
     * @param {Object} analysisData - Analysis data
     * @param {string} location - Location
     * @returns {Promise<Object>} - Insights and recommendations
     */
    async generateInsights(analysisData, location) {
        try {
            const prompt = `
Based on this emotional analysis data for ${location}:
${JSON.stringify(analysisData, null, 2)}

Provide:
1. Key insights about the emotional state
2. Safety recommendations
3. Trending patterns
4. Areas of concern

Respond in JSON format:
{
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "trends": ["trend1", "trend2"],
  "concerns": ["concern1", "concern2"]
}
`;

            const response = await axios.post(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = response.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response
            const jsonMatch = result.match(/```(?:json)?\n([\s\S]*?)\n```|({[\s\S]*?})/);
            if (jsonMatch) {
                const jsonData = jsonMatch[1] || jsonMatch[2];
                return JSON.parse(jsonData);
            }

            return null;
        } catch (error) {
            console.error('Error generating insights:', error.message);
            return null;
        }
    }

    /**
     * Merge crime statistics from multiple sources
     */
    mergeCrimeStats(stats1, stats2) {
        const merged = {};
        const allKeys = new Set([...Object.keys(stats1 || {}), ...Object.keys(stats2 || {})]);
        
        allKeys.forEach(key => {
            merged[key] = Math.round(((stats1[key] || 0) + (stats2[key] || 0)) / 2);
        });
        
        return merged;
    }

    /**
     * Get crime timeline for a location
     * @param {string} location - Location to analyze
     * @param {Array} newsArticles - News articles array
     * @param {number} months - Number of months to analyze
     * @returns {Promise<Object>} - Timeline data
     */
    async getCrimeTimeline(location, newsArticles, months = 1) {
        try {
            const articlesText = newsArticles.map(a => 
                `Date: ${a.publishedAt || 'recent'}\nTitle: ${a.title}\nContent: ${a.description || ''}`
            ).join('\n\n');

            const prompt = `
Analyze crime patterns and trends for ${location} over the past ${months} months based on these news articles:

${articlesText}

Provide a detailed monthly breakdown with:
1. Total crimes per month
2. Crime types distribution
3. Safety index trend
4. Peak crime times
5. Comparison with previous periods

Respond in JSON format:
{
  "location": "${location}",
  "timeframe": "${months} months",
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
    "comparedToAverage": number (percentage),
    "status": "better/worse/same"
  },
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}
`;

            const response = await this.makeRequest(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                }
            );

            const result = response.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response
            const jsonMatch = result.match(/```(?:json)?\n([\s\S]*?)\n```|({[\s\S]*?})/);
            if (jsonMatch) {
                const jsonData = jsonMatch[1] || jsonMatch[2];
                return JSON.parse(jsonData);
            }

            return this.getDefaultTimeline(location, months);
        } catch (error) {
            console.error('Error getting crime timeline:', error.message);
            // Throw error instead of returning default - let AI Manager handle fallback
            throw error;
        }
    }

    /**
     * Get default timeline structure
     */
    getDefaultTimeline(location, months) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const currentDate = new Date();
        const monthlyData = [];

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);
            monthlyData.push({
                month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
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
                peakHours: ['20:00-23:00'],
                safestHours: ['06:00-09:00']
            });
        }

        return {
            location,
            timeframe: `${months} months`,
            monthlyData,
            overallTrend: {
                direction: 'stable',
                percentageChange: 0,
                mostCommonCrime: 'theft',
                leastCommonCrime: 'vandalism'
            },
            currentMonth: {
                name: monthNames[currentDate.getMonth()],
                totalCrimes: 0,
                comparedToLastMonth: 0,
                comparedToAverage: 0,
                status: 'same'
            },
            recommendations: [
                'Continue monitoring crime patterns',
                'Increase awareness during peak hours'
            ]
        };
    }

    /**
     * Verify and classify location using Gemini
     * Determines if location is a state, city, neighborhood, or invalid
     * @param {string} locationName - Location to verify
     * @returns {Promise<Object>} - Location verification result
     */
    async verifyLocationHierarchy(locationName) {
        try {
            const prompt = `Classify and verify the following location: "${locationName}"

Your task:
1. Determine if this is a valid location in India
2. Classify it as: state, union-territory, city, district, or neighborhood
3. Return its hierarchical information

Respond ONLY in valid JSON format (no markdown, no backticks):
{
  "valid": true/false,
  "locationType": "state|union-territory|city|district|neighborhood|invalid",
  "locationName": "verified exact name",
  "state": "parent state name if applicable",
  "district": "district name if applicable",
  "coordinates": {
    "lat": approximate latitude,
    "lon": approximate longitude
  },
  "description": "brief description of the location",
  "confidence": 0-100,
  "note": "any clarification or ambiguity note"
}

Important: Return ONLY JSON, no additional text.`;

            const response = await this.makeRequest(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 512,
                    }
                }
            );

            const result = response.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response - handle both markdown and plain JSON
            let jsonData = null;
            
            // Try to extract from markdown code block first
            const jsonMatch = result.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[1]);
            } else {
                // Try to parse as plain JSON
                const cleanedResult = result.trim();
                jsonData = JSON.parse(cleanedResult);
            }

            return jsonData;
        } catch (error) {
            console.error('Error verifying location with Gemini:', error.message);
            // Return a default invalid response instead of throwing
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
     * Get default analysis structure
     */
    getDefaultAnalysis() {
        return {
            safetyIndex: 50,
            aggregatedEmotions: {
                calm: 20,
                angry: 20,
                depressed: 20,
                fear: 20,
                happy: 20
            },
            crimeStats: {},
            monthlyTrends: [],
            currentPeriod: {
                month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                totalCrimes: 0,
                comparedToLastMonth: '0%',
                mostCommonCrime: 'N/A',
                safestTime: '06:00-09:00',
                riskiestTime: '20:00-23:00'
            },
            safetyConcerns: false,
            summary: 'Unable to analyze'
        };
    }
}

module.exports = GeminiIntegration;
