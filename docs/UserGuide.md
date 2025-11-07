# Data Aggregator Platform - User Guide

**Version**: 2.0
**Date**: October 17, 2025
**Document Type**: User Guide
**Last Updated**: Complete UI/API Integration (Sprints 1-5)

> **📝 Update Note**: This user guide has been updated to reflect the complete implementation of all frontend features with Next.js 15.5.4, React 19.1.0, including visual pipeline builder, real-time monitoring, interactive analytics, and full backend API integration. All features described in this guide are now **PRODUCTION READY**.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
  - [2.1 Prerequisites](#21-prerequisites)
  - [2.2 System Requirements](#22-system-requirements)
  - [2.3 Quick Start](#23-quick-start)
  - [2.4 Try the built-in example (local/dev)](#24-try-the-built-in-example-localdev)
  - [2.5 Run the tutorial (detailed)](#25-run-the-tutorial-detailed)
  - [2.6 Example data and end-to-end loaders](#26-example-data-and-end-to-end-loaders)
3. [Installation and Deployment](#installation-and-deployment)
4. [Architecture Overview](#architecture-overview)
5. [Core Application Features](#core-application-features)
  - [5.1 Pipelines](#51-pipelines)
  - [5.2 Transformations](#52-transformations)
  - [5.3 Connectors](#53-connectors)
  - [5.4 Settings](#54-settings)
6. [User Interface Guide](#user-interface-guide)
7. [API Documentation](#api-documentation)
8. [Security Features](#security-features)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Getting Started Guide for New Users](#11-getting-started-guide-for-new-users)
  - [11.1 First Steps](#111-first-steps)
  - [11.2 Create Your First Connector](#112-create-your-first-connector)
  - [11.3 Create Your First Transformation](#113-create-your-first-transformation)
  - [11.4 Create Your First Pipeline](#114-create-your-first-pipeline)
  - [11.5 Best Practices for Beginners](#115-best-practices-for-beginners)
12. [FAQ](#12-faq)
  - [12.1 General Questions](#121-general-questions)
  - [12.2 Technical Questions](#122-technical-questions)
  - [12.3 Deployment Questions](#123-deployment-questions)

## 1. Introduction

### 1.1 Overview

The Data Aggregator Platform is a comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format. The platform provides real-time and batch processing capabilities with an intuitive user interface for configuration and management.

This platform addresses the complex challenges of data integration by providing:

- Seamless connectivity to multiple data sources
- Robust data transformation capabilities
- Scalable processing architecture
- Comprehensive monitoring and management tools

### 1.2 Target Users

- **Data Engineers**: For building reliable, efficient data pipelines with minimal maintenance overhead
- **Data Scientists**: For accessing clean, well-structured datasets for analysis and machine learning
- **Business Analysts**: For creating reports and dashboards using integrated data
- **IT Managers**: For maintaining secure, compliant, and cost-effective data infrastructure

### 1.3 Platform Capabilities

- **Data Source Connectivity**: Support for REST APIs, databases, file systems, and SaaS platforms
  - Industrial protocols (OPC-UA, Modbus, DNP3, IEC 61850) for energy and manufacturing
  - Real-time data streams with sub-second latency
  - Cloud storage integration (AWS S3, Google Cloud Storage, Azure Blob)
- **Data Processing & Transformation**: Schema mapping, data validation, cleansing, and transformation
  - Advanced time-series analytics for IoT and sensor data
  - Predictive analytics and machine learning model integration
  - Complex event processing for real-time decision-making
- **Data Storage & Management**: Multi-destination support with versioning and retention policies
  - Time-series optimized storage with partitioning
  - Data lake and data warehouse destinations
- **Scheduling & Orchestration**: Visual workflow builder with dependency management
  - Real-time event-driven triggers
  - High-frequency scheduling (sub-minute intervals)
- **Comprehensive UI**: Intuitive web interface for configuration, monitoring, and management
  - Real-time dashboards with WebSocket connectivity
  - Interactive visualizations and alerts
- **Security**: Role-based access control, encryption, and compliance with industry standards
  - Grid compliance monitoring (NERC, FERC regulations)
  - Audit trails for regulatory reporting

### 1.4 Industry Applications

The Data Aggregator Platform is designed to serve diverse industries with specialized requirements:

#### Renewable Energy Sector
- **Wind & Solar Farm Management**: Aggregate data from thousands of turbines, inverters, SCADA systems, and weather stations
- **Predictive Maintenance**: ML-based failure prediction for gearboxes, generators, and power electronics
- **Energy Trading Optimization**: Real-time forecasting and dispatch optimization for wholesale markets
- **Grid Compliance**: Automated monitoring of frequency response, voltage ride-through, and ancillary services
- **Performance Analytics**: Power curve analysis, degradation tracking, and loss attribution
- See detailed use case in [UseCases.md](UseCases.md#renewable-energy-farm-data-management)

#### Other Industries
- **E-commerce**: Multi-platform sales data integration and customer analytics
- **Financial Services**: Regulatory compliance reporting and risk management
- **Healthcare**: Patient data integration with HIPAA compliance
- **Manufacturing**: IoT sensor data processing and equipment monitoring
- **Telecommunications**: Network performance and customer experience analytics
- See additional use cases in [UseCases.md](UseCases.md)

## 2. Getting Started

### 2.1 Prerequisites

Before installing the Data Aggregator Platform, ensure you have the following prerequisites:

- **Docker and Docker Compose**: Version 20.10 or higher
- **Python 3.10+**: For backend development and runtime
- **Node.js 18+**: For frontend development (Next.js 15.5.4 requires Node 18+)
- **Poetry**: For backend dependency management
- **AWS CLI**: If deploying to AWS (for production)
- **Git**: Version control system

#### Additional Requirements for Advanced Features:
- **Redis**: Version 6.0+ (for WebSocket and caching)
- **PostgreSQL**: Version 13+ (with JSONB support for pipeline definitions)
- **TimescaleDB**: Optional, for enhanced time-series analytics

### 2.2 System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: Minimum 8GB (16GB recommended for production)
- **Storage**: 10GB available space minimum
- **CPU**: 4+ cores recommended for processing performance

### 2.3 Quick Start

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-organization/dataaggregator.git
   cd dataaggregator
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

3. **Start the platform using Docker Compose**:

   ```bash
   docker-compose up -d
   ```

4. **Access the services**:
   - Frontend (with enhanced UI): http://localhost:3000
   - Backend API: http://localhost:8001
   - Adminer (DB UI): http://localhost:8080

5. **Explore the API documentation**:
   - Swagger UI: http://localhost:8001/docs
   - ReDoc: http://localhost:8001/redoc

### 2.4 Try the built-in example (local/dev)

For a quick end-to-end demo with connectors and a pipeline:

1. Start the stack and wait for health:
  - `bash scripts/dev-up.sh`
2. Create connectors and a unification pipeline, then trigger a run:
  - `bash scripts/load-example.sh`
3. Read the walkthrough: `docs/tutorial/example-ecommerce.md`

Notes:
- In development, a convenient “Example Data” link may appear in the UI sidebar. This link is hidden in production builds and only available when running locally.

### 2.5 Run the tutorial (detailed)

Follow the end-to-end tutorial for the e-commerce example to understand connectors, transformations, and pipeline execution.

Prerequisites:

- Stack running locally (recommended: `bash scripts/dev-up.sh` which waits for backend health)
- Default local credentials: `admin` / `password`

Option A — CLI (fastest):

```bash
bash scripts/load-example.sh
```

What this does:

- Creates two file connectors that point to sample JSON under `uploads/examples/ecommerce/`
- Provisions a pipeline named "E-commerce Orders Unification (Example)"
- Triggers the pipeline once and writes `uploads/examples/ecommerce/unified_orders.json`

Option B — In-app (dev-only UI):

1. Sign in at <http://localhost:3000>
2. Open the "Example Data" page: <http://localhost:3000/example-data>
3. Click "Create example now" to provision connectors + pipeline and execute a run

Where to verify:

- Pipelines: open `/pipelines` and locate "E-commerce Orders Unification (Example)"; view execution history
- Files: open `/files` to preview `unified_orders.json`

For a narrative walkthrough and screenshots, see `docs/tutorial/example-ecommerce.md`.

### 2.6 Example data and end-to-end loaders

This repository includes a small example dataset and a loader script for quick demos.

Locations:

- Example sources: `uploads/examples/ecommerce/` (Shopify and WooCommerce sample orders)
- Unified output: `uploads/examples/ecommerce/unified_orders.json`
- Loader script: `scripts/load-example.sh`

What the loader creates:

- Connectors: two file connectors that read the sample JSON files
- Pipeline: "E-commerce Orders Unification (Example)" that merges and standardizes orders
- Execution: triggers one run and writes the unified output file

UI access (development only):

- A sidebar link "Example Data" is shown when running locally to provision the same example from the browser
- This link is controlled by an environment flag (e.g., `NEXT_PUBLIC_SHOW_EXAMPLE_DATA`) and is disabled/hidden in production

Tips:

- Re-run the loader to trigger additional executions; you can manage or remove resources from the UI if needed
- After running, explore the pipeline definition and connectors in the UI to learn the configuration structure

## 3. Installation and Deployment

### 3.1 Local Development Installation

#### 3.1.1 Backend Setup

1. **Navigate to the backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies** using Poetry:

   ```bash
   poetry install
   ```

3. **Activate the virtual environment**:

   ```bash
   poetry shell
   ```

4. **Run database migrations**:

   ```bash
   alembic upgrade head
   ```

5. **Start the development server**:

   ```bash
   python -m uvicorn main:app --reload
   ```

#### 3.1.2 Frontend Setup

1. **Navigate to the frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

### 3.2 Production Deployment

#### 3.2.1 Infrastructure Setup with Terraform

The Data Aggregator Platform includes Terraform configurations for cloud deployment on AWS:

1. **Navigate to the terraform directory**:

   ```bash
   cd terraform
   ```

2. **Initialize Terraform**:

   ```bash
   terraform init
   ```

3. **Plan the infrastructure**:

   ```bash
   terraform plan
   ```

4. **Apply the infrastructure**:

   ```bash
   terraform apply
   ```

This will provision:

- VPC with public and private subnets
- ECS cluster for running containers
- Application Load Balancer
- RDS PostgreSQL database
- ElastiCache Redis cluster
- MSK (Managed Kafka)
- ECR repositories for Docker images

#### 3.2.2 Manual Deployment to ECS

For manual deployment, build and push Docker images to ECR:

1. **Build and tag backend image**:

   ```bash
   docker build -t dataaggregator-backend:latest .
   docker tag dataaggregator-backend:latest <your-ecr-repo>/dataaggregator-backend:latest
   docker push <your-ecr-repo>/dataaggregator-backend:latest
   ```

2. **Build and tag frontend image**:

   ```bash
   cd frontend
   docker build -t dataaggregator-frontend:latest .
   docker tag dataaggregator-frontend:latest <your-ecr-repo>/dataaggregator-frontend:latest
   docker push <your-ecr-repo>/dataaggregator-frontend:latest
   ```

3. **Update ECS services**:

   ```bash
   aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
   ```

### 3.3 CI/CD Pipeline

The platform includes a complete CI/CD pipeline configured in `.github/workflows/ci-cd.yml`:

1. **Backend and frontend testing**
2. **Docker image building and pushing to ECR**
3. **ECS service deployment**
4. **Health checks and rollback capabilities**

## 4. Architecture Overview

### 4.1 System Architecture

The Data Aggregator Platform follows a cloud-native, microservices-based architecture that provides scalable, secure, and reliable data integration capabilities.

#### 4.1.1 Architecture Layers

**Presentation Layer**:
- User Interface Service: Web-based interface built with Next.js and Tailwind CSS
- API Gateway: Entry point for all external communications

**Application Layer**:
- Pipeline Management Service: Orchestrates data processing workflows
- Connector Service: Manages connections to data sources and destinations
- Transformation Engine: Processes and transforms data
- User Management Service: Handles user authentication and authorization

**Processing Layer**:
- Stream Processing Service: Handles real-time data streams
- Batch Processing Service: Handles bulk data operations
- Data Validation Service: Ensures data quality and consistency

**Integration Layer**:
- Event Bus: Centralized messaging system with Apache Kafka
- API Management Layer: Handles external integrations

**Data Layer**:
- Data Storage Service: Manages data persistence
- Metadata Repository: Stores schema, configuration, and lineage information
- Monitoring Database: Stores metrics and logs

### 4.2 Technology Stack

#### 4.2.1 Backend Technologies

**Current Implementation:**
- **Programming Languages**: Python 3.10+ with FastAPI for APIs, AsyncIO for async operations
- **Web Framework**: FastAPI with Pydantic for data validation
- **Databases**: PostgreSQL (primary), Redis (caching and sessions)
- **ORM**: SQLAlchemy with Alembic for migrations
- **Message Queue**: Apache Kafka for event processing
- **Task Scheduling**: Celery with Redis broker for background tasks
- **Authentication**: JWT with OAuth 2.0 support
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes for production scaling

**Enhanced for Advanced Features:**
- **Real-time Communication**: FastAPI WebSocket, Redis Pub/Sub for live updates
- **Event Streaming**: Redis Streams, Apache Kafka for event sourcing
- **Time-series Storage**: TimescaleDB or PostgreSQL with time partitions
- **Schema Management**: SQLAlchemy inspection, OpenAPI parsing for introspection
- **File Processing**: Aiofiles for async file operations, Apache Tika for metadata
- **Analytics Engine**: Pandas, NumPy for data processing and aggregation
- **Graph Processing**: NetworkX for pipeline graph management
- **Enhanced Logging**: Structlog for structured logging with correlation IDs
- **Metrics Collection**: Prometheus client for custom application metrics
- **Dynamic Configuration**: JSON Schema, Pydantic for configuration validation

#### 4.2.2 Frontend Technologies

**Current Implementation:**
- **Framework**: Next.js 15.5.4 with App Router and Server Components
- **React Version**: React 19.1.0 with modern React patterns
- **Styling**: Tailwind CSS 3.4.13 with enhanced design system and animations
- **UI Components**: Custom components with enhanced styling and accessibility
- **State Management**: Zustand 5.0.8 for client state management
- **Forms**: React Hook Form 7.63.0 with Zod 4.1.11 validation
- **Icons**: Lucide React 0.544.0 for consistent iconography
- **Charts**: Recharts 3.2.1 for data visualization

**Enhanced Features (Planned):**
- **Visual Pipeline Builder**: React Flow for drag-and-drop pipeline creation
- **Real-time Communication**: Socket.io-client for WebSocket connectivity
- **Advanced Data Tables**: TanStack Table for enhanced data management
- **Dynamic Forms**: Context-aware configuration interfaces
- **Schema Mapping**: Visual field mapping with drag-and-drop

### 4.3 Data Flow Architecture

1. **Ingestion Flow**: Data Sources → Connector Service → API Gateway → Stream Processing
2. **Processing Flow**: Kafka Queue → Stream Processing → Transformation → Data Validation → Destination
3. **Control Flow**: User Interface → API Gateway → Pipeline Service → Task Orchestrator

### 4.4 Planned Advanced Features

The Data Aggregator Platform is continuously evolving. The following advanced features are planned for implementation:

#### 4.4.1 Visual Pipeline Builder (Phase 2 - Months 7-8)
- **Drag-and-drop Interface**: Visual pipeline creation using React Flow
- **Node-based Design**: Pre-built nodes for data sources, transformations, and destinations
- **Real-time Validation**: Live pipeline validation and error detection
- **Template System**: Reusable pipeline templates for common use cases
- **Execution Visualization**: Real-time pipeline execution tracking

#### 4.4.2 Real-time Dashboard & Monitoring (Phase 2 - Months 5-6)
- **WebSocket Integration**: Live updates for pipeline status and metrics
- **Interactive Charts**: Real-time data visualization with Recharts
- **System Health Monitoring**: Live system resource and performance tracking
- **Alert Management**: Real-time notifications and alert escalation
- **Activity Feeds**: Live activity streams for user actions and system events

#### 4.4.3 Advanced Analytics & Reporting (Phase 3 - Months 9-10)
- **Time-series Analytics**: Historical performance and trend analysis
- **Custom Dashboard Builder**: User-configurable analytics dashboards
- **Data Export**: Advanced export capabilities (CSV, Excel, PDF)
- **Performance Metrics**: Detailed pipeline and system performance analytics
- **Predictive Analytics**: AI-powered performance predictions and recommendations

#### 4.4.4 Enhanced User Experience (Phase 4 - Months 11-12)
- **Dynamic Form Builder**: Context-aware configuration interfaces
- **Schema Mapping Interface**: Visual field mapping with drag-and-drop
- **Advanced Data Tables**: Sortable, filterable, and exportable data grids
- **Guided Tours**: Interactive onboarding and feature discovery
- **Advanced Search**: Global search with filters and saved searches

*Note: These features are currently in development. Check the latest release notes for availability.*

### 4.5 Current Feature Status

All planned features have been successfully implemented and are now production ready!

#### ✅ **Production Ready Features:**

**Core Platform Features:**
- **User Authentication & Management**: Complete JWT-based authentication with RBAC
- **Modern UI**: Responsive design with Tailwind CSS and enhanced styling
- **API Integration**: Comprehensive REST API with full CRUD operations
- **Full Backend Integration**: All pages connected to real backend APIs (no mock data)
- **Toast Notification System**: Immediate visual feedback for all user actions
- **Permission-Based Access Control**: Role-based UI restrictions throughout the platform

**Data Management:**
- **Pipeline Management**: Complete CRUD operations with execution and monitoring
- **Connector Management**: Support for database, API, file, and SaaS connectors
- **Transformation Management**: Advanced data transformation capabilities
- **File Management**: Upload, preview, download, and manage data files

**Visual Pipeline Builder:**
- **Drag-and-Drop Interface**: Visual pipeline creation using React Flow
- **Node-based Design**: Pre-built nodes for sources, transformations, and destinations
- **Real-time Validation**: Live pipeline validation and error detection
- **Dry-Run Testing**: Test pipelines with sample data before execution
- **Template System**: Pre-built pipeline templates for common use cases
- **Execution Visualization**: Real-time pipeline execution tracking and monitoring
- **Auto-Layout & Minimap**: Automatic node arrangement and navigation for large pipelines

**Real-time Dashboard & Monitoring:**
- **Live Updates**: Real-time data refresh for all metrics and status indicators
- **System Health Monitoring**: Live system resource and performance tracking
- **Pipeline Status**: Real-time pipeline execution status and progress
- **Alert Management**: Real-time notifications and alert display
- **Activity Feeds**: Live activity streams for system events

**Advanced Analytics & Reporting:**
- **Interactive Charts**: Data volume trends, pipeline performance charts with Recharts
- **Time-series Analytics**: Historical performance and trend analysis
- **Performance Metrics**: Detailed pipeline and system performance analytics
- **Top Performers**: Ranked pipelines by success rate and volume
- **Time Range Filters**: View analytics for 24h, 7d, 30d, 90d periods
- **Export Capabilities**: Export analytics data (UI ready)

**Enhanced User Experience:**
- **Dashboard Customization**: Drag-and-drop widget management with 6 widget types
- **Global Search**: Universal search across all entity types with filters
- **Saved Searches**: Save and reuse frequently used queries
- **Search History**: Track and reuse recent searches
- **Advanced Settings**: Profile, password, notifications, and security settings
- **Loading States**: Clear indicators for all async operations
- **Empty State Guidance**: Helpful messages when no data is available

#### 🎯 **Completion Status:**
- **Phase 1**: Charts & Tables ✅ Complete
- **Phase 2**: Pipeline Builder & Real-time Features ✅ Complete
- **Phase 3**: Advanced Analytics ✅ Complete
- **Phase 4**: Enhanced UX & Forms ✅ Complete
- **Sprints 1-5**: Full UI/API Integration ✅ Complete

#### 📅 **Release Information:**
- **Version**: 2.0
- **Release Date**: October 17, 2025
- **Status**: Production Ready
- **All Features**: Fully Functional with Backend Integration

## 5. Core Application Features

### 5.1 Pipelines

Pipelines are the core functionality of the Data Aggregator Platform, allowing you to define, schedule, and execute data workflows. A pipeline connects data sources to destinations through a series of transformations and processing steps, providing a complete data integration solution.

#### 5.1.1 Pipeline Definition

- **Source Configuration**: Define data source connections using connectors
- **Destination Configuration**: Specify where processed data should be stored
- **Transformation Rules**: Apply transformations to convert data to desired format
- **Schedule Settings**: Configure when and how often the pipeline should run
- **Error Handling**: Define retry logic and error notification settings
- **Data Validation**: Set up quality checks and validation rules
- **Data Lineage**: Track the origin and transformations of data as it flows through the pipeline
- **Monitoring & Alerts**: Configure notifications for pipeline status changes
- **Performance Metrics**: Track throughput, processing times, and resource utilization
- **Dependency Management**: Define relationships between multiple pipelines

#### 5.1.2 Creating Pipelines

A pipeline defines how data moves from source to destination with optional transformations. Here's how to create one:

1. Navigate to the "Pipelines" section in the UI
2. Click "Create Pipeline"
3. Configure source and destination connectors
4. Define transformation rules (optional)
5. Set scheduling options (cron expressions or event triggers)
6. Configure error handling and notification settings
7. Save and deploy the pipeline

**Detailed Example: E-commerce Data Pipeline**

Let's create a pipeline that aggregates sales data from multiple sources:

**Step 1: Define the source** - A REST API from an e-commerce platform
```json
{
  "source": {
    "connector_type": "REST API",
    "config": {
      "url": "https://api.ecommerce-platform.com/v1/orders",
      "auth_method": "API_KEY",
      "auth_params": {
        "api_key_header": "X-API-Key",
        "api_key_value": "your-api-key-here"
      },
      "pagination": {
        "type": "offset",
        "page_size": 100
      }
    }
  }
}
```

**Sample source data:**
```json
[
  {
    "order_id": "ORD-001",
    "customer_id": "CUST-123",
    "product_name": "wireless mouse",
    "quantity": 2,
    "price": 29.99,
    "order_date": "2025-01-15T10:30:00Z",
    "status": "completed",
    "customer_email": "john.doe@example.com"
  },
  {
    "order_id": "ORD-002",
    "customer_id": "CUST-456",
    "product_name": "mechanical keyboard",
    "quantity": 1,
    "price": 89.99,
    "order_date": "2025-01-15T11:45:00Z",
    "status": "pending",
    "customer_email": "jane.smith@example.com"
  },
  {
    "order_id": "ORD-003",
    "customer_id": "CUST-123",
    "product_name": "usb cable",
    "quantity": 3,
    "price": 9.99,
    "order_date": "2025-01-15T14:20:00Z",
    "status": "completed",
    "customer_email": "john.doe@example.com"
  }
]
```

**Step 2: Apply transformations** - Clean and standardize the data
- Convert all product names to title case
- Calculate total price (quantity × price)
- Filter out orders with status other than "completed"
- Add a "processed_timestamp" field
- Validate email format

**Transformation Rules Example:**
```json
{
  "transformations": [
    {
      "type": "field_mapping",
      "field_name": "product_name",
      "operation": "title_case"
    },
    {
      "type": "field_calculation",
      "field_name": "total_price",
      "operation": "multiply",
      "parameters": {
        "source_fields": ["quantity", "price"],
        "output_field": "total_price"
      }
    },
    {
      "type": "record_filter",
      "condition": {
        "field": "status",
        "operator": "equals",
        "value": "completed"
      }
    },
    {
      "type": "field_addition",
      "field_name": "processed_timestamp",
      "value": "current_timestamp"
    },
    {
      "type": "field_validation",
      "field_name": "customer_email",
      "validation_type": "email_format"
    }
  ]
}
```

**Step 3: Define the destination** - Store in a data warehouse (e.g., Snowflake)
```json
{
  "destination": {
    "connector_type": "Snowflake",
    "config": {
      "host": "your-account.snowflakecomputing.com",
      "database": "SALES_DB",
      "schema": "PROCESSED",
      "table": "daily_orders",
      "warehouse": "COMPUTE_WH"
    }
  }
}
```

**Final transformed data:**
```json
[
  {
    "order_id": "ORD-001",
    "customer_id": "CUST-123",
    "product_name": "Wireless Mouse",
    "quantity": 2,
    "unit_price": 29.99,
    "total_price": 59.98,
    "order_date": "2025-01-15T10:30:00Z",
    "status": "completed",
    "customer_email": "john.doe@example.com",
    "processed_timestamp": "2025-01-16T08:00:00Z"
  },
  {
    "order_id": "ORD-003",
    "customer_id": "CUST-123",
    "product_name": "Usb Cable",
    "quantity": 3,
    "unit_price": 9.99,
    "total_price": 29.97,
    "order_date": "2025-01-15T14:20:00Z",
    "status": "completed",
    "customer_email": "john.doe@example.com",
    "processed_timestamp": "2025-01-16T08:00:00Z"
  }
]
```

**Step 4: Schedule the pipeline** - Run it daily at 8:00 AM UTC
```json
{
  "schedule": {
    "type": "cron",
    "expression": "0 8 * * *",
    "timezone": "UTC"
  }
}
```

**Step 5: Set up error handling** - Retry failed records up to 3 times with exponential backoff
```json
{
  "error_handling": {
    "retry_policy": {
      "max_retries": 3,
      "backoff_multiplier": 2,
      "initial_delay_seconds": 1
    },
    "notifications": {
      "email": ["admin@example.com"],
      "webhook": "https://hooks.example.com/pipeline-alerts"
    }
  }
}
```

**Advanced Example: Renewable Energy Wind Turbine Monitoring Pipeline**

This example demonstrates a high-frequency, real-time pipeline for wind farm operations:

**Step 1: Define multiple real-time sources**
```json
{
  "sources": [
    {
      "name": "turbine_scada",
      "connector_type": "OPC_UA",
      "config": {
        "endpoint": "opc.tcp://windfarm-01.example.com:4840",
        "security_mode": "SignAndEncrypt",
        "nodes": [
          "ns=2;s=Turbine.PowerOutput",
          "ns=2;s=Turbine.RotorSpeed",
          "ns=2;s=Turbine.WindSpeed",
          "ns=2;s=Turbine.GearboxTemp"
        ],
        "sampling_interval": 1000
      }
    },
    {
      "name": "weather_api",
      "connector_type": "REST_API",
      "config": {
        "url": "https://api.weather.com/v1/forecasts",
        "refresh_interval": 900000
      }
    },
    {
      "name": "grid_operator",
      "connector_type": "API",
      "config": {
        "url": "https://api.grid-operator.com/v1/realtime",
        "auth_method": "oauth2",
        "refresh_interval": 5000
      }
    }
  ]
}
```

**Step 2: Real-time transformations and analytics**
```json
{
  "transformations": [
    {
      "type": "power_curve_analysis",
      "parameters": {
        "wind_speed_field": "WindSpeed",
        "power_output_field": "PowerOutput",
        "manufacturer_curve": "vestas_v150_4.2mw",
        "calculate_deviation": true
      }
    },
    {
      "type": "predictive_maintenance_scoring",
      "algorithm": "random_forest",
      "features": [
        "GearboxTemp",
        "VibrationLevel",
        "OilPressure",
        "OperatingHours"
      ],
      "output_field": "failure_probability",
      "model_path": "/models/gearbox_failure_v2.pkl"
    },
    {
      "type": "grid_compliance_check",
      "regulations": ["NERC_PRC-024-2", "FERC_Order_842"],
      "parameters": {
        "frequency_tolerance": 0.2,
        "voltage_tolerance": 0.1
      }
    },
    {
      "type": "energy_forecast",
      "horizon": "PT6H",
      "resolution": "PT15M",
      "algorithm": "gradient_boosting",
      "weather_integration": true
    }
  ]
}
```

**Step 3: Multiple destinations with different purposes**
```json
{
  "destinations": [
    {
      "name": "timescale_db",
      "connector_type": "TimescaleDB",
      "purpose": "time_series_storage",
      "config": {
        "table": "turbine_metrics",
        "hypertable": true,
        "retention_policy": "P90D"
      }
    },
    {
      "name": "real_time_dashboard",
      "connector_type": "WebSocket",
      "purpose": "live_monitoring",
      "config": {
        "channel": "operations_dashboard",
        "update_frequency": 1000
      }
    },
    {
      "name": "alert_system",
      "connector_type": "Kafka",
      "purpose": "event_streaming",
      "config": {
        "topic": "turbine_alerts",
        "filter": "failure_probability > 0.8 OR grid_violation = true"
      }
    },
    {
      "name": "data_warehouse",
      "connector_type": "Snowflake",
      "purpose": "analytics",
      "config": {
        "database": "RENEWABLE_ENERGY",
        "schema": "WIND_OPERATIONS",
        "table": "turbine_performance_daily",
        "aggregation_period": "P1D"
      }
    }
  ]
}
```

**Step 4: High-frequency scheduling**
```json
{
  "schedule": {
    "type": "real_time",
    "trigger": "data_arrival",
    "max_latency_ms": 1000,
    "batch_size": 100
  }
}
```

**Step 5: Advanced error handling and alerting**
```json
{
  "error_handling": {
    "retry_policy": {
      "max_retries": 3,
      "backoff_multiplier": 1.5,
      "initial_delay_seconds": 1
    },
    "dead_letter_queue": {
      "enabled": true,
      "storage": "s3://failed-records/turbine-data/"
    },
    "alerts": [
      {
        "condition": "failure_probability > 0.8",
        "severity": "high",
        "notify": ["maintenance_team@example.com"],
        "action": "create_work_order"
      },
      {
        "condition": "grid_compliance_violation = true",
        "severity": "critical",
        "notify": ["grid_operator@example.com", "operations_manager@example.com"],
        "action": "immediate_notification",
        "escalation_time_minutes": 5
      }
    ]
  }
}
```

**Business Impact:**
- **Real-time visibility**: Sub-second monitoring of 500+ wind turbines
- **Predictive maintenance**: 30% reduction in unplanned downtime
- **Grid compliance**: 100% automated monitoring with zero violations
- **Energy optimization**: 2-5% increase in annual energy production
- **Revenue improvement**: $1.5M annual benefit for 100 MW wind farm

#### 5.1.3 Pipeline Execution

- **Manual Execution**: Start a pipeline run immediately via the UI or API
- **Scheduled Execution**: Pipelines run automatically based on schedule
- **Event-Driven Execution**: Pipelines triggered by external events or data changes
- **Monitoring**: Real-time status tracking, execution logs, and performance metrics

**Execution Statuses Explained:**
- **Pending**: Pipeline is queued for execution
- **Running**: Pipeline is currently processing data
- **Success**: Pipeline completed successfully
- **Failed**: Pipeline encountered a critical error
- **Warning**: Pipeline completed but with non-critical issues
- **Cancelled**: Pipeline execution was manually cancelled
- **Paused**: Pipeline execution is temporarily paused
- **Retrying**: Pipeline is performing retry attempts after an error

#### 5.1.4 Pipeline Management

- **Status Tracking**: View pipeline execution status (Running, Success, Failed, etc.)
- **Execution History**: Access logs and results from previous runs
- **Performance Metrics**: Monitor throughput, processing times, and error rates
- **Editing**: Modify pipeline configuration without stopping active executions
- **Deletion**: Safely remove pipelines when no longer needed
- **Versioning**: Keep track of pipeline configuration changes over time
- **Cloning**: Create copies of existing pipelines as templates
- **Pause/Resume**: Temporarily stop or restart scheduled executions
- **Testing**: Run pipeline validation without saving to production
- **Rollback**: Revert pipeline to a previous working configuration

#### 5.1.5 Advanced Pipeline Features

- **Dependency Management**: Create pipelines that depend on other pipelines' completion
- **Parallel Processing**: Execute multiple transformations simultaneously for better performance
- **Incremental Loads**: Only process new or changed records since the last run
- **Data Validation**: Comprehensive validation checks during processing
- **Error Recovery**: Automatic retry mechanisms and dead letter queues for failed records
- **Monitoring**: Built-in dashboards to track pipeline performance and data quality
- **Data Profiling**: Automatic analysis of data patterns and quality metrics
- **Schema Evolution**: Automatic handling of source schema changes
- **Real-time Streaming**: Process data as it arrives rather than in batches
- **Event Triggers**: Execute pipelines based on external events or thresholds

#### 5.1.6 Visual Pipeline Builder ✨ **NEW**

The Visual Pipeline Builder provides an intuitive drag-and-drop interface for creating data pipelines without writing code. This feature is now fully integrated and production-ready.

**Location**: `/pipeline-builder`

**Key Features**:
- **Drag-and-Drop Canvas**: Create pipelines visually using React Flow
- **Node Palette**: Pre-built nodes for sources, transformations, and destinations
- **Real-time Validation**: Instant feedback on pipeline configuration errors
- **Dry-Run Testing**: Test pipelines with sample data before going live
- **Template Browser**: Access pre-built pipeline templates
- **Execution Panel**: Monitor real-time pipeline execution
- **Auto-Layout**: Automatically arrange nodes for better visualization
- **Minimap**: Navigate large, complex pipelines easily

**How to Use the Visual Pipeline Builder**:

**1. Create a Visual Pipeline**:
   - Navigate to `/pipeline-builder`
   - Drag nodes from the palette onto the canvas:
     - **Source Nodes**: Database, API, File
     - **Transformation Nodes**: Filter, Map, Sort, Aggregate
     - **Destination Nodes**: Database, File, Warehouse, API
   - Connect nodes by dragging from one node's output to another's input
   - Click any node to configure its properties in the right panel
   - Use "Validate Pipeline" to check for configuration errors
   - Click "Save Pipeline" and provide a name
   - See success toast notification

**2. Configure Nodes**:
   - Click on any node in the canvas
   - Configuration panel appears on the right side
   - Fill in required fields (highlighted in red if missing)
   - Use "Test Node" to validate individual node configuration
   - Click "Save" to apply changes

**3. Test Pipeline (Dry-Run)**:
   - Build your pipeline as described above
   - Click "Test Pipeline" button in the toolbar
   - View sample data flow through each node
   - Check execution time estimates
   - Fix any issues identified before deployment

**4. Execute Pipeline**:
   - Complete pipeline must be saved first
   - Click "Run Pipeline" button
   - Monitor execution progress in real-time via the execution panel
   - View logs and data flow visualization
   - Use "Cancel" button to stop execution if needed

**5. Load Pipeline Templates**:
   - Click "Browse Templates" button
   - View available templates organized by category:
     - Data Migration
     - Real-time Sync
     - Data Transformation
     - Aggregation & Analytics
   - Preview template structure and nodes
   - Click "Use Template" to load onto canvas
   - Customize template as needed and save

**Available Node Types**:

**Source Nodes**:
- **Database Source**: Connect to SQL/NoSQL databases
- **API Source**: Fetch data from REST APIs
- **File Source**: Read from local or cloud storage files
- **Stream Source**: Connect to real-time data streams

**Transformation Nodes**:
- **Filter**: Remove records based on conditions
- **Map**: Transform field values
- **Sort**: Order records by specified fields
- **Aggregate**: Group and summarize data
- **Join**: Combine data from multiple sources
- **Split**: Divide records into multiple streams

**Destination Nodes**:
- **Database Destination**: Write to SQL/NoSQL databases
- **File Destination**: Save to local or cloud storage
- **Warehouse Destination**: Load into data warehouses
- **API Destination**: Send data to external APIs

**Pipeline Validation**:

The builder performs real-time validation including:
- **Connection Validation**: Ensures all nodes are properly connected
- **Configuration Validation**: Checks required fields are filled
- **Type Compatibility**: Verifies data types match between connected nodes
- **Cycle Detection**: Prevents circular dependencies
- **Performance Warnings**: Alerts for potential bottlenecks

**Keyboard Shortcuts**:
- `Delete`: Remove selected node or connection
- `Ctrl+C / Cmd+C`: Copy selected nodes
- `Ctrl+V / Cmd+V`: Paste copied nodes
- `Ctrl+Z / Cmd+Z`: Undo last action
- `Ctrl+Shift+Z / Cmd+Shift+Z`: Redo
- `Ctrl+S / Cmd+S`: Save pipeline
- `Space`: Pan canvas (hold and drag)

**Permissions Required**:
- `pipelines.create` - Create visual pipelines
- `pipelines.edit` - Modify existing pipelines
- `pipelines.execute` - Run pipelines from the builder

### 5.2 Transformations

Transformations enable you to modify and standardize data as it moves through the pipeline. This section provides detailed explanations and examples of various transformation types.

#### 5.2.1 Transformation Types

- **Schema Mapping**: Map fields from source schema to destination schema
- **Data Cleansing**: Remove or correct invalid, incomplete, or inaccurate data
- **Data Validation**: Apply business rules to ensure data quality
- **Format Conversion**: Convert data between different formats (CSV, JSON, XML, etc.)
- **Data Enrichment**: Add additional data from external sources
- **Data Aggregation**: Combine multiple records or data points
- **Field Manipulation**: Modify individual field values (e.g., uppercase, lowercase, formatting)
- **Record Filtering**: Remove records that don't meet specific criteria
- **Record Splitting**: Divide complex records into multiple simpler records
- **Calculations**: Perform mathematical operations on field values

#### 5.2.2 Transformation Configuration

- **Visual Designer**: Drag-and-drop interface for creating transformations
- **Schema Preview**: View input and output schemas to verify transformations
- **Rule Builder**: Create complex transformation rules with conditional logic
- **Function Library**: Access built-in functions for common transformation operations
- **Custom Functions**: Write custom Python functions for complex transformations
- **Preview Mode**: Test transformations with sample data before applying to production
- **Dry Run**: Execute transformations without writing to destination
- **Transformation Chaining**: Apply multiple transformations in sequence

#### 5.2.3 Transformation Execution

- **Real-time Processing**: Transform data as it flows through the pipeline
- **Batch Processing**: Apply transformations to large datasets
- **Streaming**: Handle continuous data streams with stateful transformations
- **Validation**: Verify data quality before and after transformations

#### 5.2.4 Detailed Transformation Examples

**Example 1: Customer Data Standardization**

Input data with inconsistent formatting:
```json
[
  {
    "customer_id": 123,
    "name": "john doe",
    "email": "JOHN.DOE@EXAMPLE.COM",
    "phone": "123-456-7890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "signup_date": "2025-01-15T10:30:00Z"
  }
]
```

Transformation configuration:
```json
{
  "transformations": [
    {
      "type": "field_operation",
      "field_name": "name",
      "operation": "title_case"
    },
    {
      "type": "field_operation",
      "field_name": "email",
      "operation": "lowercase"
    },
    {
      "type": "field_operation",
      "field_name": "phone",
      "operation": "format",
      "parameters": {
        "pattern": "($1) $2-$3",
        "regex": "(\\d{3})-(\\d{3})-(\\d{4})"
      }
    },
    {
      "type": "field_addition",
      "field_name": "full_address",
      "operation": "concat",
      "parameters": {
        "source_fields": [
          "address.street",
          "address.city",
          "address.state",
          "address.zip"
        ],
        "separator": ", "
      }
    },
    {
      "type": "field_removal",
      "field_names": ["address"]
    },
    {
      "type": "field_validation",
      "field_name": "email",
      "validation_type": "email_format"
    }
  ]
}
```

Output after transformation:
```json
[
  {
    "customer_id": 123,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "(123) 456-7890",
    "full_address": "123 Main St, New York, NY, 10001",
    "signup_date": "2025-01-15T10:30:00Z"
  }
]
```

**Example 2: Financial Data Aggregation**

Input data with individual transactions:
```json
[
  {
    "transaction_id": "T001",
    "customer_id": "CUST-001",
    "product_category": "Electronics",
    "amount": 299.99,
    "date": "2025-01-15"
  },
  {
    "transaction_id": "T002",
    "customer_id": "CUST-001",
    "product_category": "Electronics",
    "amount": 99.99,
    "date": "2025-01-15"
  },
  {
    "transaction_id": "T003",
    "customer_id": "CUST-001",
    "product_category": "Clothing",
    "amount": 49.99,
    "date": "2025-01-15"
  }
]
```

Aggregation transformation:
```json
{
  "type": "aggregation",
  "group_by_fields": ["customer_id", "date"],
  "aggregated_fields": [
    {
      "input_field": "amount",
      "output_field": "total_amount",
      "operation": "sum"
    },
    {
      "input_field": "amount",
      "output_field": "avg_amount",
      "operation": "average"
    },
    {
      "input_field": "transaction_id",
      "output_field": "transaction_count",
      "operation": "count"
    }
  ],
  "include_details": false
}
```

Output after aggregation:
```json
[
  {
    "customer_id": "CUST-001",
    "date": "2025-01-15",
    "total_amount": 449.97,
    "avg_amount": 149.99,
    "transaction_count": 3
  }
]
```

**Example 3: Customer Enrichment with External Data**

Input customer data:
```json
[
  {
    "customer_id": "CUST-001",
    "email": "john.doe@example.com",
    "signup_date": "2025-01-15"
  }
]
```

External data from CRM system:
```json
[
  {
    "email": "john.doe@example.com",
    "crm_id": "CRM-12345",
    "customer_segment": "Premium",
    "last_purchase_date": "2025-01-10",
    "total_spent": 1250.75
  }
]
```

Join transformation:
```json
{
  "type": "join",
  "join_type": "left",
  "primary_key": "email",
  "foreign_key": "email",
  "join_source": "crm_system",
  "included_fields": [
    "crm_id",
    "customer_segment",
    "last_purchase_date",
    "total_spent"
  ]
}
```

Output after join:
```json
[
  {
    "customer_id": "CUST-001",
    "email": "john.doe@example.com",
    "signup_date": "2025-01-15",
    "crm_id": "CRM-12345",
    "customer_segment": "Premium",
    "last_purchase_date": "2025-01-10",
    "total_spent": 1250.75
  }
]
```

#### 5.2.5 Conditional Transformations

You can apply transformations conditionally based on field values:

```json
{
  "transformations": [
    {
      "type": "conditional",
      "condition": {
        "field": "customer_segment",
        "operator": "equals",
        "value": "VIP"
      },
      "then": [
        {
          "type": "field_addition",
          "field_name": "discount_rate",
          "value": 0.15
        }
      ],
      "else": [
        {
          "type": "field_addition",
          "field_name": "discount_rate",
          "value": 0.05
        }
      ]
    }
  ]
}
```

#### 5.2.6 Advanced Transformation Operations

- **Regular Expression Operations**: Apply regex patterns for complex text manipulation
- **Date/Time Operations**: Format, calculate, and manipulate date fields
- **JSON/XML Operations**: Extract, manipulate, and transform structured data
- **String Operations**: Concatenate, split, replace, and format text fields
- **Mathematical Operations**: Perform calculations across multiple fields
- **Lookup Operations**: Replace values based on lookup tables
- **Hashing Operations**: Apply cryptographic functions to sensitive fields for privacy

### 5.3 Connectors

Connectors provide the platform's ability to connect to various data sources and destinations.

#### 5.3.1 Connector Types

- **Database Connectors**: Connect to SQL and NoSQL databases (PostgreSQL, MySQL, MongoDB, etc.)
- **API Connectors**: Integrate with REST APIs and web services
- **File Connectors**: Read and write data from/to file systems and cloud storage
- **SaaS Connectors**: Pre-built connectors for popular SaaS platforms
- **Custom Connectors**: Build custom connectors for proprietary systems
- **Message Queue Connectors**: Connect to systems like Kafka, RabbitMQ, etc.
- **Streaming Connectors**: Handle real-time data streams
- **Email Connectors**: Integrate with email services for notifications

#### 5.3.2 Connector Configuration

- **Connection Parameters**: Define host, port, credentials, and other connection details
- **Authentication**: Support for various authentication methods (API keys, OAuth, basic auth, etc.)
- **Connection Pooling**: Optimize performance with connection pooling
- **Security**: Encrypt sensitive connection information
- **Testing**: Validate connections before saving configurations
- **Connection Monitoring**: Track connection health and performance
- **Retry Logic**: Automatic reconnect functionality on connection failures

#### 5.3.3 Connector Management

- **Add Connectors**: Create new connector configurations
- **Edit Connectors**: Update connection parameters and authentication
- **Delete Connectors**: Remove unused connector configurations
- **Test Connections**: Verify connector functionality
- **Connection Templates**: Save and reuse common connection configurations

#### 5.3.4 Supported Connectors

- **REST API**: HTTP-based API connections with various authentication methods
- **PostgreSQL**: Full-featured PostgreSQL database connector
- **MySQL**: MySQL database connector with connection pooling
- **MongoDB**: NoSQL database connector with flexible schema handling
- **AWS S3**: Cloud storage connector with multipart upload support
- **File Systems**: Local and network file system access
- **Oracle**: Enterprise Oracle database support
- **Microsoft SQL Server**: Full-featured SQL Server connector
- **Elasticsearch**: Search and analytics engine connector
- **Google BigQuery**: Cloud data warehouse connector
- **Snowflake**: Cloud data platform connector
- **Salesforce**: CRM platform connector
- **HubSpot**: Marketing and sales platform connector
- **Google Sheets**: Spreadsheet data connector
- **FTP/SFTP**: File transfer protocol connectors

#### 5.3.5 Connector Configuration Examples

**REST API Connector Example:**
```json
{
  "connector_type": "rest_api",
  "config": {
    "name": "E-commerce API",
    "url": "https://api.ecommerce-platform.com/v1",
    "auth_method": "bearer_token",
    "auth_params": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "connection_timeout": 30,
    "retry_attempts": 3,
    "rate_limit": 1000,
    "rate_limit_period": "minute"
  }
}
```

**Database Connector Example (PostgreSQL):**
```json
{
  "connector_type": "postgresql",
  "config": {
    "name": "Sales Database",
    "host": "sales-db.example.com",
    "port": 5432,
    "database": "sales_db",
    "username": "data_pipeline_user",
    "password": "secure_password",
    "ssl_mode": "require",
    "connection_pool_size": 10,
    "max_overflow": 20,
    "connect_timeout": 10,
    "schema": "public"
  }
}
```

**File System Connector Example (AWS S3):**
```json
{
  "connector_type": "aws_s3",
  "config": {
    "name": "Data Lake Bucket",
    "bucket_name": "company-data-lake",
    "aws_region": "us-west-2",
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "prefix": "raw-data/",
    "file_format": "json",
    "compression": "gzip",
    "signature_version": "s3v4"
  }
}
```

#### 5.3.6 Connector Security

- **Credential Encryption**: All sensitive credentials are encrypted at rest
- **Token Management**: Automatic token refresh for OAuth and other token-based systems
- **Network Security**: Support for SSL/TLS and VPN connections
- **IAM Integration**: AWS IAM roles and policies for cloud connectors
- **Certificate Management**: Support for client certificates and custom CA bundles
- **Access Logging**: Detailed logs of all connector access and operations

#### 5.3.7 Custom Connectors

For proprietary or unsupported systems, you can create custom connectors:

**Custom Connector Template:**
```python
from typing import Dict, Any, List
from abc import ABC, abstractmethod

class CustomConnector(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection = None
    
    @abstractmethod
    def connect(self):
        """Establish connection to the data source"""
        pass
    
    @abstractmethod
    def fetch_data(self) -> List[Dict[str, Any]]:
        """Fetch data from the source"""
        pass
    
    @abstractmethod
    def close(self):
        """Close the connection"""
        pass

# Example implementation for a custom API
class CustomAPIConnector(CustomConnector):
    def connect(self):
        import requests
        self.connection = requests.Session()
        # Set up authentication headers using config
        self.connection.headers.update({
            'Authorization': f'Bearer {self.config["api_key"]}',
            'Content-Type': 'application/json'
        })
    
    def fetch_data(self) -> List[Dict[str, Any]]:
        response = self.connection.get(self.config['endpoint'])
        response.raise_for_status()  # Raise an exception for bad responses
        return response.json()
    
    def close(self):
        if self.connection:
            self.connection.close()
```

**Registering the custom connector in the platform:**
```json
{
  "connector_type": "custom",
  "implementation": "path.to.custom_connector.CustomAPIConnector",
  "config": {
    "name": "Custom API",
    "endpoint": "https://api.custom-system.com/v1/data",
    "api_key": "your-api-key"
  }
}
```

### 5.4 Settings

The settings section allows you to manage system-wide configurations and user preferences.

#### 5.4.1 User Settings

- **Profile Management**: Update personal information and contact details
- **Password Management**: Change account password and enable two-factor authentication
- **Notification Preferences**: Configure email and in-app notifications
- **UI Preferences**: Customize interface appearance and behavior
- **API Keys**: Generate and manage personal API keys for programmatic access

#### 5.4.2 System Settings

- **Authentication**: Configure authentication methods (OAuth providers, LDAP, etc.)
- **Security**: Set security policies (password complexity, session timeout, etc.)
- **Email**: Configure email service for notifications and password reset
- **API Limits**: Set rate limits and quotas for API usage
- **Data Retention**: Configure data retention policies and cleanup schedules

#### 5.4.3 Environment Settings

- **Environment Configuration**: Manage settings for different environments (dev, staging, prod)
- **Feature Flags**: Enable or disable specific platform features
- **Backup Settings**: Configure automated backup schedules and retention
- **Monitoring Settings**: Configure logging level and monitoring metrics
- **Integration Settings**: Manage third-party integrations and webhooks

## 6. User Interface Guide ✨ **UPDATED**

All platform pages are now fully integrated with the backend API and include real-time updates, toast notifications, and comprehensive user feedback. This section describes the complete user interface with all production-ready features.

### 6.1 Dashboard (`/dashboard`)

The main dashboard provides a real-time overview of the platform's status with live data from the backend.

**Features**:
- **System Statistics Cards**: Real-time totals for pipelines, connectors, transformations, and records processed
- **Recent Activity Feed**: Live updates of pipeline executions and system events
- **System Health Indicators**: Real-time health status for all platform components
- **Quick Actions**: One-click access to common tasks (Create Pipeline, Add Connector, etc.)
- **Performance Overview**: Processing times, throughput, and success rates

**How to Use**:
1. Access the dashboard after login at `/dashboard`
2. View key metrics at a glance in the statistics cards
3. Monitor recent activity in the activity feed
4. Check system health indicators for any issues
5. Use quick action buttons to create new resources
6. Click on any metric card to drill down into detailed views

**Permissions Required**: `dashboard.view`

### 6.2 Pipeline Management (`/pipelines`)

Comprehensive pipeline management with full CRUD operations, execution controls, and real-time status updates.

#### 6.2.1 Pipeline List View

**Features**:
- View all pipelines with status, schedule, and last run information
- Real-time status indicators (Running, Success, Failed, etc.)
- Quick actions: Run, Edit, Delete for each pipeline
- Search and filter capabilities
- Toast notifications for all operations

**How to Use**:
1. Navigate to `/pipelines` to view all pipelines
2. Use the search box to find specific pipelines
3. Click column headers to sort by different criteria
4. Use filter dropdown to show pipelines by status
5. View pipeline details by clicking on the pipeline name

#### 6.2.2 Creating Pipelines

**How to Create a Pipeline**:
1. Navigate to `/pipelines`
2. Click "New Pipeline" button (top right)
3. Fill in the pipeline creation form:
   - **Name**: Unique pipeline identifier
   - **Description**: Optional pipeline description
   - **Source Connector**: Select from available connectors
   - **Destination Connector**: Select from available connectors
   - **Transformations**: Add optional transformations
   - **Schedule**: Configure cron expression or interval
   - **Error Handling**: Set retry policy and notifications
4. Click "Create Pipeline"
5. See success toast notification
6. Pipeline appears in the list

#### 6.2.3 Running Pipelines

**Manual Execution**:
1. Find your pipeline in the list
2. Click the "Run" button (play icon)
3. Confirm execution in the dialog
4. Monitor real-time status updates
5. View execution logs when complete

**Scheduled Execution**:
- Pipelines run automatically based on configured schedule
- View next scheduled run in pipeline details
- Pause/resume scheduling as needed

#### 6.2.4 Pipeline Monitoring

- **Real-time Status**: Live updates on pipeline execution state
- **Execution Logs**: Detailed logs for troubleshooting
- **Performance Metrics**: Throughput, processing times, error rates
- **Data Quality Metrics**: Validation results and data quality scores

**Permissions Required**:
- `pipelines.view` - View pipelines
- `pipelines.create` - Create new pipelines
- `pipelines.edit` - Modify existing pipelines
- `pipelines.delete` - Remove pipelines
- `pipelines.execute` - Run pipelines

### 6.3 Connector Management (`/connectors`, `/connectors/configure`)

Full connector lifecycle management with test capabilities and real-time status monitoring.

#### 6.3.1 Connector List View (`/connectors`)

**Features**:
- View all configured connectors
- Connection status indicators (Connected, Disconnected, Testing)
- Quick actions: Test, Edit, Delete
- Connector type badges
- Last test timestamp

**How to Use**:
1. Navigate to `/connectors`
2. View all configured connectors
3. Check connection status for each connector
4. Use quick actions to test, edit, or delete connectors
5. Search for specific connectors using the search box

#### 6.3.1 Adding Connectors

**How to Create a Connector**:
1. Navigate to `/connectors`
2. Click "New Connector" button
3. You'll be redirected to `/connectors/configure`
4. Select connector type:
   - **Database**: PostgreSQL, MySQL, MongoDB, Oracle, SQL Server
   - **API**: REST APIs with various auth methods
   - **File**: Local, FTP, SFTP, S3, Azure Blob, Google Cloud Storage
   - **SaaS**: Salesforce, HubSpot, Google Sheets
   - **Data Warehouse**: Snowflake, BigQuery, Redshift
5. Fill in connection parameters specific to the connector type
6. Click "Test Connection" to validate configuration
7. If test succeeds, click "Save Connector"
8. See success toast notification
9. Redirected back to connector list

#### 6.3.3 Testing Connectors

**Test Existing Connector**:
1. Find connector in the list
2. Click "Test" button
3. Wait for test results
4. Green checkmark = success, Red X = failure
5. View detailed error message if test fails
6. Fix configuration and test again

**Permissions Required**:
- `connectors.view` - View connectors
- `connectors.create` - Create new connectors
- `connectors.edit` - Modify existing connectors
- `connectors.delete` - Remove connectors
- `connectors.test` - Test connections

### 6.4 Transformation Management (`/transformations`)

Create, test, and manage data transformations with full backend integration.

#### 6.4.1 Transformation List View

**Features**:
- View all configured transformations
- Transformation type badges
- Status indicators (Active/Inactive)
- Records processed counter
- Quick actions: Run, Edit, Delete

**How to Use**:
1. Navigate to `/transformations`
2. View all transformations
3. Check transformation type and status
4. Use search to find specific transformations
5. Click transformation name for details

#### 6.4.2 Creating Transformations

**How to Create a Transformation**:
1. Navigate to `/transformations`
2. Click "New Transformation" button
3. Fill in transformation details:
   - **Name**: Unique transformation identifier
   - **Description**: Optional description
   - **Type**: Select transformation type (Filter, Map, Aggregate, etc.)
   - **Source Fields**: Define input schema
   - **Target Fields**: Define output schema
   - **Transformation Rules**: Configure transformation logic
4. Click "Test Transformation" to run with sample data
5. View transformation results
6. If satisfactory, click "Create Transformation"
7. See success toast notification

#### 6.4.3 Testing Transformations

**Test Transformation**:
1. Find transformation in the list
2. Click "Run" button (play icon)
3. Provide sample input data (JSON format)
4. Click "Run Test"
5. View transformed output
6. Check for errors or warnings
7. Adjust configuration if needed

**Permissions Required**:
- `transformations.view` - View transformations
- `transformations.create` - Create new transformations
- `transformations.edit` - Modify existing transformations
- `transformations.delete` - Remove transformations
- `transformations.execute` - Test transformations

### 6.5 Analytics Dashboard (`/analytics`)

Interactive analytics with real-time charts and comprehensive metrics.

**Features**:
- **Real-Time Metrics Cards**: Records processed, avg processing time, success rate, active pipelines
- **Data Volume Trends Chart**: Line chart showing records processed over time
- **Pipeline Performance Chart**: Bar chart comparing pipeline success rates
- **Top Performing Pipelines Table**: Ranked by success rate and volume
- **Time Range Selector**: View data for 24h, 7d, 30d, 90d periods
- **Export Capabilities**: Export analytics data (CSV, Excel, PDF)

**How to Use**:
1. Navigate to `/analytics`
2. View key metrics in the cards at the top
3. Analyze data volume trends in the line chart
4. Compare pipeline performance in the bar chart
5. Review top performers in the table
6. Change time range using dropdown (top right)
7. Click "Export" to download analytics data

**Permissions Required**: `analytics.view`

### 6.6 Monitoring (`/monitoring`, `/monitoring/live`, `/monitoring/performance`)

Real-time system monitoring with live updates and comprehensive health checks.

#### 6.6.1 Main Monitoring Dashboard (`/monitoring`)

**Features**:
- **Key Statistics**: Active pipelines, running pipelines, records processed, success rate
- **Pipeline Performance Section**: Recent pipeline execution metrics
- **Recent Alerts**: System alerts and warnings
- **System Health Indicators**: Database, API, cache, message queue status
- **Time Range Filter**: 1h, 24h, 7d, 30d views

**How to Use**:
1. Navigate to `/monitoring`
2. View key statistics cards
3. Review pipeline performance metrics
4. Check recent alerts for issues
5. Monitor system health indicators
6. Change time range for historical view

#### 6.6.2 Live Monitoring (`/monitoring/live`)

**Features**:
- Real-time pipeline execution visualization
- Live data flow monitoring
- Resource usage graphs (CPU, memory, network)
- Live alert feed
- Auto-refresh every few seconds

**How to Use**:
1. Navigate to `/monitoring/live`
2. Watch real-time pipeline executions
3. Monitor resource utilization
4. Respond to alerts as they appear

#### 6.6.3 Performance Monitoring (`/monitoring/performance`)

**Features**:
- Detailed performance metrics
- Resource utilization graphs
- Performance trends over time
- Bottleneck identification
- Export performance reports

**How to Use**:
1. Navigate to `/monitoring/performance`
2. View detailed performance metrics
3. Analyze resource utilization
4. Identify performance bottlenecks
5. Export reports for analysis

**Permissions Required**: `monitoring.view`

### 6.7 File Management (`/files`)

Upload, preview, download, and manage data files with support for multiple formats.

**Features**:
- **File Upload**: Drag-and-drop or browse to upload
- **File Preview**: View CSV, JSON, text, and image files
- **File Download**: Download any uploaded file
- **File Status**: Track upload/processing status
- **Search & Filter**: Find files by name or status
- **File Metadata**: View size, type, upload date

**How to Use**:

**Upload Files**:
1. Navigate to `/files`
2. Click "Upload Files" button
3. Drag files onto upload area OR click to browse
4. Supported formats: CSV, JSON, XLSX, TXT, XML
5. Max file size: 100 MB
6. Multiple files supported
7. Monitor upload progress
8. See success toast when complete

**Preview Files**:
1. Find file in the list
2. Click "Preview" button (eye icon)
3. View file contents in modal:
   - CSV/JSON: Table view (first 100 rows)
   - Text: Raw text content
   - Images: Full image display
4. Click X to close preview

**Download Files**:
1. Find file in the list
2. Click "Download" button
3. File downloads to your computer
4. See success toast

**Delete Files**:
1. Find file in the list
2. Click "Delete" button (trash icon)
3. Confirm deletion
4. File removed with toast confirmation

**Filter Files**:
1. Use search box to find files by name
2. Use status dropdown to filter:
   - All Files
   - Completed
   - Processing
   - Failed

**Permissions Required**:
- `files.view` - View file list
- `files.upload` - Upload new files
- `files.download` - Download files
- `files.delete` - Remove files

### 6.8 Dashboard Customization (`/dashboard/customize`)

Create and customize personal dashboards with drag-and-drop widget management.

**Features**:
- **Widget Library**: 6 pre-built widget types
- **Drag-and-Drop**: Arrange widgets visually
- **Widget Sizing**: Small, medium, large sizes
- **Layout Templates**: Save and load custom layouts
- **Widget Configuration**: Customize each widget
- **Auto-Save**: Layouts persist automatically

**How to Use**:

**Customize Dashboard**:
1. Navigate to `/dashboard/customize`
2. Enter dashboard name
3. Click "Add Widget" button
4. Select widget type:
   - **Bar Chart**: Display data as bars
   - **Line Chart**: Show trends over time
   - **Pie Chart**: Visualize proportions
   - **Metrics**: Key performance indicators
   - **Data Table**: Display tabular data
   - **Pipeline Status**: Monitor pipeline health
5. Drag widgets to rearrange
6. Click widget settings icon to configure
7. Click widget copy icon to duplicate
8. Click widget trash icon to remove
9. Click "Save Layout" when done
10. See success toast confirmation

**Use Templates**:
1. Click "Templates" button
2. View available layouts
3. Click "Load" on desired template
4. Customize as needed
5. Save with a new name

**Change Widget Size**:
1. Click settings icon on any widget
2. Size cycles through: Small → Medium → Large → Small
3. Changes apply immediately

**Permissions Required**: `dashboard.customize`

### 6.9 Global Search (`/search`)

Universal search across all entity types with advanced filtering and saved searches.

**Features**:
- **Universal Search**: Search across all entity types
- **Entity Filtering**: Filter by pipelines, connectors, transformations, users
- **Match Scores**: See relevance scores for results
- **Search History**: View recent searches
- **Saved Searches**: Save frequently used queries
- **Real-Time Results**: Instant search as you type

**How to Use**:

**Perform a Search**:
1. Navigate to `/search`
2. Enter search query in search box
3. Optionally select entity types to filter:
   - Pipelines
   - Connectors
   - Transformations
   - Users
4. Press Enter or click "Search"
5. View results with match scores
6. Click any result to view details

**Save a Search**:
1. Perform a search
2. Click bookmark icon (right of search box)
3. Enter name for saved search
4. Click "Save"
5. See success toast

**Use Saved Search**:
1. View "Saved Searches" panel (left sidebar)
2. Click on any saved search name
3. Search executes automatically
4. To delete: click X icon next to saved search

**View Search History**:
1. View "Recent Searches" panel (left sidebar)
2. Click any previous query to re-run
3. See result count from previous search

**Clear Filters**:
1. Click "Clear" button next to Filters
2. All entity type filters removed

**Permissions Required**: `search.view`

### 6.10 Settings (`/settings`)

Comprehensive user settings with profile, password, notifications, and security configuration.

**Features**:
- **Profile Management**: Update name, email, username
- **Password Change**: Secure password update with validation
- **Notification Preferences**: Email, push, pipeline alerts, connector alerts
- **Security Settings**: Two-factor auth, login alerts, session timeout
- **Timezone Configuration**: Set your timezone

**How to Use**:

**Update Profile** (Profile Tab):
1. Navigate to `/settings`
2. Click "Profile" tab (default)
3. Update fields:
   - First Name
   - Last Name
   - Username
   - Email
   - Timezone
4. Click "Save Profile"
5. See success toast

**Change Password** (Password Tab):
1. Click "Password" tab
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Use eye icons to show/hide passwords
6. Click "Update Password"
7. See success toast
8. Form clears automatically

**Configure Notifications** (Notifications Tab):
1. Click "Notifications" tab
2. Toggle switches for:
   - Email Notifications
   - Push Notifications
   - Pipeline Alerts
   - Connector Alerts
3. Click "Save Notification Settings"
4. See success toast

**Configure Security** (Security Tab):
1. Click "Security" tab
2. Toggle switches for:
   - Two-Factor Authentication
   - Login Alerts
3. Set Session Timeout dropdown:
   - 15 minutes
   - 30 minutes
   - 1 hour
   - 2 hours
   - Never
4. Click "Save Security Settings"
5. See success toast

**Permissions Required**: `settings.view`

### 6.11 User Management

#### 6.11.1 Role-Based Access Control

The platform implements three-tier role-based access control:

- **Admin**: Full access to all features and settings, including user management
- **Editor**: Can create and modify pipelines, connectors, and transformations
- **Viewer**: Read-only access to pipelines, dashboards, and analytics

**Permission-Based UI**:
- UI elements automatically hide/show based on user permissions
- Buttons for create/edit/delete operations only visible if user has required permissions
- Access denied screen shown when accessing unauthorized features

### 6.12 Toast Notifications & User Feedback System ✨ **NEW**

The platform now features a comprehensive toast notification system that provides immediate visual feedback for all user actions throughout the application.

#### 6.12.1 Toast Notification Types

**Success Notifications** (Green with checkmark icon):
- "Pipeline created successfully"
- "Connector tested successfully"
- "Settings saved successfully"
- "File uploaded successfully"
- "Transformation created successfully"
- "Search saved successfully"

**Error Notifications** (Red with X icon):
- "Failed to load pipelines"
- "Connection test failed"
- "Invalid configuration"
- "File upload failed"
- "Pipeline execution failed"
- "Authentication error"

**Warning Notifications** (Yellow with alert icon):
- "Please enter a search query"
- "No results found"
- "File upload in progress"
- "Pipeline already running"
- "Missing required fields"

**Info Notifications** (Blue with info icon):
- "Loading data..."
- "Processing request..."
- "Refreshing data..."

#### 6.12.2 Toast Behavior

**Display Characteristics**:
- Appear at top-right of screen
- Auto-dismiss after 5 seconds
- Click X to dismiss manually
- Multiple toasts stack vertically
- Color-coded by type (success, error, warning, info)
- Slide-in animation from right
- Fade-out animation when dismissed

**Toast Priority**:
- Critical errors shown first
- Multiple toasts from same action grouped
- Duplicate toasts prevented within 2 seconds

#### 6.12.3 Loading States

All pages implement consistent loading states for better user feedback:

**Full-Page Loading**:
- Centered spinner with "Loading..." message
- Displayed when initially loading page data
- Prevents interaction during load
- Replaced by content when data arrives

**Button Loading States**:
- Button shows "Saving..." or "Loading..." during async operations
- Button disabled during operation
- Prevents duplicate submissions
- Returns to normal state after completion

**Card/Section Loading**:
- Skeleton loaders for card content
- Shimmer animation effect
- Preserves layout during load
- Smooth transition to actual content

**Progress Indicators**:
- File upload: Progress bar with percentage
- Pipeline execution: Step-by-step progress
- Batch operations: Count of completed/total items

#### 6.12.4 Empty States

When no data is available, the platform provides helpful guidance:

**Empty Pipeline List**:
- Message: "No pipelines created yet"
- Guidance: "Get started by creating your first pipeline"
- Action: "Create Pipeline" button
- Icon: Pipeline illustration

**Empty Search Results**:
- Message: "No results found"
- Guidance: "Try adjusting your search query or filters"
- Suggestions: Check spelling, use different keywords, clear filters
- Action: "Clear Filters" button

**Empty Analytics**:
- Message: "No analytics data available yet"
- Guidance: "Run some pipelines to generate analytics"
- Action: Link to pipeline list or pipeline builder
- Icon: Chart illustration

**Empty File List**:
- Message: "No files uploaded yet"
- Guidance: "Upload your first data file to get started"
- Action: "Upload Files" button
- Icon: File upload illustration

#### 6.12.5 Error Handling

**Inline Form Validation**:
- Required fields highlighted in red when empty
- Validation messages appear below fields
- Real-time validation as user types
- Clear indication of what needs to be fixed

**API Error Messages**:
- User-friendly error messages (not technical jargon)
- Specific guidance on how to fix issues
- Option to retry failed operations
- Contact support link for persistent errors

**Network Error Handling**:
- "Unable to connect to server" message
- Automatic retry with exponential backoff
- Manual retry button
- Offline mode indicator

#### 6.12.6 Confirmation Dialogs

Critical actions require user confirmation:

**Delete Confirmation**:
- Modal dialog with warning message
- Shows what will be deleted
- Warning if item is in use (e.g., connector used in pipelines)
- "Cancel" and "Delete" buttons
- Delete button styled in red for emphasis

**Execution Confirmation**:
- Confirm before running pipelines
- Shows estimated cost/time if applicable
- Option to run in test mode
- "Cancel" and "Run" buttons

**Discard Changes Confirmation**:
- When leaving page with unsaved changes
- Shows which fields have changed
- Options: "Discard Changes", "Keep Editing", "Save & Exit"

#### 6.12.7 Keyboard Shortcuts

The platform supports keyboard shortcuts for common actions:

**Global Shortcuts**:
- `/` (forward slash): Focus global search
- `Ctrl/Cmd + S`: Save current form
- `Esc`: Close modals/dialogs
- `?`: Show help/keyboard shortcuts

**Page-Specific Shortcuts**:
- Pipeline Builder: See section 5.1.6 for complete list
- Search: `Enter` to search, `Ctrl/Cmd + K` to focus search

#### 6.12.8 Accessibility Features

**Screen Reader Support**:
- All toast notifications announced to screen readers
- ARIA labels on all interactive elements
- Proper heading hierarchy
- Alt text on all images and icons

**Keyboard Navigation**:
- Tab through all interactive elements
- Focus indicators on all focusable elements
- Skip to main content link
- Logical tab order

**Visual Accessibility**:
- High contrast mode support
- Colorblind-friendly color schemes
- Resizable text (up to 200%)
- Focus indicators with sufficient contrast

**Best Practices for Users**:
- Wait for loading indicators to complete before navigating away
- Read toast messages for important feedback
- Don't click buttons multiple times (causes duplicate actions)
- Use keyboard shortcuts to improve efficiency
- Pay attention to form validation messages

## 7. API Documentation

### 7.1 Authentication

All API endpoints require authentication using JWT tokens. To authenticate:

1. Make a POST request to `/auth/login` with credentials
2. Receive a JWT token in the response
3. Include the token in the Authorization header for subsequent requests: `Authorization: Bearer <token>`

### 7.2 Key Endpoints

#### 7.2.1 User Management

- `GET /users`: List all users
- `POST /users`: Create a new user
- `GET /users/{id}`: Get user details
- `PUT /users/{id}`: Update user information
- `DELETE /users/{id}`: Delete a user

#### 7.2.2 Pipeline Management

- `GET /pipelines`: List all pipelines
- `POST /pipelines`: Create a new pipeline
- `GET /pipelines/{id}`: Get pipeline details
- `PUT /pipelines/{id}`: Update pipeline configuration
- `DELETE /pipelines/{id}`: Delete a pipeline
- `POST /pipelines/{id}/execute`: Execute a pipeline
- `GET /pipelines/{id}/runs`: Get pipeline execution history

#### 7.2.3 Connector Management

- `GET /connectors`: List all connectors
- `POST /connectors`: Create a new connector
- `GET /connectors/{id}`: Get connector details
- `PUT /connectors/{id}`: Update connector configuration
- `DELETE /connectors/{id}`: Delete a connector

#### 7.2.4 Transformation Management

- `GET /transformations`: List all transformations
- `POST /transformations`: Create a new transformation
- `GET /transformations/{id}`: Get transformation details
- `PUT /transformations/{id}`: Update transformation
- `DELETE /transformations/{id}`: Delete a transformation

#### 7.2.5 Monitoring

- `GET /monitoring/pipeline-stats`: Get pipeline statistics
- `GET /monitoring/alerts`: Get system alerts
- `GET /monitoring/pipeline-performance`: Get performance metrics
- `GET /monitoring/system-health`: Get system health status

#### 7.2.6 Analytics

- `GET /analytics/data`: Get analytics data
- `GET /analytics/timeseries`: Get time-series analytics
- `GET /analytics/top-pipelines`: Get top performing pipelines
- `GET /analytics/pipeline-trends`: Get pipeline trends

### 7.3 Example API Request

```bash
# Get all pipelines
curl -X GET \
  http://localhost:8001/pipelines \
  -H 'Authorization: Bearer <your-jwt-token>' \
  -H 'Content-Type: application/json'
```

## 8. Security Features

### 8.1 Authentication & Authorization

The platform implements a comprehensive security model:

- **OAuth 2.0 with JWT tokens** for secure authentication
- **Role-based access control (RBAC)** with three levels:
  - Admin: Full system access
  - Editor: Pipeline creation and modification
  - Viewer: Read-only access
- **Secure session management** with refresh tokens and automatic expiration
- **Email verification and password reset** with secure token handling

### 8.2 Data Security

- **Encryption at rest** using AES-256
- **Encryption in transit** using TLS 1.3
- **Customer-managed encryption keys** support
- **Data anonymization and masking** capabilities
- **Compliance with GDPR, CCPA, and HIPAA** regulations

### 8.3 Network Security

- **Network segmentation and isolation**
- **VPN access for on-premises connectors**
- **DDoS protection** at network edge
- **API rate limiting and throttling**

### 8.4 Frontend Security

- **XSS prevention** with Next.js built-in protections
- **CSRF tokens** for state-changing operations
- **Secure cookie handling**
- **Content Security Policy (CSP)** headers

## 9. Monitoring and Maintenance

### 9.1 Platform Monitoring

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

### 9.2 Logging

- **Structured logging** with JSON format
- **Centralized log aggregation** (ELK Stack)
- **Log retention policies** (30 days standard, 7 years for audit)
- **Log-based alerting** for critical events

### 9.3 Backup & Recovery

- **Daily full backups** with incremental backups
- **Point-in-time recovery** capabilities
- **Cross-region backup replication**
- **Automated backup validation**

### 9.4 Performance Optimization

- **Caching layers** (Redis) for frequently accessed data
- **Connection pooling** for database connections
- **Asynchronous processing** for non-critical operations
- **Data compression** for efficient transmission

## 10. Troubleshooting

### 10.1 Common Issues

#### 10.1.1 Service Not Starting

If services fail to start:

1. Check the Docker logs: `docker-compose logs -f`
2. Verify that all environment variables are properly set
3. Ensure sufficient system resources (RAM, disk space)
4. Check service dependencies (database, Redis, etc.)

#### 10.1.2 Authentication Issues

If experiencing authentication problems:

1. Verify the JWT token is still valid
2. Check that the token is properly formatted in the Authorization header
3. Confirm user account status (active, verified)
4. Ensure the user has appropriate permissions for the requested resource

#### 10.1.3 Database Connection Issues

If unable to connect to the database:

1. Verify database service is running with `docker-compose ps`
2. Check database connection string in `.env`
3. Confirm database migrations have been applied: `alembic current`
4. Review database user credentials and permissions

### 10.2 Diagnostic Commands

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f

# Check backend API status
curl http://localhost:8001/health

# Check frontend connectivity
curl http://localhost:3000/api/health

# View backend logs specifically
docker-compose logs -f backend

# View frontend logs specifically
docker-compose logs -f frontend
```

## 11. Getting Started Guide for New Users

This section provides a step-by-step guide for new users to start using the Data Aggregator Platform effectively.

### 11.1 First Steps

1. **Sign In**: Use your credentials to log into the platform
2. **Verify Email**: Check your email for verification if required
3. **Set Up Profile**: Complete your profile information and security settings
4. **Explore the Dashboard**: Familiarize yourself with the main dashboard and navigation

### 11.2 Create Your First Connector

1. Navigate to the "Connectors" section
2. Click "Create Connector"
3. Select the connector type (e.g., PostgreSQL, REST API, etc.)
4. Fill in the connection parameters based on the examples above
5. Test the connection to ensure it works
6. Save the connector

### 11.3 Create Your First Transformation

1. Go to the "Transformations" section
2. Click "Create Transformation"
3. Define your input schema
4. Create transformation rules using the visual designer
5. Preview your transformation with sample data
6. Save and test the transformation

### 11.4 Create Your First Pipeline

1. Navigate to the "Pipelines" section
2. Click "Create Pipeline"
3. Select your source connector
4. Select your destination connector
5. Apply transformation rules if needed
6. Set up scheduling options
7. Configure error handling and notifications
8. Test the pipeline with a small dataset
9. Deploy the pipeline

### 11.5 Best Practices for Beginners

- **Start Simple**: Begin with simple, single-source pipelines
- **Test Frequently**: Use the preview and test functions extensively
- **Document**: Add descriptions to your connectors, transformations, and pipelines
- **Monitor**: Regularly check the execution logs and performance metrics
- **Iterate**: Start with basic transformations and gradually add complexity

## 12. FAQ

### 12.1 General Questions

**Q: What data sources are supported?**  
A: The platform supports REST APIs, various SQL and NoSQL databases, file-based sources (CSV, JSON, XML, Excel), and popular SaaS platforms like Salesforce and HubSpot.

**Q: How does the platform handle large volumes of data?**  
A: The platform is designed with horizontal scaling in mind, using Apache Kafka for message queuing, Apache Flink for stream processing, and Apache Spark for batch processing. It can handle up to 100,000 records per minute.

**Q: Is the platform suitable for real-time data processing?**  
A: Yes, the platform supports both real-time streaming and batch processing. Apache Kafka handles event streaming, while Flink processes real-time data streams with low latency.

### 12.2 Technical Questions

**Q: Can I customize the data transformations?**  
A: Yes, the platform provides a visual transformation builder and supports user-defined transformation functions with conditional logic.

**Q: How does the platform ensure data quality?**  
A: The platform includes built-in data quality rules, validation against configurable rules, automatic data cleansing capabilities, and configurable deduplication rules with fuzzy matching.

**Q: What security features are included?**  
A: The platform includes OAuth 2.0 with JWT tokens, role-based access control, encryption at rest and in transit, customer-managed encryption keys, and compliance with GDPR, CCPA, and HIPAA.

### 12.3 Deployment Questions

**Q: Can I deploy the platform on-premises?**  
A: Yes, the platform can be deployed on-premises using Docker Compose for development or Kubernetes with the provided manifests for production.

**Q: What cloud platforms are supported?**  
A: The platform provides Terraform configurations for AWS, but it's cloud-agnostic and can be deployed on any cloud platform that supports Docker and Kubernetes.

**Q: How do I upgrade to a newer version?**  
A: To upgrade:

1. Pull the latest code: `git pull`
2. Apply database migrations: `alembic upgrade head`
3. Build new Docker images: `docker-compose build`
4. Restart services: `docker-compose up -d`

---

*This user guide provides comprehensive information about the Data Aggregator Platform. For additional technical details, see the architecture documentation in the docs directory.*