// Google Gemini API Integration for Emotion Analysis
class GeminiEmotionAnalyzer {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;
        this.visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`;
    }

    // Analyze text sentiment from news articles
    async analyzeTextSentiment(text) {
        const prompt = `
        Analyze the emotional sentiment of the following text. 
        Classify it into one of these categories: calm, angry, depressed, fear, happy, neutral.
        Also provide a confidence score from 0-100.
        Additionally, identify any mentions of safety concerns, crimes, or public disturbances.
        
        Text: "${text}"
        
        Respond in JSON format:
        {
          "emotion": "emotion_category",
          "confidence": number,
          "safety_concerns": boolean,
          "crimes_mentioned": ["crime_type1", "crime_type2"],
          "summary": "brief summary of emotional tone"
        }
        `;

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            const data = await response.json();
            const result = JSON.parse(data.candidates[0].content.parts[0].text);
            return result;
        } catch (error) {
            console.error('Error analyzing text sentiment:', error);
            return this.getDefaultAnalysis();
        }
    }

    // Analyze image for facial emotions (simulated - in real implementation would use Gemini Pro Vision)
    async analyzeFacialEmotions(imageData) {
        const prompt = `
        Analyze the facial expressions in this image and identify the predominant emotions.
        Classify the emotions into: calm, angry, depressed, fear, happy, surprised, disgusted, neutral.
        Estimate the percentage of people showing each emotion.
        Also note the general crowd density and behavior (peaceful, agitated, panicked, etc.).
        
        Respond in JSON format:
        {
          "emotions": {
            "calm": number,
            "angry": number,
            "depressed": number,
            "fear": number,
            "happy": number,
            "surprised": number,
            "disgusted": number,
            "neutral": number
          },
          "crowd_behavior": "behavior_type",
          "crowd_density": "low/medium/high",
          "overall_mood": "predominant_emotion",
          "confidence": number
        }
        `;

        try {
            // In a real implementation, we would send the image data to Gemini Pro Vision
            // For simulation purposes, we'll return mock data
            return {
                emotions: {
                    calm: 35,
                    angry: 15,
                    depressed: 10,
                    fear: 20,
                    happy: 25,
                    surprised: 5,
                    disgusted: 3,
                    neutral: 40
                },
                crowd_behavior: "mostly peaceful",
                crowd_density: "medium",
                overall_mood: "calm",
                confidence: 85
            };
        } catch (error) {
            console.error('Error analyzing facial emotions:', error);
            return this.getDefaultFaceAnalysis();
        }
    }

    // Analyze audio for stress/stress indicators (simulated)
    async analyzeAudioStress(audioData) {
        const prompt = `
        Analyze the audio content for stress indicators, anger, fear, or signs of distress.
        Identify vocal patterns that suggest emotional states.
        
