// Global variables
let map;
let markers = [];
let emotionPieChart;
let crimeBarChart;

// Fetch API configuration from server
async function loadAPIConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`API config request failed with status ${response.status}`);
        }
        window.API_CONFIG = await response.json();
        console.log('API configuration loaded successfully');
    } catch (error) {
        console.error('Error loading API configuration:', error);
        // Fallback to default values
        window.API_CONFIG = {
            GEOAPIFY_API_KEY: 'YOUR_GEOAPIFY_API_KEY',
            MISTRAL_API_KEY: 'YOUR_MISTRAL_API_KEY'
        };
    }
}

// Load API configuration when page loads
loadAPIConfig();

// Initialize the application
function initMapApp() {
    initializeMap();
    setupSearchFunctionality();
    setupEventListeners();
    loadSampleData();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeMap();
    setupSearchFunctionality();
    setupEventListeners();
    loadSampleData();
});

// Initialize Leaflet Map
function initializeMap() {
    // Create map centered on India
    map = L.map('map').setView([20.5937, 78.9629], 5); // Center of India

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Load and display Indian state boundaries
    loadIndiaMapBoundaries();
}

// Function to load and display India map boundaries
async function loadIndiaMapBoundaries() {
    try {
        // Get all available state boundaries
        const states = [
            'andhra-pradesh', 'arunachalpradesh', 'assam', 'bihar', 'chhattisgarh',
            'goa', 'gujarat-divisions', 'haryana', 'himachal-pradesh', 'jharkhand',
            'karnataka', 'kerala', 'madhya-pradesh', 'maharashtra', 'manipur',
            'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
            'rajasthan', 'sikkim', 'tamilnadu', 'telangana', 'tripura',
            'uttar-pradesh', 'uttarakhand', 'west-bengal', 'chandigarh', 'delhi',
            'puducherry', 'lakshadweep', 'andamannicobarislands', 'dnh',
            'jammu-kashmir', 'ladakh'
        ];

        // Load each state's boundary and add to map
        for (const state of states) {
            try {
                const response = await fetch('/api/get-boundaries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        location: state.replace('-', ' ')
                    })
                });

                if (response.ok) {
                    const boundaryData = await response.json();

                    if (boundaryData.coordinates && boundaryData.coordinates.length > 0) {
                        // Create a polygon for the state
                        const statePolygon = L.polygon(
                            boundaryData.coordinates.map(coord => [coord.lat, coord.lng]),
                            {
                                color: '#3388ff',
                                weight: 1,
                                fillColor: '#3388ff',
                                fillOpacity: 0.1
                            }
                        );

                        // Add to map
                        statePolygon.addTo(map);

                        // Add click event to focus on state
                        statePolygon.on('click', function (e) {
                            const stateName = state.replace('-', ' ');
                            document.getElementById('location-search').value = stateName;
                            handleSearch();
                        });
                    }
                }
            } catch (error) {
                console.warn(`Could not load boundary for state: ${state}`, error);
            }
        }
    } catch (error) {
        console.error('Error loading India map boundaries:', error);
    }
}

// Set up search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('location-search');

    // Add search input event
    searchInput.addEventListener('input', handleSearchInput);

    // Add search button click event
    searchInput.addEventListener('keypress', handleKeyDown);
}

// Set up event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('location-search');
    const searchButton = document.getElementById('search-btn');
    const dropdown = document.getElementById('location-dropdown');

    // Search button click
    searchButton.addEventListener('click', handleSearch);

    // Click outside to close dropdown
    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Handle search input for auto-suggestions
function handleSearchInput(event) {
    const query = event.target.value;
    const dropdown = document.getElementById('location-dropdown');

    if (query.length > 2) {
        // Use Geoapify Autocomplete API for suggestions
        fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&apiKey=${window.API_CONFIG?.GEOAPIFY_API_KEY || 'YOUR_GEOAPIFY_API_KEY'}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.results) {
                    const suggestions = data.results.map(result => {
                        return {
                            name: result.formatted,
                            lat: result.lat,
                            lon: result.lon
                        };
                    });
                    showSuggestions(suggestions);
                } else {
                    dropdown.classList.add('hidden');
                }
            })
            .catch(error => {
                console.error('Error fetching Geoapify suggestions:', error);
                dropdown.classList.add('hidden');
            });
    } else {
        dropdown.classList.add('hidden');
    }
}

