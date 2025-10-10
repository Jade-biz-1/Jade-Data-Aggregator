#!/bin/bash

# CDN Deployment Script for Data Aggregator Platform
# Supports AWS CloudFront, Azure CDN, and GCP Cloud CDN

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROVIDER=${1:-"aws"}  # aws, azure, or gcp
STATIC_DIR=".next/static"

echo -e "${GREEN}🚀 CDN Deployment Script${NC}"
echo -e "${YELLOW}Provider: $PROVIDER${NC}"
echo ""

# Check if build exists
if [ ! -d "$STATIC_DIR" ]; then
    echo -e "${RED}❌ Error: .next/static directory not found${NC}"
    echo "Please run 'npm run build' first"
    exit 1
fi

# AWS CloudFront Deployment
deploy_aws() {
    echo -e "${GREEN}📦 Deploying to AWS S3 + CloudFront...${NC}"

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not installed${NC}"
        exit 1
    fi

    # Get configuration from environment
    S3_BUCKET=${AWS_S3_BUCKET:-"dataaggregator-static"}
    CLOUDFRONT_ID=${AWS_CLOUDFRONT_ID:-""}

    # Upload to S3
    echo "Uploading static files to S3..."
    aws s3 sync $STATIC_DIR s3://$S3_BUCKET/_next/static \
        --acl public-read \
        --cache-control "public, max-age=31536000, immutable" \
        --delete

    # Upload public directory if exists
    if [ -d "public" ]; then
        echo "Uploading public files..."
        aws s3 sync public s3://$S3_BUCKET/public \
            --acl public-read \
            --cache-control "public, max-age=31536000, immutable" \
            --delete
    fi

    # Invalidate CloudFront cache if distribution ID provided
    if [ -n "$CLOUDFRONT_ID" ]; then
        echo "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_ID \
            --paths "/*"
    fi

    echo -e "${GREEN}✅ AWS deployment complete!${NC}"
    echo "CDN URL: https://$S3_BUCKET.s3.amazonaws.com"
}

# Azure CDN Deployment
deploy_azure() {
    echo -e "${GREEN}📦 Deploying to Azure Blob Storage + CDN...${NC}"

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI not installed${NC}"
        exit 1
    fi

    # Get configuration from environment
    STORAGE_ACCOUNT=${AZURE_STORAGE_ACCOUNT:-"dataaggregatorcdn"}
    CONTAINER=${AZURE_CONTAINER:-"\$web"}
    CDN_ENDPOINT=${AZURE_CDN_ENDPOINT:-""}

    # Upload to Blob Storage
    echo "Uploading static files to Azure Blob Storage..."
    az storage blob upload-batch \
        --account-name $STORAGE_ACCOUNT \
        --source $STATIC_DIR \
        --destination "$CONTAINER/_next/static" \
        --overwrite \
        --content-cache-control "public, max-age=31536000, immutable"

    # Upload public directory if exists
    if [ -d "public" ]; then
        echo "Uploading public files..."
        az storage blob upload-batch \
            --account-name $STORAGE_ACCOUNT \
            --source public \
            --destination "$CONTAINER/public" \
            --overwrite \
            --content-cache-control "public, max-age=31536000, immutable"
    fi

    # Purge CDN cache if endpoint provided
    if [ -n "$CDN_ENDPOINT" ]; then
        echo "Purging Azure CDN cache..."
        RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"rg-dataaggregator"}
        PROFILE_NAME=${AZURE_CDN_PROFILE:-"dataaggregator-cdn"}

        az cdn endpoint purge \
            --resource-group $RESOURCE_GROUP \
            --profile-name $PROFILE_NAME \
            --name $CDN_ENDPOINT \
            --content-paths "/*"
    fi

    echo -e "${GREEN}✅ Azure deployment complete!${NC}"
    echo "CDN URL: https://$STORAGE_ACCOUNT.blob.core.windows.net"
}

# GCP Cloud CDN Deployment
deploy_gcp() {
    echo -e "${GREEN}📦 Deploying to GCP Cloud Storage + Cloud CDN...${NC}"

    # Check gcloud CLI
    if ! command -v gsutil &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not installed${NC}"
        exit 1
    fi

    # Get configuration from environment
    GCS_BUCKET=${GCP_BUCKET:-"dataaggregator-static"}

    # Upload to Cloud Storage
    echo "Uploading static files to Cloud Storage..."
    gsutil -m rsync -r -d \
        -h "Cache-Control:public, max-age=31536000, immutable" \
        $STATIC_DIR gs://$GCS_BUCKET/_next/static

    # Upload public directory if exists
    if [ -d "public" ]; then
        echo "Uploading public files..."
        gsutil -m rsync -r -d \
            -h "Cache-Control:public, max-age=31536000, immutable" \
            public gs://$GCS_BUCKET/public
    fi

    # Invalidate CDN cache
    echo "Invalidating Cloud CDN cache..."
    gcloud compute url-maps invalidate-cdn-cache dataaggregator-lb \
        --path "/*" \
        --async || true

    echo -e "${GREEN}✅ GCP deployment complete!${NC}"
    echo "CDN URL: https://storage.googleapis.com/$GCS_BUCKET"
}

# Main deployment logic
case $PROVIDER in
    aws)
        deploy_aws
        ;;
    azure)
        deploy_azure
        ;;
    gcp)
        deploy_gcp
        ;;
    *)
        echo -e "${RED}❌ Unknown provider: $PROVIDER${NC}"
        echo "Usage: $0 [aws|azure|gcp]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update CDN_URL in your production environment:"
echo "   - AWS: https://d1234567890.cloudfront.net"
echo "   - Azure: https://dataaggregator.azureedge.net"
echo "   - GCP: https://cdn.yourdomain.com"
echo ""
echo "2. Test CDN delivery:"
echo "   curl -I \$CDN_URL/_next/static/test.js"
echo ""
echo "3. Monitor cache hit rates in your CDN dashboard"
