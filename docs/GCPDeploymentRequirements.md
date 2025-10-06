# Google Cloud Platform (GCP) Deployment Requirements for Data Aggregator Platform

## Overview

This document outlines the requirements and approach for deploying the Data Aggregator Platform on Google Cloud Platform (GCP). It provides a comprehensive mapping from the current AWS infrastructure to GCP equivalents, along with detailed implementation guidance.

---

## Current AWS Architecture

The platform currently uses the following AWS services:

- **Compute**: ECS Fargate (Backend + Frontend containers)
- **Database**: RDS PostgreSQL 15.4
- **Cache**: ElastiCache Redis 6.2
- **Messaging**: MSK (Managed Kafka)
- **Networking**: VPC, ALB, Security Groups
- **Registry**: ECR (Container images)
- **Monitoring**: CloudWatch Logs

---

## GCP Service Mappings

| AWS Service | GCP Equivalent | Notes |
|------------|----------------|-------|
| **ECS Fargate** | **Cloud Run** or **GKE Autopilot** | Cloud Run for serverless, GKE for full control |
| **RDS PostgreSQL** | **Cloud SQL for PostgreSQL** | Fully managed, v15 supported |
| **ElastiCache Redis** | **Memorystore for Redis** | Fully compatible |
| **MSK (Kafka)** | **Pub/Sub** or **Confluent Cloud on GCP** | Pub/Sub native, Confluent for Kafka |
| **ECR** | **Artifact Registry** or **Container Registry** | Artifact Registry recommended (successor to GCR) |
| **VPC** | **Virtual Private Cloud (VPC)** | Network isolation |
| **ALB** | **Cloud Load Balancing** (HTTPS LB) | Global or regional load balancing |
| **Security Groups** | **Firewall Rules** | VPC firewall rules |
| **CloudWatch** | **Cloud Logging + Cloud Monitoring** | Unified observability |
| **IAM Roles** | **Service Accounts + Workload Identity** | GCP IAM integration |

---

## Required GCP Resources

### 1. Core Infrastructure

#### Project & Organization
- **GCP Project**: Container for all resources
- **Project ID**: `dataaggregator-{environment}` (e.g., dataaggregator-dev)
- **Region**: Choose based on user proximity (e.g., us-central1, europe-west1, asia-southeast1)
- **Organization Policies**: Set up resource constraints and compliance

#### Virtual Private Cloud (VPC)
- **Network Mode**: Custom mode VPC
- **Subnets**:
  - **Public Subnet**: For load balancers and NAT gateway
  - **Private Subnet**: For Cloud Run, Cloud SQL, Memorystore
  - **IP Range**: 10.0.0.0/16 (configurable)
- **Private Google Access**: Enabled for private subnet
- **Cloud NAT**: For outbound internet access from private resources

#### Firewall Rules
- **Load Balancer Ingress**: Allow HTTP/HTTPS (80, 443) from `0.0.0.0/0`
- **Cloud Run Ingress**: Allow traffic from load balancer
- **Cloud SQL**: Allow PostgreSQL (5432) from Cloud Run via private IP
- **Memorystore**: Allow Redis (6379) from Cloud Run
- **Internal**: Allow all traffic within VPC

---

### 2. Compute & Containers

#### Artifact Registry
- **Format**: Docker
- **Location**: Regional or multi-regional
- **Repositories**:
  - `dataaggregator-backend`
  - `dataaggregator-frontend`
- **Features**:
  - Vulnerability scanning (Container Analysis API)
  - Image signing and verification
  - IAM-based access control
  - Immutable image tags (optional)

#### Cloud Run (Recommended)
- **Backend Service**:
  - CPU: 1 vCPU
  - Memory: 1GB (2GB for memory-intensive operations)
  - Min instances: 0 (dev), 1 (prod)
  - Max instances: 100 (auto-scaling)
  - Port: 8000
  - Request timeout: 300s
  - Concurrency: 80 requests per instance

- **Frontend Service**:
  - CPU: 1 vCPU
  - Memory: 512MB
  - Min instances: 0 (dev), 1 (prod)
  - Max instances: 100
  - Port: 3000
  - Request timeout: 60s
  - Concurrency: 100 requests per instance

- **Features**:
  - Automatic HTTPS
  - Built-in autoscaling (CPU, memory, request-based)
  - Blue/Green deployments
  - Traffic splitting for canary releases
  - VPC Connector for private networking
  - Service-to-service authentication

#### Alternative: Google Kubernetes Engine (GKE) Autopilot
- **Use Case**: When you need Kubernetes features and workload portability
- **Configuration**:
  - **Mode**: Autopilot (fully managed) or Standard
  - **Node pools**: Auto-managed by Google
  - **Networking**: VPC-native cluster
  - **Workload Identity**: Enabled for secure GCP access

- **Benefits**:
  - Full Kubernetes API support
  - More control over scheduling and resources
  - Support for stateful workloads
  - Multi-cluster management (Anthos)

- **Trade-offs**:
  - Higher complexity than Cloud Run
  - Requires Kubernetes expertise
  - Higher baseline costs

---

### 3. Data Services