// Show location suggestions
function showSuggestions(suggestions) {
    const dropdown = document.getElementById('location-dropdown');

    if (suggestions.length > 0) {
        dropdown.innerHTML = '';
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';

            // Handle both string suggestions and object suggestions
            if (typeof suggestion === 'string') {
                div.textContent = suggestion;
                div.addEventListener('click', () => {
                    document.getElementById('location-search').value = suggestion;
                    dropdown.classList.add('hidden');
                    handleSearch();
                });
            } else {
                div.textContent = suggestion.name;
                div.addEventListener('click', () => {
                    document.getElementById('location-search').value = suggestion.name;
                    dropdown.classList.add('hidden');
                    // Use the coordinates for geocoding
                    geocodeLocationByCoordinates(suggestion.lat, suggestion.lon, suggestion.name);
                });
            }

            dropdown.appendChild(div);
        });
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

// Handle keyboard navigation in dropdown
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
    }
}

// Handle search button click
function handleSearch() {
    const location = document.getElementById('location-search').value.trim();

    if (location) {
        showLoading(true);
        geocodeLocation(location);
    }
}

// Geocode location and update map
function geocodeLocation(location) {
    // Use Geoapify Forward Geocoding API
    fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&format=json&apiKey=${window.API_CONFIG?.GEOAPIFY_API_KEY || 'YOUR_GEOAPIFY_API_KEY'}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.results && data.results.length > 0) {
                const result = data.results[0];
                const lat = result.lat;
                const lon = result.lon;

                // Store current location for heatmap
                window.currentLocation = location;

                // Center map on location
                map.setView([lat, lon], 12);

                // Add marker
                addMarker(lat, lon, location);

                // Fetch data for location
                fetchDataForLocation(location, lat, lon);
            } else {
                alert('Location not found');
                showLoading(false);
            }
        })
        .catch(error => {
            console.error('Error geocoding location:', error);
            alert('Error geocoding location');
            showLoading(false);
        });
}

// Geocode location using coordinates
function geocodeLocationByCoordinates(lat, lon, locationName) {
    // Store current location for heatmap
    window.currentLocation = locationName;

    // Center map on location
    map.setView([lat, lon], 12);

    // Add marker
    addMarker(lat, lon, locationName);

    // Fetch data for location
    fetchDataForLocation(locationName, lat, lon);
}

