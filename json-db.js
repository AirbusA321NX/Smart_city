/**
 * Simple JSON File Database for MVP
 * Stores data in JSON files for quick prototyping
 */

const fs = require('fs').promises;
const path = require('path');

class JsonDatabase {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        this.ensureDataDir();
    }

    // Ensure data directory exists
    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'emotional-analysis'), { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'news-cache'), { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'user-feedback'), { recursive: true });
        } catch (error) {
            console.error('Error creating data directories:', error);
        }
    }

    // Save emotional analysis data
    async saveEmotionalAnalysis(location, data) {
        try {
            const filename = `${this.sanitizeFilename(location)}_${Date.now()}.json`;
            const filepath = path.join(this.dataDir, 'emotional-analysis', filename);
            
            const record = {
                location,
                timestamp: new Date().toISOString(),
                data
            };

            await fs.writeFile(filepath, JSON.stringify(record, null, 2));
            return { success: true, filename };
        } catch (error) {
            console.error('Error saving emotional analysis:', error);
            return { success: false, error: error.message };
        }
    }

    // Get emotional analysis history for a location
    async getEmotionalAnalysisHistory(location, limit = 10) {
        try {
            const dir = path.join(this.dataDir, 'emotional-analysis');
            const files = await fs.readdir(dir);
            
            const locationFiles = files
                .filter(f => f.startsWith(this.sanitizeFilename(location)))
                .sort()
                .reverse()
                .slice(0, limit);

            const history = [];
            for (const file of locationFiles) {
                const content = await fs.readFile(path.join(dir, file), 'utf8');
                history.push(JSON.parse(content));
            }

            return history;
        } catch (error) {
            console.error('Error reading emotional analysis history:', error);
            return [];
        }
    }

    // Cache news data
    async cacheNews(location, articles, ttl = 3600000) {
        try {
            const filename = `${this.sanitizeFilename(location)}.json`;
            const filepath = path.join(this.dataDir, 'news-cache', filename);
            
            const cache = {
                location,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttl,
                articles
            };

            await fs.writeFile(filepath, JSON.stringify(cache, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error caching news:', error);
            return { success: false, error: error.message };
        }
    }

    // Get cached news
    async getCachedNews(location) {
        try {
            const filename = `${this.sanitizeFilename(location)}.json`;
            const filepath = path.join(this.dataDir, 'news-cache', filename);
            
            const content = await fs.readFile(filepath, 'utf8');
            const cache = JSON.parse(content);

            // Check if cache is still valid
            if (cache.expiresAt > Date.now()) {
                return cache.articles;
            }

            return null; // Cache expired
        } catch (error) {
            return null; // No cache found
        }
    }

    // Save user feedback
    async saveUserFeedback(feedback) {
        try {
            const filename = `feedback_${Date.now()}.json`;
            const filepath = path.join(this.dataDir, 'user-feedback', filename);
            
            const record = {
                timestamp: new Date().toISOString(),
                ...feedback
            };

            await fs.writeFile(filepath, JSON.stringify(record, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving feedback:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all feedback
    async getAllFeedback(limit = 50) {
        try {
            const dir = path.join(this.dataDir, 'user-feedback');
            const files = await fs.readdir(dir);
            
            const feedbackFiles = files
                .sort()
                .reverse()
                .slice(0, limit);

            const feedback = [];
            for (const file of feedbackFiles) {
                const content = await fs.readFile(path.join(dir, file), 'utf8');
                feedback.push(JSON.parse(content));
            }

            return feedback;
        } catch (error) {
            console.error('Error reading feedback:', error);
            return [];
        }
    }

    // Get statistics
    async getStatistics() {
        try {
            const emotionalDir = path.join(this.dataDir, 'emotional-analysis');
            const feedbackDir = path.join(this.dataDir, 'user-feedback');
            const cacheDir = path.join(this.dataDir, 'news-cache');

            const [emotionalFiles, feedbackFiles, cacheFiles] = await Promise.all([
                fs.readdir(emotionalDir).catch(() => []),
                fs.readdir(feedbackDir).catch(() => []),
                fs.readdir(cacheDir).catch(() => [])
            ]);

            return {
                totalAnalyses: emotionalFiles.length,
                totalFeedback: feedbackFiles.length,
                cachedLocations: cacheFiles.length,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return null;
        }
    }

    // Clean old cache files
    async cleanOldCache(maxAge = 86400000) {
        try {
            const dir = path.join(this.dataDir, 'news-cache');
            const files = await fs.readdir(dir);
            
            let cleaned = 0;
            for (const file of files) {
                const filepath = path.join(dir, file);
                const content = await fs.readFile(filepath, 'utf8');
                const cache = JSON.parse(content);

                if (cache.expiresAt < Date.now()) {
                    await fs.unlink(filepath);
                    cleaned++;
                }
            }

            return { success: true, cleaned };
        } catch (error) {
            console.error('Error cleaning cache:', error);
            return { success: false, error: error.message };
        }
    }

    // Sanitize filename
    sanitizeFilename(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 50);
    }

    // Export all data (for backup)
    async exportAllData() {
        try {
            const stats = await this.getStatistics();
            const feedback = await this.getAllFeedback();
            
            return {
                exportDate: new Date().toISOString(),
                statistics: stats,
                feedback: feedback
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }
}

module.exports = JsonDatabase;