#### Cloud SQL for PostgreSQL
- **Version**: 15
- **Machine Type**:
  - **Development**: Shared-core (db-f1-micro, db-g1-small)
  - **Production**: Standard (db-n1-standard-1) or High Memory (db-n1-highmem-2)
- **Storage**:
  - Type: SSD
  - Size: 10GB minimum, auto-increase enabled
  - Max size: 30TB
- **High Availability**:
  - Regional HA (automatic failover) for production
  - Cross-region replica for disaster recovery
- **Backups**:
  - Automated daily backups (7-day retention for dev, 30-day for prod)
  - Point-in-time recovery (PITR) enabled
- **Security**:
  - Private IP for VPC access (recommended)
  - Public IP with authorized networks (optional)
  - SSL/TLS enforcement
  - Cloud SQL Auth Proxy for secure connections
  - IAM database authentication
- **Features**:
  - Cloud SQL Insights for query performance
  - Automated maintenance windows
  - Read replicas for scaling reads

#### Memorystore for Redis
- **Tier**:
  - **Development**: Basic tier (no replication) - 1GB
  - **Production**: Standard tier (HA with replica) - 5GB+
- **Version**: Redis 6.x or 7.x
- **Network**: VPC peering or Private Service Connect
- **Persistence**: RDB snapshots (Standard tier)
- **Security**:
  - VPC-only access (no public IP)
  - AUTH enabled
  - In-transit encryption (TLS)
  - Automatic failover (Standard tier)
- **Features**:
  - Import/Export for migrations
  - Maintenance window configuration
  - Monitoring and alerting

---

### 4. Messaging & Event Streaming

#### Google Cloud Pub/Sub (Recommended)
- **Use Case**: Native GCP event streaming and messaging
- **Features**:
  - At-least-once delivery semantics
  - Global service with automatic scaling
  - Message retention: 7 days (configurable up to 31 days)
  - Dead-letter topics for failed messages
  - Schema validation (Avro, Protocol Buffers)
  - Message filtering and ordering
  - Push and pull subscriptions

- **Configuration**:
  - **Topics**: Create topics for different event types
  - **Subscriptions**: Create subscriptions for consumers
  - **Acknowledgement deadline**: 10-600 seconds
  - **Retry policy**: Exponential backoff

- **Pricing**:
  - Pay per GB of data ingested and delivered
  - No minimum fees
  - First 10GB per month free

#### Alternative: Confluent Cloud on GCP
- **Use Case**: When Kafka compatibility is required
- **Features**:
  - Fully managed Apache Kafka
  - Native Kafka API support
  - Multi-region replication
  - Schema Registry
  - ksqlDB for stream processing

- **Deployment**:
  - Runs on GCP infrastructure
  - VPC peering for private connectivity
  - Integrated monitoring

- **Considerations**:
  - Higher cost than Pub/Sub
  - Additional vendor dependency
  - More complex setup

#### Migration Strategy
- **Option 1**: Migrate to Pub/Sub
  - Requires application code changes
  - Lower cost and operational overhead
  - Native GCP integration

- **Option 2**: Use Confluent Cloud
  - Minimal code changes (Kafka-compatible)
  - Higher cost
  - Familiar Kafka ecosystem

---

### 5. Networking & Security

#### Cloud Load Balancing
- **Type**: HTTPS Load Balancer (Global or Regional)
- **Components**:
  - **Global Forwarding Rule**: External IP and port (80, 443)
  - **Target HTTPS Proxy**: SSL certificate termination
  - **URL Map**: Path-based routing rules
  - **Backend Services**:
    - Backend for Cloud Run (backend API)
    - Backend for Cloud Run (frontend)

- **Routing Rules**:
  - `/api/*` → Backend Cloud Run service
  - `/*` → Frontend Cloud Run service

- **Features**:
  - Global anycast IP (low latency worldwide)
  - Auto-scaling backends
  - Cloud CDN integration for static content
  - Cloud Armor for DDoS protection and WAF
  - SSL certificates (Google-managed or self-managed)
  - HTTP to HTTPS redirect

#### Cloud CDN
- **Use Case**: Cache static frontend assets globally
- **Configuration**:
  - Enable on frontend backend service
  - Cache mode: Automatic or custom TTL
  - Signed URLs for private content

#### Cloud Armor (WAF)
- **Security Policies**:
  - OWASP Top 10 protection
  - Rate limiting per IP
  - Geo-blocking (allow/deny by region)
  - Custom rules (SQL injection, XSS prevention)
  - Bot management

#### Secret Manager
- **Purpose**: Secure storage for sensitive data
- **Contents**:
  - Database passwords
  - Redis AUTH strings
  - API keys and tokens
  - Service account keys
  - SSL/TLS private keys

- **Access Control**:
  - IAM-based permissions
  - Service Account access via Workload Identity
  - Audit logging for all access

- **Features**:
  - Secret versioning
  - Automatic rotation
  - Regional or global replication

#### VPC Service Controls
- **Use Case**: Create security perimeter around resources
- **Policies**:
  - Restrict data exfiltration
  - Control API access
  - Enforce private connectivity

