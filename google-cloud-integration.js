// Google Cloud API Integration for Emotional Map System
class GoogleCloudIntegration {
    constructor(config) {
        this.config = config || {};
        this.projectId = config.projectId;
        this.apiKey = config.apiKey;
        this.credentials = config.credentials;

        // Initialize services
        this.bigQueryClient = null;
        this.storageClient = null;
        this.vertexAIEndpoint = null;

        // Initialize the integration
        this.initializeServices();
    }

    // Initialize Google Cloud services
    async initializeServices() {
        console.log('Initializing Google Cloud services...');

        try {
            // Initialize BigQuery client
            await this.initializeBigQuery();

            // Initialize Cloud Storage client
            await this.initializeStorage();

            // Initialize Vertex AI endpoint
            this.initializeVertexAI();

            console.log('Google Cloud services initialized successfully');
        } catch (error) {
            console.error('Error initializing Google Cloud services:', error);
        }
    }

    // Initialize BigQuery client
    async initializeBigQuery() {
        // For client-side usage, we'll prepare configuration for server-side processing
        // since BigQuery client library requires server-side execution
        this.bigQueryConfig = {
            projectId: this.projectId,
            keyFilename: this.config.keyFilename // Path to service account key file
        };
    }

    // Initialize Cloud Storage client
    async initializeStorage() {
        // For client-side usage, we'll prepare configuration for server-side processing
        // since Cloud Storage client library requires server-side execution
        this.storageConfig = {
            projectId: this.projectId,
            keyFilename: this.config.keyFilename, // Path to service account key file
            bucketName: this.config.bucketName
        };
    }

    // Initialize Vertex AI endpoint
    initializeVertexAI() {
        // For client-side usage, we'll prepare configuration for server-side processing
        // since Mistral AI client library requires server-side execution
        this.vertexAIConfig = {
            apiEndpoint: 'https://api.mistral.ai', // Mistral API endpoint
            keyFilename: this.config.keyFilename, // Path to service account key file
            // location: this.config.region // Not applicable for Mistral API
        };
    }

    // Store emotional analysis results in BigQuery
    async storeEmotionalAnalysis(location, analysisResult) {
        // Send data to backend API for processing and storage in BigQuery
        try {
            const response = await fetch('/api/store-emotional-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    timestamp: new Date().toISOString(),
                    safety_index: analysisResult.safetyIndex,
                    calm_percentage: analysisResult.aggregatedEmotions.calm,
                    angry_percentage: analysisResult.aggregatedEmotions.angry,
                    depressed_percentage: analysisResult.aggregatedEmotions.depressed,
                    fear_percentage: analysisResult.aggregatedEmotions.fear,
                    happy_percentage: analysisResult.aggregatedEmotions.happy,
                    crime_statistics: JSON.stringify(analysisResult.crimeStats),
                    news_summary: JSON.stringify(analysisResult.newsSummary),
                    crowd_behavior: analysisResult.crowdBehavior,
                    stress_levels: JSON.stringify(analysisResult.stressLevels),
                    source_system: 'Emotional Map System'
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            console.log('Emotional analysis stored successfully in BigQuery');
            return true;
        } catch (error) {
            console.error('Error storing emotional analysis:', error);
            throw error;
        }
    }

    // Store raw news data in BigQuery
    async storeRawNewsData(newsData) {
        // Send data to backend API for processing and storage in BigQuery
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

            console.log(`Stored ${newsData.length} news articles in BigQuery`);
            return { success: true, count: newsData.length };
        } catch (error) {
            console.error('Error storing news data:', error);
            throw error;
        }
    }

