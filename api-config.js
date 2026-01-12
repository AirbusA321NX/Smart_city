// API Configuration for City Emotional Map
// This file should be loaded before other scripts to provide API keys

// Create a global configuration object
window.API_CONFIG = {
    // Google Maps API Key - replace with your actual key
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',

    // Mistral API Key - replace with your actual key
    MISTRAL_API_KEY: 'YOUR_MISTRAL_API_KEY',

    // Google Cloud Configuration
    GC_PROJECT_ID: 'your-project-id',
    GC_REGION: 'us-central1',
    GC_API_KEY: 'your-api-key',
    GC_BUCKET_NAME: 'your-bucket-name',
    GC_KEY_FILENAME: 'path/to/service-account-key.json',
    GC_DATASET_ID: 'emotional_map'
};

// For development purposes, you can load these from a separate config file or environment
// This is just a placeholder - in production, you should load from secure server-side config