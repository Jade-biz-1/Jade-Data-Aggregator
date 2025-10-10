# Architecture Diagrams

This document provides a visual overview of the Data Aggregator Platform's architecture.

## 1. High-Level System Architecture

This diagram illustrates the overall structure of the platform, showing the main components and their interactions.

```mermaid
graph TD
    subgraph User["User"]
        A["User's Browser"]
    end

    subgraph CloudInfra["Cloud Infrastructure (AWS/GCP/Azure)"]
        B[Load Balancer]
        C[Frontend Next.js]
        D[Backend FastAPI]
        E[Database PostgreSQL]
        F[Cache Redis]
        G[Message Queue Kafka]
    end

    subgraph External["External Systems"]
        H[Data Sources APIs DBs]
        I[Data Destinations Warehouses]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
```

## 2. Backend Microservices Architecture

This diagram shows the internal components of the backend, as described in the architecture document.

```mermaid
graph TD
    subgraph API["API Gateway"]
        A[API Gateway]
    end

    subgraph App["Application Layer"]
        B[Pipeline Management Service]
        C[Connector Service]
        D[Transformation Engine]
        E[User Management Service]
    end

    subgraph Process["Processing Layer"]
        F[Stream Processing Real-time]
        G[Batch Processing]
    end

    subgraph Integ["Integration Layer"]
        H[Event Bus Kafka]
    end

    subgraph Data["Data Layer"]
        I[PostgreSQL Database]
        J[Redis Cache]
    end

    A --> B
    A --> C
    A --> D
    A --> E

    B --> H
    C --> H
    D --> H

    F --> H
    G --> H

    B --> I
    C --> I
    D --> I
    E --> I
    D --> J
```

## 3. Logical Cloud Deployment Architecture

This diagram provides a logical view of how the services are deployed in a cloud environment like AWS, GCP, or Azure.

```mermaid
graph TD
    subgraph VPC ["VPC/VNet"]
        subgraph Public ["Public Subnet"]
            A[Load Balancer]
        end

        subgraph Private ["Private Subnet"]
            B[Frontend Container Cloud Run ECS]
            C[Backend Container Cloud Run ECS]
            D[Managed Database RDS Cloud SQL]
            E[Managed Cache ElastiCache Memorystore]
            F[Managed Messaging MSK Pub/Sub]
        end
    end

    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
```

## 4. Data Pipeline Flow

This sequence diagram illustrates the flow of data through a typical pipeline.

```mermaid
sequenceDiagram
    participant Source
    participant ConnectorService as Connector Service
    participant PipelineEngine as Pipeline Engine
    participant TransformationEngine as Transformation Engine
    participant Destination

    Source->>+ConnectorService: Data Ingestion
    ConnectorService->>+PipelineEngine: Raw Data
    PipelineEngine->>+TransformationEngine: Data for Transformation
    TransformationEngine-->>-PipelineEngine: Transformed Data
    PipelineEngine->>+ConnectorService: Processed Data
    ConnectorService->>+Destination: Load Data
```