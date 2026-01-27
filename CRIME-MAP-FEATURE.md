# Crime Safety Map Feature

## Overview
Interactive crime mapping system that visualizes safety index across different regions in India using color-coded markers and real-time crime data analysis.

## Features

### 1. **Location Verification**
- Uses AI (Cerebras/Mistral/Gemini) to verify if input is a valid state, district, or city
- Validates location hierarchy and type
- Returns confidence score for verification

### 2. **Data Collection**
- Scrapes news from multiple sources (Google News, Times of India, etc.)
- Collects crime-related articles for each sub-region
- Gathers 10+ articles per location for accurate analysis

### 3. **Safety Index Calculation**
- AI analyzes news articles to calculate safety index (0-100)
- Considers multiple crime types:
  - Theft
  - Assault
  - Harassment
  - Robbery
  - Vandalism
  - Other crimes
- Aggregates emotional sentiment from news

### 4. **Color Coding System**
```
🔴 Red (0-40):    High Crime Areas
🟡 Yellow (41-70): Medium Crime Areas
🟢 Green (71-100): Low Crime Areas
```

### 5. **Interactive Map**
- Built with Leaflet.js for smooth interaction
- Click markers to see detailed crime statistics
- Zoom and pan to explore different areas
- Auto-fits to show all analyzed regions

### 6. **Real-time Statistics**
- Total locations analyzed
- Average safety index
- Count of high/medium/low crime areas
- Sorted region list by safety

## How to Use

### 1. Start the Server
```bash
node server.js
```

### 2. Open Crime Map
Navigate to: `http://localhost:3000/crime-map.html`

### 3. Select a Region
- Choose a state from the dropdown (e.g., Haryana, Delhi, Maharashtra)
- Click "Analyze Region"
- Wait for analysis to complete (2-5 minutes)

### 4. Explore Results
- View color-coded markers on the map
- Click markers for detailed crime statistics
- Check sidebar for summary statistics
- Browse analyzed regions list

## Supported Regions

### Pre-configured States:
- **Haryana**: Gurugram, Faridabad, Panchkula, Ambala, Karnal, Panipat, Rohtak, Hisar
- **Delhi**: Central, North, South, East, West, New Delhi
- **Maharashtra**: Mumbai, Pune, Nagpur, Thane, Nashik, Aurangabad
- **Karnataka**: Bangalore, Mysore, Mangalore, Hubli, Belgaum
- **Tamil Nadu**: Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem
- **Uttar Pradesh**: Lucknow, Kanpur, Ghaziabad, Agra, Varanasi, Meerut
- **West Bengal**: Kolkata, Howrah, Durgapur, Asansol, Siliguri
- **Rajasthan**: Jaipur, Jodhpur, Udaipur, Kota, Ajmer, Bikaner
- **Gujarat**: Ahmedabad, Surat, Vadodara, Rajkot, Bhavnagar
- **Punjab**: Ludhiana, Amritsar, Jalandhar, Patiala, Bathinda

## API Endpoint

### POST `/api/crime-map`

**Request Body:**
```json
{
  "region": "Haryana",
  "subRegions": ["Gurugram", "Faridabad"] // Optional
}
```

**Response:**
```json
{
  "region": "Haryana",
  "regionType": "state",
  "subRegions": [
    {
      "name": "Gurugram",
      "safetyIndex": 65,
      "crimeStats": {
        "theft": 12,
        "assault": 5,
        "harassment": 3,
        "robbery": 2,
        "vandalism": 1,
        "other": 4
      },
      "location": {
        "lat": 28.4595,
        "lon": 77.0266,
        "name": "Gurugram"
      },
      "articlesCount": 10,
      "apiUsed": "cerebras"
    }
  ],
  "totalAnalyzed": 8,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## Technical Architecture

### Frontend (crime-map.html)
- Leaflet.js for interactive mapping
- Responsive design with mobile support
- Real-time statistics dashboard
- Color-coded visualization

### Backend (server.js)
- Express.js API endpoint
- AI-powered location verification
- News scraping integration
- Geoapify for geocoding

### AI Analysis (ai-api-manager.js)
- Multi-AI fallback system
- Cerebras (primary) → Mistral → Gemini
- Sentiment analysis
- Crime statistics extraction

### Map Module (crime-map.js)
- Marker management
- Color coding logic
- Statistics calculation
- Legend and popup generation

## Safety Index Algorithm

The safety index is calculated by AI based on:

1. **Crime Frequency**: Number of reported crimes
2. **Crime Severity**: Type and impact of crimes
3. **Emotional Sentiment**: Public sentiment from news
4. **Temporal Trends**: Recent vs historical data
5. **Comparative Analysis**: Relative to other regions

Formula (AI-generated):
```
Safety Index = 100 - (
  (Crime_Frequency × 0.4) +
  (Crime_Severity × 0.3) +
  (Negative_Sentiment × 0.2) +
  (Trend_Factor × 0.1)
)
```

## Customization

### Add New Regions
Edit `server.js` in the `getSubRegions()` function:

```javascript
const regionMap = {
    'your_state': ['City1', 'City2', 'City3']
};
```

### Adjust Color Thresholds
Edit `crime-map.js`:

```javascript
this.thresholds = {
    high: 40,      // 0-40: Red
    medium: 70     // 41-70: Yellow, 71-100: Green
};
```

### Change Map Center
Edit `crime-map.html`:

```javascript
crimeMap.initMap([latitude, longitude], zoomLevel);
```

## Performance Considerations

- **Analysis Time**: 2-5 minutes for 8-10 sub-regions
- **API Calls**: ~10 news scrapes + 10 AI analyses per region
- **Rate Limits**: Automatic fallback between AI providers
- **Caching**: Consider implementing for frequently accessed regions

## Future Enhancements

1. **Historical Data**: Track safety index changes over time
2. **Heatmap Layer**: Gradient visualization instead of markers
3. **Predictive Analysis**: Forecast future crime trends
4. **User Reports**: Allow community-submitted safety data
5. **Export Features**: Download maps as images or PDFs
6. **Comparison Mode**: Compare multiple regions side-by-side
7. **Alert System**: Notify users of safety changes
8. **Mobile App**: Native iOS/Android applications

## Troubleshooting

### No Data Showing
- Check if server is running on port 3000
- Verify API keys in `.env` file
- Check browser console for errors

### Slow Analysis
- Normal for first-time analysis (2-5 minutes)
- Reduce number of sub-regions analyzed
- Check internet connection

### Incorrect Safety Index
- Verify news sources are accessible
- Check AI API status
- Review scraped articles quality

## Credits

- **Mapping**: Leaflet.js, OpenStreetMap
- **Geocoding**: Geoapify API
- **AI Analysis**: Cerebras, Mistral, Gemini
- **News Sources**: Google News, Times of India

## License

This feature is part of the City Emotional Map project.
