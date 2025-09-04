# Vercel KV Setup Instructions

## 1. Create Vercel KV Database

Run this command in your project directory:

```bash
npx vercel kv create
```

This will:

- Create a new KV database
- Automatically configure environment variables
- Set up the necessary credentials

## 2. Environment Variables

The command above will automatically add these to your Vercel project:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

## 3. Local Development

For local development, you'll need to add these to your `.env.local` file:

```bash
# Copy these from your Vercel dashboard or run: vercel env pull
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
KV_URL=your_kv_url
```

## 4. Deploy

Deploy your project to Vercel:

```bash
vercel --prod
```

## 5. How It Works

The KV implementation:

1. **Session Storage**: Stores session metadata (ID, URL, transport type) in Vercel KV
2. **Session Recreation**: When a session is not found in memory, it recreates it using stored metadata
3. **Session Cleanup**: Automatically expires sessions after 30 minutes
4. **Serverless Compatible**: Works across all serverless function invocations

## 6. Benefits

- ✅ **Persistent Sessions**: Sessions survive serverless cold starts
- ✅ **Minimal Setup**: One command setup
- ✅ **Cost Effective**: Free tier available
- ✅ **Fast**: Redis-based, sub-millisecond latency
- ✅ **Automatic Cleanup**: Sessions expire automatically

## 7. Monitoring

You can monitor your KV usage in the Vercel dashboard under the "Storage" tab.
