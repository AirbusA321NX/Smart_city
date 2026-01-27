/**
 * Crime Timeline Visualization
 * Displays crime trends over time
 */

let crimeTimelineChart = null;

/**
 * Update crime timeline chart
 * @param {Object} timelineData - Timeline data from API
 */
function updateCrimeTimeline(timelineData) {
    console.log('🔍 updateCrimeTimeline called with:', timelineData);
    
    const container = document.getElementById('current-period-info');
    if (!container) {
        console.error('❌ Crime timeline container not found!');
        return;
    }

    console.log('✓ Timeline container found');

    // Show container even if data is minimal
    if (!timelineData) {
        console.warn('⚠️ No timeline data provided');
        container.innerHTML = '<div style="color: #fff; opacity: 0.7; padding: 20px; text-align: center;">No crime timeline data available</div>';
        return;
    }

    const currentMonth = timelineData.currentMonth || {};
    const overallTrend = timelineData.overallTrend || {};
    const monthlyData = timelineData.monthlyData || [];
    
    console.log('Current month:', currentMonth);
    console.log('Monthly data length:', monthlyData.length);
    
    // Get crime breakdown from the first month's data or from crimeStats
    const crimeBreakdown = monthlyData[0]?.crimeBreakdown || {};
    
    console.log('Crime breakdown:', crimeBreakdown);
    
    // Create crime list HTML
    let crimeListHtml = '';
    const crimeEntries = Object.entries(crimeBreakdown);
    
    if (crimeEntries.length > 0) {
        console.log('✓ Creating crime list with', crimeEntries.length, 'entries');
        crimeListHtml = `
            <div class="crime-list-section">
                <h4 style="color: #fff; margin-bottom: 15px; font-size: 1.1rem;">Crime Types (This Month)</h4>
                <div class="crime-list">
                    ${crimeEntries.map(([type, count]) => `
                        <div class="crime-item">
                            <span class="crime-type">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            <span class="crime-count">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        console.warn('⚠️ No crime entries in breakdown');
    }

    // Determine trend class
    let trendClass = 'neutral';
    if (currentMonth.comparedToLastMonth > 0) {
        trendClass = 'negative';
    } else if (currentMonth.comparedToLastMonth < 0) {
        trendClass = 'positive';
    }

    container.innerHTML = `
        <div class="period-summary">
            <div class="period-stat">
                <span class="period-label">Current Period:</span>
                <span class="period-value">${currentMonth.name || 'This Month'}</span>
            </div>
            <div class="period-stat">
                <span class="period-label">Total Crimes:</span>
                <span class="period-value ${trendClass}">
                    ${currentMonth.totalCrimes || 0}
                </span>
            </div>
            <div class="period-stat">
                <span class="period-label">Status:</span>
                <span class="period-value ${currentMonth.status === 'better' ? 'positive' : currentMonth.status === 'worse' ? 'negative' : 'neutral'}">
                    ${(currentMonth.status || 'Stable').toUpperCase()}
                </span>
            </div>
        </div>
        
        ${crimeListHtml}
        
        <div class="trend-summary">
            <div class="period-stat">
                <span class="period-label">Most Common:</span>
                <span class="period-value">${overallTrend.mostCommonCrime || 'N/A'}</span>
            </div>
            <div class="period-stat">
                <span class="period-label">Trend:</span>
                <span class="period-value ${overallTrend.direction === 'improving' ? 'positive' : overallTrend.direction === 'worsening' ? 'negative' : 'neutral'}">
                    ${(overallTrend.direction || 'Stable').toUpperCase()}
                </span>
            </div>
        </div>
    `;

    // Add recommendations if available
    if (timelineData.recommendations && timelineData.recommendations.length > 0) {
        const recommendationsHtml = `
            <div class="recommendations-section">
                <h4 style="color: #fff; margin: 15px 0 10px 0; font-size: 1rem;">Safety Recommendations:</h4>
                <ul style="margin: 0; padding-left: 20px; opacity: 0.9; color: #fff;">
                    ${timelineData.recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        container.innerHTML += recommendationsHtml;
    }
    
    // Hide the chart canvas since we're not using it
    const canvas = document.getElementById('crime-timeline-chart');
    if (canvas) {
        canvas.style.display = 'none';
    }
}

/**
 * Show crime breakdown by type
 * @param {Object} monthData - Month data
 */
function showCrimeBreakdown(monthData) {
    if (!monthData || !monthData.crimeBreakdown) return;

    const breakdown = monthData.crimeBreakdown;
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    console.log(`Crime Breakdown for ${monthData.month}:`);
    console.log(`Total: ${total}`);
    Object.entries(breakdown).forEach(([type, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        console.log(`  ${type}: ${count} (${percentage}%)`);
    });
}
