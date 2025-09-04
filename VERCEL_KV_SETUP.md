# Vercel KV Setup for Session Persistence

## 1. Create Vercel KV Database

Run this command from your project root:

```bash
npx vercel kv create mcp-sessions --yes
```

This will:

- Create a new KV database named "mcp-sessions"
- Automatically configure environment variables
- Link the database to your project

## 2. Check Environment Variables

The command above should automatically add these to your Vercel project:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

You can verify this in:

- **Vercel Dashboard** → Your Project → Settings → Environment Variables
- **Local Development**: `.env.local` (if you run `npx vercel env pull`)

## 3. Deploy

Deploy your project to Vercel:

```bash
npx vercel --prod
```

## 4. How Session Persistence Works

With Vercel KV configured:

1. **Session Creation**: When you connect to an MCP server, a session ID is generated and stored in localStorage
2. **Session Persistence**: Session metadata (URL, transport type, timestamps) is stored in Vercel KV
3. **Serverless Recovery**: If a serverless function cold starts, it can recreate the session using stored metadata
4. **Automatic Cleanup**: Sessions automatically expire after 30 minutes
5. **Cross-Environment**: Sessions work consistently across development, preview, and production

## 5. Without Vercel KV

If Vercel KV is not configured:

- Sessions still work in development (in-memory storage)
- In production, sessions are lost on serverless cold starts
- You'll see connection errors requiring manual reconnection
- All other functionality remains intact

## 6. Troubleshooting

If you see Redis permission errors:

1. Make sure Vercel KV is properly created and linked
2. Check that environment variables are set in Vercel dashboard
3. Try redeploying: `npx vercel --prod`

If you see "Session not found" errors:

1. This is normal without KV configured
2. Configure KV to enable persistent sessions
3. The app will still work but may require reconnection on cold starts
