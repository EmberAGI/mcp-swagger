# AWS AppRunner Deployment - Final Clean Solution

## What We Have Now

### 1. **Simplest Health Endpoint** (`/api/health/route.ts`)

```javascript
export async function GET() {
  return new Response("OK", { status: 200 });
}
```

- Returns plain text "OK" with status 200
- No JSON, no timestamps, no complexity

### 2. **Minimal Dockerfile**

- Simple two-stage build
- No standalone mode complications
- Uses `npm start` with PORT and HOST configured
- No health checks in Dockerfile (let AppRunner handle it)

### 3. **Clean Configuration**

- `package.json`: Start script uses `PORT` environment variable
- `next.config.ts`: Minimal configuration
- No extra files or scripts

## AppRunner Configuration

### Health Check Settings:

- **Protocol**: HTTP
- **Path**: `/api/health`
- **Start Period**: 120 seconds (give it plenty of time)
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3

### Environment Variables:

```
PORT=8080
NODE_ENV=production
```

### Service Configuration:

- **Memory**: 1024 MB (or higher)
- **CPU**: 0.5 vCPU (or higher)

## If It Still Doesn't Work

1. **Try the root path** as health check: `/`
2. **Increase memory** to 2048 MB
3. **Check CloudWatch logs** for any startup errors

## Testing Locally

```bash
docker build -t mcp-swagger .
docker run -p 8080:8080 mcp-swagger

# Test health endpoint
curl http://localhost:8080/api/health
# Should return: OK
```

## That's It!

This is the absolute simplest configuration possible. If this doesn't work, the issue is with AppRunner's environment, not your code.
