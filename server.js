// Server implementation for City Emotional Map
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration for news APIs
const NEWS_API_KEYS = {
    newsdata: process.env.NEWS_DATA_API_KEY || 'YOUR_NEWS_DATA_API_KEY',
    mediastack: process.env.MEDIASTACK_API_KEY || 'YOUR_MEDIASTACK_API_KEY',
    gnews: process.env.GNEWS_API_KEY || 'YOUR_GNEWS_API_KEY',
    currents: process.env.CURRENTS_API_KEY || 'YOUR_CURRENTS_API_KEY',
    newscatcher: process.env.NEWSCATCHER_API_KEY || 'YOUR_NEWSCATCHER_API_KEY',
    contextualweb: process.env.CONTEXTUALWEB_API_KEY || 'YOUR_CONTEXTUALWEB_API_KEY',
    bing: process.env.BING_NEWS_API_KEY || 'YOUR_BING_API_KEY',
    apify: process.env.APIFY_API_KEY || 'YOUR_APIFY_API_KEY',
    eventregistry: process.env.EVENTREGISTRY_API_KEY || 'YOUR_EVENTREGISTRY_API_KEY'
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for demonstration
const mockNewsSources = [
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

// API Routes

// Emotional analysis endpoint
app.post('/api/emotional-analysis', async (req, res) => {
    try {
        const { location, latitude, longitude } = req.body;

        // In a real implementation, this would call the Mistral API with news data and use Geoapify for location services
        // For now, we'll return mock data based on the location
        const emotionalData = {
            location: location,
            safetyIndex: Math.floor(Math.random() * 40) + 60, // Random value between 60-100
            aggregatedEmotions: {
                calm: Math.floor(Math.random() * 30) + 20,    // 20-50%
                angry: Math.floor(Math.random() * 20) + 5,    // 5-25%
                depressed: Math.floor(Math.random() * 15) + 5, // 5-20%
                fear: Math.floor(Math.random() * 20) + 5,     // 5-25%
                happy: Math.floor(Math.random() * 25) + 15    // 15-40%
            },
            crimeStats: {
                theft: Math.floor(Math.random() * 10),
                assault: Math.floor(Math.random() * 5),
                harassment: Math.floor(Math.random() * 7),
                robbery: Math.floor(Math.random() * 3)
            },
            news: [
                {
                    title: `Local residents report feeling ${['calm', 'concerned', 'happy'][Math.floor(Math.random() * 3)]} about ${location}`,
                    content: `Community meeting held in ${location} to discuss local safety measures and community initiatives.`,
                    emotion: ['calm', 'happy', 'fear'][Math.floor(Math.random() * 3)],
                    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
                },
                {
                    title: `Weather conditions in ${location} affecting mood of citizens`,
                    content: `Unseasonable weather patterns in ${location} have led to increased discussions about mental health support.`,
                    emotion: ['depressed', 'calm', 'happy'][Math.floor(Math.random() * 3)],
                    sentiment: ['negative', 'positive', 'neutral'][Math.floor(Math.random() * 3)]
                }
            ],
            timeBasedCrimes: Array(24).fill(0).map(() => Math.floor(Math.random() * 10)),
            historicalData: {
                dates: ['7 days ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday'],
                safetyTrend: Array(7).fill(0).map(() => Math.floor(Math.random() * 40) + 60)
            },
            geographicZones: [
                { position: { lat: latitude + 0.01, lng: longitude + 0.01 }, emotion: 'calm', intensity: 75 },
                { position: { lat: latitude - 0.01, lng: longitude - 0.01 }, emotion: 'happy', intensity: 60 },
                { position: { lat: latitude + 0.005, lng: longitude - 0.005 }, emotion: 'fear', intensity: 40 }
            ]
        };

        res.json(emotionalData);
    } catch (error) {
        console.error('Error in emotional analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get boundaries endpoint
app.post('/api/get-boundaries', async (req, res) => {
    try {
        const { location } = req.body;

        // Return mock boundaries for demonstration
        const boundaries = {
            coordinates: [
                { lat: 20.5737, lng: 78.9429 },
                { lat: 20.6137, lng: 78.9429 },
                { lat: 20.6137, lng: 78.9829 },
                { lat: 20.5737, lng: 78.9829 }
            ]
        };

        res.json(boundaries);
    } catch (error) {
        console.error('Error in get boundaries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User feedback endpoint
app.post('/api/user-feedback', async (req, res) => {
    try {
        const feedback = req.body;

        // In a real implementation, this would store feedback in a database
        console.log('Received user feedback:', feedback);

        res.json({ success: true, message: 'Feedback received' });
    } catch (error) {
        console.error('Error in user feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Social media integration endpoints
app.post('/api/social/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { location } = req.body;

        // Return mock social media data
        const mockData = {
            posts: [
                { text: `Just visited ${location} and feeling great!`, sentiment: 'positive' },
                { text: `Safety concerns in ${location} need attention`, sentiment: 'negative' },
                { text: `Beautiful day in ${location}`, sentiment: 'positive' }
            ]
        };

        res.json(mockData);
    } catch (error) {
        console.error(`Error in ${req.params.platform} integration:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Crawl news source endpoint
app.post('/api/crawl-news-source', async (req, res) => {
    try {
        const { source, location } = req.body;

        // Try different news APIs to fetch articles for the location
        let articles = [];

        // Try NewsData.io API
        try {
            const newsDataResponse = await axios.get(`https://newsdata.io/api/1/news?apikey=${NEWS_API_KEYS.newsdata}&q=${encodeURIComponent(location)}&country=in`);
            if (newsDataResponse.data && newsDataResponse.data.results) {
                articles = articles.concat(newsDataResponse.data.results.map(item => ({
                    title: item.title,
                    content: item.description || '',
                    url: item.link,
                    source: 'NewsData.io',
                    publishedAt: item.pubDate,
                    location: location
                })));
            }
        } catch (err) {
            console.log('NewsData.io API failed:', err.message);
        }

        // Try GNews API
        try {
            const gnewsResponse = await axios.get(`https://gnews.io/api/v4/search?q=${encodeURIComponent(location)}&token=${NEWS_API_KEYS.gnews}&lang=en&country=in`);
            if (gnewsResponse.data && gnewsResponse.data.articles) {
                articles = articles.concat(gnewsResponse.data.articles.map(item => ({
                    title: item.title,
                    content: item.description || '',
                    url: item.url,
                    source: item.source.name || 'GNews',
                    publishedAt: item.publishedAt,
                    location: location
                })));
            }
        } catch (err) {
            console.log('GNews API failed:', err.message);
        }

        // Try MediaStack API
        try {
            const mediaStackResponse = await axios.get(`http://api.mediastack.com/v1/news?access_key=${NEWS_API_KEYS.mediastack}&keywords=${encodeURIComponent(location)}&countries=in&limit=10`);
            if (mediaStackResponse.data && mediaStackResponse.data.data) {
                articles = articles.concat(mediaStackResponse.data.data.map(item => ({
                    title: item.title,
                    content: item.description || '',
                    url: item.url,
                    source: item.source || 'MediaStack',
                    publishedAt: item.published_at,
                    location: location
                })));
            }
        } catch (err) {
            console.log('MediaStack API failed:', err.message);
        }

        // Try Currents API
        try {
            const currentsResponse = await axios.get(`https://api.currentsapi.services/v1/search?apiKey=${NEWS_API_KEYS.currents}&keywords=${encodeURIComponent(location)}&language=en`);
            if (currentsResponse.data && currentsResponse.data.news) {
                articles = articles.concat(currentsResponse.data.news.map(item => ({
                    title: item.title,
                    content: item.description || '',
                    url: item.url,
                    source: item.source || 'Currents API',
                    publishedAt: item.published,
                    location: location
                })));
            }
        } catch (err) {
            console.log('Currents API failed:', err.message);
        }

        // Try Newscatcher API
        try {
            const newscatcherResponse = await axios.get(`https://api.newscatcherapi.com/v2/search?q=${encodeURIComponent(location)}&lang=en&country=in&page_size=10`, {
                headers: { 'x-api-key': NEWS_API_KEYS.newscatcher }
            });
            if (newscatcherResponse.data && newscatcherResponse.data.articles) {
                articles = articles.concat(newscatcherResponse.data.articles.map(item => ({
                    title: item.title,
                    content: item.summary || '',
                    url: item.link,
                    source: item.source || 'Newscatcher',
                    publishedAt: item.published_date,
                    location: location
                })));
            }
        } catch (err) {
            console.log('Newscatcher API failed:', err.message);
        }

        // Try Bing News Search API
        try {
            const bingResponse = await axios.get(`https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(location)}&mkt=en-IN&mfg=1&freshness=Week`, {
                headers: { 'Ocp-Apim-Subscription-Key': NEWS_API_KEYS.bing }
            });
            if (bingResponse.data && bingResponse.data.value) {
                articles = articles.concat(bingResponse.data.value.map(item => ({
                    title: item.name,
                    content: item.description || '',
                    url: item.url,
                    source: item.provider?.[0]?.name || 'Bing News',
                    publishedAt: item.datePublished,
                    location: location
                })));
            }
        } catch (err) {
            console.log('Bing News API failed:', err.message);
        }

        // Try ContextualWeb API
        try {
            const contextualWebResponse = await axios.post(`https://api.contextualwebsearch.com/v1/news/searchAPI?apiKey=${NEWS_API_KEYS.contextualweb}&q=${encodeURIComponent(location)}&pageNumber=1&pageSize=10&autocorrect=true&safeSearch=false`);
            if (contextualWebResponse.data && contextualWebResponse.data.value) {
                articles = articles.concat(contextualWebResponse.data.value.map(item => ({
                    title: item.title,
                    content: item.body || '',
                    url: item.url,
                    source: item.provider?.name || 'ContextualWeb',
                    publishedAt: item.datePublished,
                    location: location
                })));
            }
        } catch (err) {
            console.log('ContextualWeb API failed:', err.message);
        }

        // Try Apify News API
        try {
            const apifyResponse = await axios.get(`https://api.apify.com/v2/acts/apify~news-crawler/runs?token=${NEWS_API_KEYS.apify}&country=IN&q=${encodeURIComponent(location)}`);
            if (apifyResponse.data && apifyResponse.data.data && apifyResponse.data.data.items) {
                articles = articles.concat(apifyResponse.data.data.items.map(item => ({
                    title: item.title,
                    content: item.description || '',
                    url: item.url,
                    source: item.domain || 'Apify News',
                    publishedAt: item.publishedAt,
                    location: location
                })));
            }
        } catch (err) {
            console.log('Apify News API failed:', err.message);
        }

        // Try EventRegistry API
        try {
            const eventRegistryResponse = await axios.get(`https://eventregistry.org/api/v1/article/getArticles?apiKey=${NEWS_API_KEYS.eventregistry}&action=getArticles&q=${encodeURIComponent(location)}&country=India&resultType=articles&articlesSortBy=date&articlesCount=10`);
            if (eventRegistryResponse.data && eventRegistryResponse.data.articles) {
                articles = articles.concat(Object.values(eventRegistryResponse.data.articles).map(item => ({
                    title: item.title,
                    content: item.body || '',
                    url: item.url,
                    source: item.source?.title || 'EventRegistry',
                    publishedAt: item.datetimePub,
                    location: location
                })));
            }
        } catch (err) {
            console.log('EventRegistry API failed:', err.message);
        }

        // If all APIs fail, return mock data
        if (articles.length === 0) {
            articles = [
                {
                    title: `Local residents report positive developments in ${location}`,
                    content: `Community leaders in ${location} announce new safety measures and infrastructure improvements.`,
                    url: `${source.url}/article1`,
                    source: source.name,
                    publishedAt: new Date().toISOString(),
                    location: location
                },
                {
                    title: `Economic growth continues in ${location} area`,
                    content: `New businesses opening in ${location} contribute to positive sentiment among residents.`,
                    url: `${source.url}/article2`,
                    source: source.name,
                    publishedAt: new Date().toISOString(),
                    location: location
                }
            ];
        }

        res.json(articles);
    } catch (error) {
        console.error('Error in crawl news source:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cloud integration endpoints
app.post('/api/store-emotional-analysis', async (req, res) => {
    try {
        const data = req.body;

        // In a real implementation, this would store in a database
        console.log('Storing emotional analysis in database:', data.location);

        res.json({ success: true, message: 'Data stored successfully' });
    } catch (error) {
        console.error('Error storing emotional analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/store-raw-news-data', async (req, res) => {
    try {
        const { newsData } = req.body;

        // In a real implementation, this would store in a database
        console.log(`Storing ${newsData.length} news articles in database`);

        res.json({ success: true, count: newsData.length });
    } catch (error) {
        console.error('Error storing news data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/store-image-analysis', async (req, res) => {
    try {
        const { imagesWithAnalysis } = req.body;

        // In a real implementation, this would store in a database
        console.log(`Storing ${imagesWithAnalysis.length} image analyses in database`);

        res.json({ success: true, message: 'Images stored successfully' });
    } catch (error) {
        console.error('Error storing image analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/upload-processed-data', async (req, res) => {
    try {
        const { data, dataType, location } = req.body;

        // In a real implementation, this would upload to a storage system
        console.log(`Uploading ${dataType} data for ${location} to storage`);

        res.json({
            success: true,
            name: `${dataType}/${location}/${Date.now()}_${dataType}.json`,
            url: `/data/${dataType}/${location}/${Date.now()}_${dataType}.json`
        });
    } catch (error) {
        console.error('Error uploading processed data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/cleanup-old-data', async (req, res) => {
    try {
        const { daysToKeep } = req.body;

        // In a real implementation, this would delete old data from database
        console.log(`Cleaning up data older than ${daysToKeep} days`);

        res.json({ success: true, message: `Cleaned up data older than ${daysToKeep} days` });
    } catch (error) {
        console.error('Error cleaning up old data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/get-historical-data', async (req, res) => {
    try {
        const { location, daysBack } = req.body;

        // Return mock historical data
        const mockData = Array(Math.min(daysBack, 7)).fill(0).map((_, index) => ({
            timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
            safety_index: Math.floor(Math.random() * 40) + 60,
            calm_percentage: Math.floor(Math.random() * 30) + 20,
            angry_percentage: Math.floor(Math.random() * 20) + 5,
            depressed_percentage: Math.floor(Math.random() * 15) + 5,
            fear_percentage: Math.floor(Math.random() * 20) + 5,
            happy_percentage: Math.floor(Math.random() * 25) + 15
        }));

        res.json(mockData);
    } catch (error) {
        console.error('Error getting historical data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/get-location-statistics', async (req, res) => {
    try {
        const { location } = req.body;

        // Return mock statistics
        const mockStats = {
            total_analyses: Math.floor(Math.random() * 100) + 50,
            average_safety: Math.floor(Math.random() * 40) + 60,
            average_calm: Math.floor(Math.random() * 30) + 20,
            average_angry: Math.floor(Math.random() * 20) + 5,
            average_depressed: Math.floor(Math.random() * 15) + 5,
            average_fear: Math.floor(Math.random() * 20) + 5,
            average_happy: Math.floor(Math.random() * 25) + 15,
            last_analysis: new Date().toISOString()
        };

        res.json(mockStats);
    } catch (error) {
        console.error('Error getting location statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});