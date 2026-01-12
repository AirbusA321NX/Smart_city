// Main Integration File for City Emotional Map
// This file orchestrates all components of the emotional mapping system

class CityEmotionalMapSystem {
    constructor() {
        this.mistralAnalyzer = null;
        this.newsCrawler = null;
        this.visualizer = null;
        this.cloudIntegration = null;
        this.currentLocation = null;
        this.isProcessing = false;
        this.updateInterval = null;

        this.init();
    }

    async init() {
        console.log('Initializing City Emotional Map System...');

        // Wait for all components to be available
        await this.waitForComponents();

        // Initialize components
        this.initializeComponents();

        // Set up event listeners
        this.setupEventListeners();

        console.log('City Emotional Map System initialized');
    }

    // Wait for all component scripts to load
    async waitForComponents() {
        const checkComponent = (componentName, timeout = 5000) => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                const check = () => {
                    if (window[componentName]) {
                        resolve(window[componentName]);
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error(`${componentName} did not load in time`));
                    } else {
                        setTimeout(check, 100);
                    }
                };

                check();
            });
        };

        try {
            // Wait for all components to be available
            await Promise.all([
                checkComponent('MistralEmotionAnalyzer'),
                checkComponent('IndianNewsCrawler'),
                checkComponent('EmotionalMapVisualizer'),
                checkComponent('DataIntegration')
            ]);
        } catch (error) {
            console.error('Error waiting for components:', error);
            throw error;
        }
    }

    // Initialize all components
    initializeComponents() {
        // Initialize Mistral Analyzer
        this.mistralAnalyzer = new window.MistralEmotionAnalyzer(window.API_CONFIG?.MISTRAL_API_KEY || 'YOUR_MISTRAL_API_KEY');

        // Initialize News Crawler
        this.newsCrawler = new window.IndianNewsCrawler();

        // Get reference to visualizer
        this.visualizer = window.emotionalMapVisualizer;

        // Get reference to data integration
        this.cloudIntegration = window.dataIntegration;

        // Start periodic crawling
        this.newsCrawler.schedulePeriodicCrawling();
    }

    // Set up event listeners
    setupEventListeners() {
        // Listen for location search events
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleLocationSearch();
        });

        document.getElementById('location-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLocationSearch();
            }
        });
    }

    // Handle location search
    async handleLocationSearch() {
        if (this.isProcessing) {
            console.log('Processing already in progress, skipping request');
            return;
        }

        const locationInput = document.getElementById('location-search');
        const location = locationInput.value.trim();

        if (!location) {
            alert('Please enter a location');
            return;
        }

        this.isProcessing = true;
        this.showLoading(true);

        try {
            console.log(`Processing location: ${location}`);

            // Crawl news for the location
            const newsData = await this.newsCrawler.crawlNewsForLocation(location);
            console.log(`Retrieved ${newsData.length} news articles`);

            // Perform emotional analysis using Mistral (image/audio data will use default analysis as Mistral doesn't support direct image/audio processing)
            const emotionalAnalysis = await this.mistralAnalyzer.analyzeLocationEmotions(
                location,
                newsData
            );

            console.log('Emotional analysis completed:', emotionalAnalysis);

            // Update the visualization
            this.visualizer.updateChartData(emotionalAnalysis);

            // Store results in data storage
            await this.storeResults(location, emotionalAnalysis, newsData);

            // Update current location
            this.currentLocation = location;

            // Set up periodic updates for this location
            this.setupPeriodicUpdates();

        } catch (error) {
            console.error('Error processing location:', error);
            alert(`Error processing location: ${error.message}`);
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    // Store results in data storage
    async storeResults(location, emotionalAnalysis, newsData) {
        try {
            // Store emotional analysis
            await this.cloudIntegration.storeEmotionalAnalysis(location, emotionalAnalysis);

            // Store raw news data
            await this.cloudIntegration.storeRawNewsData(newsData);

            console.log('Results stored successfully');
        } catch (error) {
            console.error('Error storing results:', error);
            // Don't throw error here as it shouldn't stop the UI flow
        }
    }

    // Set up periodic updates for the current location
    setupPeriodicUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Set up new interval (every 6 hours in production, every 30 seconds for demo)
        this.updateInterval = setInterval(async () => {
            if (this.currentLocation) {
                await this.updateLocationData(this.currentLocation);
            }
        }, 30000); // 30 seconds for demo, change to 6*60*60*1000 for 6 hours
    }

    // Update data for a specific location
    async updateLocationData(location) {
        if (this.isProcessing) return;

        console.log(`Updating data for location: ${location}`);

        try {
            // Crawl news for the location
            const newsData = await this.newsCrawler.crawlNewsForLocation(location);

            // Perform emotional analysis (image/audio data will use default analysis as Mistral doesn't support direct image/audio processing)
            const emotionalAnalysis = await this.mistralAnalyzer.analyzeLocationEmotions(
                location,
                newsData
            );

            // Update visualization
            this.visualizer.updateChartData(emotionalAnalysis);

            // Store results
            await this.storeResults(location, emotionalAnalysis, newsData);

            console.log('Location data updated successfully');
        } catch (error) {
            console.error('Error updating location data:', error);
        }
    }

    // Show/hide loading indicator
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');

        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    // Export data for the current location
    async exportLocationData(format = 'csv') {
        if (!this.currentLocation) {
            alert('No location selected for export');
            return;
        }

        try {
            // Get the latest data for the location
            const stats = await this.cloudIntegration.getLocationStatistics(this.currentLocation);

            if (format === 'csv') {
                // Export as CSV using the visualizer's method
                if (this.visualizer && this.visualizer.exportDataAsCSV) {
                    this.visualizer.exportDataAsCSV(stats, `${this.currentLocation}_emotional_data.csv`);
                }
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            alert(`Error exporting data: ${error.message}`);
        }
    }

    // Get system status
    getSystemStatus() {
        return {
            components: {
                mistral: !!this.mistralAnalyzer,
                crawler: !!this.newsCrawler,
                visualizer: !!this.visualizer,
                cloud: !!this.cloudIntegration
            },
            currentLocation: this.currentLocation,
            isProcessing: this.isProcessing,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.cityEmotionalMapSystem = new CityEmotionalMapSystem();
        console.log('City Emotional Map System is ready');
    } catch (error) {
        console.error('Failed to initialize City Emotional Map System:', error);
    }
});

// Add export functionality to the UI
document.addEventListener('DOMContentLoaded', () => {
    // Add export button if it doesn't exist
    if (!document.getElementById('export-btn')) {
        const panelHeader = document.querySelector('.panel-header');
        if (panelHeader) {
            const exportBtn = document.createElement('button');
            exportBtn.id = 'export-btn';
            exportBtn.textContent = 'Export Data';
            exportBtn.style.cssText = `
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                padding: 8px 15px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            `;

            exportBtn.addEventListener('mouseenter', () => {
                exportBtn.style.background = 'rgba(255, 255, 255, 0.3)';
            });

            exportBtn.addEventListener('mouseleave', () => {
                exportBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            });

            exportBtn.addEventListener('click', () => {
                if (window.cityEmotionalMapSystem) {
                    window.cityEmotionalMapSystem.exportLocationData();
                }
            });

            panelHeader.appendChild(exportBtn);
        }
    }
});