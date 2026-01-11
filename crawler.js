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
            // Construct the search URL based on the source and location
            const searchUrl = `${source.url}/search?q=${encodeURIComponent(location)}&hl=en`;

            // Fetch the page content
            const response = await fetch(searchUrl);

            if (!response.ok) {
                console.error(`Failed to fetch from ${source.name}: ${response.status}`);
                return [];
            }

            const html = await response.text();

            // Parse the HTML to extract articles
            const articles = this.parseNewsPage(html, source, location);

            return articles;
        } catch (error) {
            console.error(`Error crawling ${source.name}:`, error);
            return [];
        }
    }

    // Parse news page HTML to extract articles
    parseNewsPage(html, source, location) {
        // Create a document from the HTML string
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Selectors for different news sites may vary
        // This is a generalized approach
        const articleElements = [
            'article',
            '.story',
            '.news-item',
            '.post',
            '.headline',
            '[data-testid="article"]'
        ];

        let articles = [];
        let found = false;

        // Try different selectors to find articles
        for (const selector of articleElements) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0) {
                articles = this.extractArticles(elements, source, location);
                found = true;
                break;
            }
        }

        // If no articles found with specific selectors, try general approach
        if (!found) {
            articles = this.extractGenericArticles(doc, source, location);
        }

        return articles;
    }

    // Extract articles from selected elements
    extractArticles(elements, source, location) {
        const articles = [];

        elements.forEach(element => {
            const titleElement = element.querySelector('h1, h2, h3, .title, .headline, [class*="title"], [class*="headline"]') || element;
            const title = titleElement.textContent?.trim() || '';

            // Skip if title doesn't contain location
            if (!title.toLowerCase().includes(location.toLowerCase())) {
                return;
            }

            const contentElement = element.querySelector('p, .content, .summary, [class*="content"], [class*="summary"]');
            const content = contentElement?.textContent?.trim() || '';

            const linkElement = element.querySelector('a');
            let url = source.url;
            if (linkElement && linkElement.href) {
                url = linkElement.href;
            }

            // Try to find publication date
            const dateElement = element.querySelector('time, .date, .published, [class*="date"], [class*="published"]');
            let publishedAt = new Date().toISOString();
            if (dateElement && dateElement.dateTime) {
                publishedAt = new Date(dateElement.dateTime).toISOString();
            } else if (dateElement) {
                // Try to parse date from text
                const dateText = dateElement.textContent.trim();
                const parsedDate = this.parseDate(dateText);
                if (parsedDate) {
                    publishedAt = parsedDate.toISOString();
                }
            }

            if (title) {
                articles.push({
                    title,
                    content,
                    url,
                    source: source.name,
                    publishedAt,
                    location
                });
            }
        });

        return articles;
    }

    // Generic approach to extract articles
    extractGenericArticles(doc, source, location) {
        const articles = [];

        // Look for headings that might contain article titles
        const headingElements = doc.querySelectorAll('h1, h2, h3');

        headingElements.forEach(heading => {
            const title = heading.textContent.trim();

            // Only include if it relates to the location
            if (title.toLowerCase().includes(location.toLowerCase())) {
                // Try to find associated content
                let content = '';
                let nextSibling = heading.nextElementSibling;

                // Look for paragraphs following the heading
                while (nextSibling && articles.length < 10) { // Limit to prevent too many
                    if (nextSibling.tagName === 'P' || nextSibling.classList.contains('content')) {
                        content += ' ' + nextSibling.textContent.trim();
                    }

                    // Look for links
                    const linkElement = nextSibling.querySelector('a');
                    let url = source.url;
                    if (linkElement && linkElement.href) {
                        url = linkElement.href;
                    }

                    // Move to next sibling
                    nextSibling = nextSibling.nextElementSibling;

                    // Break if we have enough content
                    if (content.length > 200) break;
                }

                articles.push({
                    title,
                    content: content.substring(0, 500), // Limit content length
                    url,
                    source: source.name,
                    publishedAt: new Date().toISOString(),
                    location
                });
            }
        });

        return articles;
    }

    // Parse date string to Date object
    parseDate(dateString) {
        // Common formats to try
        const formats = [
            /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/, // MM/DD/YYYY or DD/MM/YYYY
            /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/, // YYYY-MM-DD
            /\b(\w+\s+\d{1,2},\s+\d{4})\b/, // Month DD, YYYY
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                try {
                    return new Date(match[0]);
                } catch (e) {
                    continue;
                }
            }
        }

        return null;
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