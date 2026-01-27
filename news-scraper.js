/**
 * News Scraper Module
 * Scrapes news from Google News and other sources
 */

const axios = require('axios');
const cheerio = require('cheerio');

class NewsScraper {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.timeout = 10000;
    }

    /**
     * Scrape Google News for a location
     * @param {string} location - Location to search for
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Array of news articles
     */
    async scrapeGoogleNews(location, maxResults = 15) {
        try {
            console.log(`Scraping Google News for: ${location}`);

            const searchQuery = encodeURIComponent(`${location} crime news India`);
            const url = `https://news.google.com/search?q=${searchQuery}&hl=en-IN&gl=IN&ceid=IN:en`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: this.timeout
            });

            const $ = cheerio.load(response.data);
            const articles = [];

            // Try multiple selectors for Google News
            const selectors = [
                'article',
                'div[class*="article"]',
                'div[jsname]',
                'c-wiz'
            ];

            for (const selector of selectors) {
                $(selector).each((index, element) => {
                    if (articles.length >= maxResults) return false;

                    try {
                        const $article = $(element);

                        // Try multiple title selectors
                        let title = $article.find('a[class*="gPFEn"]').first().text().trim() ||
                            $article.find('h3').first().text().trim() ||
                            $article.find('h4').first().text().trim() ||
                            $article.find('a').first().text().trim();

                        // Try multiple link selectors
                        const linkElement = $article.find('a').first();
                        const link = linkElement.attr('href');
                        const fullLink = link ? (link.startsWith('http') ? link : `https://news.google.com${link}`) : '';

                        // Try multiple time selectors
                        const timeElement = $article.find('time');
                        const publishedAt = timeElement.attr('datetime') || new Date().toISOString();

                        // Try multiple source selectors
                        const sourceElement = $article.find('a[data-n-tid]').first() || $article.find('div[data-n-tid]').first();
                        const source = sourceElement.text().trim() || 'Google News';

                        // Try to get description/snippet
                        let description = $article.find('div[class*="snippet"]').text().trim() ||
                            $article.find('p').first().text().trim() ||
                            $article.find('span').first().text().trim();

                        // If no snippet, use title as description
                        if (!description || description.length < 10) {
                            description = title;
                        }

                        if (title && title.length > 10 && !articles.find(a => a.title === title)) {
                            articles.push({
                                title: title,
                                description: description,
                                url: fullLink,
                                source: source,
                                publishedAt: publishedAt,
                                scrapedFrom: 'Google News'
                            });
                        }
                    } catch (err) {
                        // Skip this article
                    }
                });

                if (articles.length >= maxResults) break;
            }

            console.log(`✓ Scraped ${articles.length} articles from Google News`);
            return articles;

        } catch (error) {
            console.error('Error scraping Google News:', error.message);
            return [];
        }
    }

    /**
     * Scrape Times of India
     * @param {string} location - Location to search for
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Array of news articles
     */
    async scrapeTimesOfIndia(location, maxResults = 5) {
        try {
            console.log(`Scraping Times of India for: ${location}`);

            const searchQuery = encodeURIComponent(`${location} crime`);
            const url = `https://timesofindia.indiatimes.com/topic/${searchQuery}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: this.timeout
            });

            const $ = cheerio.load(response.data);
            const articles = [];

            $('.uwU81').each((index, element) => {
                if (articles.length >= maxResults) return false;

                try {
                    const $article = $(element);
                    const title = $article.find('.fHv_i').text().trim();
                    const description = $article.find('.oxXSK').text().trim();
                    const link = $article.find('a').attr('href');
                    const fullLink = link ? `https://timesofindia.indiatimes.com${link}` : '';

                    if (title) {
                        articles.push({
                            title: title,
                            description: description || title,
                            url: fullLink,
                            source: 'Times of India',
                            publishedAt: new Date().toISOString(),
                            scrapedFrom: 'Times of India'
                        });
                    }
                } catch (err) {
                    console.warn('Error parsing TOI article:', err.message);
                }
            });

            console.log(`✓ Scraped ${articles.length} articles from Times of India`);
            return articles;

        } catch (error) {
            console.error('Error scraping Times of India:', error.message);
            return [];
        }
    }

    /**
     * Scrape The Hindu
     * @param {string} location - Location to search for
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Array of news articles
     */
    async scrapeTheHindu(location, maxResults = 5) {
        try {
            console.log(`Scraping The Hindu for: ${location}`);

            const searchQuery = encodeURIComponent(`${location} crime`);
            const url = `https://www.thehindu.com/search/?q=${searchQuery}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Referer': 'https://www.thehindu.com/'
                },
                timeout: this.timeout
            });

            const $ = cheerio.load(response.data);
            const articles = [];

            // Try multiple selectors
            const selectors = [
                '.story-card',
                'article',
                '.element',
                '.story-card-news',
                'div[class*="story"]'
            ];

            for (const selector of selectors) {
                $(selector).each((index, element) => {
                    if (articles.length >= maxResults) return false;

                    try {
                        const $article = $(element);
                        const title = $article.find('h3, h2, .title, a').first().text().trim();
                        const description = $article.find('p, .intro, .lead-text').first().text().trim();
                        const link = $article.find('a').first().attr('href');
                        const fullLink = link ? (link.startsWith('http') ? link : `https://www.thehindu.com${link}`) : '';

                        if (title && title.length > 10 && !articles.find(a => a.title === title)) {
                            articles.push({
                                title: title,
                                description: description || title,
                                url: fullLink,
                                source: 'The Hindu',
                                publishedAt: new Date().toISOString(),
                                scrapedFrom: 'The Hindu'
                            });
                        }
                    } catch (err) {
                        // Skip this article
                    }
                });

                if (articles.length > 0) break;
            }

            console.log(`✓ Scraped ${articles.length} articles from The Hindu`);
            return articles;

        } catch (error) {
            console.error('Error scraping The Hindu:', error.message);
            return [];
        }
    }

    /**
     * Scrape NDTV
     * @param {string} location - Location to search for
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Array of news articles
     */
    async scrapeNDTV(location, maxResults = 5) {
        try {
            console.log(`Scraping NDTV for: ${location}`);

            const searchQuery = encodeURIComponent(`${location} crime`);
            const url = `https://www.ndtv.com/search?searchtext=${searchQuery}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Referer': 'https://www.ndtv.com/'
                },
                timeout: this.timeout
            });

            const $ = cheerio.load(response.data);
            const articles = [];

            // Try multiple selectors
            const selectors = [
                '.src_itm',
                '.news_Itm',
                '.src-itm',
                'article',
                'div[class*="src"]',
                'div[class*="news"]'
            ];

            for (const selector of selectors) {
                $(selector).each((index, element) => {
                    if (articles.length >= maxResults) return false;

                    try {
                        const $article = $(element);
                        const title = $article.find('h2, h3, .src_itm-ttl, a').first().text().trim();
                        const description = $article.find('p, .src_itm-txt, span').first().text().trim();
                        const link = $article.find('a').first().attr('href');
                        const fullLink = link ? (link.startsWith('http') ? link : `https://www.ndtv.com${link}`) : '';

                        if (title && title.length > 10 && !articles.find(a => a.title === title)) {
                            articles.push({
                                title: title,
                                description: description || title,
                                url: fullLink,
                                source: 'NDTV',
                                publishedAt: new Date().toISOString(),
                                scrapedFrom: 'NDTV'
                            });
                        }
                    } catch (err) {
                        // Skip this article
                    }
                });

                if (articles.length > 0) break;
            }

            console.log(`✓ Scraped ${articles.length} articles from NDTV`);
            return articles;

        } catch (error) {
            console.error('Error scraping NDTV:', error.message);
            return [];
        }
    }

    /**
     * Scrape India Today
     * @param {string} location - Location to search for
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Array of news articles
     */
    async scrapeIndiaToday(location, maxResults = 5) {
        try {
            console.log(`Scraping India Today for: ${location}`);

            const searchQuery = encodeURIComponent(`${location} crime`);
            const url = `https://www.indiatoday.in/search?searchtext=${searchQuery}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Referer': 'https://www.indiatoday.in/'
                },
                timeout: this.timeout
            });

            const $ = cheerio.load(response.data);
            const articles = [];

            // Try multiple selectors
            const selectors = [
                '.B1S3_content__wrap__9mSB6',
                '.Story__Listing',
                '.story-card',
                'article',
                'div[class*="content"]',
                'div[class*="story"]'
            ];

            for (const selector of selectors) {
                $(selector).each((index, element) => {
                    if (articles.length >= maxResults) return false;

                    try {
                        const $article = $(element);
                        const title = $article.find('h2, h3, .B1S3_content__title__qJIuv, a').first().text().trim() ||
                            $article.find('a').first().attr('title');
                        const description = $article.find('p, .B1S3_content__description__1vM0T, span').first().text().trim();
                        const link = $article.find('a').first().attr('href');
                        const fullLink = link ? (link.startsWith('http') ? link : `https://www.indiatoday.in${link}`) : '';

                        if (title && title.length > 10 && !articles.find(a => a.title === title)) {
                            articles.push({
                                title: title,
                                description: description || title,
                                url: fullLink,
                                source: 'India Today',
                                publishedAt: new Date().toISOString(),
                                scrapedFrom: 'India Today'
                            });
                        }
                    } catch (err) {
                        // Skip this article
                    }
                });

                if (articles.length > 0) break;
            }

            console.log(`✓ Scraped ${articles.length} articles from India Today`);
            return articles;

        } catch (error) {
            console.error('Error scraping India Today:', error.message);
            return [];
        }
    }

    /**
     * Scrape news from multiple sources
     * @param {string} location - Location to search for
     * @param {number} maxResults - Maximum total results
     * @returns {Promise<Array>} - Combined array of news articles
     */
    async scrapeAllSources(location, maxResults = 25) {
        console.log(`\n🔍 Starting news scraping for: ${location}`);
        console.log('━'.repeat(50));

        const results = await Promise.allSettled([
            this.scrapeGoogleNews(location, Math.ceil(maxResults * 0.6)), // 60% from Google News
            this.scrapeTimesOfIndia(location, Math.ceil(maxResults * 0.4)) // 40% from TOI
        ]);

        let allArticles = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                allArticles = allArticles.concat(result.value);
            } else {
                const sources = ['Google News', 'Times of India'];
                console.warn(`⚠️  Failed to scrape ${sources[index]}`);
            }
        });

        // Remove duplicates based on title similarity
        allArticles = this.removeDuplicates(allArticles);

        // Limit to maxResults
        allArticles = allArticles.slice(0, maxResults);

        console.log('━'.repeat(50));
        console.log(`✓ Total articles scraped: ${allArticles.length}`);
        console.log(`  - Google News: ${allArticles.filter(a => a.scrapedFrom === 'Google News').length}`);
        console.log(`  - Times of India: ${allArticles.filter(a => a.scrapedFrom === 'Times of India').length}`);
        console.log('━'.repeat(50) + '\n');

        // Return articles even if empty - no mock data
        if (allArticles.length === 0) {
            console.log('⚠️  No articles found for this location');
        }

        return allArticles;
    }

    /**
     * Remove duplicate articles based on title similarity
     * @param {Array} articles - Array of articles
     * @returns {Array} - Deduplicated articles
     */
    removeDuplicates(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const normalizedTitle = article.title.toLowerCase().trim();
            if (seen.has(normalizedTitle)) {
                return false;
            }
            seen.add(normalizedTitle);
            return true;
        });
    }



    /**
     * Test the scraper
     */
    async test() {
        console.log('Testing News Scraper...\n');
        const articles = await this.scrapeAllSources('Delhi', 10);

        console.log('\nSample Articles:');
        articles.slice(0, 3).forEach((article, index) => {
            console.log(`\n${index + 1}. ${article.title}`);
            console.log(`   Source: ${article.source}`);
            console.log(`   Description: ${article.description.substring(0, 100)}...`);
        });
    }
}

module.exports = NewsScraper;

// Test if run directly
if (require.main === module) {
    const scraper = new NewsScraper();
    scraper.test().catch(console.error);
}
