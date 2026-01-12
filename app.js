// Global variables
let map;
let markers = [];
let emotionPieChart;
let crimeBarChart;

// Initialize the application
function initMapApp() {
    initializeMap();
    setupEventListeners();
    loadSampleData();
}

// Fallback in case the callback doesn't work
document.addEventListener('DOMContentLoaded', function () {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.warn('Google Maps API not loaded via callback, trying fallback initialization');
        // Retry initialization after a delay
        setTimeout(() => {
            if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                initializeMap();
                setupEventListeners();
                loadSampleData();
            }
        }, 1000);
    }
});

// Initialize Google Map
function initializeMap() {
    const mapOptions = {
        center: { lat: 20.5937, lng: 78.9629 }, // Center of India
        zoom: 5,
        styles: [
            {
                featureType: "administrative",
                elementType: "labels.text.fill",
                stylers: [{ color: "#ffffff" }]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }]
            },
            {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [{ color: "#2c3e50" }]
            }
        ]
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

// Set up event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('location-search');
    const searchButton = document.getElementById('search-btn');
    const dropdown = document.getElementById('location-dropdown');

    // Search input events
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleKeyDown);

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
        // Use Google Places Autocomplete service for suggestions
        const service = new google.maps.places.AutocompleteService();

        service.getPlacePredictions({
            input: query,
            componentRestrictions: { country: 'in' }, // Restrict to India
            types: ['(regions)'] // Include regions, cities, and sub-localities
        }, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                const suggestions = predictions.map(prediction => {
                    return {
                        name: prediction.description,
                        placeId: prediction.place_id
                    };
                });

                showSuggestions(suggestions);
            } else {
                dropdown.classList.add('hidden');
            }
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
                    // Use the place ID for more accurate geocoding
                    geocodeLocationByPlaceId(suggestion.placeId, suggestion.name);
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
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: location }, function (results, status) {
        if (status === 'OK') {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();

            // Store current location for heatmap
            window.currentLocation = location;

            // Center map on location
            map.setCenter({ lat, lng });
            map.setZoom(12);

            // Add marker
            addMarker(lat, lng, location);

            // Fetch data for location
            fetchDataForLocation(location, lat, lng);
        } else {
            alert('Location not found: ' + status);
            showLoading(false);
        }
    });
}

// Geocode location using Place ID for more accurate results
function geocodeLocationByPlaceId(placeId, locationName) {
    const service = new google.maps.places.PlacesService(map);

    service.getDetails({
        placeId: placeId,
        fields: ['geometry', 'name', 'formatted_address']
    }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Store current location for heatmap
            window.currentLocation = locationName;

            // Center map on location
            map.setCenter({ lat, lng });
            map.setZoom(12);

            // Add marker
            addMarker(lat, lng, place.name || locationName);

            // Fetch data for location
            fetchDataForLocation(locationName, lat, lng);
        } else {
            // Fallback to regular geocoding if place details fail
            geocodeLocation(locationName);
        }
    });
}

