#!/bin/bash

# Update AppRunner service health check configuration
# Replace YOUR_SERVICE_ARN with your actual AppRunner service ARN

SERVICE_ARN="YOUR_SERVICE_ARN"

aws apprunner update-service \
    --service-arn "$SERVICE_ARN" \
    --health-check-configuration '{
        "Protocol": "HTTP",
        "Path": "/api/health",
        "Interval": 30,
        "Timeout": 10,
        "HealthyThreshold": 2,
        "UnhealthyThreshold": 3
    }' \
    --region us-east-1

echo "Health check configuration updated. Service will redeploy automatically."
