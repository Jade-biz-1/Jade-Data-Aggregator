# Data Aggregator Platform

A comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Getting Started](#getting-started)
5. [Development](#development)
6. [Deployment](#deployment)
7. [Monitoring](#monitoring)
8. [Testing](#testing)

## Architecture Overview

The Data Aggregator Platform is designed as a cloud-native, microservices-based architecture that provides scalable, secure, and reliable data integration capabilities. The architecture supports both real-time and batch processing with a focus on extensibility, maintainability, and high availability.

### Key Components

- **Backend Services**: Python FastAPI microservices for API, authentication, data processing
- **Frontend**: Next.js application with Tailwind CSS (original UI)
- **Frontend2**: Next.js application with enhanced UI theme (Windster theme with Flowbite components)
- **Database**: PostgreSQL for primary data storage
- **Cache**: Redis for session and temporary data storage
- **Message Queue**: Apache Kafka for event streaming
- **Infrastructure**: Containerized with Docker and orchestrated with Kubernetes

## Project Structure

```
dataaggregator/
├── backend/                 # Backend services (Python/FastAPI)
│   ├── api/                 # API definitions
│   ├── core/                # Core functionality (config, security, database)
│   ├── crud/                # Database CRUD operations
│   ├── models/              # Database models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── frontend/                # Original frontend application (Next.js)
│   ├── app/                 # Next.js 13+ app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   ├── public/              # Static assets
│   └── styles/              # Global styles
├── frontend2/               # New frontend application with UI theme (Next.js)
│   ├── app/                 # Next.js 13+ app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   ├── public/              # Static assets
│   └── styles/              # Global styles
├── terraform/               # Infrastructure as Code (AWS)
├── monitoring/              # Monitoring stack (Prometheus, Grafana)
├── docs/                    # Documentation
├── theme/                   # UI theme files
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Docker services
├── Dockerfile               # Backend Dockerfile
├── frontend/Dockerfile      # Frontend Dockerfile
├── frontend2/Dockerfile     # Frontend2 Dockerfile
└── pyproject.toml           # Backend dependencies
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
# - Frontend: http://localhost:3000
# - Frontend2 (with UI theme): http://localhost:3001
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

The frontend follows Next.js app directory structure:

1. **Pages**: In `frontend/app/`
2. **Components**: In `frontend/components/`
3. **API Calls**: In `frontend/lib/api.ts`
4. **Global Styles**: In `frontend/app/globals.css`

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

## Services

The platform consists of multiple services:

1. **Authentication Service**: Handles user authentication and authorization
2. **Pipeline Management Service**: Orchestrates data processing workflows
3. **Connector Service**: Manages connections to data sources and destinations
4. **Transformation Engine**: Processes and transforms data
5. **User Management Service**: Handles user profiles and permissions

## Security

- OAuth 2.0 with JWT tokens
- Role-based access control (RBAC)
- End-to-end encryption for data in transit and at rest
- Regular security scanning in CI/CD pipeline
- API rate limiting and authentication