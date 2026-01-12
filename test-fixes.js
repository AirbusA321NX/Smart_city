const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

// Test the fixed logic for problematic states
async function testStateBoundaries() {
    console.log('Testing state boundaries with updated logic...\n');

    const statesToTest = [
        { location: 'Himachal Pradesh', expectedFile: 'himachal-pradesh' },
        { location: 'Madhya Pradesh', expectedFile: 'madhya-pradesh' },
        { location: 'Manipur', expectedFile: 'manipur' },
        { location: 'Punjab', expectedFile: 'punjab' }
    ];

    for (const stateData of statesToTest) {
        const { location, expectedFile } = stateData;
        console.log(`Testing location: ${location}`);

        // Replicate the server logic
        const stateNameMap = {
            'andhra pradesh': 'andhra-pradesh',
            'arunachal pradesh': 'arunachalpradesh',
            'assam': 'assam',
            'bihar': 'bihar',
            'chhattisgarh': 'chhattisgarh',
            'goa': 'goa',
            'gujarat': 'gujarat-divisions',
            'haryana': 'haryana',
            'himachal pradesh': 'himachal-pradesh',
            'jharkhand': 'jharkhand',
            'karnataka': 'karnataka',
            'kerala': 'kerala',
            'madhya pradesh': 'madhya-pradesh',
            'maharashtra': 'maharashtra',
            'manipur': 'manipur',
            'meghalaya': 'meghalaya',
            'mizoram': 'mizoram',
            'nagaland': 'nagaland',
            'odisha': 'odisha',
            'punjab': 'punjab',
            'rajasthan': 'rajasthan',
            'sikkim': 'sikkim',
            'tamil nadu': 'tamilnadu',
            'telangana': 'telangana',
            'tripura': 'tripura',
            'uttar pradesh': 'uttar-pradesh',
            'uttarakhand': 'uttarakhand',
            'west bengal': 'west-bengal',
            'chandigarh': 'chandigarh',
            'delhi': 'delhi',
            'puducherry': 'puducherry',
            'lakshadweep': 'lakshadweep',
            'andaman and nicobar islands': 'andamannicobarislands',
            'dadra and nagar haveli and daman and diu': 'dnh',
            'jammu and kashmir': 'jammu-kashmir',
            'ladakh': 'ladakh'
        };

        const locationLower = location.toLowerCase();
        let stateName = '';

        // Try to extract state name from location string
        for (const [fullStateName, fileName] of Object.entries(stateNameMap)) {
            if (locationLower.includes(fullStateName)) {
                stateName = fileName;
                break;
            }
        }

        if (!stateName) {
            console.log(`  Could not map location to state name`);
            continue;
        }

        // Try to read the corresponding topojson file
        let topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'divisions', `${stateName}.topo.json`);
        let topoJson = null;
        let objectKey = null;

        // If the divisions file doesn't exist, try other folders
        if (!fs.existsSync(topoJsonPath)) {
            // Try the states folder
            topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'states', `${stateName}.topo.json`);

            if (!fs.existsSync(topoJsonPath)) {
                // Try the districts folder
                topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', 'districts', `${stateName}.topo.json`);

                if (!fs.existsSync(topoJsonPath)) {
                    // Try without any subfolder
                    topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', `${stateName}.topo.json`);
                }
            }
        }

        if (fs.existsSync(topoJsonPath)) {
            try {
                const topoJsonData = fs.readFileSync(topoJsonPath, 'utf8');
                topoJson = JSON.parse(topoJsonData);

                // Determine the correct object key in the topojson (using updated logic)
                objectKey = stateName;
                if (topoJson.objects && !topoJson.objects[stateName]) {
                    // If the direct stateName key doesn't exist, try common variations
                    const possibleKeys = [
                        `${stateName}-division-district`,  // Like in the assam file
                        `${stateName}-test`,              // Like in the haryana file
                        `${stateName}-division`,          // Like in the bihar file
                        `${stateName}-districts-divisions`,
                        `${stateName}-divisions-districts`,
                        `${stateName}-divisions`,
                        `${stateName}-districts`,
                        `${stateName}-states`,
                        // Additional variations for states like himachal-pradesh, madhya-pradesh, etc.
                        `${stateName.replace('-', '')}`,           // himachalpradesh instead of himachal-pradesh
                        `${stateName.replace('-', '')}-districts`, // himachalpradesh-districts
                        `${stateName.replace('-', '')}-divisions`, // himachalpradesh-divisions
                        `${stateName.replace('-', '')}-division`,  // himachalpradesh-division
                        `${stateName.replace('-', '')}-test`,      // himachalpradesh-test
                        // Specific known variations from debug
                        'hp-division',                           // himachal-pradesh variation
                        'MadhyaPradesh',                         // madhya-pradesh variation
                        'Manipur',                               // manipur variation
                        'Punjab',                                // punjab variation
                        stateName
                    ];

                    for (const key of possibleKeys) {
                        if (topoJson.objects && topoJson.objects[key]) {
                            objectKey = key;
                            break;
                        }
                    }

                    // If still no match, try with different name formats
                    if (!objectKey && location) {
                        const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
                        const possibleAlternativeKeys = [
                            normalizedLocation,
                            `${normalizedLocation}-division-district`,
                            `${normalizedLocation}-test`,
                            `${normalizedLocation}-division`,
                            `${normalizedLocation}-districts-divisions`,
                            `${normalizedLocation}-divisions-districts`,
                            `${normalizedLocation}-divisions`,
                            `${normalizedLocation}-districts`,
                            `${normalizedLocation}-states`,
                            // Additional variations for states like himachal-pradesh, madhya-pradesh, etc.
                            `${normalizedLocation.replace('-', '')}`,           // himachalpradesh instead of himachal-pradesh
                            `${normalizedLocation.replace('-', '')}-districts`, // himachalpradesh-districts
                            `${normalizedLocation.replace('-', '')}-divisions`, // himachalpradesh-divisions
                            `${normalizedLocation.replace('-', '')}-division`,  // himachalpradesh-division
                            `${normalizedLocation.replace('-', '')}-test`,      // himachalpradesh-test
                            // Specific known variations from debug
                            'hp-division',                           // himachal-pradesh variation
                            'MadhyaPradesh',                         // madhya-pradesh variation
                            'Manipur',                               // manipur variation
                            'Punjab'                                 // punjab variation
                        ];

                        for (const key of possibleAlternativeKeys) {
                            if (topoJson.objects && topoJson.objects[key]) {
                                objectKey = key;
                                break;
                            }
                        }
                    }

                    // If still no match, try with the first available key as fallback
                    if (!objectKey && topoJson.objects) {
                        const allKeys = Object.keys(topoJson.objects);
                        if (allKeys.length > 0) {
                            objectKey = allKeys[0];
                        }
                    }
                }

                // Convert topojson to geojson to get the geometry
                if (!topoJson.objects || !topoJson.objects[objectKey]) {
                    console.log(`  ✗ Object key '${objectKey}' not found in topojson file for location: ${location}`);
                    console.log(`  Available keys:`, Object.keys(topoJson.objects || {}));
                } else {
                    console.log(`  ✓ Found object key: '${objectKey}'`);

                    try {
                        const geoJson = topojson.feature(topoJson, topoJson.objects[objectKey]);
                        console.log(`  ✓ Conversion to GeoJSON successful (type: ${geoJson.type})`);

                        // Extract coordinates using the same helper function as in app.js
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

                        console.log(`  ✓ Successfully extracted ${coords.length} coordinates`);
                    } catch (convertErr) {
                        console.log(`  ✗ Conversion to GeoJSON failed: ${convertErr.message}`);
                    }
                }
            } catch (parseError) {
                console.log(`  ✗ Error parsing topojson file: ${parseError.message}`);
            }
        } else {
            console.log(`  ✗ File does not exist: ${topoJsonPath}`);
        }

        console.log('');
    }

    console.log('Test completed.');
}

testStateBoundaries();