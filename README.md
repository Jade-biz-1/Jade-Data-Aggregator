<div align="center">
  <img src="docs/logo.png" alt="Data Aggregator Platform Logo" width="400"/>
</div>

# Data Aggregator Platform

A comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format. The platform provides real-time and batch processing capabilities with an intuitive user interface for configuration and management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Getting Started](#getting-started)
5. [Development](#development)
6. [Deployment](#deployment)
7. [Monitoring](#monitoring)
8. [Testing](#testing)
9. [Features](#features)

## Architecture Overview

The Data Aggregator Platform is designed as a cloud-native, microservices-based architecture that provides scalable, secure, and reliable data integration capabilities. The architecture supports both real-time and batch processing with a focus on extensibility, maintainability, and high availability.

### Key Components

- **Backend Services**: Python FastAPI microservices for API, authentication, data processing
- **Frontend**: Next.js 15.5.4 application with enhanced UI theme using Tailwind CSS 3.4.13 and React 19.1.0
- **Database**: PostgreSQL 14+ for primary data storage (with partitioning for time-series data)
- **Cache**: Redis 7+ for session management, caching, and pub/sub messaging
- **Message Queue**: Apache Kafka for persistent event streaming
- **Infrastructure**: Containerized with Docker (Kubernetes deployment planned)

### Architecture Layers

- **Presentation Layer**: User Interface Service and API Gateway
- **Application Layer**: Pipeline Management, Connector, Transformation, and User Management Services
- **Processing Layer**: Stream and Batch Processing Services
- **Integration Layer**: Event Bus and API Management
- **Data Layer**: Data Storage, Metadata Repository, and Monitoring Database

## Project Structure

```
dataaggregator/
├── backend/                 # Backend services (Python/FastAPI)
│   ├── api/                 # API definitions and endpoints
│   │   └── v1/              # API version 1
│   ├── auth/                # Authentication modules
│   ├── connectors/          # Data source connectors
│   ├── core/                # Core functionality (config, security, database)
│   ├── crud/                # Database CRUD operations
│   ├── middleware/          # Custom middleware
│   ├── models/              # Database models
│   ├── pipelines/           # Pipeline management
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic services
│   ├── transformations/     # Data transformation logic
│   ├── users/               # User management
│   └── utils/               # Utility functions
├── frontend/                # Frontend application with enhanced UI theme (Next.js)
│   ├── src/
│   │   ├── app/             # Next.js 15+ app directory structure
│   │   │   ├── analytics/   # Analytics dashboard page
│   │   │   ├── auth/        # Authentication pages
│   │   │   │   ├── login/   # Login page
│   │   │   │   └── register/# Registration page
│   │   │   ├── connectors/  # Connectors management page
│   │   │   ├── dashboard/   # Main dashboard page
│   │   │   ├── docs/        # Documentation page
│   │   │   ├── monitoring/  # Monitoring dashboard page
│   │   │   ├── pipelines/   # Pipeline management page
│   │   │   ├── settings/    # Settings page
│   │   │   ├── transformations/ # Transformations page
│   │   │   └── users/       # User management page
│   │   ├── components/      # React components
│   │   │   ├── charts/      # Chart components
│   │   │   ├── forms/       # Form components
│   │   │   ├── layout/      # Layout components (header, sidebar, etc.)
│   │   │   └── ui/          # UI components (buttons, cards, inputs)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and API client
│   │   ├── stores/          # State management (Zustand stores)
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Helper utilities
│   ├── public/              # Static assets
│   ├── Dockerfile           # Frontend Docker configuration
│   ├── next.config.js       # Next.js configuration
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── tsconfig.json        # TypeScript configuration
├── terraform/               # Infrastructure as Code (AWS)
├── monitoring/              # Monitoring stack (Prometheus, Grafana)
├── docs/                    # Documentation
├── theme/                   # UI theme files
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Docker services configuration
├── Dockerfile               # Backend Dockerfile
└── pyproject.toml           # Backend dependencies and configuration
```

## Prerequisites

- Docker and Docker Compose
- Python 3.10+
- Node.js 18+ (for frontend development)
- Poetry (for backend dependency management)
- AWS CLI (for deployment)

## Getting Started

### 1. Environment Setup

First, make sure you have Docker installed and running. Then, create a `.env` file in the root of the project:

```bash
cp .env.example .env
# Edit .env with your specific configuration
```

### 2. Running with Docker Compose

The easiest way to get started is using Docker Compose:

```bash
# Start all services (including database, Redis, Kafka, etc.)
docker-compose up -d

# View logs
docker-compose logs -f

# Access the services:
# - Frontend (with enhanced UI): http://localhost:3000
# - Backend API: http://localhost:8001
# - Adminer (DB UI): http://localhost:8080
```

### 3. Backend Development Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Run migrations
alembic upgrade head

# Start the development server
python -m uvicorn main:app --reload
```

### 4. Frontend Development Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development

### Backend Development

The backend is built with FastAPI and follows a modular architecture:

1. **API Layer**: Defined in `backend/api/v1/endpoints/`
2. **Core Logic**: In `backend/core/` (config, security, database)
3. **Database Operations**: In `backend/crud/` (CRUD operations)
4. **Schemas**: In `backend/schemas/` (Pydantic models)
5. **Models**: In `backend/models/` (SQLAlchemy models)

### Frontend Development

The frontend follows Next.js 15+ app directory structure with modern React patterns:

1. **Pages**: In `frontend/src/app/` using Next.js App Router
2. **Components**: In `frontend/src/components/` organized by functionality
   - `ui/` - Reusable UI components (buttons, cards, inputs)
   - `layout/` - Layout components (header, sidebar, navigation)
   - `forms/` - Form-specific components
   - `charts/` - Data visualization components
3. **API Client**: In `frontend/src/lib/api.ts` with TypeScript
4. **State Management**: In `frontend/src/stores/` using Zustand
5. **Types**: In `frontend/src/types/` for TypeScript definitions
6. **Hooks**: In `frontend/src/hooks/` for custom React hooks
7. **Styling**:
   - Global styles in `frontend/src/app/globals.css`
   - Tailwind configuration in `frontend/tailwind.config.js`
8. **Utils**: In `frontend/src/utils/` for helper functions

## Deployment

### Infrastructure Setup with Terraform

The infrastructure is defined in the `terraform/` directory and provisions:

- VPC with public and private subnets
- ECS cluster for running containers
- Application Load Balancer
- RDS PostgreSQL database
- ElastiCache Redis cluster
- MSK (Managed Kafka)
- ECR repositories for Docker images

To deploy infrastructure:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### CI/CD Pipeline

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml` and includes:

1. Backend and frontend testing
2. Docker image building and pushing to ECR
3. ECS service deployment
4. Health checks and rollback capabilities

### Manual Deployment to ECS

For manual deployment, you can build and push Docker images to ECR:

```bash
# Build and tag backend image
docker build -t dataaggregator-backend:latest .
docker tag dataaggregator-backend:latest <your-ecr-repo>/dataaggregator-backend:latest
docker push <your-ecr-repo>/dataaggregator-backend:latest

# Build and tag frontend image
cd frontend
docker build -t dataaggregator-frontend:latest .
docker tag dataaggregator-frontend:latest <your-ecr-repo>/dataaggregator-frontend:latest
docker push <your-ecr-repo>/dataaggregator-frontend:latest

# Update ECS services with new images
aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
```

## Monitoring

The platform includes a comprehensive monitoring stack:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **cAdvisor**: Container metrics
- **Node Exporter**: System metrics

To run the monitoring stack:

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana at http://localhost:3000 (admin/admin)
```

The default dashboard includes panels for:
- Pipeline execution status
- API request rates
- Container resource usage
- System resource usage

## Testing

### Backend Testing

```bash
# Run all backend tests
cd backend
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=.

# Run specific test file
poetry run pytest tests/test_pipelines.py
```

### Frontend Testing

```bash
# Run frontend tests
cd frontend
npm run test
npm run test:watch

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## API Documentation

The backend API includes automatic documentation via FastAPI:

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Features

### Data Source Connectivity
- REST API data sources with various authentication methods
- Database connectivity (MySQL, PostgreSQL, SQL Server, Oracle, MongoDB)
- File-based data sources (CSV, JSON, XML, Excel)
- SaaS platform integrations (Salesforce, HubSpot, etc.)

### Data Processing & Transformation
- Schema mapping and normalization
- Data validation and cleansing
- Data transformation engine
- Data deduplication

### Data Storage & Management
- Multiple destination support (Snowflake, BigQuery, Redshift, various databases)
- Data versioning and historical access
- Data retention policies

### Scheduling & Orchestration
- Visual workflow builder
- Cron-based scheduling
- Event-driven triggers
- Error handling and retry mechanisms

### Security
- OAuth 2.0 with JWT tokens
- Role-based access control (RBAC)
- End-to-end encryption for data in transit and at rest
- API rate limiting and authentication

### User Interface
- Intuitive configuration interface
- Visual data mapping tools
- Transformation rule builder
- Real-time monitoring dashboard
- User management interface

### Current Implementation Status (As of October 9, 2025)
- **Core Features**: 9/9 (100%) complete
- **Backend APIs**: **179 endpoints** across **23 service routers** - fully functional
- **Backend Services**: **26 services** fully operational
- **Frontend Pages**: **16 pages** (11 core pages + 5 advanced features) - 60% complete
  - Core pages: Auth, Dashboard, Pipelines, Connectors, Analytics, Monitoring, Transformations, Users, Settings, Docs, Connector Config
  - Advanced pages: Search, File Management, Preferences, Dashboard Customization, Live Monitoring
- **Pipeline Execution Engine**: Fully functional
- **Role-Based Access Control**: Complete
- **Enhanced Authentication**: Complete (JWT, password reset, email verification, refresh tokens)
- **Estimated Production Date**: **January 2026** (12 weeks remaining)

### Platform Capabilities
- Full-stack CRUD operations for pipelines, transformations, users, and connectors
- Complete UI suite with 11 pages fully functional and integrated
- Advanced authentication system with password reset and email verification
- Pipeline execution engine with status tracking
- Session management and automatic timeout handling
- Comprehensive testing infrastructure (unit and integration tests)

---

## Product Vision & Mission

### Vision Statement
To become the premier solution for collecting, processing, and transforming data from multiple sources into unified, standardized formats, enabling organizations to make data-driven decisions by simplifying complex data integration challenges.

### Mission Statement
Enable organizations to focus on data insights rather than data integration challenges by providing a reliable, scalable, and intuitive platform that connects, processes, and delivers data from multiple sources in a standardized format.

---

*For more detailed documentation, see the [docs](/docs/) directory.*