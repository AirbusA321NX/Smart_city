# City Emotional Map - Real-Time Mood Detection System

This application creates a real-time emotional map of Indian cities using Google Gemini AI, news crawling, and data visualization.

## Features

- Interactive map with location search for Indian cities
- Real-time emotion analysis using Google Gemini
- News crawling from major Indian news sources
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
3. Create a Google Cloud project and enable required APIs
4. Update the API keys in the following files:
   - `index.html` - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key
   - `main-integration.js` - Replace `YOUR_GEMINI_API_KEY` with your actual key
   - `google-cloud-integration.js` - Update configuration with your project details

### Running the Application

1. Save all files to a local directory
2. Open `index.html` in a web browser
3. Enter an Indian city name in the search bar
4. View the emotional analysis results on the map and charts

## Files Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and animations
- `app.js` - Core application logic and map functionality
- `gemini-api.js` - Google Gemini integration
- `crawler.js` - News crawling functionality
- `visualization.js` - Data visualization components
- `google-cloud-integration.js` - Google Cloud services integration
- `main-integration.js` - Orchestrates all components
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
- Google Maps JavaScript API
- Google Gemini AI
- Google Cloud Platform (BigQuery, Cloud Storage)
- Chart.js for data visualization
- Responsive design with CSS Grid and Flexbox

## Privacy and Ethics

This system is designed to analyze publicly available information only. All data processing respects privacy regulations and ethical guidelines for AI usage.