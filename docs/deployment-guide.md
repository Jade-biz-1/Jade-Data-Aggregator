# Data Aggregator Platform - Deployment Guide

**Comprehensive deployment guide for AWS, Azure, GCP, and Docker environments**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment (Local/Development)](#docker-deployment-localdevelopment)
- [AWS Deployment](#aws-deployment)
- [Azure Deployment](#azure-deployment)
- [GCP Deployment](#gcp-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [CI/CD Setup](#cicd-setup)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Data Aggregator Platform can be deployed across multiple environments:

| Environment | Use Case | Complexity | Cost |
|-------------|----------|------------|------|
| **Docker Compose** | Local development, testing | Low | Free |
| **AWS** | Production (ECS, RDS, ElastiCache, MSK) | Medium | $$$ |
| **Azure** | Production (Container Apps, PostgreSQL, Redis, Event Hubs) | Medium | $$$ |
| **GCP** | Production (Cloud Run, Cloud SQL, Memorystore, Pub/Sub) | Low | $$ |

**Recommendation**:
- **Development**: Docker Compose
- **Production**: GCP Cloud Run (simplest) or AWS ECS (full control)

---

## Prerequisites

### General Requirements

- **Git** (version 2.30+)
- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- **Python 3.11+** (for local backend development)
- **Node.js 18+** (for local frontend development)
- **Poetry** (Python dependency management)

### Cloud Platform Requirements

**AWS**:
- AWS CLI v2
- AWS account with admin access
- Terraform 1.5+

**Azure**:
- Azure CLI 2.50+
- Azure subscription with contributor role
- Terraform 1.5+ or Bicep CLI

**GCP**:
- gcloud CLI 440.0+
- GCP project with billing enabled
- Terraform 1.5+

---

## Deployment Options

### Quick Start (Docker Compose)

```bash
# Clone repository
git clone https://github.com/yourusername/dataaggregator.git
cd dataaggregator

# Create environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# Adminer (DB UI): http://localhost:8080
```

### Production Deployments

- [AWS ECS Deployment](#aws-deployment) - Full control, feature-rich
- [Azure Container Apps](#azure-deployment) - Balanced, good integration
- [GCP Cloud Run](#gcp-deployment) - Simplest, serverless

---

## Docker Deployment (Local/Development)

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL  │
│ (Next.js)   │     │  (FastAPI)  │     │     (DB)     │
│  Port 3000  │     │  Port 8001  │     │  Port 5432   │
└─────────────┘     └─────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    Redis     │
                    │  (Cache)     │
                    │  Port 6379   │
                    └──────────────┘
```

### Step 1: Environment Setup

```bash
# Create .env file
cat > .env << EOF
# Database
POSTGRES_SERVER=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=dataaggregator

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Backend
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
ENVIRONMENT=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001

# Email (for password reset, verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@dataaggregator.com
EOF
```

### Step 2: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Step 3: Database Initialization

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# (Optional) Seed initial data
docker-compose exec backend python scripts/seed_data.py
```

### Step 4: Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8001/docs | - |
| Adminer (DB UI) | http://localhost:8080 | postgres/your_password |
| Redis | localhost:6379 | your_redis_password |

### Step 5: Development Workflow

```bash
# Watch backend logs
docker-compose logs -f backend

# Watch frontend logs
docker-compose logs -f frontend

# Restart backend after code changes
docker-compose restart backend

# Rebuild after dependency changes
docker-compose up -d --build backend

# Access backend shell
docker-compose exec backend bash

# Access database shell
docker-compose exec postgres psql -U postgres -d dataaggregator
```

---

## AWS Deployment

**📖 For detailed AWS deployment instructions**, see:
- [Main README - AWS Section](../README.md#deployment)
- Infrastructure code: `platform/terraform/` directory

### Overview

**Architecture**: ECS Fargate + RDS + ElastiCache + MSK + ALB

**Services Used**:
- **Compute**: ECS Fargate (Backend + Frontend containers)
- **Database**: RDS PostgreSQL 15
- **Cache**: ElastiCache Redis 7
- **Messaging**: MSK (Managed Kafka)
- **Load Balancer**: Application Load Balancer (ALB)
- **Registry**: ECR
- **Monitoring**: CloudWatch

### Quick Deploy

```bash
# 1. Configure AWS CLI
aws configure

# 2. Deploy infrastructure with Terraform
cd platform/terraform
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"

# 3. Build and push Docker images
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t dataaggregator-backend:latest .
docker tag dataaggregator-backend:latest <ecr-repo>/backend:latest
docker push <ecr-repo>/backend:latest

cd frontend
docker build -t dataaggregator-frontend:latest .
docker tag dataaggregator-frontend:latest <ecr-repo>/frontend:latest
docker push <ecr-repo>/frontend:latest

# 4. Deploy to ECS
aws ecs update-service --cluster dataaggregator-cluster --service backend --force-new-deployment
aws ecs update-service --cluster dataaggregator-cluster --service frontend --force-new-deployment
```

### Cost Estimate (Monthly)

| Environment | Configuration | Cost |
|-------------|--------------|------|
| **Development** | Minimal resources | $150-250 |
| **Production** | HA, autoscaling | $800-1,500 |

---

## Azure Deployment

**📖 For detailed Azure deployment instructions**, see:
- [Azure Deployment Requirements](./AzureDeploymentRequirements.md)

### Overview

**Architecture**: Container Apps + Azure PostgreSQL + Azure Redis + Event Hubs

**Services Used**:
- **Compute**: Azure Container Apps
- **Database**: Azure Database for PostgreSQL Flexible Server
- **Cache**: Azure Cache for Redis
- **Messaging**: Azure Event Hubs (Kafka protocol)
- **Load Balancer**: Application Gateway
- **Registry**: Azure Container Registry (ACR)
- **Monitoring**: Application Insights + Log Analytics

### Quick Deploy

```bash
# 1. Login to Azure
az login
az account set --subscription "<subscription-id>"

# 2. Create resource group
az group create --name rg-dataaggregator-prod --location eastus

# 3. Deploy infrastructure with Terraform
cd terraform-azure
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"

# 4. Build and push to ACR
az acr login --name dataaggregatoracr

docker build -t dataaggregatoracr.azurecr.io/backend:latest .
docker push dataaggregatoracr.azurecr.io/backend:latest

cd frontend
docker build -t dataaggregatoracr.azurecr.io/frontend:latest .
docker push dataaggregatoracr.azurecr.io/frontend:latest

# 5. Deploy to Container Apps
az containerapp update --name backend \
  --resource-group rg-dataaggregator-prod \
  --image dataaggregatoracr.azurecr.io/backend:latest

az containerapp update --name frontend \
  --resource-group rg-dataaggregator-prod \
  --image dataaggregatoracr.azurecr.io/frontend:latest
```

### Cost Estimate (Monthly)

| Environment | Configuration | Cost |
|-------------|--------------|------|
| **Development** | Basic tiers | $250-350 |
| **Production** | Standard/Premium | $900-1,600 |

---

## GCP Deployment

**📖 For detailed GCP deployment instructions**, see:
- [GCP Deployment Requirements](./GCPDeploymentRequirements.md)

### Overview

**Architecture**: Cloud Run + Cloud SQL + Memorystore + Pub/Sub

**Services Used**:
- **Compute**: Cloud Run (serverless containers)
- **Database**: Cloud SQL for PostgreSQL
- **Cache**: Memorystore for Redis
- **Messaging**: Cloud Pub/Sub
- **Load Balancer**: Cloud Load Balancing (HTTPS)
- **Registry**: Artifact Registry
- **Monitoring**: Cloud Logging + Monitoring

### Quick Deploy

```bash
# 1. Setup GCP project
gcloud projects create dataaggregator-prod
gcloud config set project dataaggregator-prod

# 2. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  redis.googleapis.com \
  pubsub.googleapis.com \
  artifactregistry.googleapis.com

# 3. Deploy infrastructure with Terraform
cd terraform-gcp
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"

# 4. Build and push to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

docker build -t us-central1-docker.pkg.dev/dataaggregator-prod/backend:latest .
docker push us-central1-docker.pkg.dev/dataaggregator-prod/backend:latest

cd frontend
docker build -t us-central1-docker.pkg.dev/dataaggregator-prod/frontend:latest .
docker push us-central1-docker.pkg.dev/dataaggregator-prod/frontend:latest

# 5. Deploy to Cloud Run
gcloud run deploy backend \
  --image us-central1-docker.pkg.dev/dataaggregator-prod/backend:latest \
  --region us-central1 \
  --platform managed

gcloud run deploy frontend \
  --image us-central1-docker.pkg.dev/dataaggregator-prod/frontend:latest \
  --region us-central1 \
  --platform managed
```

### Cost Estimate (Monthly)

| Environment | Configuration | Cost |
|-------------|--------------|------|
| **Development** | Minimal resources | $100-150 |
| **Production** | Standard config | $875-1,600 |

---

## Environment Configuration

### Backend Environment Variables

```bash
# Database Configuration
POSTGRES_SERVER=<host>
POSTGRES_PORT=5432
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
POSTGRES_DB=dataaggregator

# Redis Configuration
REDIS_HOST=<host>
REDIS_PORT=6379
REDIS_PASSWORD=<password>

# Kafka/Messaging (choose one based on platform)
# AWS MSK
KAFKA_BOOTSTRAP_SERVERS=<msk-endpoint>:9092

# Azure Event Hubs
KAFKA_BOOTSTRAP_SERVERS=<namespace>.servicebus.windows.net:9093
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SECURITY_PROTOCOL=SASL_SSL

# GCP Pub/Sub
GCP_PROJECT_ID=<project-id>
PUBSUB_TOPIC=pipeline-events

# Security
SECRET_KEY=<64-char-hex-string>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<password>
SMTP_FROM=noreply@dataaggregator.com

# Application
ENVIRONMENT=production  # or development, staging
LOG_LEVEL=INFO
CORS_ORIGINS=["https://yourdomain.com"]
```

### Frontend Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MONITORING=true

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Secrets Management

**AWS**: Use AWS Secrets Manager or Parameter Store
```bash
aws secretsmanager create-secret --name dataaggregator/db-password --secret-string "your-password"
```

**Azure**: Use Azure Key Vault
```bash
az keyvault secret set --vault-name dataaggregator-kv --name db-password --value "your-password"
```

**GCP**: Use Secret Manager
```bash
echo -n "your-password" | gcloud secrets create db-password --data-file=-
```

---

## Database Setup

### Local (Docker)

Database is automatically created with Docker Compose. Run migrations:

```bash
docker-compose exec backend alembic upgrade head
```

### Cloud Platforms

#### Step 1: Create Database

**AWS RDS**:
```bash
# Created via Terraform, or manually:
aws rds create-db-instance \
  --db-instance-identifier dataaggregator-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 100
```

**Azure**:
```bash
az postgres flexible-server create \
  --name dataaggregator-db \
  --resource-group rg-dataaggregator \
  --location eastus \
  --admin-user adminuser \
  --admin-password <password> \
  --sku-name Standard_D2s_v3
```

**GCP**:
```bash
gcloud sql instances create dataaggregator-db \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-1 \
  --region=us-central1
```

#### Step 2: Run Migrations

```bash
# Set connection string
export DATABASE_URL="postgresql://user:password@host:5432/dataaggregator"

# Run migrations
alembic upgrade head

# Or via Docker
docker run --rm \
  -e DATABASE_URL=$DATABASE_URL \
  <your-backend-image> \
  alembic upgrade head
```

#### Step 3: Create Initial Admin User

```bash
# Via backend script
docker-compose exec backend python scripts/create_admin.py

# Or manually via psql
docker-compose exec postgres psql -U postgres -d dataaggregator -c \
  "INSERT INTO users (email, hashed_password, role, is_active) VALUES
  ('admin@example.com', '<bcrypt-hash>', 'admin', true);"
```

---

## CI/CD Setup

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # AWS Deployment
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/dataaggregator-backend:$IMAGE_TAG .
          docker push $ECR_REGISTRY/dataaggregator-backend:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster dataaggregator \
            --service backend --force-new-deployment
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - aws ecs update-service --cluster dataaggregator \
        --service backend --force-new-deployment
  only:
    - main
```

### Azure DevOps

Create `azure-pipelines.yml`:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: Docker@2
    inputs:
      containerRegistry: 'dataaggregatoracr'
      repository: 'backend'
      command: 'buildAndPush'
      Dockerfile: '**/Dockerfile'
      tags: '$(Build.BuildId)'

  - task: AzureCLI@2
    inputs:
      azureSubscription: 'dataaggregator-subscription'
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        az containerapp update --name backend \
          --resource-group rg-dataaggregator \
          --image dataaggregatoracr.azurecr.io/backend:$(Build.BuildId)
```

---

## Post-Deployment Checklist

### Functional Validation

- [ ] Frontend loads correctly at production URL
- [ ] Backend API docs accessible (`/docs` endpoint)
- [ ] User can register and login
- [ ] Database connections working
- [ ] Redis caching operational
- [ ] WebSocket connections working (real-time features)
- [ ] File uploads functional
- [ ] Email notifications sending (password reset, verification)

### Security Validation

- [ ] HTTPS enforced (no HTTP access)
- [ ] CORS configured correctly
- [ ] Secrets stored in secret manager (not in code)
- [ ] Database not publicly accessible
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Security headers present (check with SecurityHeaders.com)

### Performance Validation

- [ ] API response times < 500ms (95th percentile)
- [ ] Frontend load time < 3 seconds
- [ ] Database query performance acceptable
- [ ] Autoscaling triggers working
- [ ] CDN caching effective (if enabled)

### Monitoring Validation

- [ ] Application logs appearing in monitoring service
- [ ] Metrics being collected
- [ ] Dashboards created and functional
- [ ] Alert policies configured:
  - [ ] High error rate (>5%)
  - [ ] High latency (>2s)
  - [ ] Database connection failures
  - [ ] Service downtime
- [ ] Notification channels tested (email, Slack, PagerDuty)

### Operations Validation

- [ ] CI/CD pipeline tested and working
- [ ] Database backups configured and tested
- [ ] Disaster recovery plan documented
- [ ] Runbook created and accessible
- [ ] Cost monitoring and budgets set up
- [ ] Resource tagging complete (environment, owner, project)

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms**: Backend can't connect to database

**Solutions**:
```bash
# Check connection string
echo $DATABASE_URL

# Test connection manually
psql "$DATABASE_URL"

# Verify firewall rules (cloud platforms)
# AWS: Check security groups
# Azure: Check NSG rules
# GCP: Check firewall rules

# Check if database is running
# Docker:
docker-compose ps postgres

# Cloud:
aws rds describe-db-instances --db-instance-identifier <id>
az postgres flexible-server show --name <name> --resource-group <rg>
gcloud sql instances describe <instance-name>
```

#### 2. Frontend Can't Reach Backend

**Symptoms**: API calls fail with CORS or network errors

**Solutions**:
```bash
# Check CORS settings in backend
# backend/core/config.py
CORS_ORIGINS = ["https://yourdomain.com"]

# Verify backend URL in frontend
echo $NEXT_PUBLIC_API_URL

# Check load balancer/ingress configuration
# Ensure path routing is correct: /api/* → backend
```

#### 3. Container Won't Start

**Symptoms**: Service keeps restarting, health checks failing

**Solutions**:
```bash
# Check container logs
docker-compose logs backend

# AWS ECS:
aws ecs describe-tasks --cluster <cluster> --tasks <task-arn>

# Azure:
az containerapp logs show --name backend --resource-group <rg>

# GCP:
gcloud run services logs read backend --region us-central1

# Common fixes:
# - Verify environment variables are set
# - Check if port is correct (8001 for backend, 3000 for frontend)
# - Ensure dependencies are installed (check Dockerfile)
```

#### 4. High Memory/CPU Usage

**Symptoms**: Service slow, frequent restarts, high costs

**Solutions**:
```bash
# Check resource limits
docker stats  # for Docker Compose

# Increase resources (cloud platforms)
# AWS ECS: Update task definition CPU/memory
# Azure: Scale up Container App
# GCP: Increase Cloud Run memory allocation

# Optimize queries
# Check slow query log in PostgreSQL
# Add database indexes
# Implement caching with Redis
```

#### 5. Migration Fails

**Symptoms**: `alembic upgrade head` errors

**Solutions**:
```bash
# Check current migration version
alembic current

# Check migration history
alembic history

# Rollback one version
alembic downgrade -1

# Force to specific version
alembic stamp head

# Manual SQL fix (if needed)
psql $DATABASE_URL < manual_fix.sql
```

### Getting Help

- **Documentation**: Check `docs/` directory
- **Troubleshooting Guide**: See [docs/troubleshooting.md](./troubleshooting.md)
- **GitHub Issues**: https://github.com/yourusername/dataaggregator/issues
- **Community**: Discord/Slack (if available)

---

## Platform Comparison

| Feature | Docker | AWS | Azure | GCP |
|---------|--------|-----|-------|-----|
| **Complexity** | Low | High | Medium | Low |
| **Setup Time** | 10 min | 2-4 hours | 2-3 hours | 1-2 hours |
| **Cost (Dev)** | Free | $150-250 | $250-350 | $100-150 |
| **Cost (Prod)** | N/A | $800-1,500 | $900-1,600 | $875-1,600 |
| **Autoscaling** | No | Yes | Yes | Yes |
| **Managed DB** | No | Yes (RDS) | Yes (Flexible) | Yes (Cloud SQL) |
| **Serverless** | No | Partial | Yes | Yes |
| **Best For** | Dev/Test | Enterprise | Microsoft shops | Startups |

**Recommendation**:
- **Local Development**: Docker Compose
- **Small Teams/Startups**: GCP (simplest, serverless)
- **Enterprise**: AWS (most features) or Azure (if Microsoft stack)

---

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**Next Review**: Quarterly or after major platform updates

**See Also**:
- [Azure Deployment Requirements](./AzureDeploymentRequirements.md)
- [GCP Deployment Requirements](./GCPDeploymentRequirements.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Production Runbook](./runbook.md)
- [Security Documentation](./security.md)
