#!/bin/bash

# MGXS Multi-Chain Deployment Script
# Usage: ./scripts/deploy-multi-chain.sh [networks...]
# Example: ./scripts/deploy-multi-chain.sh sepolia amoy
# Example: ./scripts/deploy-multi-chain.sh mainnet polygon

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default networks (testnets)
DEFAULT_NETWORKS="sepolia amoy"

# If networks are provided as arguments, use those instead
NETWORKS="${@:-$DEFAULT_NETWORKS}"

echo ""
echo "=========================================="
echo "  MGXS Multi-Chain Deployment"
echo "=========================================="
echo ""
echo "Networks to deploy: $NETWORKS"
echo ""

# Check if DEPLOYER_PRIVATE_KEY is set
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo -e "${RED}Error: DEPLOYER_PRIVATE_KEY environment variable is not set${NC}"
    echo "Export it first: export DEPLOYER_PRIVATE_KEY=0x..."
    exit 1
fi

# Clear previous deployments file
> .env.deployments

# Deploy to each network
for network in $NETWORKS; do
    echo ""
    echo -e "${YELLOW}Deploying to $network...${NC}"
    echo ""

    if npx hardhat run scripts/deploy-all.ts --network $network; then
        echo -e "${GREEN}✓ Successfully deployed to $network${NC}"
    else
        echo -e "${RED}✗ Failed to deploy to $network${NC}"
    fi
done

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Environment variables for Vercel:"
echo ""
cat .env.deployments
echo ""
echo "Copy the above to your Vercel project settings."
