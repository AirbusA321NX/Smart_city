// Indian News Crawler for Emotional Analysis
class IndianNewsCrawler {
    constructor() {
        // List of major Indian news sources
        this.newsSources = [
            { name: 'Times of India', url: 'https://timesofindia.indiatimes.com', category: 'general' },
            { name: 'The Hindu', url: 'https://www.thehindu.com', category: 'general' },
            { name: 'NDTV', url: 'https://www.ndtv.com', category: 'general' },
            { name: 'India Today', url: 'https://www.indiatoday.in', category: 'general' },
            { name: 'The Indian Express', url: 'https://indianexpress.com', category: 'general' },
            { name: 'CNN-News18', url: 'https://www.news18.com', category: 'general' },
            { name: 'Republic World', url: 'https://www.republicworld.com', category: 'general' },
            { name: 'ABP News', url: 'https://news.abplive.com', category: 'hindi' },
            { name: 'Aaj Tak', url: 'https://www.aajtak.in', category: 'hindi' },
            { name: 'Zee News', url: 'https://zeenews.india.com', category: 'general' }
        ];


    }

    // Main crawling function
    async crawlNewsForLocation(location) {
        console.log(`Starting crawl for location: ${location}`);

        // Prepare location for matching (remove state, get city name)
        const cityName = this.extractCityName(location);
        if (!cityName) {
            throw new Error(`Could not identify Indian city in location: ${location}`);
        }

        // Crawl each news source
        const allArticles = [];
        const promises = this.newsSources.map(source =>
            this.crawlSource(source, cityName).catch(err => {
                console.error(`Error crawling ${source.name}:`, err);
                return [];
            })
        );

        const results = await Promise.all(promises);
        results.forEach(articles => allArticles.push(...articles));

        // Filter articles relevant to the location
        const relevantArticles = this.filterByLocation(allArticles, cityName);

        // Add timestamps and metadata
        const processedArticles = relevantArticles.map(article => ({
            ...article,
            timestamp: new Date().toISOString(),
            source: article.source,
            location: cityName
        }));

        console.log(`Found ${processedArticles.length} relevant articles for ${cityName}`);
        return processedArticles;
    }

    // Crawl a specific news source
    async crawlSource(source, location) {
        try {
            // Due to CORS restrictions, we need to use a backend proxy to fetch external content
            const response = await fetch('/api/crawl-news-source', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: source,
                    location: location
                })
            });

            if (!response.ok) {
                console.error(`Failed to fetch from ${source.name}: ${response.status}`);
                return [];
            }

            const articles = await response.json();
            return articles;
        } catch (error) {
            console.error(`Error crawling ${source.name}:`, error);
            return [];
        }
    }

    // Parse news page HTML to extract articles
    // This function would be implemented on the server-side due to CORS restrictions
    // Client-side version removed as it cannot process external websites
    parseNewsPage(html, source, location) {
        // This function is now handled server-side
        return [];
    }

    // Extract articles from selected elements
    // This function would be implemented on the server-side due to CORS restrictions
    // Client-side version removed as it cannot process external websites
    extractArticles(elements, source, location) {
        // This function is now handled server-side
        return [];
    }

    // Generic approach to extract articles
    // This function would be implemented on the server-side due to CORS restrictions
    // Client-side version removed as it cannot process external websites
    extractGenericArticles(doc, source, location) {
        // This function is now handled server-side
        return [];
    }

    // Parse date string to Date object
    // This function would be implemented on the server-side due to CORS restrictions
    // Client-side version removed as it cannot process external websites
    parseDate(dateString) {
        // This function is now handled server-side
        return new Date();
    }

    // Simply return the location as provided by the user
    extractCityName(location) {
        // Since the user provides the location directly through the search bar,
        // we just return it as is for processing by Gemini
        return location;
    }



    // Filter articles by location relevance
    filterByLocation(articles, location) {
        return articles.filter(article => {
            // Check if location is mentioned in title or content
            const text = `${article.title} ${article.content}`.toLowerCase();
            return text.includes(location.toLowerCase());
        });
    }

    // Analyze sentiment of articles - simplified to prepare for Gemini processing
    analyzeSentiment(articles) {
        return articles.map(article => {
            // Instead of hardcoded keyword matching, we'll prepare the articles
            // for processing by Gemini which will handle the nuanced sentiment analysis
            return {
                ...article,
                // These will be populated by Gemini
                detectedEmotion: null,
                emotionStrength: null,
                crimeRelated: null,
                crimeType: null,
                sentimentScore: null
            };
        });
    }



    // Get summary statistics for the location - prepared for Gemini processing
    getSummaryStats(articles) {
        const total = articles.length;
        if (total === 0) return null;

        // This method now prepares the raw articles for processing by Gemini
        // which will provide the detailed emotional analysis
        return {
            totalArticles: total,
            rawArticles: articles,
            location: articles.length > 0 ? articles[0].location : null,
            lastUpdated: new Date().toISOString()
        };
    }

    // Schedule periodic crawling (every 6 hours)
    schedulePeriodicCrawling(locations = []) {
        console.log('Scheduling periodic crawling every 6 hours...');

        // Set interval to 6 hours (6 * 60 * 60 * 1000 milliseconds)
        const crawlInterval = 6 * 60 * 60 * 1000; // 6 hours

        setInterval(async () => {
            console.log('Starting scheduled crawl...');

            // Crawl for all monitored locations
            for (const location of locations) {
                try {
                    console.log(`Crawling news for location: ${location}`);
                    const articles = await this.crawlNewsForLocation(location);

                    // Optionally store the results or trigger further processing
                    console.log(`Found ${articles.length} articles for ${location}`);
                } catch (error) {
                    console.error(`Error crawling ${location}:`, error);
                }
            }
        }, crawlInterval);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndianNewsCrawler;
}