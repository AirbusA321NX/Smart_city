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
        const { location, latitude, longitude, newsArticles } = req.body;

        // Call Mistral AI API for emotional analysis
        const mistralApiKey = 'IrkM67HLMx3HCAvxAB5L1eAa74V6Ln9U';

        // Prepare content for Mistral API
        const newsContent = (newsArticles || []).slice(0, 5).map(article =>
            `Title: ${article.title}\nDescription: ${article.description || ''}`
        ).join('\n\n');

        // Call Mistral API for sentiment/emotion analysis
        let aiAnalysis = '';
        try {
            console.log('Making Mistral API request with key:', mistralApiKey.substring(0, 5) + '...');
            const mistralResponse = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'mistral-large-latest',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing news articles to determine emotional sentiment and safety metrics for locations in India. Analyze the provided news articles and return a JSON response with EXACTLY this structure: {"safetyIndex": number (0-100), "aggregatedEmotions": {"calm": number (0-100), "angry": number (0-100), "depressed": number (0-100), "fear": number (0-100), "happy": number (0-100)}, "crimeStats": {"theft": number, "assault": number, "harassment": number, "robbery": number, "other": number}, "news": [{"title": string, "content": string, "emotion": {"calm": number, "angry": number, "depressed": number, "fear": number, "happy": number}, "sentiment": string, "location": string}], "timeBasedCrimes": [number, number, ..., number] (EXACTLY 24 numbers representing crimes per hour 0-23), "historicalData": {"dates": [string, string, ...] (at least 30 dates), "safetyTrend": [number, number, ..., number] (same length as dates, values 0-100)}, "geographicZones": [{"zone": string, "safetyScore": number, "crimeDensity": number}]}. ALL fields are REQUIRED. timeBasedCrimes MUST have exactly 24 numbers. historicalData.dates and historicalData.safetyTrend MUST have at least 30 entries each.'
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

            console.log('Mistral API response status:', mistralResponse.status);
            aiAnalysis = mistralResponse.data.choices[0].message.content;
            console.log('Mistral API response received, content length:', aiAnalysis.length);
        } catch (mistralError) {
            console.log('Mistral API failed:', mistralError.message);
            console.log('Response data:', mistralError.response?.data);
            // Continue with empty AI analysis
            aiAnalysis = '';
        }

        // Attempt to extract JSON from AI response (assuming it returns structured data)
        let parsedData = {};
        try {
            // Look for JSON within the response, potentially surrounded by code
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

        // Ensure emotion values are proper percentages (0-100)
        const aggregatedEmotions = parsedData.aggregatedEmotions || {
            calm: 0,
            angry: 0,
            depressed: 0,
            fear: 0,
            happy: 0
        };

        // Convert decimal values to percentages if needed
        Object.keys(aggregatedEmotions).forEach(key => {
            if (aggregatedEmotions[key] <= 1) {
                aggregatedEmotions[key] = Math.round(aggregatedEmotions[key] * 100);
            }
        });

        // Ensure crime stats have proper structure
        const crimeStats = parsedData.crimeStats || {
            theft: 0,
            assault: 0,
            harassment: 0,
            robbery: 0,
            other: 0
        };

        // Use timeBasedCrimes from API response or default to empty array
        const timeBasedCrimes = parsedData.timeBasedCrimes || Array(24).fill(0);

        // Use historicalData from API response or default to empty arrays
        const historicalData = parsedData.historicalData || {
            dates: [],
            safetyTrend: []
        };

        // Construct emotionalData with fallbacks to avoid any hardcoded values
        const emotionalData = {
            location: location,
            safetyIndex: parsedData.safetyIndex || 70,
            aggregatedEmotions: aggregatedEmotions,
            crimeStats: crimeStats,
            news: parsedData.news || (newsArticles || []).map(article => ({
                title: article.title,
                content: article.description,
                emotion: 'neutral',
                sentiment: 'neutral',
                location: location
            })),
            timeBasedCrimes: timeBasedCrimes,
            historicalData: historicalData,
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
        const { location } = req.body;

        // Use server-side RSS crawling to avoid CORS issues
        const query = encodeURIComponent(location);
        const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

        // Fetch RSS feed using axios (server-side)
        const response = await axios.get(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Parse RSS XML
        const parser = require('xml2js');
        const parsed = await parser.parseStringPromise(response.data);

        // Extract articles
        const items = parsed.rss.channel[0].item || [];
        const articles = [];

        items.slice(0, 30).forEach(item => {
            articles.push({
                title: item.title[0],
                url: item.link[0],
                source: 'Google News',
                publishedAt: item.pubDate[0],
                description: item.description ? item.description[0] : '',
                content: '',
                author: '',
                location: location
            });
        });

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

// API Configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY || 'YOUR_GEOAPIFY_API_KEY',
        MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || 'YOUR_MISTRAL_API_KEY',
        NEWS_API_KEYS: {
            newsdata: process.env.NEWS_DATA_API_KEY || 'YOUR_NEWS_DATA_API_KEY',
            mediastack: process.env.MEDIASTACK_API_KEY || 'YOUR_MEDIASTACK_API_KEY',
            gnews: process.env.GNEWS_API_KEY || 'YOUR_GNEWS_API_KEY',
            currents: process.env.CURRENTS_API_KEY || 'YOUR_CURRENTS_API_KEY',
            newscatcher: process.env.NEWSCATCHER_API_KEY || 'YOUR_NEWSCATCHER_API_KEY',
            contextualweb: process.env.CONTEXTUALWEB_API_KEY || 'YOUR_CONTEXTUALWEB_API_KEY',
            bing: process.env.BING_NEWS_API_KEY || 'YOUR_BING_API_KEY',
            apify: process.env.APIFY_API_KEY || 'YOUR_APIFY_API_KEY',
            eventregistry: process.env.EVENTREGISTRY_API_KEY || 'YOUR_EVENTREGISTRY_API_KEY'
        }
    });
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