// Add marker to map
function addMarker(lat, lng, title) {
    // Clear existing markers
    clearMarkers();

    // Create Leaflet marker
    const marker = L.marker([lat, lng]).addTo(map);

    markers.push(marker);

    // Add popup to marker
    marker.bindPopup(`<div><strong>${title}</strong><br>Emotional Analysis Zone</div>`);

    // Open popup when marker is clicked
    marker.on('click', function () {
        marker.openPopup();
    });
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

// Fetch data for location
function fetchDataForLocation(location, lat, lng) {
    // Call our backend API which integrates with Mistral AI and news sources
    fetchEmotionalData(location, lat, lng);
}

// Fetch emotional data from backend API
async function fetchEmotionalData(location, lat, lng) {
    try {
        // Call the backend API to get emotional analysis
        const response = await fetch('/api/emotional-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location: location,
                latitude: lat,
                longitude: lng
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const emotionalData = await response.json();

        updateUIWithData(emotionalData);
        showLoading(false);
    } catch (error) {
        console.error('Error fetching emotional data:', error);

        // Show error to user
        showLoading(false);
        showNotification('Error fetching data for ' + location + '. Please try again later.', 'error');

        // Fallback to empty data
        const emptyData = {
            safetyIndex: 0,
            emotions: { calm: 0, angry: 0, depressed: 0, fear: 0, happy: 0 },
            crimeStats: {},
            news: []
        };
        updateUIWithData(emptyData);
    }
}

// Update UI with fetched data
async function updateUIWithData(data) {
    // Update safety index
    updateSafetyIndex(data.safetyIndex);

    // Update emotion pie chart
    updateEmotionChart(data.emotions);

    // Update crime bar chart
    updateCrimeChart(data.crimes);

    // Update news feed
    updateNewsFeed(data.news);

    // Create state heatmap if location is provided
    if (window.currentLocation) {
        await createStateHeatmap(window.currentLocation, data);
    }

    // Get predictive insights
    const insights = getPredictiveInsights(data);

    // Show alerts for high-risk areas
    if (insights.highRiskAreas.length > 0) {
        insights.highRiskAreas.forEach(area => {
            showNotification(`High risk ${area.type} alert: ${area.severity} severity with ${area.confidence}% confidence`, 'warning');
        });
    }

    // Show trending emotions
    if (insights.trendingEmotions.length > 0) {
        insights.trendingEmotions.forEach(trend => {
            showNotification(`Emotion trend: ${trend.emotion} is ${trend.direction} by ${Math.abs(trend.change)}%`, 'info');
        });
    }

    // Integrate social media data if visualizer is available
    if (window.emotionalMapVisualizer && typeof window.emotionalMapVisualizer.aggregateSocialMediaData === 'function') {
        try {
            const socialMediaData = await window.emotionalMapVisualizer.aggregateSocialMediaData(window.currentLocation);

            // Update the social media chart with the aggregated data
            if (window.emotionalMapVisualizer.charts.socialMediaChart) {
                window.emotionalMapVisualizer.updateSocialMediaChart(socialMediaData);
            }

            // Add the social media data to the data object for other components
            data.socialMediaData = socialMediaData;
        } catch (error) {
            console.error('Error integrating social media data:', error);
        }
    }
}

// Update safety index display
function updateSafetyIndex(score) {
    const scoreElement = document.querySelector('.safety-score');
    const fillElement = document.querySelector('.safety-fill');

    scoreElement.textContent = score;

    // Update color based on score
    if (score >= 70) {
        scoreElement.style.color = '#2ecc71'; // Green
    } else if (score >= 40) {
        scoreElement.style.color = '#f1c40f'; // Yellow
    } else {
        scoreElement.style.color = '#e74c3c'; // Red
    }

    // Animate the fill
    fillElement.style.width = score + '%';
}

// Update emotion pie chart
function updateEmotionChart(emotions) {
    const ctx = document.getElementById('emotion-pie-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (emotionPieChart) {
        emotionPieChart.destroy();
    }

    emotionPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Calm', 'Angry', 'Depressed', 'Fear'],
            datasets: [{
                data: [
                    emotions.calm,
                    emotions.angry,
                    emotions.depressed,
                    emotions.fear
                ],
                backgroundColor: [
                    '#2ecc71',
                    '#e74c3c',
                    '#34495e',
                    '#9b59b6'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Update crime bar chart
function updateCrimeChart(crimes) {
    const ctx = document.getElementById('crime-bar-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (crimeBarChart) {
        crimeBarChart.destroy();
    }

    // Extract crime types and counts from the crimes object
    const crimeTypes = Object.keys(crimes || {});
    const crimeCounts = crimeTypes.map(type => crimes[type]);

    // Generate colors based on the number of crime types
    const backgroundColors = generateColors(crimeTypes.length, 'rgba', 0.7);
    const borderColors = generateColors(crimeTypes.length, 'rgba', 1);

    crimeBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: crimeTypes, // Dynamic labels from crime data
            datasets: [{
                label: 'Incident Count',
                data: crimeCounts, // Dynamic data from crime counts
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Update news feed
function updateNewsFeed(news) {
    const container = document.getElementById('news-feed');
    container.innerHTML = '';

    news.forEach(item => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-item';

        // Set color based on sentiment
        let colorClass = '';
        if (item.sentiment === 'positive') colorClass = 'calm';
        else if (item.sentiment === 'negative') colorClass = 'angry';
        else colorClass = 'fear';

        newsElement.innerHTML = `
            <div class="news-title">${item.title}</div>
            <div class="news-meta">
                <span class="emotion-tag ${colorClass}">${item.emotion}</span>
                <span class="sentiment-tag">${item.sentiment}</span>
            </div>
        `;

        container.appendChild(newsElement);
    });
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');

    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Initialize with empty data
function loadSampleData() {
    // Initialize UI with empty data
    const emptyData = {
        safetyIndex: 0,
        emotions: { calm: 0, angry: 0, depressed: 0, fear: 0, happy: 0 },
        crimeStats: {},
        news: []
    };

    updateUIWithData(emptyData);
}

// Function to perform periodic updates every 6 hours
function setupPeriodicUpdates() {
    // Fetch new data every 6 hours (6 * 60 * 60 * 1000 = 21600000 ms)
    setInterval(() => {
        const location = document.getElementById('location-search').value;
        if (location) {
            fetchDataForLocation(location, map.getCenter().lat(), map.getCenter().lng());
        }
    }, 21600000); // Update every 6 hours
}

// Helper function to generate colors for charts
function generateColors(count, format, alpha) {
    const colors = [];
    const baseColors = [
        '231, 76, 60',   // Red
        '241, 196, 15',  // Yellow
        '52, 152, 219',  // Blue
        '155, 89, 182',  // Purple
        '230, 126, 34',  // Orange
        '46, 204, 113',  // Green
        '22, 160, 133',  // Dark Green
        '39, 174, 96',   // Emerald
        '243, 156, 18',  // Carrot
        '211, 84, 0',    // Pumpkin
        '192, 57, 43',   // Alizarin
        '142, 68, 173',  // Amethyst
        '41, 128, 185',  // Belize Hole
        '26, 188, 156',  // Turquoise
        '241, 180, 183'  // Light Pink
    ];

    for (let i = 0; i < count; i++) {
        const baseColor = baseColors[i % baseColors.length];
        if (format === 'rgba') {
            colors.push(`rgba(${baseColor}, ${alpha})`);
        } else {
            colors.push(`rgb(${baseColor})`);
        }
    }

    return colors;
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';

    // Set notification style based on type
    let bgColor, textColor;
    switch (type) {
        case 'success':
            bgColor = 'rgba(46, 204, 113, 0.9)'; // Green
            textColor = '#fff';
            break;
        case 'error':
            bgColor = 'rgba(231, 76, 60, 0.9)'; // Red
            textColor = '#fff';
            break;
        case 'warning':
            bgColor = 'rgba(241, 196, 15, 0.9)'; // Yellow
            textColor = '#333';
            break;
        default:
            bgColor = 'rgba(52, 152, 219, 0.9)'; // Blue
            textColor = '#fff';
    }

    notification.style.cssText = `
        background: ${bgColor};
        color: ${textColor};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 250px;
    `;

    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    closeButton.onclick = function () {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    };

    notification.appendChild(closeButton);

    // Add to container
    notificationContainer.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Add to your fetchEmotionalData function error handling:
// In the error handling section, replace the alert with:
// showNotification('Error fetching data for ' + location, 'error');

// Create state-level heatmap overlay
async function createStateHeatmap(location, emotionalData) {
    if (!map) return;

    // Get state boundaries based on location
    const stateBoundaries = await getStateBoundaries(location);

    if (!stateBoundaries || !emotionalData.stateLevelData) return;

    // Create heatmap data from state-level data
    const heatmapData = [];

    // Process state-level data to create heatmap points
    for (const district of emotionalData.stateLevelData.districts) {
        // Convert district coordinates to heatmap format
        if (district.coordinates && district.emotionIntensity) {
            heatmapData.push([
                district.coordinates.lat,
                district.coordinates.lng,
                district.emotionIntensity
            ]);
        }
    }

    // Create or update heatmap layer
    if (window.stateHeatmapLayer) {
        // Remove existing heatmap layer if it exists
        map.removeLayer(window.stateHeatmapLayer);
    }

    // Create Leaflet heatmap layer using leaflet-heat plugin
    window.stateHeatmapLayer = L.heatLayer(heatmapData, {
        radius: 20,
        blur: 15,
        max: 100,
        gradient: {
            0.2: 'blue',
            0.4: 'lime',
            0.6: 'yellow',
            0.8: 'orange',
            1.0: 'red'
        }
    }).addTo(map);

    // Add state overview polygon with color based on crime levels
    await addStateOverviewPolygon(location, emotionalData);
}

// Add state overview polygon with color based on crime levels
async function addStateOverviewPolygon(location, emotionalData) {
    // Clear existing state polygons
    if (window.statePolygon) {
        map.removeLayer(window.statePolygon);
    }

    // Get state boundaries
    const stateBoundaries = await getStateBoundaries(location);
    if (!stateBoundaries) return;

    // Calculate color based on overall crime/safety level
    const overallCrimeLevel = calculateOverallCrimeLevel(emotionalData);
    const fillColor = getColorForCrimeLevel(overallCrimeLevel);

    // Define state boundary coordinates (get from API)
    const stateCoords = await getActualStateCoordinates(location);

    if (stateCoords) {
        window.statePolygon = L.polygon(stateCoords, {
            color: '#FF0000',
            opacity: 0.8,
            weight: 2,
            fillColor: fillColor,
            fillOpacity: 0.35
        }).addTo(map);

        // Add click event to show state details
        window.statePolygon.on('click', function (event) {
            showStateOverviewDetails(location, emotionalData);
        });
    }
}

// Calculate overall crime level for the state
function calculateOverallCrimeLevel(emotionalData) {
    // Calculate based on crime stats and emotional data
    let totalCrime = 0;
    let crimeCount = 0;

    if (emotionalData.crimeStats) {
        for (const [type, count] of Object.entries(emotionalData.crimeStats)) {
            totalCrime += count;
            crimeCount++;
        }
    }

    const avgCrime = crimeCount > 0 ? totalCrime / crimeCount : 0;

    // Normalize to a 0-100 scale
    // Assuming max possible crime count is 100 for normalization
    const normalizedCrime = Math.min(100, (avgCrime / 50) * 100);

    return normalizedCrime;
}

// Get color based on crime level
function getColorForCrimeLevel(crimeLevel) {
    // Green for safe (low crime), red for dangerous (high crime)
    if (crimeLevel < 30) {
        return '#2ecc71'; // Green
    } else if (crimeLevel < 60) {
        return '#f1c40f'; // Yellow
    } else {
        return '#e74c3c'; // Red
    }
}

// Get actual state coordinates
async function getActualStateCoordinates(location) {
    try {
        // Call our backend API to get geographic boundaries
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

        // Return the coordinates from the API response
        return boundaryData.coordinates || null;
    } catch (error) {
        console.error('Error fetching state coordinates:', error);

        // Fallback to simplified coordinates if API fails
        const stateCoordsMap = {

            // Add more states as needed
        };

        const stateName = location.toLowerCase().split(',')[1]?.trim() || location.toLowerCase();
        return stateCoordsMap[stateName] || null;
    }
}

// Show state overview details
function showStateOverviewDetails(location, emotionalData) {
    // Create modal for state overview
    let modal = document.getElementById('state-overview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'state-overview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #2c3e50;
            padding: 30px;
            border-radius: 15px;
            width: 80%;
            max-width: 900px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => modal.style.display = 'none';

        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    const content = document.querySelector('#state-overview-modal > div:nth-child(1)');

    // Format crime stats for display
    let crimeStatsHTML = '<h4>Crime Statistics:</h4><div class="crime-stats-grid">';
    if (emotionalData.crimeStats && Object.keys(emotionalData.crimeStats).length > 0) {
        for (const [type, count] of Object.entries(emotionalData.crimeStats)) {
            crimeStatsHTML += `<div class="crime-stat"><span class="crime-type">${type}:</span> <span class="crime-count">${count}</span></div>`;
        }
    } else {
        crimeStatsHTML += '<div class="crime-stat">No crime data available</div>';
    }
    crimeStatsHTML += '</div>';

    content.innerHTML = `
        <h2>State Overview: ${location}</h2>
        <div class="overview-stats">
            <div><strong>Safety Index:</strong> <span class="safety-value">${emotionalData.safetyIndex || 'N/A'}</span></div>
            <div><strong>Overall Crime Level:</strong> <span class="crime-value">${calculateOverallCrimeLevel(emotionalData).toFixed(2)}%</span></div>
        </div>
        
        <div class="emotional-distribution">
            <h4>Emotional Distribution:</h4>
            <div class="emotion-grid">
                <div class="emotion-item"><span class="emotion-label">Calm:</span> <span class="emotion-value">${emotionalData.emotions?.calm || 0}%</span></div>
                <div class="emotion-item"><span class="emotion-label">Angry:</span> <span class="emotion-value">${emotionalData.emotions?.angry || 0}%</span></div>
                <div class="emotion-item"><span class="emotion-label">Depressed:</span> <span class="emotion-value">${emotionalData.emotions?.depressed || 0}%</span></div>
                <div class="emotion-item"><span class="emotion-label">Fear:</span> <span class="emotion-value">${emotionalData.emotions?.fear || 0}%</span></div>
                <div class="emotion-item"><span class="emotion-label">Happy:</span> <span class="emotion-value">${emotionalData.emotions?.happy || 0}%</span></div>
            </div>
        </div>
        
        ${crimeStatsHTML}
        
        <div class="time-crime-section">
            <h4>Time-based Crime Distribution:</h4>
            <div id="time-chart-container" style="height: 250px; margin-top: 15px;"></div>
        </div>
        
        <div class="state-heatmap-section">
            <h4>State Crime Heatmap Overview:</h4>
            <p>This shows a color-coded representation of crime density across different districts in the state. Red indicates high crime density, while green indicates low crime density.</p>
            <div id="state-heatmap-container" style="height: 300px; margin-top: 15px; border: 1px solid #555; border-radius: 5px; background-color: #1a2530;"></div>
        </div>
    `;

    // Create time-based chart if data exists
    if (emotionalData.timeBasedCrimes) {
        setTimeout(() => {
            createTimeBasedChart('time-chart-container', emotionalData.timeBasedCrimes);
        }, 100);
    }

    // Create state heatmap overview
    setTimeout(async () => {
        await createStateHeatmapOverview('state-heatmap-container', location, emotionalData);
    }, 150);

    modal.style.display = 'flex';
}

// Create time-based chart for state overview
function createTimeBasedChart(containerId, timeData) {
    const ctx = document.createElement('canvas');
    document.getElementById(containerId).appendChild(ctx);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Crime Reports by Hour',
                data: timeData || Array(24).fill(0),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Create state heatmap overview visualization
async function createStateHeatmapOverview(containerId, location, emotionalData) {
    // Get state boundaries
    const stateBoundaries = await getStateBoundaries(location);

    if (!stateBoundaries) {
        // If we can't get boundaries, just show a message
        const container = document.getElementById(containerId);
        container.innerHTML = '<p>Unable to load state boundaries for visualization</p>';
        return;
    }

    // Create a temporary div for the leaflet map
    const mapDiv = document.createElement('div');
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';
    document.getElementById(containerId).appendChild(mapDiv);

    // Create a mini map for the state overview
    const stateMap = L.map(mapDiv, {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false
    }).setView([20.5937, 78.9629], 5); // Default to India center

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(stateMap);

    // Draw the state boundary with color based on crime level
    const overallCrimeLevel = calculateOverallCrimeLevel(emotionalData);

    // Determine color based on crime level (red for high crime, green for low crime)
    const crimeColor = getColorForCrimeLevel(overallCrimeLevel);

    // Draw state boundary
    const stateCoords = [];
    if (stateBoundaries.bounds) {
        const bounds = stateBoundaries.bounds;
        stateCoords.push([bounds.north, bounds.west]);
        stateCoords.push([bounds.north, bounds.east]);
        stateCoords.push([bounds.south, bounds.east]);
        stateCoords.push([bounds.south, bounds.west]);
        stateCoords.push([bounds.north, bounds.west]); // Close the polygon
    }

    if (stateCoords.length > 0) {
        const statePolygon = L.polygon(stateCoords, {
            color: crimeColor,
            weight: 2,
            fillColor: crimeColor,
            fillOpacity: 0.5
        }).addTo(stateMap);

        // Fit bounds to show the state
        stateMap.fitBounds(statePolygon.getBounds());
    }

    // Add a label for the crime level
    const labelDiv = L.divIcon({
        html: `<div style="background: ${crimeColor}; color: white; padding: 5px; border-radius: 3px; font-weight: bold;">Crime Level: ${Math.round(overallCrimeLevel)}%</div>`,
        className: '',
        iconSize: [150, 30]
    });

    if (stateCoords.length > 0) {
        const centerLat = (stateBoundaries.bounds.north + stateBoundaries.bounds.south) / 2;
        const centerLng = (stateBoundaries.bounds.east + stateBoundaries.bounds.west) / 2;
        L.marker([centerLat, centerLng], { icon: labelDiv }).addTo(stateMap);
    }
}

// Helper function to get state boundaries
async function getStateBoundaries(location) {
    try {
        // Call our backend API to get geographic boundaries
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

        // If coordinates are available, calculate bounds
        if (boundaryData.coordinates && boundaryData.coordinates.length > 0) {
            // Calculate bounds from coordinates
            let north = -Infinity;
            let south = Infinity;
            let east = -Infinity;
            let west = Infinity;

            boundaryData.coordinates.forEach(coord => {
                north = Math.max(north, coord.lat);
                south = Math.min(south, coord.lat);
                east = Math.max(east, coord.lng);
                west = Math.min(west, coord.lng);
            });

            // Return the calculated bounds and an empty districts array
            return {
                bounds: { north, south, east, west },
                districts: [] // We could populate this with actual district data if available
            };
        } else {
            // Return null if no coordinates are available
            return null;
        }
    } catch (error) {
        console.error('Error fetching state boundaries:', error);
        return null; // Return null on error
    }
}

// Add to your global variables
let comparedLocations = [];

// Function to add location for comparison
function addToComparison(location, emotionalData) {
    if (comparedLocations.length >= 3) {
        showNotification('Maximum 3 locations for comparison', 'warning');
        return;
    }

    // Check if location is already in comparison
    if (comparedLocations.some(loc => loc.name === location)) {
        showNotification('Location already in comparison', 'info');
        return;
    }

    comparedLocations.push({
        name: location,
        data: emotionalData,
        timestamp: new Date().toISOString()
    });

    updateComparisonView();
}

// Update comparison view
function updateComparisonView() {
    // Create comparison panel if it doesn't exist
    let comparisonPanel = document.getElementById('comparison-panel');
    if (!comparisonPanel) {
        comparisonPanel = document.createElement('div');
        comparisonPanel.id = 'comparison-panel';
        comparisonPanel.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            z-index: 1000;
            max-height: 70vh;
            overflow-y: auto;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => comparisonPanel.style.display = 'none';

        comparisonPanel.appendChild(closeBtn);
        document.body.appendChild(comparisonPanel);
    }

    // Update content
    comparisonPanel.innerHTML = `
        <h3>Location Comparison</h3>
        <div id="comparison-charts">
            ${comparedLocations.map((loc, idx) => `
                <div class="comparison-item">
                    <h4>${loc.name}</h4>
                    <div>Safety: ${loc.data.safetyIndex}</div>
                    <div>Calm: ${loc.data.emotions.calm}%</div>
                    <div>Angry: ${loc.data.emotions.angry}%</div>
                    <div>Fear: ${loc.data.emotions.fear}%</div>
                    <button onclick="removeFromComparison(${idx})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
                </div>
            `).join('')}
        </div>
        <button onclick="clearComparison()" style="margin-top: 10px; background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Clear All</button>
    `;
}

// Remove location from comparison
function removeFromComparison(index) {
    comparedLocations.splice(index, 1);
    updateComparisonView();
}

// Clear all comparisons
function clearComparison() {
    comparedLocations = [];
    const panel = document.getElementById('comparison-panel');
    if (panel) panel.style.display = 'none';
}

// Show detailed incident report
function showIncidentReport(incident) {
    // Create modal for detailed report
    let modal = document.getElementById('incident-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'incident-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #2c3e50;
            padding: 30px;
            border-radius: 15px;
            width: 80%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => modal.style.display = 'none';

        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    const content = document.querySelector('#incident-modal > div:nth-child(1)');
    content.innerHTML = `
        <h2>Incident Report</h2>
        <div><strong>Location:</strong> ${incident.location}</div>
        <div><strong>Type:</strong> ${incident.type}</div>
        <div><strong>Severity:</strong> ${incident.severity}</div>
        <div><strong>Time:</strong> ${incident.timestamp}</div>
        <div><strong>Description:</strong> ${incident.description}</div>
        <div><strong>Emotion Detected:</strong> ${incident.emotion}</div>
        <div><strong>Confidence:</strong> ${incident.confidence}%</div>
    `;

    modal.style.display = 'flex';
}

// Add user feedback form
function showFeedbackForm() {
    let feedbackModal = document.getElementById('feedback-modal');
    if (!feedbackModal) {
        feedbackModal = document.createElement('div');
        feedbackModal.id = 'feedback-modal';
        feedbackModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #2c3e50;
            padding: 30px;
            border-radius: 15px;
            width: 80%;
            max-width: 500px;
            position: relative;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => feedbackModal.style.display = 'none';

        modalContent.innerHTML = `
            <h2>Share Your Experience</h2>
            <form id="feedback-form">
                <div style="margin-bottom: 15px;">
                    <label>Your Current Location:</label>
                    <input type="text" id="feedback-location" placeholder="Current location" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;"/>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>How do you feel?</label>
                    <select id="feedback-emotion" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                        <option value="calm">Calm</option>
                        <option value="happy">Happy</option>
                        <option value="angry">Angry</option>
                        <option value="fear">Fear</option>
                        <option value="depressed">Depressed</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>How safe do you feel?</label>
                    <input type="range" id="feedback-safety" min="0" max="100" value="50" style="width: 100%;"/>
                    <span id="safety-value">50%</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>Your Comments:</label>
                    <textarea id="feedback-comments" rows="4" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;"></textarea>
                </div>
                <button type="submit" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Submit Feedback</button>
            </form>
        `;

        // Add event listener for safety slider
        const safetySlider = modalContent.querySelector('#feedback-safety');
        const safetyValue = modalContent.querySelector('#safety-value');
        safetySlider.oninput = () => safetyValue.textContent = safetySlider.value + '%';

        // Add form submission handler
        const form = modalContent.querySelector('#feedback-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await submitUserFeedback();
        };

        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(feedbackModal);
    }

    feedbackModal.style.display = 'flex';
}

// Submit user feedback
async function submitUserFeedback() {
    const location = document.getElementById('feedback-location').value;
    const emotion = document.getElementById('feedback-emotion').value;
    const safety = document.getElementById('feedback-safety').value;
    const comments = document.getElementById('feedback-comments').value;

    try {
        const response = await fetch('/api/user-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location,
                emotion,
                safety: parseInt(safety),
                comments,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            showNotification('Thank you for your feedback!', 'success');
            document.getElementById('feedback-modal').style.display = 'none';
        } else {
            showNotification('Error submitting feedback', 'error');
        }
    } catch (error) {
        showNotification('Error submitting feedback', 'error');
    }
}

// Add predictive analytics function
function getPredictiveInsights(emotionalData) {
    // Analyze trends and predict potential hotspots
    const insights = {
        highRiskAreas: [],
        trendingEmotions: [],
        predictedEvents: []
    };

    // Example: Identify areas with increasing negative emotions
    if (emotionalData.historicalData) {
        const recentNegativeChange = analyzeEmotionalTrends(emotionalData.historicalData);
        insights.trendingEmotions = recentNegativeChange;
    }

    // Example: Predict potential incidents based on patterns
    const potentialHotspots = identifyPotentialHotspots(emotionalData);
    insights.highRiskAreas = potentialHotspots;

    return insights;
}

// Analyze emotional trends
function analyzeEmotionalTrends(historicalData) {
    const trends = [];

    // Compare recent data with past averages
    const recentAvg = historicalData.slice(-3); // Last 3 data points
    const pastAvg = historicalData.slice(0, -3); // Previous data points

    // Calculate trend for each emotion
    const emotions = ['angry', 'fear', 'depressed', 'calm', 'happy'];

    emotions.forEach(emotion => {
        const recentValues = recentAvg.map(d => d.emotions[emotion]).filter(v => v !== undefined);
        const pastValues = pastAvg.map(d => d.emotions[emotion]).filter(v => v !== undefined);

        if (recentValues.length > 0 && pastValues.length > 0) {
            const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
            const pastMean = pastValues.reduce((a, b) => a + b, 0) / pastValues.length;

            const change = ((recentMean - pastMean) / pastMean) * 100;

            if (Math.abs(change) > 10) { // Significant change threshold
                trends.push({
                    emotion,
                    change: Math.round(change),
                    direction: change > 0 ? 'increasing' : 'decreasing'
                });
            }
        }
    });

    return trends;
}

// Identify potential hotspots
function identifyPotentialHotspots(emotionalData) {
    const hotspots = [];

    // Identify potential hotspots using real data from emotional analysis
    if (emotionalData.crimeStats) {
        for (const [crimeType, count] of Object.entries(emotionalData.crimeStats)) {
            if (count > 0) { // Include all crime types with actual reported incidents
                hotspots.push({
                    type: 'crime',
                    crimeType,
                    severity: count > 5 ? 'high' : 'medium', // Scale severity based on count
                    confidence: Math.min(95, Math.floor(count * 3)) // Confidence based on incident count
                });
            }
        }
    }

    // Check for high negative emotions based on actual data
    if (emotionalData.emotions) {
        const angry = emotionalData.emotions.angry || 0;
        const fear = emotionalData.emotions.fear || 0;
        const depressed = emotionalData.emotions.depressed || 0;

        if (angry > 0) {
            hotspots.push({
                type: 'emotional',
                emotion: 'angry',
                severity: angry > 25 ? 'high' : (angry > 10 ? 'medium' : 'low'),
                confidence: Math.min(90, Math.floor(angry * 2))
            });
        }

        if (fear > 0) {
            hotspots.push({
                type: 'emotional',
                emotion: 'fear',
                severity: fear > 25 ? 'high' : (fear > 10 ? 'medium' : 'low'),
                confidence: Math.min(90, Math.floor(fear * 2))
            });
        }

        if (depressed > 0) {
            hotspots.push({
                type: 'emotional',
                emotion: 'depressed',
                severity: depressed > 25 ? 'high' : (depressed > 10 ? 'medium' : 'low'),
                confidence: Math.min(90, Math.floor(depressed * 2))
            });
        }
    }

    return hotspots;
}

// Initialize periodic updates
setTimeout(setupPeriodicUpdates, 5000); // Start after 5 seconds