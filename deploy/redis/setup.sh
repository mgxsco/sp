#!/bin/bash
set -e

echo "=== MGXS Redis Setup ==="
echo ""

# Generate secure passwords if .env doesn't exist
if [ ! -f .env ]; then
    echo "Generating secure credentials..."
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    SRH_TOKEN=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

    cat > .env << EOF
REDIS_PASSWORD=${REDIS_PASSWORD}
SRH_TOKEN=${SRH_TOKEN}
EOF

    echo "Created .env with secure credentials"
    echo ""
    echo "=== SAVE THESE VALUES ==="
    echo "SRH_TOKEN (use as KV_REST_API_TOKEN in Vercel): ${SRH_TOKEN}"
    echo "========================="
    echo ""
else
    echo ".env already exists, using existing credentials"
    source .env
    echo ""
    echo "=== YOUR API TOKEN ==="
    echo "SRH_TOKEN (use as KV_REST_API_TOKEN in Vercel): ${SRH_TOKEN}"
    echo "======================"
    echo ""
fi

# Start the containers
echo "Starting Redis containers..."
docker compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 5

# Check if running
if docker compose ps | grep -q "running"; then
    echo ""
    echo "=== SUCCESS ==="
    echo "Redis is running on localhost:8585"
    echo ""
    echo "Next steps:"
    echo "1. Add to Cloudflare Tunnel config:"
    echo "   - Hostname: redis.mglhs.com (or your choice)"
    echo "   - Service: http://localhost:8585"
    echo ""
    echo "2. Set in Vercel environment variables:"
    echo "   KV_REST_API_URL=https://redis.mglhs.com"
    echo "   KV_REST_API_TOKEN=${SRH_TOKEN}"
    echo ""
else
    echo "Error: Containers failed to start"
    docker compose logs
    exit 1
fi
