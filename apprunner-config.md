# AWS AppRunner Configuration Guide

## Health Check Configuration

Your AppRunner service should be configured with the following health check settings:

### Health Check Settings:

- **Health Check Protocol**: HTTP
- **Health Check Path**: `/api/health`
- **Health Check Interval**: 30 seconds
- **Health Check Timeout**: 10 seconds
- **Health Check Start Period**: 60 seconds (to allow for startup time)
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3

### Service Configuration:

- **Port**: 8080
- **Environment**: production

### Environment Variables (if needed):

```
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```

## Troubleshooting

If health checks are still failing:

1. **Check the startup time**: Next.js applications can take 30-60 seconds to start up completely
2. **Verify the health endpoint**: Visit `https://your-app.region.awsapprunner.com/api/health` manually
3. **Check AppRunner logs**: Look for any startup errors or port binding issues
4. **Increase start period**: Try setting the health check start period to 90-120 seconds

## Testing the Health Endpoint

You can test the health endpoint locally:

```bash
# Build and run the container locally
docker build -t mcp-swagger .
docker run -p 8080:8080 mcp-swagger

# Test the health endpoint
curl http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-11T12:19:43.000Z",
  "service": "mcp-swagger",
  "version": "1.0.0"
}
```
