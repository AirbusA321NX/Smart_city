/**
 * Simple Rule-Based Analyzer
 * Fallback when AI APIs are unavailable
 * Uses keyword matching to analyze news articles
 */

class SimpleAnalyzer {
    constructor() {
        // Emotion keywords
        this.emotionKeywords = {
            calm: ['peaceful', 'calm', 'stable', 'normal', 'routine', 'safe', 'secure', 'tranquil', 'quiet'],
            angry: ['protest', 'outrage', 'angry', 'furious', 'riot', 'clash', 'violence', 'mob', 'rage'],
            depressed: ['tragic', 'sad', 'victim', 'loss', 'grief', 'death', 'killed', 'died', 'mourning'],
            fear: ['fear', 'danger', 'threat', 'unsafe', 'scared', 'terror', 'panic', 'worried', 'concern'],
            happy: ['improved', 'success', 'celebration', 'positive', 'better', 'progress', 'achievement', 'good']
        };

        // Crime keywords
        this.crimeKeywords = {
            theft: ['theft', 'stolen', 'robbery', 'burglary', 'loot', 'steal', 'robbed', 'burglar'],
            assault: ['assault', 'attack', 'beaten', 'violence', 'fight', 'hit', 'injured', 'hurt'],
            harassment: ['harassment', 'stalking', 'abuse', 'molest', 'harass', 'stalker', 'abused'],
            robbery: ['robbery', 'dacoity', 'armed', 'gunpoint', 'robbed', 'loot', 'heist'],
            vandalism: ['vandalism', 'damage', 'destroyed', 'broken', 'vandal', 'graffiti', 'defaced'],
            other: ['fraud', 'scam', 'cybercrime', 'cheating', 'forgery', 'bribery', 'corruption']
        };
    }

    /**
     * Analyze news articles using keyword matching
     * @param {Array} articles - News articles
     * @param {string} location - Location name
     * @returns {Object} - Analysis results
     */
    analyze(articles, location) {
        console.log(`📊 Using Simple Analyzer (keyword-based) for ${articles.length} articles`);

        // Combine all article text
        const allText = articles.map(a => 
            `${a.title} ${a.description || ''}`
        ).join(' ').toLowerCase();

        // Analyze emotions
        const emotions = this.analyzeEmotions(allText);

        // Analyze crimes
        const crimes = this.analyzeCrimes(allText, articles);

        // Calculate safety index
        const safetyIndex = this.calculateSafetyIndex(emotions, crimes);

        // Generate timeline
        const timeline = this.generateTimeline(crimes, location);

        console.log(`✓ Simple Analysis complete: Safety ${safetyIndex}, Crimes: ${crimes.total}`);

        return {
            safetyIndex,
            aggregatedEmotions: emotions.percentages,
            crimeStats: crimes.breakdown,
            monthlyTrends: timeline.monthlyData,
            currentPeriod: timeline.currentMonth,
            summary: `Analysis based on ${articles.length} news articles from ${location}`,
            method: 'keyword-based'
        };
    }

