const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

// Test reading a specific topojson file
const topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'divisions', 'maharashtra.topo.json');

console.log('Checking if file exists:', fs.existsSync(topoJsonPath));

if (fs.existsSync(topoJsonPath)) {
    try {
        const topoJsonData = fs.readFileSync(topoJsonPath, 'utf8');
        const topoJson = JSON.parse(topoJsonData);

        console.log('TopoJSON keys:', Object.keys(topoJson));
        console.log('Objects keys:', topoJson.objects ? Object.keys(topoJson.objects) : 'No objects property');

        // Try to find the correct object key
        const objectKeys = topoJson.objects ? Object.keys(topoJson.objects) : [];
        if (objectKeys.length > 0) {
            const firstKey = objectKeys[0];
            console.log('Attempting to convert with key:', firstKey);

            try {
                const geoJson = topojson.feature(topoJson, topoJson.objects[firstKey]);
                console.log('GeoJSON created successfully');
                console.log('GeoJSON type:', geoJson.type);

                // Extract coordinates based on geometry type
                function extractCoordinates(geometry) {
                    const coordinates = [];

                    if (geometry.type === 'Polygon') {
                        // For Polygon, the first element contains the outer ring
                        for (const coord of geometry.coordinates[0]) {
                            coordinates.push({ lat: coord[1], lng: coord[0] });
                        }
                    } else if (geometry.type === 'MultiPolygon') {
                        // For MultiPolygon, each element is a polygon
                        for (const polygon of geometry.coordinates) {
                            for (const coord of polygon[0]) {  // Take only the outer ring
                                coordinates.push({ lat: coord[1], lng: coord[0] });
                            }
                        }
                    } else if (geometry.type === 'LineString') {
                        // For LineString
                        for (const coord of geometry.coordinates) {
                            coordinates.push({ lat: coord[1], lng: coord[0] });
                        }
                    } else if (geometry.type === 'MultiLineString') {
                        // For MultiLineString
                        for (const lineString of geometry.coordinates) {
                            for (const coord of lineString) {
                                coordinates.push({ lat: coord[1], lng: coord[0] });
                            }
                        }
                    } else if (geometry.type === 'Point') {
                        // For Point
                        coordinates.push({ lat: geometry.coordinates[1], lng: geometry.coordinates[0] });
                    } else if (geometry.type === 'MultiPoint') {
                        // For MultiPoint
                        for (const coord of geometry.coordinates) {
                            coordinates.push({ lat: coord[1], lng: coord[0] });
                        }
                    }

                    return coordinates;
                }

                let coords = [];
                if (geoJson.type === 'FeatureCollection') {
                    for (const feature of geoJson.features) {
                        coords = coords.concat(extractCoordinates(feature.geometry));
                    }
                } else {
                    coords = extractCoordinates(geoJson.geometry);
                }

                console.log('Total coordinates extracted:', coords.length);
                console.log('First few coordinates:', coords.slice(0, 5));
            } catch (convertError) {
                console.error('Error converting topojson to geojson:', convertError.message);
            }
        }
    } catch (error) {
        console.error('Error reading/parsing topojson file:', error.message);
    }
} else {
    console.log('File does not exist at path:', topoJsonPath);
}