// Indian News Crawler using Python web crawler
class IndianNewsCrawler {
    constructor() {
        // No hardcoded news sources needed - using dynamic Python crawler
    }

    // Main crawling function
    async crawlNewsForLocation(location) {
        console.log(`Crawling news for location: ${location}`);
        
        try {
            // Use server-side crawling to avoid CORS issues
            const response = await fetch('/api/crawl-news-source', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location
                })
            });

            if (!response.ok) {
                console.error(`Failed to fetch news: ${response.status}`);
                return [];
            }

            const articles = await response.json();
            console.log(`Successfully crawled ${articles.length} articles for ${location}`);
            return articles;
            
        } catch (error) {
            console.error('Error in web crawling:', error);
            // Return empty array if crawling fails
            return [];
        }
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

// Make the class available globally in browser
if (typeof window !== 'undefined') {
    window.IndianNewsCrawler = IndianNewsCrawler;
}