'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  BookOpen,
  Code,
  Database,
  GitBranch,
  ExternalLink,
  Search,
  Copy
} from 'lucide-react';

const documentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn how to set up and start using the Data Aggregator Platform',
    content: `## Getting Started with Data Aggregator Platform

The Data Aggregator Platform is a comprehensive solution for connecting, processing, and delivering data from multiple sources in a standardized format.

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.10+ (for backend development)
- Poetry (for backend dependency management)

### Quick Start
1. Clone the repository
2. Copy .env.example to .env and update configurations
3. Run with Docker Compose:
   \`\`\`
   docker-compose up -d
   \`\`\`

The services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Adminer (DB UI): http://localhost:8080`
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: Code,
    description: 'Complete API documentation and endpoints reference',
    content: `## API Reference

All API endpoints follow the REST architectural style and return JSON responses.

Base URL: http://localhost:8001/api/v1

### Authentication

Most endpoints require a valid JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-token-here>
\`\`\`

### Available Endpoints

#### Pipelines
- GET /pipelines - Get all pipelines
- POST /pipelines - Create a new pipeline
- GET /pipelines/{id} - Get a specific pipeline
- PUT /pipelines/{id} - Update a pipeline
- DELETE /pipelines/{id} - Delete a pipeline

#### Connectors
- GET /connectors - Get all connectors
- POST /connectors - Create a new connector
- GET /connectors/{id} - Get a specific connector
- PUT /connectors/{id} - Update a connector
- DELETE /connectors/{id} - Delete a connector

#### Transformations
- GET /transformations - Get all transformations
- POST /transformations - Create a new transformation
- GET /transformations/{id} - Get a specific transformation
- PUT /transformations/{id} - Update a transformation
- DELETE /transformations/{id} - Delete a transformation

#### Users
- GET /users/me - Get current user information
- GET /users/{id} - Get a specific user
- PUT /users/{id} - Update a user
- DELETE /users/{id} - Delete a user

### Authentication
- POST /auth/login - Authenticate and get JWT token`
  },
  {
    id: 'pipelines',
    title: 'Pipelines',
    icon: GitBranch,
    description: 'Learn how to create and manage data pipelines',
    content: `## Pipelines Documentation

Pipelines are the core of the Data Aggregator Platform. They define how data flows from source to destination with optional transformations.

### Creating a Pipeline

To create a pipeline:

1. Navigate to the Pipelines page
2. Click "New Pipeline"
3. Configure the source connection
4. Configure the destination
5. Define any transformations
6. Set the schedule (optional)
7. Save the pipeline

### Pipeline Configuration

A pipeline consists of:

- **Source Configuration**: Connection details for the data source (database, API, file, etc.)
- **Destination Configuration**: Where to send the processed data
- **Transformation Configuration**: How to transform the data (optional)
- **Schedule**: When and how often to run (optional)
- **Status**: Whether the pipeline is active or paused

### Monitoring Pipelines

Monitor your pipelines on the Monitoring page to track performance, success rates, and troubleshoot any issues.`
  },
  {
    id: 'connectors',
    title: 'Connectors',
    icon: Database,
    description: 'Setting up and managing data connectors',
    content: `## Connectors Documentation

Connectors provide the connection to various data sources including databases, APIs, and file systems.

### Available Connectors

- **Database Connectors**: PostgreSQL, MySQL, SQL Server, Oracle, MongoDB
- **API Connectors**: REST APIs, GraphQL APIs with various authentication methods
- **File Connectors**: CSV, JSON, XML, Excel files from local storage or cloud storage
- **Cloud Storage**: AWS S3, Google Cloud Storage, Azure Blob Storage
- **SaaS Integrations**: Salesforce, HubSpot, and other popular platforms

### Creating a Connector

1. Navigate to the Connectors page
2. Click "New Connector"
3. Select the connector type
4. Configure the connection parameters
5. Test the connection
6. Save the connector

### Connector Security

All connector credentials are encrypted at rest. Connection pooling and optimization is handled automatically.`
  }
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState(documentationSections[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Optionally show a notification
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
            <p className="mt-2 text-gray-600">
              Learn how to use the Data Aggregator Platform effectively
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
                  Contents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 text-sm"
                  />
                </div>
                
                <nav className="space-y-1">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeSection.id === section.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {section.title}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Documentation Content */}
          <div className="lg:w-3/4">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{activeSection.title}</h1>
                  <p className="text-gray-600 mb-6">{activeSection.description}</p>
                  
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: activeSection.content
                        .replace(/\n/g, '<br />')
                        .replace(/## (.+)/g, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
                        .replace(/### (.+)/g, '<h3 class="text-lg font-semibold text-gray-800 mt-5 mb-2">$1</h3>')
                        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span>Need more help? Check out our </span>
                      <a href="/docs" className="ml-1 text-primary-600 hover:underline">
                        documentation
                      </a>
                      <span className="mx-2">•</span>
                      <a href="http://localhost:8001/docs" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                        API documentation (Swagger)
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
