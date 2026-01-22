// Data Integration Module for Emotional Map Application
// Handles integration with various data sources and services

class DataIntegration {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Load API configuration from external file or environment
        if (window.API_CONFIG) {
            console.log('API configuration loaded successfully');
        } else {
            console.warn('API configuration not found, using default values');
        }
    }

    // Function to fetch geographic boundaries for locations
    async fetchLocationBoundaries(location) {
        try {
            const response = await fetch('/api/get-boundaries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const boundaryData = await response.json();
            return boundaryData.coordinates || [];
        } catch (error) {
            console.error('Error fetching location boundaries:', error);
            return [];
        }
    }



    // Function to validate API keys
    validateAPIKeys() {
        const requiredKeys = ['GEOAPIFY_API_KEY'];
        const missingKeys = [];

        requiredKeys.forEach(key => {
            if (!window.API_CONFIG || !window.API_CONFIG[key]) {
                missingKeys.push(key);
            }
        });

        if (missingKeys.length > 0) {
            console.warn('Missing API keys:', missingKeys);
            return false;
        }

        return true;
    }

    // Store emotional analysis results
    async storeEmotionalAnalysis(location, emotionalAnalysis) {
        try {
            const response = await fetch('/api/store-emotional-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    emotionalAnalysis: emotionalAnalysis,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log('Emotional analysis stored successfully:', result);
            return result;
        } catch (error) {
            console.error('Error storing emotional analysis:', error);
            throw error;
        }
    }

    // Store raw news data
    async storeRawNewsData(newsData) {
        try {
            const response = await fetch('/api/store-raw-news-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newsData: newsData
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log(`Stored ${result.count} news articles successfully`);
            return result;
        } catch (error) {
            console.error('Error storing news data:', error);
            throw error;
        }
    }

    // Store image analysis data
    async storeImageAnalysis(imagesWithAnalysis) {
        try {
            const response = await fetch('/api/store-image-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imagesWithAnalysis: imagesWithAnalysis
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log('Image analysis stored successfully:', result);
            return result;
        } catch (error) {
            console.error('Error storing image analysis:', error);
            throw error;
        }
    }

    // Upload processed data
    async uploadProcessedData(data, dataType, location) {
        try {
            const response = await fetch('/api/upload-processed-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: data,
                    dataType: dataType,
                    location: location
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log('Processed data uploaded successfully:', result);
            return result;
        } catch (error) {
            console.error('Error uploading processed data:', error);
            throw error;
        }
    }

    // Clean up old data
    async cleanupOldData(daysToKeep) {
        try {
            const response = await fetch('/api/cleanup-old-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    daysToKeep: daysToKeep
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log('Old data cleaned up successfully:', result);
            return result;
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            throw error;
        }
    }

    // Get historical data for a location
    async getHistoricalData(location, daysBack = 30) {
        try {
            const response = await fetch('/api/get-historical-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    daysBack: daysBack
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const historicalData = await response.json();
            return historicalData;
        } catch (error) {
            console.error('Error getting historical data:', error);
            throw error;
        }
    }

    // Get location statistics
    async getLocationStatistics(location) {
        try {
            const response = await fetch('/api/get-location-statistics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const locationStats = await response.json();
            return locationStats;
        } catch (error) {
            console.error('Error getting location statistics:', error);
            throw error;
        }
    }
}

// Export functions for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataIntegration;
}

// Make the class available globally in browser
if (typeof window !== 'undefined') {
    window.DataIntegration = DataIntegration;
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Data integration module initialized');
});