#### SSL/TLS Certificates
- **Options**:
  - **Google-managed certificates**: Automatic provisioning and renewal
  - **Self-managed certificates**: Upload custom certs (Let's Encrypt, commercial CA)
- **Storage**: Secret Manager
- **Binding**: Load Balancer HTTPS proxy

---

### 6. Monitoring & Logging

#### Cloud Logging (formerly Stackdriver Logging)
- **Log Sources**:
  - Cloud Run request logs
  - Application logs (stdout/stderr)
  - Cloud SQL logs (error, slow query, audit)
  - Load Balancer logs
  - VPC Flow Logs
  - Firewall logs

- **Features**:
  - Centralized log aggregation
  - Log-based metrics
  - Log routing and sinks
  - Export to BigQuery, Cloud Storage, Pub/Sub
  - Retention: 30 days (default), up to 3650 days

#### Cloud Monitoring (formerly Stackdriver Monitoring)
- **Metrics**:
  - Cloud Run: Request count, latency, instance count, CPU/memory
  - Cloud SQL: Connections, CPU, memory, disk I/O, replication lag
  - Memorystore: CPU, memory, ops/sec, hit rate
  - Load Balancer: Request rate, latency, error rate
  - Custom application metrics (via OpenTelemetry or Cloud Monitoring API)

- **Dashboards**:
  - Pre-built GCP service dashboards
  - Custom dashboards with widgets
  - SLO-based dashboards

#### Cloud Trace
- **Purpose**: Distributed tracing for latency analysis
- **Integration**: OpenTelemetry SDK
- **Features**:
  - Request latency breakdown
  - Dependency mapping
  - Performance insights

#### Cloud Profiler
- **Purpose**: Continuous CPU and heap profiling
- **Languages**: Python, Go, Java, Node.js
- **Benefits**:
  - Identify performance bottlenecks
  - Memory leak detection
  - Low overhead production profiling

#### Error Reporting
- **Purpose**: Aggregate and display application errors
- **Integration**: Automatic for Cloud Run, or SDK for custom errors
- **Features**:
  - Error grouping and deduplication
  - Stack trace analysis
  - Alert on new error types

#### Uptime Checks & Alerting
- **Uptime Checks**:
  - HTTP/HTTPS endpoint monitoring
  - Global check locations
  - Alert on downtime

- **Alerting Policies**:
  - Metric-based alerts (CPU, memory, latency)
  - Log-based alerts (error patterns)
  - Notification channels: Email, SMS, PagerDuty, Slack

---

## Infrastructure as Code Options

### 1. Terraform (Recommended)
**Pros**:
- Leverage existing AWS Terraform knowledge
- Multi-cloud support
- Large community and module ecosystem
- Mature GCP provider

**Migration Steps**:
1. Change provider from `hashicorp/aws` to `hashicorp/google`
2. Replace AWS resources with GCP equivalents:
   - `aws_vpc` → `google_compute_network`
   - `aws_ecs_service` → `google_cloud_run_service`
   - `aws_db_instance` → `google_sql_database_instance`
   - `aws_elasticache_cluster` → `google_redis_instance`
   - `aws_msk_cluster` → `google_pubsub_topic` (or Confluent)
3. Update authentication (Service Account key or Application Default Credentials)
4. Manage state in Cloud Storage backend

**Estimated Effort**: 40-60 hours

**Example Provider Configuration**:
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "dataaggregator-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

### 2. Google Cloud Deployment Manager
**Pros**:
- Native GCP IaC solution
- YAML or Python templates
- Integrated with Cloud Console

**Cons**:
- GCP-only (not multi-cloud)
- Less popular than Terraform
- Limited community resources

**Estimated Effort**: 60-80 hours (full rewrite)

### 3. Pulumi
**Pros**:
- Use familiar programming languages (Python, TypeScript, Go)
- Strong typing and IDE support
- Multi-cloud support

**Cons**:
- Requires learning Pulumi framework
- Smaller community than Terraform

**Estimated Effort**: 50-70 hours

---

## Key Configuration Changes

### Environment Variables

#### Current AWS Configuration
```bash
# PostgreSQL
POSTGRES_SERVER=dataaggregator-db.abc123.us-east-1.rds.amazonaws.com
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secret>
POSTGRES_DB=dataaggregator

# Redis
REDIS_URL=redis://dataaggregator-redis.abc123.cache.amazonaws.com:6379/0

# Kafka
KAFKA_BOOTSTRAP_SERVERS=b-1.dataaggregator-msk.xyz.kafka.us-east-1.amazonaws.com:9092
```

#### GCP Configuration (Option 1: Pub/Sub)
```bash
# Cloud SQL for PostgreSQL
POSTGRES_SERVER=/cloudsql/dataaggregator-dev:us-central1:dataaggregator-db
# Or private IP: 10.0.1.3
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<from-secret-manager>
POSTGRES_DB=dataaggregator
POSTGRES_SSL_MODE=require

# Memorystore for Redis
REDIS_HOST=10.0.1.4
REDIS_PORT=6379
REDIS_PASSWORD=<from-secret-manager>

# Google Cloud Pub/Sub
GCP_PROJECT_ID=dataaggregator-dev
PUBSUB_TOPIC=pipeline-events
PUBSUB_SUBSCRIPTION=pipeline-events-sub
```

#### GCP Configuration (Option 2: Confluent Cloud)
```bash
# Cloud SQL for PostgreSQL
POSTGRES_SERVER=/cloudsql/dataaggregator-dev:us-central1:dataaggregator-db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<from-secret-manager>
POSTGRES_DB=dataaggregator

# Memorystore for Redis
REDIS_HOST=10.0.1.4
REDIS_PORT=6379
REDIS_PASSWORD=<from-secret-manager>

# Confluent Cloud Kafka
KAFKA_BOOTSTRAP_SERVERS=pkc-xxxxx.us-central1.gcp.confluent.cloud:9092
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_USERNAME=<api-key>
KAFKA_SASL_PASSWORD=<api-secret>
```

### Service Account & Workload Identity

#### Create Service Account
```bash
gcloud iam service-accounts create dataaggregator-backend \
  --display-name="Data Aggregator Backend Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding dataaggregator-dev \
  --member="serviceAccount:dataaggregator-backend@dataaggregator-dev.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding dataaggregator-dev \
  --member="serviceAccount:dataaggregator-backend@dataaggregator-dev.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding dataaggregator-dev \
  --member="serviceAccount:dataaggregator-backend@dataaggregator-dev.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

#### Cloud Run with Service Account
```bash
gcloud run deploy backend \
  --image=us-central1-docker.pkg.dev/dataaggregator-dev/backend:latest \
  --service-account=dataaggregator-backend@dataaggregator-dev.iam.gserviceaccount.com \
  --region=us-central1
```

#### Application Code (Python)
```python
from google.cloud import secretmanager
from google.cloud import pubsub_v1

# Access Secret Manager (uses Application Default Credentials)
client = secretmanager.SecretManagerServiceClient()
name = f"projects/dataaggregator-dev/secrets/db-password/versions/latest"
response = client.access_secret_version(request={"name": name})
db_password = response.payload.data.decode("UTF-8")

# Publish to Pub/Sub
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path("dataaggregator-dev", "pipeline-events")
publisher.publish(topic_path, b"Event data")
```

### Migrate from Kafka to Pub/Sub

#### Producer Code
```python
# Before (Kafka)
from kafka import KafkaProducer
producer = KafkaProducer(bootstrap_servers=['kafka:9092'])
producer.send('pipeline-events', b'Event data')

# After (Pub/Sub)
from google.cloud import pubsub_v1
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(project_id, 'pipeline-events')
future = publisher.publish(topic_path, b'Event data')
```

#### Consumer Code
```python
# Before (Kafka)
from kafka import KafkaConsumer
consumer = KafkaConsumer('pipeline-events', bootstrap_servers=['kafka:9092'])
for message in consumer:
    process(message.value)

# After (Pub/Sub - Pull subscription)
from google.cloud import pubsub_v1
subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path(project_id, 'pipeline-events-sub')

def callback(message):
    process(message.data)
    message.ack()

streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
streaming_pull_future.result()
```

---

## Deployment Steps

### Phase 1: GCP Setup
1. **Create GCP Account & Project**
   ```bash
   # Create project
   gcloud projects create dataaggregator-dev --name="Data Aggregator Dev"

   # Set default project
   gcloud config set project dataaggregator-dev

   # Enable billing
   gcloud beta billing projects link dataaggregator-dev \
     --billing-account=<BILLING_ACCOUNT_ID>
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable \
     compute.googleapis.com \
     run.googleapis.com \
     sql-component.googleapis.com \
     sqladmin.googleapis.com \
     redis.googleapis.com \
     pubsub.googleapis.com \
     artifactregistry.googleapis.com \
     secretmanager.googleapis.com \
     cloudresourcemanager.googleapis.com \
     logging.googleapis.com \
     monitoring.googleapis.com
   ```

3. **Configure gcloud CLI**
   ```bash
   gcloud auth login
   gcloud config set project dataaggregator-dev
   gcloud config set compute/region us-central1
   ```

### Phase 2: Infrastructure Provisioning (Terraform)

1. **Initialize Terraform**
   ```bash
   cd terraform-gcp
   terraform init
   terraform plan -var-file="dev.tfvars"
   terraform apply -var-file="dev.tfvars"
   ```

2. **Resources Created**:
   - VPC network and subnets
   - Firewall rules
   - Artifact Registry repository
   - Cloud SQL PostgreSQL instance
   - Memorystore Redis instance
   - Pub/Sub topics and subscriptions
   - Secret Manager secrets
   - Cloud Load Balancer (HTTPS)
   - Cloud NAT for outbound connectivity
   - Service Accounts with IAM bindings

### Phase 3: Container Build & Push

1. **Configure Docker for Artifact Registry**
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

2. **Build and Push Backend**
   ```bash
   # Build
   docker build -t us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/backend:latest .

   # Push
   docker push us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/backend:latest
   ```

3. **Build and Push Frontend**
   ```bash
   cd frontend
   docker build -t us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/frontend:latest .
   docker push us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/frontend:latest
   ```

### Phase 4: Database Setup

1. **Connect to Cloud SQL**
   ```bash
   # Using Cloud SQL Proxy
   cloud_sql_proxy -instances=dataaggregator-dev:us-central1:dataaggregator-db=tcp:5432

   # Or connect directly via psql
   gcloud sql connect dataaggregator-db --user=postgres --database=dataaggregator
   ```

2. **Run Migrations**
   ```bash
   # Set environment variables
   export POSTGRES_SERVER=/cloudsql/dataaggregator-dev:us-central1:dataaggregator-db
   export POSTGRES_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")

   # Run Alembic migrations
   alembic upgrade head
   ```

3. **Import Data** (if migrating from AWS)
   ```bash
   # Export from AWS RDS
   pg_dump -h <aws-rds-endpoint> -U postgres -d dataaggregator > dump.sql

   # Import to Cloud SQL
   psql "host=/cloudsql/dataaggregator-dev:us-central1:dataaggregator-db \
     user=postgres dbname=dataaggregator" < dump.sql
   ```

### Phase 5: Deploy to Cloud Run

1. **Deploy Backend Service**
   ```bash
   gcloud run deploy backend \
     --image=us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/backend:latest \
     --platform=managed \
     --region=us-central1 \
     --service-account=dataaggregator-backend@dataaggregator-dev.iam.gserviceaccount.com \
     --add-cloudsql-instances=dataaggregator-dev:us-central1:dataaggregator-db \
     --vpc-connector=dataaggregator-connector \
     --set-env-vars="POSTGRES_SERVER=/cloudsql/dataaggregator-dev:us-central1:dataaggregator-db" \
     --set-secrets="POSTGRES_PASSWORD=db-password:latest,REDIS_PASSWORD=redis-password:latest" \
     --cpu=1 \
     --memory=1Gi \
     --min-instances=1 \
     --max-instances=100 \
     --port=8000 \
     --allow-unauthenticated
   ```

2. **Deploy Frontend Service**
   ```bash
   gcloud run deploy frontend \
     --image=us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/frontend:latest \
     --platform=managed \
     --region=us-central1 \
     --set-env-vars="NEXT_PUBLIC_API_URL=https://api.dataaggregator.com" \
     --cpu=1 \
     --memory=512Mi \
     --min-instances=1 \
     --max-instances=100 \
     --port=3000 \
     --allow-unauthenticated
   ```

3. **Configure Load Balancer**
   ```bash
   # Create backend services for Cloud Run
   gcloud compute backend-services create backend-service \
     --global \
     --load-balancing-scheme=EXTERNAL_MANAGED

   gcloud compute backend-services add-backend backend-service \
     --global \
     --network-endpoint-group=backend-neg \
     --network-endpoint-group-region=us-central1

   # Create URL map with routing rules
   gcloud compute url-maps create dataaggregator-lb \
     --default-service=frontend-service

   gcloud compute url-maps add-path-matcher dataaggregator-lb \
     --path-matcher-name=api-paths \
     --default-service=frontend-service \
     --path-rules="/api/*=backend-service"
   ```

### Phase 6: Configure Monitoring

1. **Enable Cloud Logging**
   ```bash
   # Logs are automatically collected from Cloud Run
   # View logs
   gcloud logging read "resource.type=cloud_run_revision" --limit 50
   ```

2. **Create Custom Dashboard**
   ```bash
   # Via Console: Monitoring > Dashboards > Create Dashboard
   # Or use Terraform/API to create programmatically
   ```

3. **Set Up Alerts**
   ```bash
   # Create alert policy for high error rate
   gcloud alpha monitoring policies create \
     --notification-channels=<CHANNEL_ID> \
     --display-name="High Error Rate" \
     --condition-display-name="Error rate > 5%" \
     --condition-threshold-value=5 \
     --condition-threshold-duration=300s
   ```

4. **Configure Uptime Checks**
   ```bash
   gcloud monitoring uptime-check-configs create https-check \
     --display-name="Frontend Health Check" \
     --resource-type=uptime-url \
     --host=dataaggregator.com \
     --path=/health
   ```

### Phase 7: CI/CD Pipeline

#### Cloud Build (Google Native)
```yaml
# cloudbuild.yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/dataaggregator/backend:$COMMIT_SHA', '.']

  # Push backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/dataaggregator/backend:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'backend'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/dataaggregator/backend:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/dataaggregator/backend:$COMMIT_SHA'
```

#### GitHub Actions (Alternative)
```yaml
name: Deploy to GCP

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v1'

      - name: 'Build and push to Artifact Registry'
        run: |
          gcloud builds submit --tag us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/backend:${{ github.sha }}

      - name: 'Deploy to Cloud Run'
        run: |
          gcloud run deploy backend \
            --image us-central1-docker.pkg.dev/dataaggregator-dev/dataaggregator/backend:${{ github.sha }} \
            --region us-central1 \
            --platform managed
```

---

## Cost Estimates (Monthly - USD)

### Development/Test Environment
| Service | Configuration | Cost |
|---------|--------------|------|
| **Cloud Run** | 2 services, minimal traffic | $10-20 |
| **Cloud SQL** | Shared-core (db-f1-micro), 10GB | $8-15 |
| **Memorystore Redis** | Basic M1 (1GB) | $50 |
| **Pub/Sub** | Low volume (<10GB/month) | $5-10 |
| **Artifact Registry** | Storage + bandwidth | $5-10 |
| **Cloud Load Balancing** | Minimal traffic | $18-25 |
| **Cloud Logging** | 5GB ingestion | $2-5 |
| **Cloud Monitoring** | Standard metrics | $0-5 |
| **VPC** | Standard networking | $5-10 |
| **Secret Manager** | 10 secrets, 1000 accesses | $1-2 |
| **Total** | | **~$104-152** |

### Production Environment
| Service | Configuration | Cost |
|---------|--------------|------|
| **Cloud Run** | 4-6 instances, moderate traffic | $100-200 |
| **Cloud SQL** | High-mem (db-n1-highmem-2), 100GB, HA | $250-400 |
| **Memorystore Redis** | Standard M3 (5GB) with replica | $175-250 |
| **Pub/Sub** | High volume (100GB/month) | $40-80 |
| **Artifact Registry** | Storage + bandwidth | $20-40 |
| **Cloud Load Balancing** | High traffic + Cloud Armor | $100-200 |
| **Cloud CDN** | 500GB cached data | $40-80 |
| **Cloud Logging** | 50GB ingestion | $25-50 |
| **Cloud Monitoring** | Custom metrics + alerts | $20-40 |
| **VPC** | VPN, NAT gateway | $50-100 |
| **Secret Manager** | 50 secrets, 10k accesses | $5-10 |
| **Egress Bandwidth** | Data transfer out | $50-150 |
| **Total** | | **~$875-1,600** |

### Cost Optimization Tips
1. **Committed Use Discounts**: Save 37-55% on compute with 1-3 year commitments
2. **Sustained Use Discounts**: Automatic discounts (up to 30%) for resources running >25% of month
3. **Cloud Run Min Instances**: Set to 0 for dev, 1+ only for production latency requirements
4. **Cloud SQL**:
   - Use shared-core for dev/test
   - Schedule automated start/stop for non-production instances
   - Enable storage auto-increase to avoid over-provisioning
5. **Pub/Sub**: Use topic retention wisely (7 days max if not needed longer)
6. **Logging**:
   - Configure log exclusion filters for verbose logs
   - Export to Cloud Storage for long-term retention (cheaper)
7. **Networking**: Use Private Google Access to avoid egress charges
8. **Artifact Registry**: Enable image lifecycle policies to delete old images

---

## Migration Effort Estimate

| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **Infrastructure (Terraform)** | 40-60 | Rewrite AWS resources to GCP |
| **Application Changes** | 15-25 | Pub/Sub migration, Cloud SQL connector, Service Account auth |
| **Database Migration** | 10-15 | Export/import, Cloud SQL Proxy setup, connection updates |
| **Messaging Migration** | 10-20 | Kafka to Pub/Sub code changes, or Confluent setup |
| **Testing & Validation** | 25-35 | Functional, integration, performance, security tests |
| **CI/CD Pipeline** | 10-15 | Cloud Build or GitHub Actions setup |
| **Monitoring Setup** | 8-12 | Cloud Logging, Monitoring, dashboards, alerts |
| **Documentation** | 5-10 | Update deployment docs, runbooks, architecture diagrams |
| **Security Review** | 8-12 | IAM, VPC, firewall rules, Secret Manager, audit logging |
| **Total** | **131-204 hours** | **3-5 weeks for 1 engineer** |

### Team Recommendations
- **1 DevOps/Cloud Engineer**: Infrastructure, networking, CI/CD
- **1 Backend Developer**: Application changes, Pub/Sub migration, testing
- **1 QA Engineer**: Test planning, validation, performance testing
- **Timeline**: 4-6 weeks with parallel workstreams

---

## Recommended Migration Approach

### Option 1: Lift and Shift (2-3 weeks)
**Approach**: Quick migration with minimal changes

**Steps**:
1. Provision GCP infrastructure (Cloud Run, Cloud SQL, Memorystore)
2. Export AWS database → Import to Cloud SQL
3. Deploy containers to Cloud Run (same code)
4. Use Confluent Cloud for Kafka (no code changes)
5. Cutover DNS/traffic

**Pros**:
- Fastest migration
- Minimal code changes
- Lower risk

**Cons**:
- Higher ongoing costs (Confluent Cloud)
- Not GCP-native
- Missed optimization opportunities

**Best For**: Urgent migrations, minimize disruption

### Option 2: Incremental with Optimization (4-6 weeks) ✅ **Recommended**
**Approach**: Migrate services progressively with GCP-native optimizations

**Phase 1** (Week 1-2):
- Set up GCP project and infrastructure
- Migrate database (Cloud SQL) with replication
- Migrate cache (Memorystore)
- Validate data integrity

**Phase 2** (Week 2-3):
- Deploy backend to Cloud Run (existing Kafka code)
- Set up dual-publishing (MSK + Pub/Sub)
- Test with small traffic percentage

**Phase 3** (Week 3-4):
- Migrate messaging to Pub/Sub (code changes)
- Deploy frontend to Cloud Run
- Configure load balancer and routing
- Gradual traffic shift (10% → 50% → 100%)

**Phase 4** (Week 4-6):
- Complete cutover
- Optimize performance and costs
- Decommission AWS resources
- Documentation and training

**Pros**:
- Lower risk with incremental rollout
- GCP-native architecture (lower costs)
- Easy rollback at each phase
- Optimization opportunities

**Cons**:
- Longer timeline
- Requires code changes (Kafka → Pub/Sub)
- Temporary dual-publishing complexity

**Best For**: Production environments, cost optimization

### Option 3: Hybrid Multi-Cloud (Ongoing)
**Approach**: Run parallel infrastructure on AWS and GCP

**Use Cases**:
- High availability and disaster recovery
- Geographic distribution (AWS regions + GCP regions)
- Vendor risk mitigation
- Gradual cloud provider evaluation

**Configuration**:
- Database replication (AWS RDS ↔ GCP Cloud SQL)
- Global load balancing across clouds
- Unified monitoring and logging

**Considerations**:
- 2x infrastructure costs
- Complex data synchronization
- Cross-cloud networking costs
- Higher operational complexity

---

## Key Decision Points

### 1. Container Orchestration
- **Cloud Run**: ✅ Recommended
  - Serverless, fully managed
  - Auto-scaling with zero instances
  - Simpler operations
  - Built-in HTTPS and custom domains
  - Lower baseline cost

- **GKE Autopilot**:
  - Choose if you need Kubernetes features
  - Workload portability (multi-cloud)
  - Stateful applications
  - Advanced networking/service mesh

### 2. Infrastructure as Code
- **Terraform**: ✅ Recommended
  - Leverage existing knowledge
  - Multi-cloud support
  - Faster migration

- **Cloud Deployment Manager**:
  - Native GCP, but less popular
  - Use only if committed to GCP-only tools

### 3. Messaging Strategy
- **Pub/Sub**: ✅ Recommended for GCP-native
  - Lower cost (~$40 vs $150+ for Confluent)
  - Fully managed, auto-scaling
  - Native GCP integration
  - Requires code changes from Kafka

- **Confluent Cloud on GCP**:
  - Choose if Kafka compatibility is critical
  - Minimal code changes
  - Higher cost
  - Advanced Kafka features (ksqlDB, Schema Registry)

### 4. Database Migration Strategy
- **Dump and Restore**: Simple, requires downtime (2-4 hours)
- **Database Migration Service (DMS)**: ✅ Recommended for production
  - Minimal downtime migration
  - Continuous replication from AWS RDS to Cloud SQL
  - Validation and cutover tools
  - Supports PostgreSQL logical replication

---

## Post-Migration Checklist

### Functional Validation
- [ ] All API endpoints responding correctly
- [ ] Database connections working (Cloud SQL Proxy or private IP)
- [ ] Redis caching functional via Memorystore
- [ ] Pub/Sub messaging operational (or Confluent Cloud)
- [ ] Authentication and authorization working
- [ ] Frontend loading and navigating properly
- [ ] File uploads/downloads working (if using Cloud Storage)

### Performance Validation
- [ ] API response times within SLA (<500ms for 95th percentile)
- [ ] Database query performance acceptable
- [ ] Cloud Run cold start times <2 seconds
- [ ] Autoscaling triggers working correctly
- [ ] Load testing passed (same or better than AWS)
- [ ] CDN cache hit rate >80% (if enabled)

### Security Validation
- [ ] VPC firewall rules correctly configured
- [ ] Cloud Run ingress settings correct (internal/external)
- [ ] SSL/TLS enforced on all connections
- [ ] Secrets stored in Secret Manager (no hardcoded values)
- [ ] Service Account permissions follow least privilege
- [ ] Cloud Armor policies active (if enabled)
- [ ] Vulnerability scans passed (Artifact Registry)
- [ ] Audit logging enabled for all critical resources

### Monitoring & Alerting
- [ ] Cloud Logging collecting all application logs
- [ ] Cloud Monitoring dashboards created
- [ ] Custom metrics being recorded
- [ ] Alert policies configured and tested:
  - [ ] High error rate (>5%)
  - [ ] High latency (>2s)
  - [ ] Database connection failures
  - [ ] Cloud Run instance failures
  - [ ] Cloud SQL failover events
- [ ] Notification channels working (email, Slack, PagerDuty)
- [ ] Uptime checks configured for critical endpoints

### Operations
- [ ] CI/CD pipeline operational (Cloud Build or GitHub Actions)
- [ ] Automated backups configured for Cloud SQL
- [ ] Backup restoration tested successfully
- [ ] Disaster recovery plan documented
- [ ] Cost alerts and budgets configured
- [ ] Resource labels applied for cost tracking
- [ ] On-call runbooks updated with GCP specifics

### Business Continuity
- [ ] Rollback plan documented and tested
- [ ] Database migration validated (data integrity checks)
- [ ] User acceptance testing complete
- [ ] Stakeholder communication sent
- [ ] DNS cutover completed
- [ ] AWS resources decommissioned (or kept for DR period)

---

## GCP-Specific Best Practices

### 1. Security
- **VPC Service Controls**: Create security perimeter for sensitive data
- **Binary Authorization**: Enforce only signed container images
- **Private Google Access**: Avoid internet egress for GCP API calls
- **Organization Policies**: Enforce compliance constraints
- **Cloud KMS**: Use for encryption key management (CMEK)
- **Cloud Identity-Aware Proxy (IAP)**: For internal admin tools

### 2. Reliability
- **Cloud SQL High Availability**: Use regional HA for production
- **Multi-region Artifact Registry**: For disaster recovery
- **Global Load Balancing**: For multi-region deployments
- **Cloud Run min instances**: Set to 1+ for latency-sensitive apps
- **Health checks**: Configure for all services

### 3. Performance
- **Cloud CDN**: Enable for static frontend assets
- **Cloud SQL Read Replicas**: For read-heavy workloads
- **Memorystore Standard tier**: For HA and better performance
- **Cloud Run CPU allocation**: Set to "always allocated" for consistent performance
- **Connection pooling**: Use PgBouncer or Cloud SQL Proxy for database

### 4. Cost Management
- **Committed Use Discounts**: For predictable workloads
- **Preemptible VMs**: For batch processing (if using GKE)
- **Cloud Run min instances**: Set to 0 for non-critical services
- **Cloud SQL scheduled start/stop**: For dev/test environments
- **Log exclusion filters**: Reduce logging costs
- **Budget alerts**: Set at 50%, 90%, 100% thresholds

---

## Support & Resources

### GCP Documentation
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [Cloud Pub/Sub](https://cloud.google.com/pubsub/docs)
- [Cloud Load Balancing](https://cloud.google.com/load-balancing/docs)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)

### Terraform Resources
- [Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Terraform Examples](https://github.com/terraform-google-modules)
- [Terraform Google Modules](https://registry.terraform.io/namespaces/terraform-google-modules)

### Migration Tools
- [Database Migration Service (DMS)](https://cloud.google.com/database-migration)
- [Migrate to Containers](https://cloud.google.com/migrate/containers)
- [Transfer Service for on-premises data](https://cloud.google.com/storage-transfer/docs/on-prem-overview)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)

### Training & Certification
- [Google Cloud Skills Boost](https://www.cloudskillsboost.google/)
- [GCP Professional Cloud Architect](https://cloud.google.com/certification/cloud-architect)
- [Coursera GCP Courses](https://www.coursera.org/googlecloud)

### Community Support
- [Google Cloud Community](https://www.googlecloudcommunity.com/)
- [Stack Overflow - google-cloud-platform](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- [GitHub - GoogleCloudPlatform](https://github.com/GoogleCloudPlatform)
- [GCP Slack Community](https://googlecloud-community.slack.com/)

---

## Comparison: AWS vs Azure vs GCP

| Feature | AWS | Azure | GCP |
|---------|-----|-------|-----|
| **Container Platform** | ECS Fargate | Container Apps | Cloud Run ⭐ |
| **Database** | RDS PostgreSQL | Azure Database | Cloud SQL |
| **Cache** | ElastiCache | Azure Cache | Memorystore |
| **Messaging** | MSK (Kafka) | Event Hubs | Pub/Sub ⭐ |
| **Load Balancer** | ALB | App Gateway | Cloud LB ⭐ |
| **Monitoring** | CloudWatch | Azure Monitor | Cloud Monitoring ⭐ |
| **Serverless Maturity** | Moderate | Moderate | High ⭐ |
| **Pricing Transparency** | Complex | Moderate | Simple ⭐ |
| **Global Network** | Good | Good | Excellent ⭐ |
| **Kubernetes (Managed)** | EKS | AKS | GKE Autopilot ⭐ |

**GCP Advantages for this Platform**:
- ⭐ Cloud Run: Best-in-class serverless containers
- ⭐ Pub/Sub: Simple, scalable messaging (vs complex Kafka setup)
- ⭐ Transparent pricing and cost management
- ⭐ Superior network performance (Google's private fiber)
- ⭐ Integrated observability (Logging + Monitoring + Tracing)

---

## Next Steps

1. **Review and Approve**: Get stakeholder approval for GCP migration
2. **Create GCP Organization & Project**: Set up billing and IAM
3. **Proof of Concept**: Deploy to GCP dev environment
4. **Terraform Migration**: Adapt existing AWS Terraform to GCP
5. **Application Changes**: Implement Pub/Sub (or Confluent) integration
6. **Security Review**: Validate firewall rules, IAM, secrets management
7. **Testing**: Functional, performance, security testing
8. **Production Migration**: Execute incremental migration plan
9. **Monitoring & Optimization**: Continuous improvement post-migration
10. **Cost Analysis**: Review and optimize monthly spending

---

**Document Version**: 1.0
**Last Updated**: October 6, 2025
**Author**: Data Aggregator Platform Team
**Review Date**: Quarterly
