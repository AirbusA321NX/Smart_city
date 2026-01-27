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
        const canvas = document.getElementById('emotion-pie-chart');
        if (!canvas) {
            console.warn('Emotion pie chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.emotionPie) {
            this.charts.emotionPie.destroy();
            this.charts.emotionPie = null;
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
        const canvas = document.getElementById('crime-bar-chart');
        if (!canvas) {
            console.warn('Crime bar chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.crimeBar) {
            this.charts.crimeBar.destroy();
            this.charts.crimeBar = null;
        }

        this.charts.crimeBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [], // Will be dynamically populated based on crime data from Mistral AI analysis
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
        if (window.map) { // Using Leaflet map instead of Google Maps
            // Clear any existing zone markers
            if (this.emotionalZones) {
                this.emotionalZones.forEach(zone => window.map.removeLayer(zone));
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
        // Create Leaflet marker
        const marker = L.marker([zone.position.lat, zone.position.lng], {
            icon: this.getEmotionIcon(zone.emotion, zone.intensity)
        }).addTo(map);

        marker.bindPopup(`${zone.emotion.charAt(0).toUpperCase() + zone.emotion.slice(1)} Zone (${zone.intensity}%)`);

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

        // Create a Leaflet DivIcon for the emotion marker
        const radius = 10 + (intensity / 10);
        const color = colors[emotion] || '#7f8c8d'; // Default gray if emotion not found

        return L.divIcon({
            className: 'emotion-marker',
            html: `<div style="width: ${radius}px; height: ${radius}px; background-color: ${color}; border-radius: 50%; border: 2px solid white; opacity: ${intensity / 100};"></div>`,
            iconSize: [radius, radius],
            iconAnchor: [radius / 2, radius / 2]
        });
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
        if (window.map) { // Using Leaflet map instead of Google Maps
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
                            lat: location.lat,
                            lng: location.lng,
                            weight: location.weight || intensity
                        });
                    });
                }
            }

            // Create or update heatmap layer
            // Note: Leaflet doesn't have built-in heatmap layers like Google Maps
            // We would need to use a plugin like leaflet-heat for this functionality
            // For now, we'll skip heatmap functionality or use markers

            // Alternative: Add markers for each location instead
            heatmapData.forEach(point => {
                const marker = L.circleMarker([point.lat, point.lng], {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: point.weight / 100,
                    radius: Math.max(5, point.weight / 10)
                }).addTo(window.map);

                if (!this.heatmapMarkers) {
                    this.heatmapMarkers = [];
                }
                this.heatmapMarkers.push(marker);
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