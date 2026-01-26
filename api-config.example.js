// API Configuration for City Emotional Map
// This file should be loaded before other scripts to provide API keys

// INSTRUCTIONS:
// 1. Copy this file and rename it to 'api-config.js'
// 2. Replace the placeholder values with your actual API keys
// 3. Never commit api-config.js to version control (it's in .gitignore)

// Create a global configuration object
window.API_CONFIG = {
    // Geoapify API Key - for geocoding and location services
    // Get your free key from: https://www.geoapify.com/
    GEOAPIFY_API_KEY: 'YOUR_GEOAPIFY_API_KEY_HERE',

    // Mistral API Key - for emotional analysis (fallback)
    // Get your key from: https://console.mistral.ai/
    MISTRAL_API_KEY: 'YOUR_MISTRAL_API_KEY_HERE',

    // Additional Configuration Options
    // Add any other API keys or configuration as needed
};
