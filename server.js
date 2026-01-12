// Server implementation for City Emotional Map
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

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
app.use(express.static('.'));

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

        // Call Mistral AI API for emotional analysis
        const mistralApiKey = process.env.MISTRAL_API_KEY || 'YOUR_MISTRAL_API_KEY';

        // Get news data for the location
        const newsResponse = await axios.get(`https://gnews.io/api/v4/search?q=${encodeURIComponent(location)}&token=${NEWS_API_KEYS.gnews}&lang=en&country=in`);
        const newsArticles = newsResponse.data?.articles || [];

        // Prepare content for Mistral API
        const newsContent = newsArticles.slice(0, 5).map(article =>
            `Title: ${article.title}\nDescription: ${article.description || ''}`
        ).join('\n\n');

        // Call Mistral API for sentiment/emotion analysis
        const mistralResponse = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at analyzing news articles to determine emotional sentiment and safety metrics for locations in India. Analyze the provided news articles and return a JSON response with the following structure: {safetyIndex: number (0-100), aggregatedEmotions: {calm: number, angry: number, depressed: number, fear: number, happy: number}, crimeStats: {theft?: number, assault?: number, harassment?: number, robbery?: number, other?: number}, news: Array of objects with title, content, emotion, sentiment, and location properties}'
                },
                {
                    role: 'user',
                    content: `Analyze the following news articles for ${location} and provide emotional and safety insights:\n\n${newsContent}`
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${mistralApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const aiAnalysis = mistralResponse.data.choices[0].message.content;

        // Attempt to extract JSON from AI response (assuming it returns structured data)
        let parsedData = {};
        try {
            // Look for JSON within the response, potentially surrounded by markdown
            const jsonMatch = aiAnalysis.match(/```(?:json)?\n([\s\S]*?)\n```|({[\s\S]*?})/);
            if (jsonMatch) {
                const jsonData = jsonMatch[1] || jsonMatch[2];
                parsedData = JSON.parse(jsonData);
            } else {
                // If no JSON found, return basic structure
                parsedData = {};
            }
        } catch (e) {
            console.log('Could not parse AI response as JSON, using defaults');
            parsedData = {};
        }

        // Construct emotionalData with fallbacks to avoid any hardcoded values
        const emotionalData = {
            location: location,
            safetyIndex: parsedData.safetyIndex || 0,
            aggregatedEmotions: parsedData.aggregatedEmotions || {
                calm: 0,
                angry: 0,
                depressed: 0,
                fear: 0,
                happy: 0
            },
            crimeStats: parsedData.crimeStats || {},
            news: parsedData.news || newsArticles.map(article => ({
                title: article.title,
                content: article.description,
                emotion: 'neutral',
                sentiment: 'neutral',
                location: location
            })),
            timeBasedCrimes: parsedData.timeBasedCrimes || Array(24).fill(0),
            historicalData: parsedData.historicalData || {
                dates: [],
                safetyTrend: []
            },
            geographicZones: parsedData.geographicZones || []
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

        // Define state name mappings to match the file names
        const stateNameMap = {
            'andhra pradesh': 'andhra-pradesh',
            'arunachal pradesh': 'arunachalpradesh',
            'assam': 'assam',
            'bihar': 'bihar',
            'chhattisgarh': 'chhattisgarh',
            'goa': 'goa',
            'gujarat': 'gujarat-divisions',
            'haryana': 'haryana',
            'himachal pradesh': 'himachal-pradesh',
            'jharkhand': 'jharkhand',
            'karnataka': 'karnataka',
            'kerala': 'kerala',
            'madhya pradesh': 'madhya-pradesh',
            'maharashtra': 'maharashtra',
            'manipur': 'manipur',
            'meghalaya': 'meghalaya',
            'mizoram': 'mizoram',
            'nagaland': 'nagaland',
            'odisha': 'odisha',
            'punjab': 'punjab',
            'rajasthan': 'rajasthan',
            'sikkim': 'sikkim',
            'tamil nadu': 'tamilnadu',
            'telangana': 'telangana',
            'tripura': 'tripura',
            'uttar pradesh': 'uttar-pradesh',
            'uttarakhand': 'uttarakhand',
            'west bengal': 'west-bengal',
            'chandigarh': 'chandigarh',
            'delhi': 'delhi',
            'puducherry': 'puducherry',
            'lakshadweep': 'lakshadweep',
            'andaman and nicobar islands': 'andamannicobarislands',
            'dadra and nagar haveli and daman and diu': 'dnh',
            'jammu and kashmir': 'jammu-kashmir',
            'ladakh': 'ladakh'
        };

        // Get normalized state name
        const locationLower = location.toLowerCase();
        let stateName = '';

        // Try to extract state name from location string
        for (const [fullStateName, fileName] of Object.entries(stateNameMap)) {
            if (locationLower.includes(fullStateName)) {
                stateName = fileName;
                break;
            }
        }

        // If not found in the mapping, try the last part of the location string
        if (!stateName && locationLower.includes(',')) {
            const parts = locationLower.split(',');
            const potentialState = parts[parts.length - 1].trim();
            if (stateNameMap[potentialState]) {
                stateName = stateNameMap[potentialState];
            }
        }

        if (!stateName) {
            // If we can't identify the state, return empty boundaries
            res.json({ coordinates: [] });
            return;
        }

        // Try to read the corresponding topojson file
        // First try the divisions folder
        let topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'divisions', `${stateName}.topo.json`);
        let topoJson = null;
        let objectKey = null;

        // If the divisions file doesn't exist, try other folders
        if (!fs.existsSync(topoJsonPath)) {
            // Try the states folder
            topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'states', `${stateName}.topo.json`);

            if (!fs.existsSync(topoJsonPath)) {
                // Try the districts folder
                topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'districts', `${stateName}.topo.json`);

                if (!fs.existsSync(topoJsonPath)) {
                    // Try without any subfolder
                    topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', `${stateName}.topo.json`);
                }
            }
        }

        if (fs.existsSync(topoJsonPath)) {
            try {
                const topoJsonData = fs.readFileSync(topoJsonPath, 'utf8');
                topoJson = JSON.parse(topoJsonData);

                // Determine the correct object key in the topojson
                objectKey = stateName;
                if (topoJson.objects && !topoJson.objects[stateName]) {
                    // If the direct stateName key doesn't exist, try common variations
                    const possibleKeys = [
                        `${stateName}-division-district`,  // Like in the assam file
                        `${stateName}-test`,              // Like in the haryana file
                        `${stateName}-division`,          // Like in the bihar file
                        `${stateName}-districts-divisions`,
                        `${stateName}-divisions-districts`,
                        `${stateName}-divisions`,
                        `${stateName}-districts`,
                        `${stateName}-states`,
                        // Additional variations for states like himachal-pradesh, madhya-pradesh, etc.
                        `${stateName.replace('-', '')}`,           // himachalpradesh instead of himachal-pradesh
                        `${stateName.replace('-', '')}-districts`, // himachalpradesh-districts
                        `${stateName.replace('-', '')}-divisions`, // himachalpradesh-divisions
                        `${stateName.replace('-', '')}-division`,  // himachalpradesh-division
                        `${stateName.replace('-', '')}-test`,      // himachalpradesh-test
                        // Specific known variations from debug
                        'hp-division',                           // himachal-pradesh variation
                        'MadhyaPradesh',                         // madhya-pradesh variation
                        'Manipur',                               // manipur variation
                        'Punjab',                                // punjab variation
                        stateName
                    ];

                    for (const key of possibleKeys) {
                        if (topoJson.objects && topoJson.objects[key]) {
                            objectKey = key;
                            break;
                        }
                    }

                    // If still no match, try with different name formats
                    if (!objectKey && location) {
                        const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
                        const possibleAlternativeKeys = [
                            normalizedLocation,
                            `${normalizedLocation}-division-district`,
                            `${normalizedLocation}-test`,
                            `${normalizedLocation}-division`,
                            `${normalizedLocation}-districts-divisions`,
                            `${normalizedLocation}-divisions-districts`,
                            `${normalizedLocation}-divisions`,
                            `${normalizedLocation}-districts`,
                            `${normalizedLocation}-states`,
                            // Additional variations for states like himachal-pradesh, madhya-pradesh, etc.
                            `${normalizedLocation.replace('-', '')}`,           // himachalpradesh instead of himachal-pradesh
                            `${normalizedLocation.replace('-', '')}-districts`, // himachalpradesh-districts
                            `${normalizedLocation.replace('-', '')}-divisions`, // himachalpradesh-divisions
                            `${normalizedLocation.replace('-', '')}-division`,  // himachalpradesh-division
                            `${normalizedLocation.replace('-', '')}-test`,      // himachalpradesh-test
                            // Specific known variations from debug
                            'hp-division',                           // himachal-pradesh variation
                            'MadhyaPradesh',                         // madhya-pradesh variation
                            'Manipur',                               // manipur variation
                            'Punjab'                                 // punjab variation
                        ];

                        for (const key of possibleAlternativeKeys) {
                            if (topoJson.objects && topoJson.objects[key]) {
                                objectKey = key;
                                break;
                            }
                        }
                    }

                    // If still no match, try with the first available key as fallback
                    if (!objectKey && topoJson.objects) {
                        const allKeys = Object.keys(topoJson.objects);
                        if (allKeys.length > 0) {
                            objectKey = allKeys[0];
                        }
                    }
                }

                // Convert topojson to geojson to get the geometry
                if (!topoJson.objects || !topoJson.objects[objectKey]) {
                    console.warn(`Object key '${objectKey}' not found in topojson file for location: ${location}, returning empty coordinates`);
                    res.json({ coordinates: [] }); // Return empty coordinates instead of error
                    return;
                }
                const geoJson = topojson.feature(topoJson, topoJson.objects[objectKey]);

                // Extract coordinates from the geometry
                let coordinates = [];

                if (geoJson.type === 'FeatureCollection') {
                    // If it's a collection of features, get the coordinates from all geometries
                    for (const feature of geoJson.features) {
                        coordinates = coordinates.concat(extractCoordinates(feature.geometry));
                    }
                } else {
                    // If it's a single feature, get coordinates from the geometry
                    coordinates = extractCoordinates(geoJson.geometry);
                }

                res.json({ coordinates });
                return;
            } catch (parseError) {
                console.error('Error parsing topojson file:', parseError);
                // Return mock boundaries if parsing fails
                res.json({ coordinates: [] });
                return;
            }
        } else {
            // File doesn't exist, return empty boundaries
            res.json({ coordinates: [] });
            return;
        }
    } catch (error) {
        console.error('Error in get boundaries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to extract coordinates from geometry
function extractCoordinates(geometry) {
    const coordinates = [];

    if (geometry.type === 'Polygon') {
        // For Polygon, the first element contains the outer ring
        for (const coord of geometry.coordinates[0]) {
            coordinates.push({ lat: coord[1], lng: coord[0] });
        }
    } else if (geometry.type === 'MultiPolygon') {
        // For MultiPolygon, each element is a polygon
        for (const polygon of geometry.coordinates) {
            for (const coord of polygon[0]) {  // Take only the outer ring
                coordinates.push({ lat: coord[1], lng: coord[0] });
            }
        }
    } else if (geometry.type === 'LineString') {
        // For LineString
        for (const coord of geometry.coordinates) {
            coordinates.push({ lat: coord[1], lng: coord[0] });
        }
    } else if (geometry.type === 'MultiLineString') {
        // For MultiLineString
        for (const lineString of geometry.coordinates) {
            for (const coord of lineString) {
                coordinates.push({ lat: coord[1], lng: coord[0] });
            }
        }
    } else if (geometry.type === 'Point') {
        // For Point
        coordinates.push({ lat: geometry.coordinates[1], lng: geometry.coordinates[0] });
    } else if (geometry.type === 'MultiPoint') {
        // For MultiPoint
        for (const coord of geometry.coordinates) {
            coordinates.push({ lat: coord[1], lng: coord[0] });
        }
    }

    return coordinates;
}

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

        // If all APIs fail, return an error
        if (articles.length === 0) {
            return res.status(500).json({ error: 'No news articles could be retrieved for the specified location' });
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

        // In a real implementation, this would fetch from historical data
        const historicalData = [];

        res.json(historicalData);
    } catch (error) {
        console.error('Error getting historical data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/get-location-statistics', async (req, res) => {
    try {
        const { location } = req.body;

        // In a real implementation, this would fetch from location statistics
        const locationStats = {};

        res.json(locationStats);
    } catch (error) {
        console.error('Error getting location statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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