// Add marker to map
function addMarker(lat, lng, title) {
    // Clear existing markers
    clearMarkers();

    const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: title,
        animation: google.maps.Animation.DROP
    });

    markers.push(marker);

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${title}</strong><br>Emotional Analysis Zone</div>`
    });

    marker.addListener('click', function () {
        infoWindow.open(map, marker);
    });
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
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

            // Add the social media data to the emotionalData object for other components
            emotionalData.socialMediaData = socialMediaData;
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
    const crimeTypes = Object.keys(crimes);
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
    const stateBoundaries = getStateBoundaries(location);

    if (!stateBoundaries || !emotionalData.stateLevelData) return;

    // Create heatmap data from state-level data
    const heatmapData = [];

    // Process state-level data to create heatmap points
    for (const district of emotionalData.stateLevelData.districts) {
        // Convert district coordinates to heatmap format
        if (district.coordinates && district.emotionIntensity) {
            heatmapData.push({
                location: new google.maps.LatLng(district.coordinates.lat, district.coordinates.lng),
                weight: district.emotionIntensity
            });
        }
    }

    // Create or update heatmap layer
    if (window.stateHeatmapLayer) {
        window.stateHeatmapLayer.setMap(null);
    }

    window.stateHeatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        dissipating: true,
        maxIntensity: 100,
        opacity: 0.6,
        radius: 20000, // Adjust based on state size
        gradient: [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(127, 0, 255, 1)',
            'rgba(255, 0, 255, 1)',
            'rgba(255, 0, 127, 1)',
            'rgba(255, 0, 0, 1)',
            'rgba(255, 127, 0, 1)',
            'rgba(255, 255, 0, 1)',
            'rgba(255, 255, 127, 1)'
        ]
    });

    // Add state overview polygon with color based on crime levels
    await addStateOverviewPolygon(location, emotionalData);
}

// Add state overview polygon with color based on crime levels
async function addStateOverviewPolygon(location, emotionalData) {
    // Clear existing state polygons
    if (window.statePolygon) {
        window.statePolygon.setMap(null);
    }

    // Get state boundaries
    const stateBoundaries = getStateBoundaries(location);
    if (!stateBoundaries) return;

    // Calculate color based on overall crime/safety level
    const overallCrimeLevel = calculateOverallCrimeLevel(emotionalData);
    const fillColor = getColorForCrimeLevel(overallCrimeLevel);

    // Define state boundary coordinates (get from API)
    const stateCoords = await getActualStateCoordinates(location);

    if (stateCoords) {
        window.statePolygon = new google.maps.Polygon({
            paths: stateCoords,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: fillColor,
            fillOpacity: 0.35
        });

        window.statePolygon.setMap(map);

        // Add click event to show state details
        window.statePolygon.addListener('click', function (event) {
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
            'chandigarh': [
                { lat: 30.7334, lng: 76.7791 },
                { lat: 30.7334, lng: 76.8234 },
                { lat: 30.6842, lng: 76.8234 },
                { lat: 30.6842, lng: 76.7791 }
            ],
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
            max-width: 700px;
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
    let crimeStatsHTML = '<h4>Crime Statistics:</h4><ul>';
    if (emotionalData.crimeStats) {
        for (const [type, count] of Object.entries(emotionalData.crimeStats)) {
            crimeStatsHTML += `<li>${type}: ${count}</li>`;
        }
    } else {
        crimeStatsHTML += '<li>No crime data available</li>';
    }
    crimeStatsHTML += '</ul>';

    content.innerHTML = `
        <h2>State Overview: ${location}</h2>
        <div><strong>Safety Index:</strong> ${emotionalData.safetyIndex || 'N/A'}</div>
        <div><strong>Overall Crime Level:</strong> ${calculateOverallCrimeLevel(emotionalData).toFixed(2)}%</div>
        <div><strong>Emotional Distribution:</strong></div>
        <ul>
            <li>Calm: ${emotionalData.emotions?.calm || 0}%</li>
            <li>Angry: ${emotionalData.emotions?.angry || 0}%</li>
            <li>Depressed: ${emotionalData.emotions?.depressed || 0}%</li>
            <li>Fear: ${emotionalData.emotions?.fear || 0}%</li>
            <li>Happy: ${emotionalData.emotions?.happy || 0}%</li>
        </ul>
        ${crimeStatsHTML}
        <div><strong>Time-based Crime Distribution:</strong></div>
        <div id="time-chart-container" style="height: 200px; margin-top: 15px;"></div>
    `;

    // Create time-based chart if data exists
    if (emotionalData.timeBasedCrimes) {
        setTimeout(() => {
            createTimeBasedChart('time-chart-container', emotionalData.timeBasedCrimes);
        }, 100);
    }

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

// Helper function to get state boundaries
function getStateBoundaries(location) {
    // This would typically fetch from a service or use a predefined dataset
    // For now, we'll use a simplified approach
    const stateMap = {
        'chandigarh': {
            bounds: { north: 30.8, south: 30.6, east: 76.9, west: 76.7 },
            districts: ['chandigarh']
        },
        // Add more states as needed
    };

    const stateName = location.toLowerCase().split(',')[1]?.trim() || location.toLowerCase();
    return stateMap[stateName] || null;
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

    // Example algorithm to identify potential hotspots
    // Look for areas with high crime rates, high negative emotions, or sudden changes
    if (emotionalData.crimeStats) {
        for (const [crimeType, count] of Object.entries(emotionalData.crimeStats)) {
            if (count > 10) { // Threshold for high crime rate
                hotspots.push({
                    type: 'crime',
                    crimeType,
                    severity: 'high',
                    confidence: 85
                });
            }
        }
    }

    // Check for high negative emotions
    if (emotionalData.emotions) {
        if (emotionalData.emotions.angry > 40 || emotionalData.emotions.fear > 35) {
            hotspots.push({
                type: 'emotional',
                emotion: emotionalData.emotions.angry > emotionalData.emotions.fear ? 'angry' : 'fear',
                severity: 'high',
                confidence: 75
            });
        }
    }

    return hotspots;
}

// Initialize periodic updates
setTimeout(setupPeriodicUpdates, 5000); // Start after 5 seconds