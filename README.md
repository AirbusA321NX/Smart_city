# City Emotional Map - Real-Time Mood Detection System

This application creates a real-time emotional map of Indian cities using Google Gemini AI, multiple news APIs, and data visualization.

## Features

- Interactive map with location search for Indian cities
- Real-time emotion analysis using Google Gemini
- News crawling from multiple news APIs (NewsData.io, GNews, MediaStack, Currents, Newscatcher, Bing News, ContextualWeb, Apify, EventRegistry)
- Data visualization with pie charts and bar graphs
- Safety index calculation
- Automatic updates every 6 hours
- Responsive and interactive UI with animations

## Setup Instructions

### Prerequisites

- A Google Cloud Platform account with billing enabled
- Google Maps API key
- Google Gemini API key
- Access to Google Cloud services (BigQuery, Cloud Storage)

### Configuration

1. Obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Obtain a Google Gemini API key
3. Obtain API keys for news services (optional but recommended):
   - NewsData.io API key
   - GNews API key
   - MediaStack API key
   - Currents API key
   - Newscatcher API key
   - Bing News API key
   - ContextualWeb API key
   - Apify API key
   - EventRegistry API key
4. Create a Google Cloud project and enable required APIs
5. Update the API keys in the following files:
   - `index.html` - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key
   - `api-config.js` - Update all API keys in this centralized configuration file
   - `server.js` - Update news API keys in the NEWS_API_KEYS configuration
6. Install dependencies: `npm install`

### Running the Application

1. Save all files to a local directory
2. Install dependencies: `npm install`
3. Start the server: `node server.js`
4. Open `index.html` in a web browser (make sure to serve it through a local web server, not directly from file system due to CORS restrictions)
5. Enter an Indian city name in the search bar
6. View the emotional analysis results on the map and charts

## Files Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and animations
- `app.js` - Core application logic and map functionality
- `gemini-api.js` - Google Gemini integration
- `crawler.js` - News crawling functionality
- `visualization.js` - Data visualization components
- `google-cloud-integration.js` - Google Cloud services integration
- `main-integration.js` - Orchestrates all components
- `api-config.js` - Centralized API configuration
- `server.js` - Backend server with news API integrations
- `package.json` - Project dependencies and configuration
- `google-powered-by.svg` - Google branding

## How It Works

1. User enters a location in the search bar
2. The system crawls Indian news sources for location-specific content
3. Google Gemini analyzes the content for emotional sentiment
4. Results are displayed on the map and in data visualization charts
5. Data is stored in Google Cloud for historical analysis
6. The system updates automatically every 6 hours

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Node.js server with Express.js
- Google Maps JavaScript API
- Google Gemini AI
- Multiple News APIs (NewsData.io, GNews, MediaStack, Currents, Newscatcher, Bing News, ContextualWeb, Apify, EventRegistry)
- Google Cloud Platform (BigQuery, Cloud Storage)
- Chart.js for data visualization
- Responsive design with CSS Grid and Flexbox

## Privacy and Ethics

This system is designed to analyze publicly available information only. All data processing respects privacy regulations and ethical guidelines for AI usage.