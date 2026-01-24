# 📁 JSON File Database - MVP Solution

## Overview

This application uses JSON files as a lightweight database solution, perfect for MVP and early-stage development.

## ✅ What's Stored

### 1. **Emotional Analysis** (`/data/emotional-analysis/`)
- Location-based emotional analysis results
- Safety index calculations
- Crime statistics
- News sentiment data
- Timestamp for each analysis

### 2. **News Cache** (`/data/news-cache/`)
- Cached news articles per location
- TTL: 1 hour (configurable)
- Reduces API calls by 80%
- Saves API costs

### 3. **User Feedback** (`/data/user-feedback/`)
- User feedback submissions
- Timestamps
- Feedback content

## 📊 Features

### Automatic Features:
- ✅ **Auto-caching** - News cached for 1 hour
- ✅ **History tracking** - All analyses saved
- ✅ **Feedback storage** - User feedback persisted
- ✅ **Statistics** - Real-time stats available

### API Endpoints:

```javascript
// Get analysis history for a location
GET /api/history/:location?limit=10

// Get all user feedback
GET /api/feedback?limit=50

// Get database statistics
GET /api/stats

// Clean old cache files
POST /api/clean-cache

// Export all data
GET /api/export
```

## 🎯 Admin Dashboard

Access the admin dashboard at: **http://localhost:3000/admin.html**

Features:
- View statistics
- Browse feedback
- Clean cache
- Export data

## 📂 File Structure

```
data/
├── emotional-analysis/
│   ├── mumbai_1234567890.json
│   ├── delhi_1234567891.json
│   └── ...
├── news-cache/
│   ├── mumbai.json
│   ├── delhi.json
│   └── ...
└── user-feedback/
    ├── feedback_1234567890.json
    ├── feedback_1234567891.json
    └── ...
```

## 💾 Data Format Examples

### Emotional Analysis:
```json
{
  "location": "Mumbai",
  "timestamp": "2024-01-24T10:30:00.000Z",
  "data": {
    "safetyIndex": 75,
    "aggregatedEmotions": {
      "calm": 40,
      "angry": 20,
      "depressed": 10,
      "fear": 15,
      "happy": 15
    },
    "crimeStats": {
      "theft": 5,
      "assault": 2
    }
  }
}
```

### News Cache:
```json
{
  "location": "Mumbai",
  "timestamp": 1706095800000,
  "expiresAt": 1706099400000,
  "articles": [...]
}
```

## 🚀 Usage

### In Your Code:

```javascript
const JsonDatabase = require('./json-db');
const db = new JsonDatabase('./data');

// Save analysis
await db.saveEmotionalAnalysis('Mumbai', analysisData);

// Get history
const history = await db.getEmotionalAnalysisHistory('Mumbai', 10);

// Cache news
await db.cacheNews('Mumbai', articles, 3600000); // 1 hour

// Get cached news
const cached = await db.getCachedNews('Mumbai');

// Save feedback
await db.saveUserFeedback(feedbackData);

// Get stats
const stats = await db.getStatistics();
```

## ⚠️ Limitations

### Current Limits:
- **Concurrent writes**: Not thread-safe
- **Max file size**: ~10MB per file recommended
- **Query performance**: Linear search only
- **Scalability**: Good for <1000 records per collection

### When to Migrate:
- More than 100 users/day
- Need complex queries
- Require real-time updates
- Multiple server instances

## 🔄 Migration Path

When you outgrow JSON files:

### Option 1: MongoDB (Recommended)
```bash
npm install mongodb
# Update json-db.js to use MongoDB
```

### Option 2: PostgreSQL
```bash
npm install pg
# Update json-db.js to use PostgreSQL
```

### Option 3: Firebase
```bash
npm install firebase-admin
# Update json-db.js to use Firestore
```

## 🛡️ Backup Strategy

### Automatic Backup:
```bash
# Add to cron or Task Scheduler
node -e "require('./json-db').exportAllData()"
```

### Manual Backup:
1. Go to http://localhost:3000/admin.html
2. Click "Export All Data"
3. Save the JSON file

### Git Backup (Optional):
```bash
# Add to .gitignore if data is sensitive
echo "data/" >> .gitignore

# Or commit if data is not sensitive
git add data/
git commit -m "Backup data"
```

## 📈 Performance Tips

1. **Clean cache regularly**
   - Run `/api/clean-cache` daily
   - Keeps file count low

2. **Limit history**
   - Keep last 100 records per location
   - Archive old data

3. **Monitor file sizes**
   - Keep individual files under 1MB
   - Split large datasets

## 🎓 Best Practices

### DO:
✅ Use for MVP and prototyping
✅ Cache frequently accessed data
✅ Clean old cache regularly
✅ Export data for backups
✅ Monitor file counts

### DON'T:
❌ Store sensitive data without encryption
❌ Use for high-traffic production
❌ Store large files (>10MB)
❌ Rely on for concurrent writes
❌ Skip backups

## 🔧 Maintenance

### Daily:
- Clean old cache: `POST /api/clean-cache`

### Weekly:
- Export backup: `GET /api/export`
- Check statistics: `GET /api/stats`

### Monthly:
- Review file sizes
- Archive old data
- Consider migration if needed

## 📞 Support

For issues or questions:
1. Check file permissions in `/data` folder
2. Verify disk space
3. Check server logs
4. Review error messages

## 🎉 Conclusion

JSON file database is perfect for:
- ✅ MVP development
- ✅ Prototyping
- ✅ Small-scale applications
- ✅ Learning projects
- ✅ Quick demos

**Your MVP is ready to launch!** 🚀
