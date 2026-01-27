/**
 * Crime Mapping Module
 * Displays interactive map with safety index color coding
 */

class CrimeMap {
    constructor(mapContainerId) {
        this.mapContainer = document.getElementById(mapContainerId);
        this.map = null;
        this.markers = [];
        this.heatmapLayer = null;
        this.safetyData = new Map();
        
        // Safety index thresholds
        this.thresholds = {
            high: 40,      // 0-40: Red (High crime)
            medium: 70     // 41-70: Yellow (Medium crime), 71-100: Green (Low crime)
        };
    }

    /**
     * Initialize the map
     */
    async initMap(center = [28.7041, 77.1025], zoom = 6) {
        // Using Leaflet.js for mapping
        this.map = L.map(this.mapContainer).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        console.log('✓ Map initialized');
    }

    /**
     * Get color based on safety index
     */
    getSafetyColor(safetyIndex) {
        if (safetyIndex <= this.thresholds.high) {
            return '#dc3545'; // Red - High crime
        } else if (safetyIndex <= this.thresholds.medium) {
            return '#ffc107'; // Yellow - Medium crime
        } else {
            return '#28a745'; // Green - Low crime
        }
    }

    /**
     * Get safety status text
     */
    getSafetyStatus(safetyIndex) {
        if (safetyIndex <= this.thresholds.high) {
            return 'High Crime Area';
        } else if (safetyIndex <= this.thresholds.medium) {
            return 'Medium Crime Area';
        } else {
            return 'Low Crime Area';
        }
    }

    /**
     * Add location marker with safety color
     */
    addLocationMarker(location, safetyIndex, crimeData) {
        const color = this.getSafetyColor(safetyIndex);
        const status = this.getSafetyStatus(safetyIndex);

        // Create custom colored marker
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
            ">${Math.round(safetyIndex)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([location.lat, location.lon], {
            icon: markerIcon
        }).addTo(this.map);

        // Create popup content
        const popupContent = `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: ${color};">${location.name}</h4>
                <div style="margin-bottom: 8px;">
                    <strong>Safety Index:</strong> 
                    <span style="color: ${color}; font-weight: bold;">${safetyIndex}/100</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Status:</strong> 
                    <span style="color: ${color};">${status}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Total Crimes:</strong> ${crimeData.total || 0}
                </div>
                <div style="font-size: 12px; color: #666;">
                    <strong>Crime Breakdown:</strong><br>
                    Theft: ${crimeData.theft || 0}<br>
                    Assault: ${crimeData.assault || 0}<br>
                    Robbery: ${crimeData.robbery || 0}<br>
                    Harassment: ${crimeData.harassment || 0}<br>
                    Other: ${crimeData.other || 0}
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        this.markers.push(marker);

        // Store safety data
        this.safetyData.set(location.name, {
            safetyIndex,
            crimeData,
            location,
            color,
            status
        });

        return marker;
    }

    /**
     * Add region polygon with safety color
     */
    addRegionPolygon(coordinates, regionName, safetyIndex, crimeData) {
        const color = this.getSafetyColor(safetyIndex);
        const status = this.getSafetyStatus(safetyIndex);

        const polygon = L.polygon(coordinates, {
            color: color,
            fillColor: color,
            fillOpacity: 0.4,
            weight: 2
        }).addTo(this.map);

        const popupContent = `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: ${color};">${regionName}</h4>
                <div style="margin-bottom: 8px;">
                    <strong>Safety Index:</strong> 
                    <span style="color: ${color}; font-weight: bold;">${safetyIndex}/100</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Status:</strong> 
                    <span style="color: ${color};">${status}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Total Crimes:</strong> ${crimeData.total || 0}
                </div>
            </div>
        `;

        polygon.bindPopup(popupContent);
        this.markers.push(polygon);

        return polygon;
    }

    /**
     * Clear all markers and polygons
     */
    clearMap() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
        this.safetyData.clear();
    }

    /**
     * Fit map to show all markers
     */
    fitBounds() {
        if (this.markers.length > 0) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    /**
     * Add legend to map
     */
    addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            div.style.cssText = `
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
            `;

            div.innerHTML = `
                <h4 style="margin: 0 0 10px 0; font-size: 14px;">Safety Index</h4>
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <div style="width: 20px; height: 20px; background: #28a745; margin-right: 8px; border-radius: 3px;"></div>
                    <span style="font-size: 12px;">Low Crime (71-100)</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <div style="width: 20px; height: 20px; background: #ffc107; margin-right: 8px; border-radius: 3px;"></div>
                    <span style="font-size: 12px;">Medium Crime (41-70)</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="width: 20px; height: 20px; background: #dc3545; margin-right: 8px; border-radius: 3px;"></div>
                    <span style="font-size: 12px;">High Crime (0-40)</span>
                </div>
            `;

            return div;
        };

        legend.addTo(this.map);
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        const summary = {
            totalLocations: this.safetyData.size,
            highCrime: 0,
            mediumCrime: 0,
            lowCrime: 0,
            averageSafety: 0,
            totalCrimes: 0
        };

        let safetySum = 0;

        this.safetyData.forEach((data) => {
            safetySum += data.safetyIndex;
            summary.totalCrimes += data.crimeData.total || 0;

            if (data.safetyIndex <= this.thresholds.high) {
                summary.highCrime++;
            } else if (data.safetyIndex <= this.thresholds.medium) {
                summary.mediumCrime++;
            } else {
                summary.lowCrime++;
            }
        });

        summary.averageSafety = summary.totalLocations > 0 
            ? Math.round(safetySum / summary.totalLocations) 
            : 0;

        return summary;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrimeMap;
}
