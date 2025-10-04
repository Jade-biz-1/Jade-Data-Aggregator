# Data Aggregator Platform - User Guide

**Version**: 1.1
**Date**: October 2, 2025
**Document Type**: User Guide
**Last Updated**: Enhanced with latest architecture and implementation plan

> **📝 Update Note**: This user guide has been updated to reflect the current frontend implementation with Next.js 15.5.4, React 19.1.0, and planned advanced features including visual pipeline builder, real-time monitoring, and interactive analytics. See Section 4.5 for current feature availability.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
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
- **Data Processing & Transformation**: Schema mapping, data validation, cleansing, and transformation
- **Data Storage & Management**: Multi-destination support with versioning and retention policies
- **Scheduling & Orchestration**: Visual workflow builder with dependency management
- **Comprehensive UI**: Intuitive web interface for configuration, monitoring, and management
- **Security**: Role-based access control, encryption, and compliance with industry standards

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

To help users understand what's available now versus what's planned, here's the current implementation status:

#### ✅ **Currently Available Features:**
- **User Authentication & Management**: Complete JWT-based authentication with RBAC
- **Basic Dashboard**: Overview of pipelines, connectors, and system status
- **Pipeline Management**: CRUD operations for data pipelines
- **Connector Management**: Support for database, API, and file connectors
- **Transformation Management**: Basic data transformation capabilities
- **Analytics Dashboard**: Basic analytics with placeholder visualizations
- **Modern UI**: Responsive design with Tailwind CSS and enhanced styling
- **API Integration**: Comprehensive REST API with full CRUD operations

#### 🚧 **In Development (Advanced Features):**
- **Visual Pipeline Builder**: Drag-and-drop pipeline creation (Phase 2)
- **Real-time Dashboard**: Live updates via WebSocket (Phase 2)
- **Interactive Charts**: Real-time data visualization with Recharts (Phase 1)
- **Advanced Data Tables**: Enhanced table functionality (Phase 1)
- **Schema Mapping Interface**: Visual field mapping (Phase 4)
- **Dynamic Forms**: Context-aware configuration (Phase 4)
- **Advanced Analytics**: Time-series and predictive analytics (Phase 3)

#### 📋 **Implementation Timeline:**
- **Phase 1** (Next 2-3 months): Charts & Tables
- **Phase 2** (Months 5-8): Pipeline Builder & Real-time Features
- **Phase 3** (Months 9-10): Advanced Analytics
- **Phase 4** (Months 11-12): Enhanced UX & Forms

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

## 6. User Interface Guide

### 6.1 Dashboard

The main dashboard provides an overview of the platform's status:

- **System Statistics**: Total pipelines, connectors, transformations, and users
- **Recent Activity**: Latest pipeline executions and system events
- **Performance Metrics**: Processing times, throughput, and resource utilization
- **System Status**: Health indicators for all platform components

### 6.2 Pipeline Management

#### 6.2.1 Creating Pipelines

1. Navigate to the "Pipelines" section
2. Click "Create Pipeline"
3. Configure source and destination connectors
4. Define transformation rules
5. Set scheduling options
6. Save and deploy the pipeline

#### 6.2.2 Pipeline Monitoring

- View real-time execution status
- Access execution logs and error details
- Monitor performance metrics
- Review data quality metrics

### 6.3 Connector Management

#### 6.3.1 Adding Connectors

1. Go to the "Connectors" section
2. Select the connector type (REST API, Database, File, etc.)
3. Configure connection parameters
4. Test the connection
5. Save the connector configuration

### 6.4 Transformation Engine

#### 6.4.1 Creating Transformations

1. Navigate to the "Transformations" section
2. Click "Create Transformation"
3. Define input schema
4. Create transformation rules
5. Preview transformed data
6. Save the transformation

### 6.5 User Management

#### 6.5.1 Role-Based Access Control

- **Admin**: Full access to all features and settings
- **Editor**: Can create and modify pipelines, connectors, and transformations
- **Viewer**: Can only view pipeline status and metrics

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