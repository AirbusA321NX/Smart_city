# API Configuration Setup

## Quick Start

### 1. Create API Configuration File

Copy the example configuration file:

```bash
cp api-config.example.js api-config.js
```

### 2. Get Your API Keys

#### Geoapify API Key (Required)
- Visit: https://www.geoapify.com/
- Sign up for a free account
- Go to "My Projects" → "API Keys"
- Copy your API key
- Free tier: 3,000 requests/day

#### Mistral API Key (Optional - for fallback)
- Visit: https://console.mistral.ai/
- Create an account
- Generate an API key
- Copy your API key
- Used as fallback when Gemini hits rate limits

### 3. Update api-config.js

Open `api-config.js` and replace the placeholder values:

```javascript
window.API_CONFIG = {
    GEOAPIFY_API_KEY: 'your_actual_geoapify_key_here',
    MISTRAL_API_KEY: 'your_actual_mistral_key_here'
};
```

### 4. Verify Setup

Run the test script to verify your API keys:

```bash
node test-geoapify.js
node test-all-api-keys.js
```

## Environment Variables (.env)

The `.env` file contains server-side API keys:

```env
GEMINI_API_KEY=your_gemini_key
MISTRAL_API_KEY=your_mistral_key
GEOAPIFY_API_KEY=your_geoapify_key
# ... other keys
```

## Security Notes

⚠️ **Important Security Information:**

1. **Never commit `api-config.js`** - It's already in `.gitignore`
2. **Never commit `.env`** - It's already in `.gitignore`
3. **Use example files** - Share `api-config.example.js` and `.env.example` instead
4. **Rotate keys** - If accidentally exposed, regenerate immediately
5. **Use environment variables** - For production deployments

## File Structure

```
project/
├── api-config.js              # Your actual keys (gitignored)
├── api-config.example.js      # Template for others
├── .env                       # Server-side keys (gitignored)
├── .env.example               # Template for .env
└── .gitignore                 # Ensures sensitive files aren't committed
```

## Troubleshooting

### "API key is invalid"
- Check if you copied the key correctly
- Verify the key hasn't expired
- Ensure you're using the correct key for each service

### "Rate limit exceeded"
- Gemini: Wait for quota reset (usually 24 hours)
- Geoapify: Upgrade plan or wait for daily reset
- System will automatically use fallback APIs

### "api-config.js not found"
- Make sure you created it from the example file
- Check that it's in the root directory
- Verify the filename is exactly `api-config.js`

## API Key Hierarchy

The application uses a three-tier system:

1. **Primary**: Gemini AI (from .env)
2. **Fallback**: Mistral AI (from .env and api-config.js)
3. **Last Resort**: Simple keyword-based analyzer (no API needed)

For geocoding:
1. **Primary**: Geoapify API (from api-config.js)
2. **Fallback**: Hardcoded coordinates for major cities

## Getting Help

If you encounter issues:
1. Check the console for error messages
2. Run test scripts to verify API keys
3. Review the API provider's documentation
4. Check API usage quotas in provider dashboards

## Free Tier Limits

| Service | Free Tier | Rate Limit |
|---------|-----------|------------|
| Geoapify | 3,000 req/day | No rate limit |
| Gemini AI | 15 req/min | 1,500 req/day |
| Mistral AI | Varies | Depends on plan |

## Production Deployment

For production:
1. Use environment variables instead of config files
2. Set up proper secret management
3. Use API key rotation
4. Monitor usage and costs
5. Implement caching to reduce API calls

---

**Last Updated**: January 2026
