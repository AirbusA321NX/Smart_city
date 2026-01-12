// Data Integration Module for Emotional Map Application
// Handles integration with various data sources and services

// Initialize API configuration
function initializeAPIConfig() {
    // Load API configuration from external file or environment
    if (window.API_CONFIG) {
        console.log('API configuration loaded successfully');
    } else {
        console.warn('API configuration not found, using default values');
    }
}

// Function to fetch geographic boundaries for locations
async function fetchLocationBoundaries(location) {
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
        return getDefaultBoundaries(location);
    }
}

// Get default boundaries for common locations
function getDefaultBoundaries(location) {
    // Define default boundaries for known locations
    const defaultBoundaries = {
        'chandigarh': [
            [30.7334, 76.7791],
            [30.7334, 76.8234],
            [30.6842, 76.8234],
            [30.6842, 76.7791]
        ],
        'delhi': [
            [28.4595, 76.8252],
            [28.8744, 76.8252],
            [28.8744, 77.3193],
            [28.4595, 77.3193]
        ],
        'mumbai': [
            [18.9217, 72.8343],
            [19.2685, 72.8343],
            [19.2685, 72.9960],
            [18.9217, 72.9960]
        ]
    };

    const locationName = location.toLowerCase().split(',')[0];
    return defaultBoundaries[locationName] || [];
}

// Function to validate API keys
function validateAPIKeys() {
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

// Initialize data integration module
function initializeDataIntegration() {
    initializeAPIConfig();

    // Validate required API keys
    validateAPIKeys();

    console.log('Data integration module initialized');
}

// Export functions for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchLocationBoundaries,
        getDefaultBoundaries,
        validateAPIKeys,
        initializeDataIntegration
    };
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', initializeDataIntegration);