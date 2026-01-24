# AI API Automatic Fallback System

## Overview

The application now features an intelligent AI API management system that automatically switches between Gemini AI and Mistral AI based on availability and rate limits.

## How It Works

### Primary API: Gemini AI
- **Model**: gemini-2.0-flash-exp
- **Used for**: Emotional analysis, crime timeline, sentiment analysis
- **Advantages**: Fast, accurate, optimized for the task

### Fallback API: Mistral AI
- **Model**: mistral-large-latest
- **Activated when**: Gemini hits rate limits (429 errors) or fails
- **Advantages**: Reliable backup, no interruption in service

### Automatic Switching Logic

```
User Request
    ↓
Try Gemini AI
    ↓
Success? → Return Gemini Results ✓
    ↓
Failed (429/Error)?
    ↓
Automatically Switch to Mistral AI
    ↓
Success? → Return Mistral Results ✓
    ↓
Both Failed?
    ↓
Return Fallback Data (Default values)
```

## Features

### 1. Seamless Failover
- No user intervention required
- Automatic detection of rate limits
- Instant switch to backup API
- Transparent to end users

### 2. Status Tracking
- Monitors both APIs' health
- Tracks error counts
- Records last error messages
- Provides status endpoint

### 3. Smart Recovery
- Automatically retries Gemini after cooldown
- Resets error counts on success
- Manual reset option available

## API Endpoints

### Check AI Status
```bash
GET http://localhost:3000/api/ai-status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "gemini": {
      "available": false,
      "errorCount": 3,
      "lastError": "Request failed with status code 429"
    },
    "mistral": {
      "available": true,
      "errorCount": 0,
      "lastError": null
    },
    "fallbackEnabled": true
  },
  "message": "Using Mistral AI (Gemini unavailable)"
}
```

### Reset API Status
```bash
POST http://localhost:3000/api/ai-reset
```

**Use case**: After Gemini quota resets (usually daily), call this to mark it as available again.

**Response:**
```json
{
  "success": true,
  "message": "API status reset - both APIs marked as available"
}
```

## Console Logging

The system provides detailed console logs:

### When Gemini Works:
```
Attempting analysis with Gemini AI...
✓ Gemini AI analysis successful
```

### When Gemini Fails (Rate Limit):
```
Attempting analysis with Gemini AI...
Gemini AI failed: Request failed with status code 429
⚠️ Gemini API rate limit hit - switching to Mistral...
Using Mistral AI as fallback...
✓ Mistral AI analysis successful
```

### When Both Fail:
```
Attempting analysis with Gemini AI...
Gemini AI failed: Request failed with status code 429
Using Mistral AI as fallback...
Mistral AI also failed: Request failed with status code 401
⚠️ Using fallback data - both APIs unavailable
```

## Response Metadata

All API responses now include an `apiUsed` field:

```json
{
  "location": "Delhi",
  "safetyIndex": 75,
  "aggregatedEmotions": { ... },
  "apiUsed": "mistral"  // or "gemini" or "fallback"
}
```

This helps you track which API was used for each request.

## Configuration

### Enable/Disable Fallback

In your code, you can control the fallback behavior:

```javascript
// Disable fallback (will throw error if Gemini fails)
aiManager.setFallbackEnabled(false);

// Enable fallback (default)
aiManager.setFallbackEnabled(true);
```

### Adjust Retry Count

Edit `ai-api-manager.js`:

```javascript
this.maxRetries = 2; // Change this value
```

## Benefits

### For Users:
- ✅ Uninterrupted service
- ✅ No error messages when rate limits hit
- ✅ Consistent experience

### For Developers:
- ✅ Automatic error handling
- ✅ Detailed logging
- ✅ Easy monitoring
- ✅ Manual control when needed

### For Operations:
- ✅ Reduced downtime
- ✅ Better resource utilization
- ✅ Cost optimization (uses cheaper API when primary is unavailable)

## Cost Implications

### Gemini AI (Primary)
- Free tier: 15 requests per minute
- Paid tier: Higher limits
- Cost: Lower per request

### Mistral AI (Fallback)
- Free tier: Limited
- Paid tier: Pay per token
- Cost: Higher per request

**Recommendation**: Monitor usage and upgrade Gemini quota if you frequently hit rate limits.

## Monitoring

### Check Current Status
```bash
curl http://localhost:3000/api/ai-status
```

### Reset After Quota Refresh
```bash
curl -X POST http://localhost:3000/api/ai-reset
```

### View Logs
Check your server console for real-time API switching logs.

## Troubleshooting

### Issue: Always using Mistral
**Cause**: Gemini quota exhausted
**Solution**: 
1. Wait for quota reset (usually 24 hours)
2. Call `/api/ai-reset` endpoint
3. Or upgrade Gemini API plan

### Issue: Both APIs failing
**Cause**: Both API keys invalid or quota exhausted
**Solution**:
1. Check API keys in .env file
2. Verify API quotas in respective dashboards
3. System will use fallback data until resolved

### Issue: Want to force Mistral usage
**Solution**: Temporarily set invalid Gemini key or disable it in code

## Testing

Test the fallback system:

```bash
# Run the test script
node test-ai-fallback.js
```

This will:
1. Test Gemini API
2. Simulate rate limit
3. Verify Mistral fallback
4. Check status endpoint

## Future Enhancements

Potential improvements:
- [ ] Add more AI providers (Claude, GPT-4, etc.)
- [ ] Implement load balancing across multiple APIs
- [ ] Add caching to reduce API calls
- [ ] Implement circuit breaker pattern
- [ ] Add metrics dashboard

---

**Status**: ✅ Automatic fallback system is active and working
**Last Updated**: January 2026
