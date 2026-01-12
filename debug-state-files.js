const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

// Debug script to check the topojson files for problematic states
const statesToCheck = ['himachal-pradesh', 'madhya-pradesh', 'manipur', 'punjab'];
const foldersToCheck = ['divisions', 'states', 'districts'];

console.log('Checking topojson files for problematic states...\n');

for (const state of statesToCheck) {
    console.log(`Checking state: ${state}`);

    let found = false;
    for (const folder of foldersToCheck) {
        const topoJsonPath = path.join(__dirname, 'maps-master', 'maps-master', folder, `${state}.topo.json`);

        if (fs.existsSync(topoJsonPath)) {
            console.log(`  Found file: ${topoJsonPath}`);

            try {
                const topoJsonData = fs.readFileSync(topoJsonPath, 'utf8');
                const topoJson = JSON.parse(topoJsonData);

                console.log(`  TopoJSON objects keys:`, topoJson.objects ? Object.keys(topoJson.objects) : 'No objects property');

                // Try different key variations
                const possibleKeys = [
                    state,
                    `${state}-division-district`,
                    `${state}-test`,
                    `${state}-division`,
                    `${state}-districts-divisions`,
                    `${state}-divisions-districts`,
                    `${state}-divisions`,
                    `${state}-districts`,
                    `${state}-states`,
                    // Additional variations without hyphens
                    `${state.replace('-', '')}`,
                    `${state.replace('-', '')}-districts`,
                    `${state.replace('-', '')}-divisions`,
                    `${state.replace('-', '')}-division`,
                    `${state.replace('-', '')}-test`
                ];

                for (const key of possibleKeys) {
                    if (topoJson.objects && topoJson.objects[key]) {
                        console.log(`    ✓ Found matching key: "${key}"`);

                        // Try to convert to geojson to make sure it works
                        try {
                            const geoJson = topojson.feature(topoJson, topoJson.objects[key]);
                            console.log(`    ✓ Conversion to GeoJSON successful (type: ${geoJson.type})`);

                            // Count coordinates
                            let coordCount = 0;
                            if (geoJson.type === 'FeatureCollection') {
                                for (const feature of geoJson.features) {
                                    if (feature.geometry.type === 'Polygon') {
                                        coordCount += feature.geometry.coordinates[0].length;
                                    } else if (feature.geometry.type === 'MultiPolygon') {
                                        for (const polygon of feature.geometry.coordinates) {
                                            coordCount += polygon[0].length; // outer ring only
                                        }
                                    }
                                }
                            } else {
                                if (geoJson.geometry.type === 'Polygon') {
                                    coordCount += geoJson.geometry.coordinates[0].length;
                                } else if (geoJson.geometry.type === 'MultiPolygon') {
                                    for (const polygon of geoJson.geometry.coordinates) {
                                        coordCount += polygon[0].length; // outer ring only
                                    }
                                }
                            }
                            console.log(`    Coordinates count: ${coordCount}`);
                        } catch (convertErr) {
                            console.log(`    ✗ Conversion failed: ${convertErr.message}`);
                        }
                        break;
                    }
                }

                if (!topoJson.objects || Object.keys(topoJson.objects).every(key => !topoJson.objects[key])) {
                    console.log(`    ✗ No valid object keys found`);
                }
            } catch (err) {
                console.log(`  Error reading/parsing file: ${err.message}`);
            }

            found = true;
            break;
        }
    }

    if (!found) {
        console.log(`  File not found in any folder`);

        // Also check without subfolders
        const directPath = path.join(__dirname, 'maps-master', 'maps-master', `${state}.topo.json`);
        if (fs.existsSync(directPath)) {
            console.log(`  Found direct file: ${directPath}`);
        } else {
            console.log(`  Direct file also not found`);
        }
    }

    console.log('');
}

console.log('Debug check completed.');