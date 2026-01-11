// Data Visualization Components for Emotional Map
class EmotionalMapVisualizer {
    constructor() {
        this.charts = {};
        this.animationQueue = [];
    }

    // Initialize all charts
    initializeCharts() {
        this.createEmotionPieChart();
        this.createCrimeBarChart();
        this.createSafetyTrendChart();
        this.createEmotionalZonesMap();
        this.createTimeBasedCrimeChart();
    }

    // Create emotion distribution pie chart
    createEmotionPieChart() {
        const ctx = document.getElementById('emotion-pie-chart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.emotionPie) {
            this.charts.emotionPie.destroy();
        }

        this.charts.emotionPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Calm', 'Angry', 'Depressed', 'Fear', 'Happy'],
                datasets: [{
                    data: [0, 0, 0, 0, 0], // Will be updated with real data
                    backgroundColor: [
                        '#2ecc71',  // Calm - green
                        '#e74c3c',  // Angry - red
                        '#34495e',  // Depressed - dark blue-gray
                        '#9b59b6',  // Fear - purple
                        '#f1c40f'   // Happy - yellow
                    ],
                    borderColor: [
                        '#27ae60',
                        '#c0392b',
                        '#2c3e50',
                        '#8e44ad',
                        '#f39c12'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10
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
                                size: 12,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Create crime statistics bar chart
    createCrimeBarChart() {
        const ctx = document.getElementById('crime-bar-chart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.crimeBar) {
            this.charts.crimeBar.destroy();
        }

        this.charts.crimeBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [], // Will be dynamically populated based on crime data from AI analysis
                datasets: [{
                    label: 'Incident Count',
                    data: [0, 0, 0, 0, 0, 0], // Will be updated with real data
                    backgroundColor: [
                        'rgba(231, 76, 60, 0.7)',    // Red
                        'rgba(241, 196, 15, 0.7)',   // Yellow
                        'rgba(52, 152, 219, 0.7)',   // Blue
                        'rgba(155, 89, 182, 0.7)',   // Purple
                        'rgba(230, 126, 34, 0.7)',   // Orange
                        'rgba(46, 204, 113, 0.7)'    // Green
                    ],
                    borderColor: [
                        'rgba(231, 76, 60, 1)',
                        'rgba(241, 196, 15, 1)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(155, 89, 182, 1)',
                        'rgba(230, 126, 34, 1)',
                        'rgba(46, 204, 113, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 6
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function (value) {
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Create safety trend line chart
    createSafetyTrendChart() {
        const ctx = document.createElement('canvas');
        ctx.id = 'safety-trend-chart';
        ctx.height = 150;

        // Add chart container to the page if it doesn't exist
        if (!document.getElementById('safety-trend-container')) {
            const container = document.createElement('div');
            container.id = 'safety-trend-container';
            container.className = 'chart-container';
            container.innerHTML = '<h3>Safety Trend (Last 7 Days)</h3>';
            container.appendChild(ctx);

            const dataPanel = document.querySelector('.data-panel');
            dataPanel.insertBefore(container, document.querySelector('.live-feed'));
        }

        this.charts.safetyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // Will be dynamically populated based on historical data
                datasets: [{
                    label: 'Safety Index',
                    data: [0, 0, 0, 0, 0, 0, 0], // Will be updated with real data
                    fill: false,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 6
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Create emotional zones visualization on the map
    createEmotionalZonesMap() {
        // Create actual emotional zones on the map based on analysis data
        if (window.map && window.google && window.google.maps) {
            // Clear any existing zone markers
            if (this.emotionalZones) {
                this.emotionalZones.forEach(zone => zone.setMap(null));
            }
            this.emotionalZones = [];

            // Get real emotional data from the analysis system
            const emotionalData = window.currentEmotionalData || {};

            // Use geographic emotion data directly from the analysis results
            const geographicZones = emotionalData.geographicZones || [];

            // Create zones based on actual geographic data from the analysis
            geographicZones.forEach(zone => {
                this.createEmotionMarker(zone, window.map);
            });
        }
    }

    // Helper function to create an emotion marker
    createEmotionMarker(zone, map) {
        const marker = new google.maps.Marker({
            position: zone.position,
            map: map,
            icon: this.getEmotionIcon(zone.emotion, zone.intensity),
            title: `${zone.emotion.charAt(0).toUpperCase() + zone.emotion.slice(1)} Zone (${zone.intensity}%)`
        });

        // Add info window with details
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="zone-info">
                    <h3>${zone.emotion.charAt(0).toUpperCase() + zone.emotion.slice(1)} Zone</h3>
                    <p>Intensity: ${zone.intensity}%</p>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        this.emotionalZones.push(marker);
    }

    // Helper function to get appropriate icon based on emotion and intensity
    getEmotionIcon(emotion, intensity) {
        // Define different icons/colors for different emotions
        const colors = {
            calm: '#2ecc71',      // Green
            angry: '#e74c3c',     // Red
            depressed: '#34495e', // Dark blue-gray
            fear: '#9b59b6',      // Purple
            happy: '#f1c40f'      // Yellow
        };

        // Create a colored circle icon based on emotion
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: colors[emotion] || '#7f8c8d', // Default gray if emotion not found
            fillOpacity: intensity / 100,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 10 + (intensity / 10)
        };
    }

    // Update chart data with new emotional data
    updateChartData(emotionalData) {
        // Update emotion pie chart
        if (this.charts.emotionPie) {
            this.charts.emotionPie.data.datasets[0].data = [
                emotionalData.aggregatedEmotions.calm || 0,
                emotionalData.aggregatedEmotions.angry || 0,
                emotionalData.aggregatedEmotions.depressed || 0,
                emotionalData.aggregatedEmotions.fear || 0,
                emotionalData.aggregatedEmotions.happy || 0
            ];
            this.charts.emotionPie.update('active');
        }

        // Update crime bar chart
        if (this.charts.crimeBar) {
            const crimeData = emotionalData.crimeStats || {};

            // Extract keys (crime types) and values (counts) from the crimeStats object
            const crimeTypes = Object.keys(crimeData);
            const crimeCounts = crimeTypes.map(type => crimeData[type]);

            // Update the chart labels and data dynamically
            this.charts.crimeBar.data.labels = crimeTypes;
            this.charts.crimeBar.data.datasets[0].data = crimeCounts;

            // Update the chart
            this.charts.crimeBar.update('active');
        }

        // Update safety index display
        this.updateSafetyIndexDisplay(emotionalData.safetyIndex);

        // Update safety trend chart if we have historical data
        if (this.charts.safetyTrend && emotionalData.historicalData) {
            const safetyTrend = emotionalData.historicalData.safetyTrend || [];
            const dates = emotionalData.historicalData.dates || [];

            // Update both labels and data
            this.charts.safetyTrend.data.labels = dates;
            this.charts.safetyTrend.data.datasets[0].data = safetyTrend;
            this.charts.safetyTrend.update('active');
        }

        // Update time-based crime chart if we have time data
        if (emotionalData.timeBasedCrimes) {
            this.updateTimeBasedCrimeChart(emotionalData.timeBasedCrimes);
        }

        // Update social media sentiment chart if we have social media data
        if (emotionalData.socialMediaData) {
            this.updateSocialMediaChart(emotionalData.socialMediaData);
        }

        // Update emotional zone indicators
        this.updateZoneIndicators(emotionalData.aggregatedEmotions);
    }

    // Update safety index display
    updateSafetyIndexDisplay(score) {
        const scoreElement = document.querySelector('.safety-score');
        const fillElement = document.querySelector('.safety-fill');

        if (scoreElement && fillElement) {
            // Animate the score change
            this.animateValue(scoreElement, parseInt(scoreElement.textContent), score, 1000);

            // Update color based on score
            if (score >= 70) {
                scoreElement.style.color = '#2ecc71'; // Green
            } else if (score >= 40) {
                scoreElement.style.color = '#f1c40f'; // Yellow
            } else {
                scoreElement.style.color = '#e74c3c'; // Red
            }

            // Animate the fill
            fillElement.style.transition = 'width 1s ease-in-out';
            fillElement.style.width = score + '%';
        }
    }

    // Animate numerical value changes
    animateValue(element, start, end, duration) {
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out function
            const easeOut = 1 - Math.pow(1 - progress, 2);
            const value = Math.floor(start + (end - start) * easeOut);

            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Update emotional zone indicators
    updateZoneIndicators(emotions = {}) {
        const zones = document.querySelectorAll('.zone');

        zones.forEach(zone => {
            let emotion = '';
            if (zone.classList.contains('calm-zone')) emotion = 'calm';
            if (zone.classList.contains('angry-zone')) emotion = 'angry';
            if (zone.classList.contains('depressed-zone')) emotion = 'depressed';
            if (zone.classList.contains('fear-zone')) emotion = 'fear';

            if (emotions[emotion] !== undefined) {
                // Add intensity indicator based on percentage
                const intensity = emotions[emotion];
                zone.style.opacity = 0.7 + (intensity / 100) * 0.3; // Range from 0.7 to 1.0

                // Add pulsing effect for high intensity
                if (intensity > 70) {
                    zone.style.animation = 'pulse 1.5s infinite';
                } else {
                    zone.style.animation = 'none';
                }
            }
        });
    }

    // Create animated emotional heatmap overlay
    createEmotionalHeatmap(location, emotions) {
        // Create a canvas overlay on the map showing heat distribution of emotions
        if (window.map) { // Assuming Google Map is available as 'map'
            // Prepare data for heatmap
            const heatmapData = [];

            // Convert real emotion data to weighted locations
            for (const [emotion, intensity] of Object.entries(emotions)) {
                // Use real geographic coordinates from the analysis data
                if (intensity > 0) {
                    // Use coordinates from the analysis data
                    const locations = window.currentEmotionalData?.geographicData?.[emotion] || [];

                    locations.forEach(location => {
                        heatmapData.push({
                            location: new google.maps.LatLng(location.lat, location.lng),
                            weight: location.weight || intensity
                        });
                    });
                }
            }

            // Create or update heatmap layer
            if (this.heatmapLayer) {
                this.heatmapLayer.setMap(null);
            }

            this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: window.map,
                dissipating: true,
                maxIntensity: 100,
                opacity: 0.6,
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
        }
    }

    // Create timeline visualization
    createTimelineVisualization(data) {
        // Create a timeline showing emotional changes over time
        const timelineContainer = document.getElementById('timeline-container');

        if (!timelineContainer) {
            const container = document.createElement('div');
            container.id = 'timeline-container';
            container.className = 'chart-container';
            container.innerHTML = '<h3>Emotional Timeline</h3><div id="timeline-chart"></div>';

            const dataPanel = document.querySelector('.data-panel');
            dataPanel.appendChild(container);
        }

        // Implementation would go here
        console.log('Creating timeline visualization:', data);
    }

    // Export data as CSV
    exportDataAsCSV(data, filename = 'emotional_data.csv') {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Metric,Value\n';
        csvContent += `Safety Index,${data.safetyIndex}\n`;
        csvContent += `Calm,${data.aggregatedEmotions.calm}\n`;
        csvContent += `Angry,${data.aggregatedEmotions.angry}\n`;
        csvContent += `Depressed,${data.aggregatedEmotions.depressed}\n`;
        csvContent += `Fear,${data.aggregatedEmotions.fear}\n`;
        csvContent += `Happy,${data.aggregatedEmotions.happy}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Initialize visual effects
    initializeVisualEffects() {
        // Add hover effects to chart containers
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.addEventListener('mouseenter', () => {
                container.style.transform = 'translateY(-5px)';
                container.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
            });

            container.addEventListener('mouseleave', () => {
                container.style.transform = 'translateY(0)';
                container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            });
        });

        // Add pulse animation to safety index
        const safetyIndex = document.querySelector('.safety-index');
        if (safetyIndex) {
            safetyIndex.style.animation = 'pulse 3s infinite';
        }
    }

    // Create time-based crime analysis chart
    createTimeBasedCrimeChart() {
        // Create a canvas element for the chart
        const ctx = document.createElement('canvas');
        ctx.id = 'time-crime-chart';
        ctx.height = 150;

        // Add chart container to the page if it doesn't exist
        if (!document.getElementById('time-crime-container')) {
            const container = document.createElement('div');
            container.id = 'time-crime-container';
            container.className = 'chart-container';
            container.innerHTML = '<h3>Crime Reports by Time of Day</h3>';
            container.appendChild(ctx);

            // Insert after the crime bar chart
            const crimeChartContainer = document.querySelector('#crime-bar-chart').closest('.chart-container');
            if (crimeChartContainer) {
                crimeChartContainer.parentNode.insertBefore(container, crimeChartContainer.nextSibling);
            }
        }

        // Create the chart
        this.charts.timeCrimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
                    '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'],
                datasets: [{
                    label: 'Number of Reports',
                    data: Array(24).fill(0), // Initialize with zeros
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 6
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Update time-based crime chart with new data
    updateTimeBasedCrimeChart(timeData) {
        if (this.charts.timeCrimeChart) {
            // Update the chart data with time-based crime information
            this.charts.timeCrimeChart.data.datasets[0].data = timeData || Array(24).fill(0);
            this.charts.timeCrimeChart.update('active');
        }
    }

    // Integrate social media sentiment analysis
    integrateSocialMediaData(socialMediaData) {
        // Create a social media sentiment chart
        const ctx = document.createElement('canvas');
        ctx.id = 'social-media-chart';
        ctx.height = 150;

        // Add chart container to the page if it doesn't exist
        if (!document.getElementById('social-media-container')) {
            const container = document.createElement('div');
            container.id = 'social-media-container';
            container.className = 'chart-container';
            container.innerHTML = '<h3>Social Media Sentiment Analysis</h3>';
            container.appendChild(ctx);

            // Insert after the time-based crime chart
            const timeChartContainer = document.querySelector('#time-crime-chart').closest('.chart-container');
            if (timeChartContainer) {
                timeChartContainer.parentNode.insertBefore(container, timeChartContainer.nextSibling);
            }
        }

        // Create or update the social media sentiment chart
        if (this.charts.socialMediaChart) {
            this.charts.socialMediaChart.destroy();
        }

        this.charts.socialMediaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    label: 'Sentiment Count',
                    data: [
                        socialMediaData.positive || 0,
                        socialMediaData.neutral || 0,
                        socialMediaData.negative || 0
                    ],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.7)',  // Green for positive
                        'rgba(52, 152, 219, 0.7)',  // Blue for neutral
                        'rgba(231, 76, 60, 0.7)'     // Red for negative
                    ],
                    borderColor: [
                        'rgba(46, 204, 113, 1)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(231, 76, 60, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 6
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Update social media sentiment chart with new data
    updateSocialMediaChart(socialMediaData) {
        if (this.charts.socialMediaChart) {
            // Update the chart data with new social media information
            this.charts.socialMediaChart.data.datasets[0].data = [
                socialMediaData.positive || 0,
                socialMediaData.neutral || 0,
                socialMediaData.negative || 0
            ];
            this.charts.socialMediaChart.update('active');
        }
    }

    // Integrate with Twitter API
    async integrateTwitterData(location) {
        try {
            const response = await fetch('/api/social/twitter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    query: `location:${location} OR ${location.split(',')[0]}`
                })
            });

            if (!response.ok) {
                throw new Error(`Twitter API request failed with status ${response.status}`);
            }

            const twitterData = await response.json();
            return this.processSocialMediaData(twitterData, 'twitter');
        } catch (error) {
            console.error('Error fetching Twitter data:', error);
            return this.getDefaultSocialMediaData();
        }
    }

    // Integrate with Facebook API
    async integrateFacebookData(location) {
        try {
            const response = await fetch('/api/social/facebook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    query: location
                })
            });

            if (!response.ok) {
                throw new Error(`Facebook API request failed with status ${response.status}`);
            }

            const facebookData = await response.json();
            return this.processSocialMediaData(facebookData, 'facebook');
        } catch (error) {
            console.error('Error fetching Facebook data:', error);
            return this.getDefaultSocialMediaData();
        }
    }

    // Integrate with Instagram API
    async integrateInstagramData(location) {
        try {
            const response = await fetch('/api/social/instagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    query: location
                })
            });

            if (!response.ok) {
                throw new Error(`Instagram API request failed with status ${response.status}`);
            }

            const instagramData = await response.json();
            return this.processSocialMediaData(instagramData, 'instagram');
        } catch (error) {
            console.error('Error fetching Instagram data:', error);
            return this.getDefaultSocialMediaData();
        }
    }

    // Process social media data from all platforms
    processSocialMediaData(rawData, platform) {
        // Process raw data from social media API to extract sentiment
        let positive = 0, neutral = 0, negative = 0;

        if (rawData && rawData.posts) {
            rawData.posts.forEach(post => {
                // Simple sentiment analysis based on keywords (in real implementation, would use AI)
                const text = post.text || post.caption || '';
                const lowerText = text.toLowerCase();

                if (this.containsPositiveKeywords(lowerText)) {
                    positive++;
                } else if (this.containsNegativeKeywords(lowerText)) {
                    negative++;
                } else {
                    neutral++;
                }
            });
        }

        return {
            platform,
            positive,
            neutral,
            negative,
            total: positive + neutral + negative
        };
    }

    // Check if text contains positive keywords
    containsPositiveKeywords(text) {
        const positiveKeywords = ['good', 'great', 'amazing', 'love', 'happy', 'wonderful', 'fantastic', 'excellent', 'nice', 'perfect', 'beautiful', 'awesome', 'brilliant', 'outstanding', 'superb'];
        return positiveKeywords.some(keyword => text.includes(keyword));
    }

    // Check if text contains negative keywords
    containsNegativeKeywords(text) {
        const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'horrible', 'worst', 'disgusting', 'disappointing', 'frightening', 'scary', 'dangerous', 'fear', 'angry', 'upset'];
        return negativeKeywords.some(keyword => text.includes(keyword));
    }

    // Get default social media data when API fails
    getDefaultSocialMediaData() {
        return {
            platform: 'default',
            positive: 0,
            neutral: 0,
            negative: 0,
            total: 0
        };
    }

    // Aggregate data from all social media platforms
    async aggregateSocialMediaData(location) {
        // Fetch data from all platforms concurrently
        const [twitterData, facebookData, instagramData] = await Promise.all([
            this.integrateTwitterData(location),
            this.integrateFacebookData(location),
            this.integrateInstagramData(location)
        ]);

        // Aggregate the data
        const aggregatedData = {
            positive: twitterData.positive + facebookData.positive + instagramData.positive,
            neutral: twitterData.neutral + facebookData.neutral + instagramData.neutral,
            negative: twitterData.negative + facebookData.negative + instagramData.negative,
            platforms: {
                twitter: twitterData,
                facebook: facebookData,
                instagram: instagramData
            }
        };

        return aggregatedData;
    }
}

// Initialize visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new EmotionalMapVisualizer();
    window.emotionalMapVisualizer = visualizer; // Make available globally

    // Initialize all charts
    visualizer.initializeCharts();

    // Initialize visual effects
    visualizer.initializeVisualEffects();

    console.log('Emotional Map Visualizer initialized');
});