        Respond in JSON format:
        {
          "stress_level": "low/medium/high/extreme",
          "anger_detected": boolean,
          "fear_detected": boolean,
          "distress_signals": boolean,
          "emotional_intensity": number,
          "confidence": number
        }
        `;

        try {
            // In a real implementation, we would process the audio data
            // For simulation purposes, we'll return mock data
            return {
                stress_level: "medium",
                anger_detected: false,
                fear_detected: true,
                distress_signals: false,
                emotional_intensity: 65,
                confidence: 78
            };
        } catch (error) {
            console.error('Error analyzing audio stress:', error);
            return this.getDefaultAudioAnalysis();
        }
    }

    // Comprehensive emotional analysis combining multiple inputs
    async analyzeLocationEmotions(location, newsFeeds, cctvImages = [], audioClips = []) {
        // Analyze news feeds for sentiment
        const newsAnalyses = await Promise.all(
            newsFeeds.map(feed => this.analyzeTextSentiment(feed.title + " " + feed.content))
        );

        // Analyze CCTV images if available
        const imageAnalyses = [];
        for (const image of cctvImages) {
            const analysis = await this.analyzeFacialEmotions(image);
            imageAnalyses.push(analysis);
        }

        // Analyze audio clips if available
        const audioAnalyses = [];
        for (const audio of audioClips) {
            const analysis = await this.analyzeAudioStress(audio);
            audioAnalyses.push(analysis);
        }

        // Aggregate results
        return this.aggregateEmotionalData(location, newsAnalyses, imageAnalyses, audioAnalyses);
    }

    // Aggregate emotional data from multiple sources
    aggregateEmotionalData(location, newsAnalyses, imageAnalyses, audioAnalyses) {
        // Calculate average emotion percentages from news
        const newsEmotions = this.calculateAverageEmotions(newsAnalyses);

        // Calculate average emotion percentages from images
        const imageEmotions = this.calculateImageEmotions(imageAnalyses);

        // Calculate audio-based stress indicators
        const audioStress = this.calculateAudioStress(audioAnalyses);

        // Combine all data to create a comprehensive emotional profile
        const aggregatedEmotions = this.combineEmotionalSources(newsEmotions, imageEmotions, audioStress);

        // Calculate safety index based on various factors
        const safetyIndex = this.calculateSafetyIndex(newsAnalyses, aggregatedEmotions);

        // Identify crime statistics from news
        const crimeStats = this.extractCrimeStats(newsAnalyses);

        return {
            location: location,
            timestamp: new Date().toISOString(),
            aggregatedEmotions: aggregatedEmotions,
            safetyIndex: safetyIndex,
            crimeStats: crimeStats,
            newsSummary: this.summarizeNews(newsAnalyses),
            crowdBehavior: this.summarizeCrowdBehavior(imageAnalyses),
            stressLevels: audioStress
        };
    }

    // Calculate average emotions from news analyses
    calculateAverageEmotions(analyses) {
        const emotionCounts = {
            calm: 0,
            angry: 0,
            depressed: 0,
            fear: 0,
            happy: 0,
            neutral: 0
        };

        analyses.forEach(analysis => {
            emotionCounts[analysis.emotion] += 1;
        });

        const total = analyses.length;
        return {
            calm: Math.round((emotionCounts.calm / total) * 100),
            angry: Math.round((emotionCounts.angry / total) * 100),
            depressed: Math.round((emotionCounts.depressed / total) * 100),
            fear: Math.round((emotionCounts.fear / total) * 100),
            happy: Math.round((emotionCounts.happy / total) * 100),
            neutral: Math.round((emotionCounts.neutral / total) * 100)
        };
    }

    // Calculate emotions from image analyses
    calculateImageEmotions(analyses) {
        if (analyses.length === 0) {
            return {
                calm: 30,
                angry: 15,
                depressed: 10,
                fear: 20,
                happy: 25
            };
        }

        const avgEmotions = { calm: 0, angry: 0, depressed: 0, fear: 0, happy: 0 };

        analyses.forEach(analysis => {
            Object.keys(avgEmotions).forEach(emotion => {
                avgEmotions[emotion] += analysis.emotions[emotion];
            });
        });

        Object.keys(avgEmotions).forEach(emotion => {
            avgEmotions[emotion] = Math.round(avgEmotions[emotion] / analyses.length);
        });

        return avgEmotions;
    }

    // Calculate audio stress indicators
    calculateAudioStress(analyses) {
        if (analyses.length === 0) {
            return {
                stress_level: "medium",
                average_intensity: 50
            };
        }

        let totalIntensity = 0;
        let highStressCount = 0;

        analyses.forEach(analysis => {
            totalIntensity += analysis.emotional_intensity;
            if (analysis.stress_level === "high" || analysis.stress_level === "extreme") {
                highStressCount++;
            }
        });

        return {
            stress_level: highStressCount > analyses.length / 2 ? "high" : "medium",
            average_intensity: Math.round(totalIntensity / analyses.length)
        };
    }

    // Combine emotional data from different sources
    combineEmotionalSources(newsEmotions, imageEmotions, audioStress) {
        // Weight different sources (news: 50%, images: 35%, audio: 15%)
        return {
            calm: Math.round((newsEmotions.calm * 0.5) + (imageEmotions.calm * 0.35) + (audioStress.average_intensity < 50 ? 20 : 10)),
            angry: Math.round((newsEmotions.angry * 0.5) + (imageEmotions.angry * 0.35) + (audioStress.average_intensity > 70 ? 15 : 5)),
            depressed: Math.round((newsEmotions.depressed * 0.5) + (imageEmotions.depressed * 0.35) + 5),
            fear: Math.round((newsEmotions.fear * 0.5) + (imageEmotions.fear * 0.35) + (audioStress.average_intensity > 60 ? 20 : 10)),
            happy: Math.round((newsEmotions.happy * 0.5) + (imageEmotions.happy * 0.35) + (audioStress.average_intensity < 40 ? 25 : 15))
        };
    }

    // Calculate safety index based on various factors
    calculateSafetyIndex(newsAnalyses, emotions) {
        let safetyScore = 100;

        // Reduce score based on negative emotions
        safetyScore -= emotions.angry * 0.3;
        safetyScore -= emotions.fear * 0.4;
        safetyScore -= emotions.depressed * 0.2;

        // Reduce score based on crime mentions in news
        let crimeCount = 0;
        newsAnalyses.forEach(analysis => {
            crimeCount += analysis.crimes_mentioned.length;
        });
        safetyScore -= crimeCount * 2;

        // Increase score for positive emotions
        safetyScore += emotions.happy * 0.2;
        safetyScore += emotions.calm * 0.3;

        // Ensure score is between 0 and 100
        return Math.max(0, Math.min(100, Math.round(safetyScore)));
    }

    // Extract crime statistics from news analyses
    extractCrimeStats(analyses) {
        const crimeCounts = {};

        analyses.forEach(analysis => {
            analysis.crimes_mentioned.forEach(crime => {
                crimeCounts[crime] = (crimeCounts[crime] || 0) + 1;
            });
        });

        return crimeCounts;
    }

    // Summarize news content
    summarizeNews(analyses) {
        const positiveCount = analyses.filter(a => a.emotion === 'happy' || a.emotion === 'calm').length;
        const negativeCount = analyses.filter(a => a.emotion === 'angry' || a.emotion === 'fear' || a.emotion === 'depressed').length;
        const neutralCount = analyses.length - positiveCount - negativeCount;

        return {
            total_articles: analyses.length,
            positive_sentiment: Math.round((positiveCount / analyses.length) * 100),
            negative_sentiment: Math.round((negativeCount / analyses.length) * 100),
            neutral_sentiment: Math.round((neutralCount / analyses.length) * 100),
            dominant_sentiment: positiveCount > negativeCount ? 'positive' : 'negative'
        };
    }

    // Summarize crowd behavior from image analyses
    summarizeCrowdBehavior(analyses) {
        if (analyses.length === 0) {
            return "data unavailable";
        }

        const behaviors = analyses.map(a => a.crowd_behavior);
        const behaviorCounts = {};

        behaviors.forEach(behavior => {
            behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
        });

        // Find most common behavior
        let dominantBehavior = "peaceful";
        let maxCount = 0;
        for (const [behavior, count] of Object.entries(behaviorCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantBehavior = behavior;
            }
        }

        return dominantBehavior;
    }

    // Get default analysis for error handling
    getDefaultAnalysis() {
        return {
            emotion: "neutral",
            confidence: 50,
            safety_concerns: false,
            crimes_mentioned: [],
            summary: "Unable to analyze"
        };
    }

    getDefaultFaceAnalysis() {
        return {
            emotions: { calm: 30, angry: 15, depressed: 10, fear: 20, happy: 25 },
            crowd_behavior: "unknown",
            crowd_density: "unknown",
            overall_mood: "neutral",
            confidence: 50
        };
    }

    getDefaultAudioAnalysis() {
        return {
            stress_level: "medium",
            anger_detected: false,
            fear_detected: false,
            distress_signals: false,
            emotional_intensity: 50,
            confidence: 50
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiEmotionAnalyzer;
}