    /**
     * Analyze emotions using keyword matching
     * @param {string} text - Combined text
     * @returns {Object} - Emotion analysis
     */
    analyzeEmotions(text) {
        const counts = {
            calm: 0,
            angry: 0,
            depressed: 0,
            fear: 0,
            happy: 0
        };

        // Count keyword matches
        for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    counts[emotion] += matches.length;
                }
            }
        }

        // Calculate total
        const total = Object.values(counts).reduce((sum, val) => sum + val, 0);

        // Convert to percentages
        const percentages = {};
        if (total > 0) {
            for (const [emotion, count] of Object.entries(counts)) {
                percentages[emotion] = Math.round((count / total) * 100);
            }
        } else {
            // Default distribution if no keywords found
            percentages.calm = 30;
            percentages.angry = 15;
            percentages.depressed = 15;
            percentages.fear = 20;
            percentages.happy = 20;
        }

        return { counts, percentages, total };
    }

    /**
     * Analyze crimes using keyword matching
     * @param {string} text - Combined text
     * @param {Array} articles - Original articles
     * @returns {Object} - Crime analysis
     */
    analyzeCrimes(text, articles) {
        const breakdown = {
            theft: 0,
            assault: 0,
            harassment: 0,
            robbery: 0,
            vandalism: 0,
            other: 0
        };

        // Count keyword matches
        for (const [crimeType, keywords] of Object.entries(this.crimeKeywords)) {
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    breakdown[crimeType] += matches.length;
                }
            }
        }

        // Extract numbers from text (e.g., "5 thefts reported")
        for (const article of articles) {
            const articleText = `${article.title} ${article.description || ''}`.toLowerCase();
            
            // Look for patterns like "5 thefts", "3 assaults", etc.
            for (const [crimeType, keywords] of Object.entries(this.crimeKeywords)) {
                for (const keyword of keywords) {
                    const numberPattern = new RegExp(`(\\d+)\\s+${keyword}`, 'gi');
                    const matches = articleText.matchAll(numberPattern);
                    for (const match of matches) {
                        const count = parseInt(match[1]);
                        if (count > 0 && count < 100) { // Sanity check
                            breakdown[crimeType] += count;
                        }
                    }
                }
            }
        }

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

        return { breakdown, total };
    }

    /**
     * Calculate safety index
     * @param {Object} emotions - Emotion analysis
     * @param {Object} crimes - Crime analysis
     * @returns {number} - Safety index (0-100)
     */
    calculateSafetyIndex(emotions, crimes) {
        let index = 100;

        // Subtract for negative emotions
        index -= emotions.percentages.angry * 0.3;
        index -= emotions.percentages.fear * 0.4;
        index -= emotions.percentages.depressed * 0.2;

        // Add for positive emotions
        index += emotions.percentages.happy * 0.2;
        index += emotions.percentages.calm * 0.3;

        // Subtract for crimes (each crime reduces by 1 point, max 30 points)
        index -= Math.min(crimes.total, 30);

        // Ensure within bounds
        return Math.max(0, Math.min(100, Math.round(index)));
    }

    /**
     * Generate timeline data
     * @param {Object} crimes - Crime analysis
     * @param {string} location - Location name
     * @returns {Object} - Timeline data
     */
    generateTimeline(crimes, location) {
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        return {
            monthlyData: [
                {
                    month: currentMonth,
                    totalCrimes: crimes.total,
                    crimeBreakdown: crimes.breakdown,
                    safetyIndex: this.calculateSafetyIndex(
                        { percentages: { calm: 30, angry: 15, depressed: 15, fear: 20, happy: 20 } },
                        crimes
                    ),
                    trend: 'stable',
                    peakHours: ['10 PM - 2 AM'],
                    safestHours: ['6 AM - 10 AM']
                }
            ],
            currentMonth: {
                name: currentMonth,
                totalCrimes: crimes.total,
                comparedToLastMonth: 0,
                status: 'stable'
            },
            overallTrend: {
                direction: 'stable',
                percentageChange: 0,
                mostCommonCrime: this.getMostCommonCrime(crimes.breakdown),
                leastCommonCrime: this.getLeastCommonCrime(crimes.breakdown)
            },
            recommendations: this.generateRecommendations(crimes)
        };
    }

    /**
     * Get most common crime type
     * @param {Object} breakdown - Crime breakdown
     * @returns {string} - Most common crime
     */
    getMostCommonCrime(breakdown) {
        let maxCrime = 'theft';
        let maxCount = 0;

        for (const [crime, count] of Object.entries(breakdown)) {
            if (count > maxCount) {
                maxCount = count;
                maxCrime = crime;
            }
        }

        return maxCount > 0 ? maxCrime : 'N/A';
    }

    /**
     * Get least common crime type
     * @param {Object} breakdown - Crime breakdown
     * @returns {string} - Least common crime
     */
    getLeastCommonCrime(breakdown) {
        let minCrime = 'other';
        let minCount = Infinity;

        for (const [crime, count] of Object.entries(breakdown)) {
            if (count > 0 && count < minCount) {
                minCount = count;
                minCrime = crime;
            }
        }

        return minCount < Infinity ? minCrime : 'N/A';
    }

    /**
     * Generate safety recommendations
     * @param {Object} crimes - Crime analysis
     * @returns {Array} - Recommendations
     */
    generateRecommendations(crimes) {
        const recommendations = [];

        if (crimes.breakdown.theft > 5) {
            recommendations.push('Be vigilant about personal belongings in crowded areas');
        }
        if (crimes.breakdown.assault > 3) {
            recommendations.push('Avoid isolated areas, especially during late hours');
        }
        if (crimes.breakdown.harassment > 2) {
            recommendations.push('Use well-lit and populated routes');
        }
        if (crimes.total > 15) {
            recommendations.push('Stay informed about local safety alerts');
        }
        if (recommendations.length === 0) {
            recommendations.push('Continue following general safety precautions');
        }

        return recommendations;
    }
}

module.exports = SimpleAnalyzer;
