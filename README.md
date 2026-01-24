# City Emotional Map - Real-Time Mood Detection System

<div align="center">
  <img src="gemini+cloud.png" alt="Mistral AI Visualization" width="500"/>
</div>

This application creates a real-time emotional map of Indian cities using Mistral AI, Geoapify maps, multiple news APIs, and data visualization.

## Features

- Interactive map with location search for Indian cities using Geoapify
- Real-time emotion analysis using Mistral AI
- News crawling from multiple news APIs (NewsData.io, GNews, MediaStack, Currents, Newscatcher, Bing News, ContextualWeb, Apify, EventRegistry)
- Data visualization with pie charts and bar graphs
- Safety index calculation
- Automatic updates every 6 hours
- Responsive and interactive UI with animations

## Setup Instructions

### Prerequisites

- Geoapify API key
- Mistral AI API key

### Configuration

1. Obtain a Geoapify API key from the [Geoapify website](https://www.geoapify.com/)
2. Obtain a Mistral AI API key
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
4. Update the API keys in the following files:
   - `api-config.js` - Update all API keys in this centralized configuration file
   - `server.js` - Update news API keys in the NEWS_API_KEYS configuration
5. Install dependencies: `npm install`

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
- `mistral-api.js` - Mistral AI integration
- `crawler.js` - News crawling functionality
- `visualization.js` - Data visualization components
- `data-integration.js` - Data integration services
- `main-integration.js` - Orchestrates all components
- `api-config.js` - Centralized API configuration
- `server.js` - Backend server with news API integrations
- `package.json` - Project dependencies and configuration

## How It Works

```mermaid
flowchart LR
    A[User enters location in search bar] --> B{Request sent to server}
    B --> C[Crawl multiple news APIs for location-specific content]
    C --> D{Aggregate news articles}
    D --> E[Send content to Mistral AI for emotion analysis]
    E --> F{Analyze emotional sentiment and safety index}
    F --> G[Aggregate all emotional data]
    G --> H{Generate comprehensive emotional profile}
    H --> I[Display results on map & charts]
    H --> J[Store data for historical analysis]
    I --> K[Update every 6 hours automatically]
    J --> K
```

1. User enters a location in the search bar
2. The system crawls multiple news APIs for location-specific content
3. Mistral AI analyzes the content for emotional sentiment
4. Results are displayed on the map and in data visualization charts
5. Data is stored for historical analysis
6. The system updates automatically every 6 hours

## System Architecture

```mermaid
graph TD
    A[User Interface - HTML/CSS/JS] --> B[Geoapify Maps API]
    A --> C[Mistral API]
    A --> D[News APIs]
    D --> E[NewsData.io, GNews, MediaStack, Currents, Newscatcher, Bing News, ContextualWeb, Apify, EventRegistry]
    C --> F[Mistral AI Processing]
    D --> G[News Content Analysis]
    F --> H[Emotion Analysis]
    G --> H
    H --> I[Data Aggregation]
    I --> J[Visualization - Chart.js]
    B --> A
    J --> A
```

## Technology Stack

### Programming Languages
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) JavaScript (ES6+)
- ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) Node.js
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) HTML5
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) CSS3

### Frontend
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) HTML5
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) CSS3
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) JavaScript (ES6+)
- Leaflet.js with Geoapify
- Chart.js

### Backend
- ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) Node.js
- ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white) Express.js
- Axios (HTTP client)

### AI & Analytics
- Google Gemini AI (gemini-2.0-flash-exp)
- Emotion Analysis Algorithms
- Multimodal Analysis (Text + Images)

### News APIs
- NewsData.io API
- GNews API
- MediaStack API
- Currents API
- Newscatcher API
- Bing News API
- ContextualWeb API
- Apify API
- EventRegistry API

### Mapping Services
- Geoapify
- Leaflet.js

### Other Technologies
- Responsive design with CSS Grid and Flexbox

## Privacy and Ethics

This system is designed to analyze publicly available information only. All data processing respects privacy regulations and ethical guidelines for AI usage.