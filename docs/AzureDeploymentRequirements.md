# Azure Deployment Requirements for Data Aggregator Platform

## Overview

This document outlines the requirements and approach for deploying the Data Aggregator Platform on Microsoft Azure. It provides a comprehensive mapping from the current AWS infrastructure to Azure equivalents, along with detailed implementation guidance.

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

## Azure Service Mappings

| AWS Service | Azure Equivalent | Notes |
|------------|------------------|-------|
| **ECS Fargate** | **Azure Container Apps** or **AKS (Managed)** | Container Apps for serverless, AKS for full control |
| **RDS PostgreSQL** | **Azure Database for PostgreSQL** | Fully managed, v15 supported |
| **ElastiCache Redis** | **Azure Cache for Redis** | Fully compatible |
| **MSK (Kafka)** | **Azure Event Hubs** (Kafka protocol) | Native Kafka API support |
| **ECR** | **Azure Container Registry (ACR)** | Private container registry |
| **VPC** | **Azure Virtual Network (VNet)** | Network isolation |
| **ALB** | **Azure Application Gateway** or **Front Door** | App Gateway for regional, Front Door for global |
| **Security Groups** | **Network Security Groups (NSGs)** | Firewall rules |
| **CloudWatch** | **Azure Monitor + Log Analytics** | Logging and metrics |
| **IAM Roles** | **Managed Identities** | Azure AD integration |

---

## Required Azure Resources

### 1. Core Infrastructure

#### Resource Group
- **Purpose**: Container for all Azure resources
- **Naming**: `rg-dataaggregator-{environment}`
- **Location**: Choose based on user proximity (e.g., East US, West Europe)

#### Virtual Network (VNet)
- **Address Space**: 10.0.0.0/16
- **Subnets**:
  - **Public Subnet**: 10.0.1.0/24, 10.0.2.0/24 (Application Gateway, Container Apps)
  - **Private Subnet**: 10.0.3.0/24, 10.0.4.0/24 (Databases, Cache, Event Hubs)
- **DNS**: Azure-provided DNS or custom DNS servers

#### Network Security Groups (NSGs)
- **Application Gateway NSG**: Allow HTTP/HTTPS inbound
- **Container Apps NSG**: Allow traffic from Application Gateway
- **Database NSG**: Allow PostgreSQL (5432) from private subnet
- **Redis NSG**: Allow Redis (6379) from private subnet
- **Event Hubs NSG**: Allow Kafka (9093) from private subnet

---

### 2. Compute & Containers

#### Azure Container Registry (ACR)
- **SKU**: Basic (dev/test) or Standard/Premium (production)
- **Purpose**: Store backend and frontend Docker images
- **Features**:
  - Geo-replication (Premium tier)
  - Image scanning and vulnerability assessment
  - Webhook integration for CI/CD

#### Azure Container Apps (Recommended)
- **Backend Service**:
  - CPU: 0.5 cores
  - Memory: 1GB
  - Min replicas: 1 (dev), 2 (prod)
  - Max replicas: 10
  - Port: 8000

- **Frontend Service**:
  - CPU: 0.25 cores
  - Memory: 0.5GB
  - Min replicas: 1 (dev), 2 (prod)
  - Max replicas: 10
  - Port: 3000

- **Features**:
  - Built-in autoscaling (CPU/HTTP based)
  - HTTPS ingress with custom domains
  - Managed certificates
  - Integrated with VNet
  - Dapr support for microservices patterns

#### Alternative: Azure Kubernetes Service (AKS)
- **Use Case**: When you need more control over orchestration
- **Configuration**:
  - Node pool: 2-3 nodes (Standard_D2s_v3 or similar)
  - Kubernetes version: Latest stable
  - Network plugin: Azure CNI for VNet integration
  - Load balancer: Standard SKU

- **Additional Complexity**:
  - Requires Kubernetes expertise
  - Need to manage deployments, services, ingress
  - Higher operational overhead

---

### 3. Data Services