    // Store image analysis results in Cloud Storage
    async storeImageAnalysis(imagesWithAnalysis) {
        // Send data to backend API for processing and storage in Cloud Storage
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
            console.log(`Stored image analysis results in Cloud Storage`);
            return result;
        } catch (error) {
            console.error('Error storing image analysis:', error);
            throw error;
        }
    }

    // Query historical data from BigQuery
    async getHistoricalData(location, daysBack = 7) {
        // Send request to backend API to query historical data from BigQuery
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

            const rows = await response.json();

            console.log(`Retrieved ${rows.length} historical records for ${location}`);
            return rows;
        } catch (error) {
            console.error('Error querying historical data:', error);
            throw error;
        }
    }

    // Get aggregated statistics for a location
    async getLocationStatistics(location) {
        // Send request to backend API to get aggregated statistics
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

            const result = await response.json();

            if (result) {
                console.log(`Retrieved statistics for ${location}`);
                return result;
            } else {
                console.log(`No statistics found for ${location}`);
                return null;
            }
        } catch (error) {
            console.error('Error getting location statistics:', error);
            throw error;
        }
    }

    // Upload processed data to Cloud Storage
    async uploadProcessedData(data, dataType, location) {
        // Send data to backend API for upload to Cloud Storage
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

            console.log(`Uploaded ${dataType} data for ${location} to Cloud Storage`);
            return result;
        } catch (error) {
            console.error(`Error uploading ${dataType} data:`, error);
            throw error;
        }
    }

    // Batch process and store emotional analysis
    async batchProcessAndStore(location, analysisResults) {
        console.log(`Batch processing ${analysisResults.length} analysis results for ${location}`);

        // Store in BigQuery
        const bigQueryResults = [];
        for (const result of analysisResults) {
            try {
                await this.storeEmotionalAnalysis(location, result);
                bigQueryResults.push({ success: true });
            } catch (error) {
                bigQueryResults.push({ success: false, error: error.message });
            }
        }

        // Upload to Cloud Storage as backup
        try {
            await this.uploadProcessedData(
                analysisResults,
                'emotional_analysis_batch',
                location
            );
        } catch (error) {
            console.error('Error uploading batch to Cloud Storage:', error);
        }

        return {
            bigQueryResults: bigQueryResults,
            totalProcessed: analysisResults.length,
            timestamp: new Date().toISOString()
        };
    }

    // Clean up old data (retention policy)
    async cleanupOldData(daysToKeep = 30) {
        // Send request to backend API to clean up old data
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

            console.log(`Cleaned up data older than ${daysToKeep} days`);
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            throw error;
        }
    }

    // Get system health and metrics
    async getSystemHealth() {
        try {
            // Check if all services are initialized
            const servicesStatus = {
                bigQuery: !!this.bigQueryConfig,
                storage: !!this.storageConfig,
                vertexAI: !!this.vertexAIConfig,
                overall: !!(this.bigQueryConfig && this.storageConfig && this.vertexAIConfig)
            };

            // Get some basic metrics
            const metrics = {
                timestamp: new Date().toISOString(),
                activeConnections: 1, // Simplified
                serviceUptime: '99.9%' // Simplified
            };

            return {
                status: servicesStatus,
                metrics: metrics,
                message: 'System operational'
            };
        } catch (error) {
            console.error('Error getting system health:', error);
            return {
                status: { overall: false },
                error: error.message
            };
        }
    }

    // Initialize data retention job
    scheduleDataRetentionJob() {
        console.log('Scheduling data retention job...');

        // Run cleanup every 24 hours
        setInterval(async () => {
            try {
                await this.cleanupOldData();
            } catch (error) {
                console.error('Error during scheduled cleanup:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
    }
}

// Configuration will be loaded from external source
const gcConfig = {
    projectId: window.API_CONFIG?.GC_PROJECT_ID || 'your-project-id',
    region: window.API_CONFIG?.GC_REGION || 'us-central1',
    apiKey: window.API_CONFIG?.GC_API_KEY || 'your-api-key',
    bucketName: window.API_CONFIG?.GC_BUCKET_NAME || 'your-bucket-name',
    keyFilename: window.API_CONFIG?.GC_KEY_FILENAME || 'path/to/service-account-key.json', // Path to your service account key file
    datasetId: window.API_CONFIG?.GC_DATASET_ID || 'emotional_map' // BigQuery dataset ID
};

// Initialize the integration
let cloudIntegration = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        cloudIntegration = new GoogleCloudIntegration(gcConfig);
        window.cloudIntegration = cloudIntegration; // Make available globally

        // Schedule data retention job
        cloudIntegration.scheduleDataRetentionJob();

        console.log('Google Cloud Integration initialized');
    } catch (error) {
        console.error('Failed to initialize Google Cloud Integration:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleCloudIntegration;
}