#### Azure Database for PostgreSQL Flexible Server
- **Version**: 15
- **Pricing Tier**:
  - **Development**: Burstable (Standard_B1ms) - 1 vCore, 2GB RAM
  - **Production**: General Purpose (Standard_D2s_v3) - 2 vCores, 8GB RAM
- **Storage**: 20GB minimum, auto-grow enabled
- **Backup**: 7-day retention (dev), 35-day retention (prod)
- **High Availability**: Zone-redundant for production
- **Security**:
  - Private endpoint for VNet integration
  - SSL/TLS enforcement
  - Azure AD authentication
  - Firewall rules for client IPs

#### Azure Cache for Redis
- **Pricing Tier**:
  - **Development**: Basic C0 (250MB) or C1 (1GB)
  - **Production**: Standard C2 (2.5GB) or Premium P1 (6GB)
- **Features**:
  - VNet injection (Premium tier only)
  - Data persistence (Premium tier)
  - Clustering for scale-out (Premium tier)
  - Geo-replication (Premium tier)
- **Security**:
  - Access keys rotation
  - SSL/TLS required
  - Private endpoint support

---

### 4. Messaging

#### Azure Event Hubs (Kafka Protocol)
- **Pricing Tier**:
  - **Development**: Basic (1 throughput unit)
  - **Production**: Standard (2-4 TUs) or Premium (processing units)
- **Configuration**:
  - Enable Kafka endpoint
  - 3+ partitions per topic
  - Message retention: 1-7 days
- **Kafka Compatibility**:
  - Supports Kafka 1.0+ protocol
  - SASL authentication required
  - Connection string format: `<namespace>.servicebus.windows.net:9093`

#### Alternative: Azure Event Grid
- **Use Case**: Event-driven architectures with pub/sub patterns
- **Not a direct Kafka replacement** but useful for event routing

---

### 5. Networking & Security

#### Azure Application Gateway (v2)
- **SKU**: Standard_v2 or WAF_v2
- **Features**:
  - Web Application Firewall (WAF) for security
  - SSL/TLS termination
  - Path-based routing:
    - `/api/*` → Backend Container App
    - `/*` → Frontend Container App
  - Autoscaling (0-10 instances)
  - HTTP/2 and WebSocket support

#### Azure Front Door (Alternative)
- **Use Case**: Global distribution, CDN, advanced routing
- **Benefits**: Lower latency, DDoS protection, caching

#### Azure Key Vault
- **Purpose**: Secure storage for secrets and certificates
- **Contents**:
  - Database connection strings
  - Redis access keys
  - Event Hubs connection strings
  - API keys and tokens
  - SSL certificates
- **Access**: Via Managed Identity from Container Apps
- **Features**:
  - Secret versioning
  - Audit logging
  - Soft delete and purge protection

#### SSL/TLS Certificates
- **Options**:
  - Azure-managed certificates (free, auto-renewal)
  - Import custom certificates (Let's Encrypt, commercial CA)
- **Storage**: Azure Key Vault
- **Binding**: Application Gateway or Container Apps custom domains

---

### 6. Monitoring & Logging

#### Azure Monitor
- **Components**:
  - Application Insights for APM (Application Performance Monitoring)
  - Log Analytics Workspace for centralized logging
  - Metrics for resource monitoring
  - Alerts for proactive notifications

#### Application Insights
- **Capabilities**:
  - Request tracking and response times
  - Dependency tracking (database, Redis, Event Hubs)
  - Exception and error logging
  - Custom metrics and events
  - Live metrics stream
  - Distributed tracing

#### Log Analytics Workspace
- **Log Sources**:
  - Container Apps logs
  - Application Gateway logs
  - Database logs
  - NSG flow logs
- **Queries**: Kusto Query Language (KQL)
- **Retention**: 30-730 days

#### Azure Dashboards
- **Visualizations**:
  - System health metrics
  - Application performance
  - Cost analysis
  - Custom KQL queries

---

## Infrastructure as Code Options

### 1. Terraform (Recommended)
**Pros**:
- Minimal migration from existing AWS Terraform
- Multi-cloud support
- Large community and module ecosystem
- State management

**Migration Steps**:
1. Change provider from `hashicorp/aws` to `hashicorp/azurerm`
2. Replace AWS resources with Azure equivalents:
   - `aws_vpc` → `azurerm_virtual_network`
   - `aws_ecs_service` → `azurerm_container_app`
   - `aws_db_instance` → `azurerm_postgresql_flexible_server`
   - `aws_elasticache_cluster` → `azurerm_redis_cache`
   - `aws_msk_cluster` → `azurerm_eventhub_namespace`
3. Update variables and outputs
4. Configure Azure authentication (Service Principal or Managed Identity)

**Estimated Effort**: 40-60 hours

### 2. Azure Bicep (Azure-Native)
**Pros**:
- Declarative, clean syntax (vs. ARM JSON)
- Native Azure integration
- Type safety and IntelliSense
- Transpiles to ARM templates

**Cons**:
- Azure-only (not multi-cloud)
- Requires full rewrite from Terraform

**Estimated Effort**: 50-70 hours (full rewrite)

### 3. ARM Templates (Legacy)
**Pros**:
- Native Azure support
- Direct deployment via portal/CLI

**Cons**:
- JSON-based, verbose and complex
- Limited reusability
- Not recommended for new projects

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

#### Azure Equivalent Configuration
```bash
# PostgreSQL Flexible Server
POSTGRES_SERVER=dataaggregator-db.postgres.database.azure.com
POSTGRES_USER=adminuser
POSTGRES_PASSWORD=<from-key-vault>
POSTGRES_DB=dataaggregator
POSTGRES_SSL_MODE=require

# Azure Cache for Redis
REDIS_URL=redis://dataaggregator-redis.redis.cache.windows.net:6380?ssl=true
REDIS_PASSWORD=<from-key-vault>

# Azure Event Hubs (Kafka)
KAFKA_BOOTSTRAP_SERVERS=dataaggregator-eh.servicebus.windows.net:9093
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_USERNAME=$ConnectionString
KAFKA_SASL_PASSWORD=<eventhub-connection-string>
```

### Managed Identity Integration

#### Backend Container App
```terraform
resource "azurerm_container_app" "backend" {
  # ... other configuration ...

  identity {
    type = "SystemAssigned"
  }
}

# Grant access to Key Vault
resource "azurerm_key_vault_access_policy" "backend" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_container_app.backend.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
```

#### Application Code (Python)
```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

# Authenticate using Managed Identity
credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://dataaggregator-kv.vault.azure.net/", credential=credential)

# Retrieve secrets
db_password = client.get_secret("db-password").value
redis_password = client.get_secret("redis-password").value
```

---

## Deployment Steps

### Phase 1: Azure Setup
1. **Create Azure Account & Subscription**
   - Set up billing and resource limits
   - Create service principal for automation

2. **Configure Azure CLI**
   ```bash
   az login
   az account set --subscription "<subscription-id>"
   ```

3. **Create Resource Group**
   ```bash
   az group create --name rg-dataaggregator-dev --location eastus
   ```

### Phase 2: Infrastructure Provisioning
1. **Initialize Terraform**
   ```bash
   cd terraform-azure
   terraform init
   terraform plan -var-file="dev.tfvars"
   terraform apply -var-file="dev.tfvars"
   ```

2. **Resources Created**:
   - Virtual Network + Subnets
   - Network Security Groups
   - Azure Container Registry
   - PostgreSQL Flexible Server
   - Azure Cache for Redis
   - Event Hubs Namespace
   - Application Gateway
   - Key Vault
   - Log Analytics Workspace

### Phase 3: Container Build & Push
1. **Login to ACR**
   ```bash
   az acr login --name dataaggregatoracr
   ```

2. **Build and Push Backend**
   ```bash
   docker build -t dataaggregatoracr.azurecr.io/backend:latest .
   docker push dataaggregatoracr.azurecr.io/backend:latest
   ```

3. **Build and Push Frontend**
   ```bash
   cd frontend
   docker build -t dataaggregatoracr.azurecr.io/frontend:latest .
   docker push dataaggregatoracr.azurecr.io/frontend:latest
   ```

### Phase 4: Database Setup
1. **Run Migrations**
   ```bash
   # Connect via Azure CLI
   az postgres flexible-server connect --name dataaggregator-db --admin-user adminuser

   # Or use connection string
   alembic upgrade head
   ```

2. **Seed Initial Data** (if required)
   ```bash
   python scripts/seed_data.py
   ```

### Phase 5: Deploy Container Apps
1. **Create Container App Environment**
   ```bash
   az containerapp env create \
     --name dataaggregator-env \
     --resource-group rg-dataaggregator-dev \
     --location eastus \
     --logs-workspace-id <workspace-id>
   ```

2. **Deploy Backend**
   ```bash
   az containerapp create \
     --name backend \
     --resource-group rg-dataaggregator-dev \
     --environment dataaggregator-env \
     --image dataaggregatoracr.azurecr.io/backend:latest \
     --target-port 8000 \
     --ingress external \
     --registry-server dataaggregatoracr.azurecr.io \
     --env-vars POSTGRES_SERVER=<server> REDIS_URL=<url>
   ```

3. **Deploy Frontend**
   ```bash
   az containerapp create \
     --name frontend \
     --resource-group rg-dataaggregator-dev \
     --environment dataaggregator-env \
     --image dataaggregatoracr.azurecr.io/frontend:latest \
     --target-port 3000 \
     --ingress external \
     --registry-server dataaggregatoracr.azurecr.io \
     --env-vars NEXT_PUBLIC_API_URL=<api-url>
   ```

### Phase 6: Configure Monitoring
1. **Enable Application Insights**
   ```bash
   az monitor app-insights component create \
     --app dataaggregator \
     --location eastus \
     --resource-group rg-dataaggregator-dev \
     --workspace <workspace-id>
   ```

2. **Configure Container Apps Instrumentation**
   - Add Application Insights connection string to environment variables
   - Install SDK in backend: `pip install opencensus-ext-azure`

3. **Create Alerts**
   - HTTP 5xx errors > threshold
   - Response time > 2 seconds
   - Container restart count > 3

### Phase 7: CI/CD Pipeline

#### GitHub Actions (Example)
```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and push to ACR
        run: |
          az acr build --registry dataaggregatoracr \
            --image backend:${{ github.sha }} .

      - name: Deploy to Container Apps
        run: |
          az containerapp update \
            --name backend \
            --resource-group rg-dataaggregator-prod \
            --image dataaggregatoracr.azurecr.io/backend:${{ github.sha }}
```

#### Azure DevOps (Alternative)
- Create build pipeline for Docker images
- Create release pipeline for Container Apps deployment
- Integrate with Azure Key Vault for secrets

---

## Cost Estimates (Monthly - USD)

### Development/Test Environment
| Service | Configuration | Cost |
|---------|--------------|------|
| **Container Apps** | 2 apps, 0.5-1 vCore total | $15-30 |
| **PostgreSQL Flexible** | Burstable B1ms, 20GB | $25-50 |
| **Redis Cache** | Basic C0 (250MB) | $15 |
| **Event Hubs** | Basic, 1 TU | $25-50 |
| **Application Gateway** | Standard_v2, minimal | $150 |
| **Monitoring** | Log Analytics, App Insights | $10-20 |
| **VNet, NSGs** | Standard networking | $5-10 |
| **Container Registry** | Basic tier | $5 |
| **Key Vault** | Standard | $1-5 |
| **Total** | | **~$251-336** |

### Production Environment
| Service | Configuration | Cost |
|---------|--------------|------|
| **Container Apps** | 4-6 replicas, autoscaling | $100-200 |
| **PostgreSQL Flexible** | General Purpose D2s, 100GB, HA | $150-300 |
| **Redis Cache** | Standard C2 or Premium P1 | $100-150 |
| **Event Hubs** | Standard, 4 TUs | $150-300 |
| **Application Gateway** | WAF_v2, autoscaling | $250-400 |
| **Monitoring** | Higher ingestion, alerts | $50-100 |
| **VNet, NSGs** | Standard + peering | $20-30 |
| **Container Registry** | Standard tier | $20 |
| **Key Vault** | Standard | $5-10 |
| **Bandwidth** | Egress charges | $50-100 |
| **Total** | | **~$895-1,610** |

### Cost Optimization Tips
1. **Reserved Instances**: Save 30-40% on compute with 1-3 year commitments
2. **Autoscaling**: Scale down during off-hours
3. **Azure Hybrid Benefit**: Use existing licenses for SQL Server (if applicable)
4. **Spot Instances**: For dev/test non-critical workloads
5. **Burstable Tiers**: Use B-series for variable workloads
6. **Storage Lifecycle**: Move old data to cool/archive tiers

---

## Migration Effort Estimate

| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **Infrastructure (Terraform)** | 40-60 | Rewrite AWS resources to Azure |
| **Application Changes** | 10-15 | Event Hubs auth, Managed Identity, SSL changes |
| **Database Migration** | 5-10 | Export/import, connection string updates |
| **Testing & Validation** | 20-30 | Functional, integration, performance tests |
| **CI/CD Pipeline** | 10-15 | GitHub Actions or Azure DevOps setup |
| **Monitoring Setup** | 5-10 | Application Insights, dashboards, alerts |
| **Documentation** | 5-10 | Update deployment docs, runbooks |
| **Security Review** | 5-10 | NSGs, Key Vault, RBAC configuration |
| **Total** | **100-160 hours** | **2-4 weeks for 1 engineer** |

### Team Recommendations
- **1 DevOps Engineer**: Infrastructure and CI/CD
- **1 Backend Developer**: Application changes and testing
- **1 QA Engineer**: Testing and validation
- **Timeline**: 3-4 weeks with parallel workstreams

---

## Recommended Migration Approach

### Option 1: Big Bang Migration (1-2 weeks)
**Approach**: Migrate all services at once during a maintenance window

**Pros**:
- Faster completion
- Single cutover event
- Simpler coordination

**Cons**:
- Higher risk
- Longer downtime
- Rollback complexity

**Best For**: Dev/test environments, or when downtime is acceptable

### Option 2: Incremental Migration (3-4 weeks) ✅ **Recommended**
**Approach**: Migrate services progressively

**Phase 1** (Week 1):
- Set up Azure infrastructure
- Migrate database (PostgreSQL) with replication
- Validate data integrity

**Phase 2** (Week 2):
- Migrate cache (Redis) and messaging (Event Hubs)
- Deploy backend container to Azure
- Test with AWS frontend

**Phase 3** (Week 3):
- Deploy frontend container to Azure
- Configure Application Gateway routing
- Gradual traffic shift (10% → 50% → 100%)

**Phase 4** (Week 4):
- Monitor and optimize
- Complete cutover
- Decommission AWS resources

**Pros**:
- Lower risk
- Easy rollback at each phase
- Continuous validation

**Cons**:
- Longer timeline
- Temporary hybrid architecture complexity

**Best For**: Production environments

### Option 3: Hybrid/Multi-Cloud (Ongoing)
**Approach**: Run parallel on both AWS and Azure

**Use Cases**:
- High availability across clouds
- Geographic distribution
- Risk mitigation

**Considerations**:
- Higher costs (2x infrastructure)
- Data synchronization complexity
- Operational overhead

---

## Key Decision Points

### 1. Container Orchestration
- **Azure Container Apps**: ✅ Recommended for this platform
  - Simpler operations
  - Built-in scaling and ingress
  - Lower management overhead

- **Azure Kubernetes Service (AKS)**:
  - Choose if you need advanced Kubernetes features
  - Existing Kubernetes expertise in team

### 2. Infrastructure as Code
- **Terraform**: ✅ Recommended
  - Leverage existing Terraform knowledge
  - Multi-cloud flexibility
  - Faster migration

- **Azure Bicep**:
  - Choose if committing fully to Azure
  - Better Azure-native integration

### 3. Database Migration Strategy
- **Dump and Restore**: Simple, requires downtime
- **Replication**: ✅ Recommended for production
  - Set up PostgreSQL replication AWS → Azure
  - Validate data consistency
  - Minimal downtime cutover

### 4. Messaging Migration
- **Direct Migration**: Update connection strings, redeploy
- **Dual Publishing**: ✅ Recommended for zero downtime
  - Publish to both MSK and Event Hubs temporarily
  - Consumers gradually move to Event Hubs
  - Deprecate MSK

---

## Post-Migration Checklist

### Functional Validation
- [ ] All APIs responding correctly
- [ ] Database connections working
- [ ] Redis caching functional
- [ ] Event Hubs messaging operational
- [ ] Authentication and authorization working
- [ ] Frontend loading and navigating properly

### Performance Validation
- [ ] Response times within SLA
- [ ] Database query performance acceptable
- [ ] Container startup times < 30 seconds
- [ ] Autoscaling triggers working
- [ ] Load testing passed

### Security Validation
- [ ] NSG rules correctly configured
- [ ] SSL/TLS enforced on all connections
- [ ] Secrets stored in Key Vault
- [ ] Managed Identity permissions correct
- [ ] No hardcoded credentials in code
- [ ] Vulnerability scan passed

### Monitoring & Alerting
- [ ] Application Insights collecting telemetry
- [ ] Log Analytics receiving logs
- [ ] Dashboards created and functional
- [ ] Alerts configured and tested
- [ ] On-call runbooks updated

### Operations
- [ ] CI/CD pipeline operational
- [ ] Backup and restore tested
- [ ] Disaster recovery plan documented
- [ ] Cost monitoring configured
- [ ] Resource tagging complete
- [ ] Documentation updated

### Business Continuity
- [ ] Rollback plan documented and tested
- [ ] Data migration validated
- [ ] User acceptance testing complete
- [ ] Stakeholders notified
- [ ] AWS resources decommissioned (or kept for DR)

---

## Support & Resources

### Azure Documentation
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/azure/postgresql/)
- [Azure Cache for Redis](https://learn.microsoft.com/azure/azure-cache-for-redis/)
- [Azure Event Hubs](https://learn.microsoft.com/azure/event-hubs/)
- [Azure Application Gateway](https://learn.microsoft.com/azure/application-gateway/)

### Terraform Resources
- [Azure Provider Documentation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Terraform Examples](https://github.com/hashicorp/terraform-provider-azurerm/tree/main/examples)

### Migration Tools
- [Azure Migrate](https://azure.microsoft.com/services/azure-migrate/)
- [Database Migration Service](https://azure.microsoft.com/services/database-migration/)
- [Azure TCO Calculator](https://azure.microsoft.com/pricing/tco/calculator/)

### Community Support
- [Azure Community Support](https://azure.microsoft.com/support/community/)
- [Stack Overflow - Azure Tag](https://stackoverflow.com/questions/tagged/azure)
- [Terraform Azure Provider Issues](https://github.com/hashicorp/terraform-provider-azurerm/issues)

---

## Next Steps

1. **Review and Approve**: Get stakeholder approval for Azure migration
2. **Provision Azure Subscription**: Set up billing and resource limits
3. **Create Terraform Configuration**: Adapt existing AWS Terraform to Azure
4. **Set Up Development Environment**: Deploy to Azure dev environment first
5. **Test and Validate**: Comprehensive testing of all functionality
6. **Plan Production Migration**: Schedule migration window and communication
7. **Execute Migration**: Follow incremental approach
8. **Monitor and Optimize**: Continuous monitoring and cost optimization

---

**Document Version**: 1.0
**Last Updated**: October 6, 2025
**Author**: Data Aggregator Platform Team
**Review Date**: Quarterly
