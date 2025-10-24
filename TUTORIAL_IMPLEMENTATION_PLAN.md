# Tutorial Application - Implementation Plan
**Data Aggregator Platform Interactive Learning Experience**

**Version:** 1.0
**Date:** October 24, 2025
**Status:** Ready to Implement

---

## 📋 Executive Summary

This document provides a step-by-step implementation guide for building the interactive tutorial application as specified in `TUTORIAL_APP_SPECIFICATION.md`.

**Key Points:**
- **Timeline**: 10 weeks (phased approach)
- **Team**: 1 full-stack developer (with optional support)
- **Technology**: Next.js 14+, React 18+, Tailwind CSS
- **Location**: `/tutorial` folder (standalone app)
- **Dependencies**: None on main application (API-only integration)

---

## 🎯 Quick Start Summary

### What We're Building

A standalone interactive tutorial web application that teaches users how to use the Data Aggregator Platform through:
- **6 Progressive Modules**: From basics to advanced scenarios
- **Hands-on Exercises**: Real API interactions with validation
- **4 Real-World Scenarios**: E-commerce, IoT, Financial, Customer 360
- **Interactive Playground**: Sandbox environment for experimentation
- **Progress Tracking**: Save and resume learning journey

### Why Standalone?

- ✅ **No Code Conflicts**: Separate codebase, no dependency issues
- ✅ **Independent Deployment**: Can be updated without affecting main app
- ✅ **Focused Development**: Clear scope and boundaries
- ✅ **Easy Maintenance**: Isolated from main platform changes
- ✅ **Scalable**: Can run on separate infrastructure

---

## 📅 Implementation Timeline

```
Week 1-2:  Foundation & Setup
Week 3-4:  Modules 1 & 2 (Basics & Connectors)
Week 5-6:  Modules 3 & 4 (Transformations & Pipelines)
Week 7-8:  Modules 5 & 6 (Advanced & Scenarios)
Week 9-10: Polish, Testing & Deployment
```

---

## Phase 1: Foundation (Week 1-2)

### Week 1: Project Setup & Core Infrastructure

#### Day 1-2: Initialize Project

**Tasks:**
```bash
# 1. Create tutorial directory
mkdir -p /home/deepak/Public/dataaggregator/tutorial
cd tutorial

# 2. Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app --no-src

# 3. Install core dependencies
npm install axios zustand framer-motion lucide-react
npm install @monaco-editor/react prismjs
npm install react-markdown remark-gfm
npm install date-fns clsx

# 4. Install dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint prettier
```

**File Structure:**
```
tutorial/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.local.example
├── .gitignore
└── README.md
```

**Deliverables:**
- [ ] Next.js project initialized
- [ ] Dependencies installed
- [ ] Git repository setup
- [ ] Basic configuration files

#### Day 3-4: Setup Base UI Components

**Create Base Components:**
```typescript
// app/layout.tsx - Root layout
// components/ui/Button.tsx
// components/ui/Card.tsx
// components/ui/Badge.tsx
// components/ui/Alert.tsx
// components/ui/Tabs.tsx
// components/ui/Progress.tsx
```

**Tailwind Configuration:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { /* blue shades */ },
        success: { /* green shades */ },
        warning: { /* orange shades */ },
        danger: { /* red shades */ },
      }
    }
  }
}
```

**Deliverables:**
- [ ] UI component library (8 base components)
- [ ] Tailwind theme configured
- [ ] Component storybook (optional)

#### Day 5-7: Core Tutorial Components

**Tutorial-Specific Components:**
```typescript
// components/tutorial/LessonLayout.tsx
// components/tutorial/NavigationButtons.tsx
// components/tutorial/ProgressTracker.tsx
// components/tutorial/CodeBlock.tsx (with Prism.js)
// components/tutorial/InteractiveDemo.tsx
// components/tutorial/QuizQuestion.tsx
// components/tutorial/CompletionBadge.tsx
```

**Sample Component:**
```typescript
// components/tutorial/LessonLayout.tsx
export interface LessonLayoutProps {
  moduleId: string;
  lessonId: string;
  title: string;
  estimatedTime: number;
  children: React.ReactNode;
}

export function LessonLayout({
  moduleId,
  lessonId,
  title,
  estimatedTime,
  children
}: LessonLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      {/* Progress indicator */}
      {/* Lesson content */}
      {/* Navigation buttons */}
    </div>
  );
}
```

**Deliverables:**
- [ ] 7 tutorial-specific components
- [ ] Component documentation
- [ ] Usage examples

#### Day 8-10: API Integration Layer

**API Client Setup:**
```typescript
// lib/api/client.ts
export class TutorialAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('tutorial_token');
  }

  async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request('POST', '/api/v1/auth/login', {
      username,
      password
    });
    this.token = response.access_token;
    localStorage.setItem('tutorial_token', this.token);
    return response;
  }

  // Connectors
  async createConnector(config: ConnectorConfig) {
    return this.request('POST', '/api/v1/connectors', config);
  }

  async testConnector(connectorId: string) {
    return this.request('POST', `/api/v1/connectors/${connectorId}/test`);
  }

  // Transformations
  async createTransformation(code: string) {
    return this.request('POST', '/api/v1/transformations', { code });
  }

  // Pipelines
  async createPipeline(definition: PipelineDefinition) {
    return this.request('POST', '/api/v1/pipelines', definition);
  }

  async executePipeline(pipelineId: string) {
    return this.request('POST', `/api/v1/pipelines/${pipelineId}/execute`);
  }
}

// Export singleton instance
export const apiClient = new TutorialAPIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
);
```

**Deliverables:**
- [ ] API client class
- [ ] Authentication methods
- [ ] Connector API methods
- [ ] Transformation API methods
- [ ] Pipeline API methods
- [ ] Error handling

#### Day 11-14: Progress Tracking System

**Progress Tracker:**
```typescript
// lib/progress/tracker.ts
export interface TutorialProgress {
  userId: string;
  completedLessons: string[];
  completedExercises: string[];
  currentModule: number;
  currentLesson: number;
  scores: Record<string, number>;
  totalScore: number;
  startDate: Date;
  lastUpdated: Date;
}

export class ProgressTracker {
  private storageKey = 'tutorial_progress';

  saveProgress(progress: TutorialProgress): void {
    localStorage.setItem(this.storageKey, JSON.stringify(progress));
  }

  loadProgress(userId: string): TutorialProgress | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;

    const progress = JSON.parse(stored);
    return progress.userId === userId ? progress : null;
  }

  completeLesson(lessonId: string): void {
    const progress = this.getCurrentProgress();
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.lastUpdated = new Date();
      this.saveProgress(progress);
    }
  }

  completeExercise(exerciseId: string, score: number): void {
    const progress = this.getCurrentProgress();
    if (!progress.completedExercises.includes(exerciseId)) {
      progress.completedExercises.push(exerciseId);
      progress.scores[exerciseId] = score;
      progress.totalScore += score;
      progress.lastUpdated = new Date();
      this.saveProgress(progress);
    }
  }

  getCompletionPercentage(): number {
    const progress = this.getCurrentProgress();
    const totalLessons = 50; // Calculate from module data
    return (progress.completedLessons.length / totalLessons) * 100;
  }

  private getCurrentProgress(): TutorialProgress {
    const stored = this.loadProgress('current');
    return stored || this.initializeProgress();
  }

  private initializeProgress(): TutorialProgress {
    return {
      userId: 'current',
      completedLessons: [],
      completedExercises: [],
      currentModule: 1,
      currentLesson: 1,
      scores: {},
      totalScore: 0,
      startDate: new Date(),
      lastUpdated: new Date()
    };
  }

  exportProgress(): string {
    return JSON.stringify(this.getCurrentProgress());
  }

  importProgress(data: string): void {
    const progress = JSON.parse(data);
    this.saveProgress(progress);
  }

  reset(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const progressTracker = new ProgressTracker();
```

**Deliverables:**
- [ ] Progress tracking class
- [ ] LocalStorage persistence
- [ ] Export/import functionality
- [ ] Completion calculations

---

### Week 2: Sample Data & Home Page

#### Day 1-3: Create Sample Data

**E-commerce Sample Data:**
```typescript
// public/sample-data/ecommerce/orders.csv
order_id,customer_id,product_id,quantity,price,order_date,channel,status
ORD-001,CUST-123,PROD-456,2,29.99,2025-01-15T10:30:00Z,shopify,completed
ORD-002,CUST-456,PROD-789,1,49.99,2025-01-15T11:45:00Z,amazon,completed
ORD-003,CUST-789,PROD-123,3,19.99,2025-01-15T12:15:00Z,ebay,pending
ORD-004,CUST-123,PROD-456,1,29.99,2025-01-15T13:20:00Z,shopify,completed
ORD-005,CUST-234,PROD-789,2,49.99,2025-01-15T14:05:00Z,website,completed

// public/sample-data/ecommerce/customers.json
[
  {
    "customer_id": "CUST-123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "country": "USA",
    "state": "CA",
    "lifetime_value": 459.90,
    "join_date": "2024-06-15T00:00:00Z"
  },
  {
    "customer_id": "CUST-456",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0456",
    "country": "USA",
    "state": "NY",
    "lifetime_value": 349.95,
    "join_date": "2024-08-22T00:00:00Z"
  }
]

// public/sample-data/ecommerce/products.json
[
  {
    "product_id": "PROD-456",
    "name": "Wireless Mouse",
    "category": "Electronics",
    "subcategory": "Computer Accessories",
    "cost": 15.00,
    "price": 29.99,
    "supplier": "TechSupply Co.",
    "stock": 150
  },
  {
    "product_id": "PROD-789",
    "name": "USB-C Cable",
    "category": "Electronics",
    "subcategory": "Cables",
    "cost": 8.00,
    "price": 19.99,
    "supplier": "CableCo",
    "stock": 300
  }
]
```

**IoT Sample Data:**
```typescript
// public/sample-data/iot/sensor-readings.json
[
  {
    "sensor_id": "TEMP-001",
    "device_id": "MACHINE-A",
    "device_name": "Assembly Line Motor A1",
    "reading_type": "temperature",
    "value": 75.3,
    "unit": "celsius",
    "timestamp": "2025-01-15T10:30:15.234Z",
    "location": "Assembly Line 1",
    "facility": "Plant-North"
  },
  {
    "sensor_id": "PRESS-002",
    "device_id": "MACHINE-A",
    "device_name": "Assembly Line Motor A1",
    "reading_type": "pressure",
    "value": 2.4,
    "unit": "bar",
    "timestamp": "2025-01-15T10:30:15.234Z",
    "location": "Assembly Line 1",
    "facility": "Plant-North"
  }
]

// public/sample-data/iot/devices.json
[
  {
    "device_id": "MACHINE-A",
    "device_name": "Assembly Line Motor A1",
    "device_type": "motor",
    "manufacturer": "Siemens",
    "model": "1LE1001-1AB43-4AA4",
    "install_date": "2023-05-10",
    "location": "Assembly Line 1",
    "facility": "Plant-North",
    "max_temperature": 85.0,
    "max_pressure": 3.5,
    "maintenance_schedule": "quarterly"
  }
]
```

**Financial Sample Data:**
```typescript
// public/sample-data/financial/transactions.csv
transaction_id,account_id,amount,currency,transaction_type,date,description,category
TXN-001,ACC-123,1500.00,USD,credit,2025-01-15,Product Sales,revenue
TXN-002,ACC-456,350.00,USD,debit,2025-01-15,Office Supplies,expense
TXN-003,ACC-123,2200.00,USD,credit,2025-01-15,Service Revenue,revenue
TXN-004,ACC-789,1200.00,USD,debit,2025-01-15,Contractor Payment,expense

// public/sample-data/financial/accounts.json
[
  {
    "account_id": "ACC-123",
    "account_name": "Sales Revenue",
    "account_number": "4000-001",
    "account_type": "revenue",
    "department": "Sales",
    "currency": "USD"
  },
  {
    "account_id": "ACC-456",
    "account_name": "Operating Expenses",
    "account_number": "5000-001",
    "account_type": "expense",
    "department": "Operations",
    "currency": "USD"
  }
]
```

**Sample Data README:**
```markdown
// public/sample-data/README.md
# Tutorial Sample Data

This directory contains sample datasets for tutorial exercises.

## Datasets

### E-commerce
- **orders.csv**: 100 sample orders from multiple channels
- **customers.json**: 50 customer profiles
- **products.json**: 30 product catalog entries

**Use Case**: Multi-channel sales integration tutorial

### IoT
- **sensor-readings.json**: 1000 sensor readings (temperature, pressure)
- **devices.json**: 20 industrial devices

**Use Case**: Real-time sensor data processing tutorial

### Financial
- **transactions.csv**: 200 financial transactions
- **accounts.json**: 15 chart of accounts entries

**Use Case**: Financial reporting pipeline tutorial

## Usage

These files are referenced in tutorial exercises and can be:
- Uploaded through the UI
- Referenced via file path
- Used in transformation examples
- Imported into sample connectors

## Format

All data follows standard formats:
- CSV: RFC 4180 compliant
- JSON: Valid JSON with consistent schemas
- Dates: ISO 8601 format
```

**Deliverables:**
- [ ] E-commerce sample data (3 files)
- [ ] IoT sample data (2 files)
- [ ] Financial sample data (2 files)
- [ ] Sample data README
- [ ] Data validation scripts

#### Day 4-7: Build Home Page & Navigation

**Home Page:**
```typescript
// app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Master the Data Aggregator Platform
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Interactive tutorials, hands-on exercises, and real-world scenarios
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Start Learning</Button>
            <Button size="lg" variant="outline">Continue Progress</Button>
          </div>
        </div>
      </section>

      {/* Module Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8">Learning Path</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">
            What You'll Learn
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={Database} title="Connect Data Sources" />
            <FeatureCard icon={Wrench} title="Transform Data" />
            <FeatureCard icon={Zap} title="Build Pipelines" />
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Global Navigation:**
```typescript
// components/layout/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <h1 className="text-xl font-bold">DA Tutorial</h1>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex gap-6">
          <Link href="/modules">Modules</Link>
          <Link href="/playground">Playground</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/help">Help</Link>
        </nav>

        {/* Progress Indicator */}
        <div className="flex items-center gap-4">
          <ProgressIndicator percentage={completionPercentage} />
          <Button variant="ghost">Menu</Button>
        </div>
      </div>
    </header>
  );
}
```

**Deliverables:**
- [ ] Home page with hero section
- [ ] Module cards grid
- [ ] Global header navigation
- [ ] Footer component
- [ ] Progress indicator
- [ ] Responsive design

---

## Phase 2: Modules 1 & 2 (Week 3-4)

### Module 1: Platform Basics

**Structure:**
```
app/modules/1-basics/
├── page.tsx                    # Module overview
├── lesson-1/
│   └── page.tsx                # Login & Navigation
├── lesson-2/
│   └── page.tsx                # Dashboard Overview
├── lesson-3/
│   └── page.tsx                # Roles & Permissions
└── exercise/
    └── page.tsx                # Exploration exercise
```

**Lesson Example:**
```typescript
// app/modules/1-basics/lesson-1/page.tsx
export default function Lesson1_1() {
  return (
    <LessonLayout
      moduleId="1"
      lessonId="1.1"
      title="Login and Navigation"
      estimatedTime={15}
    >
      <LessonContent>
        <Section>
          <h2>Learning Objectives</h2>
          <ul>
            <li>Understand authentication process</li>
            <li>Navigate the platform interface</li>
            <li>Identify key sections</li>
          </ul>
        </Section>

        <Section>
          <h2>Platform Login</h2>
          <p>
            The Data Aggregator Platform uses JWT-based authentication...
          </p>
          <InteractiveDemo type="login" />
        </Section>

        <Section>
          <h2>Main Navigation</h2>
          <img src="/tutorial/images/navigation.png" alt="Navigation" />
          <p>The platform has six main sections...</p>
        </Section>

        <Section>
          <h2>Try It Yourself</h2>
          <Exercise
            id="1.1.1"
            instructions="Log in to the platform and explore each section"
            validation={validateExplorationExercise}
          />
        </Section>
      </LessonContent>
    </LessonLayout>
  );
}
```

**Deliverables (Week 3):**
- [ ] Module 1 overview page
- [ ] Lesson 1.1: Login & Navigation
- [ ] Lesson 1.2: Dashboard Overview
- [ ] Lesson 1.3: Roles & Permissions
- [ ] Exercise 1: Platform exploration
- [ ] Screenshots and images
- [ ] Interactive demos

---

### Module 2: Connectors

**Interactive Connector Builder:**
```typescript
// components/sandbox/ConnectorBuilder.tsx
export function ConnectorBuilder() {
  const [connectorType, setConnectorType] = useState<ConnectorType>('database');
  const [config, setConfig] = useState<ConnectorConfig>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  async function testConnection() {
    try {
      const connector = await apiClient.createConnector({
        type: connectorType,
        config
      });
      const result = await apiClient.testConnector(connector.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <h3>Connector Configuration</h3>
        </CardHeader>
        <CardContent>
          <ConnectorTypeSelector
            value={connectorType}
            onChange={setConnectorType}
          />
          <ConnectorConfigForm
            type={connectorType}
            config={config}
            onChange={setConfig}
          />
          <Button onClick={testConnection}>Test Connection</Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <h3>Test Results</h3>
        </CardHeader>
        <CardContent>
          {testResult && (
            <TestResultDisplay result={testResult} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Deliverables (Week 4):**
- [ ] Module 2 overview page
- [ ] Lesson 2.1: Connector types overview
- [ ] Lesson 2.2: Database connector tutorial
- [ ] Lesson 2.3: Test connection tutorial
- [ ] Lesson 2.4: Schema introspection
- [ ] Exercise 2: Create REST API connector
- [ ] Interactive connector builder
- [ ] Sample connectors library

---

## Phase 3: Modules 3 & 4 (Week 5-6)

### Module 3: Transformations

**Transformation Editor:**
```typescript
// components/sandbox/TransformationEditor.tsx
import Editor from '@monaco-editor/react';

export function TransformationEditor() {
  const [code, setCode] = useState(defaultTransformationCode);
  const [testData, setTestData] = useState<any>(sampleData);
  const [output, setOutput] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function testTransformation() {
    try {
      const transformation = await apiClient.createTransformation(code);
      const result = await apiClient.testTransformation(
        transformation.id,
        testData
      );
      setOutput(result.output);
      setErrors(result.errors || []);
    } catch (error) {
      setErrors([error.message]);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6 h-screen">
      {/* Code Editor */}
      <div className="flex flex-col">
        <div className="bg-gray-800 text-white p-4">
          <h3>Transformation Code</h3>
        </div>
        <Editor
          height="60%"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14
          }}
        />
        <div className="p-4 border-t">
          <h4 className="mb-2">Input Data</h4>
          <Editor
            height="200px"
            language="json"
            value={JSON.stringify(testData, null, 2)}
            onChange={(value) => setTestData(JSON.parse(value || '{}'))}
          />
        </div>
        <div className="p-4 border-t">
          <Button onClick={testTransformation}>
            Test Transformation
          </Button>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex flex-col">
        <div className="bg-gray-100 p-4">
          <h3>Output</h3>
        </div>
        {errors.length > 0 ? (
          <Alert variant="danger">
            {errors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </Alert>
        ) : output ? (
          <pre className="p-4 overflow-auto">
            {JSON.stringify(output, null, 2)}
          </pre>
        ) : (
          <div className="p-4 text-gray-500">
            Run a test to see output...
          </div>
        )}
      </div>
    </div>
  );
}
```

**Deliverables (Week 5):**
- [ ] Module 3 overview
- [ ] Lesson 3.1: Transformation concepts
- [ ] Lesson 3.2: Field mapping tutorial
- [ ] Lesson 3.3: Validation rules
- [ ] Lesson 3.4: Custom functions
- [ ] Lesson 3.5: Testing transformations
- [ ] Exercise 3: E-commerce transformation
- [ ] Transformation editor with Monaco
- [ ] Live testing functionality

---

### Module 4: Pipelines

**Pipeline Canvas (Visual Builder):**
```typescript
// components/sandbox/PipelineCanvas.tsx
import ReactFlow, { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export function PipelineCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const nodeTypes = {
    source: SourceNode,
    transformation: TransformationNode,
    destination: DestinationNode
  };

  function onNodesChange(changes) {
    // Handle node position/selection changes
  }

  function onEdgesChange(changes) {
    // Handle edge changes
  }

  function onConnect(connection) {
    // Handle new connections
    setEdges((eds) => addEdge(connection, eds));
  }

  function addNode(type: NodeType) {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 100 },
      data: { label: `${type} Node` }
    };
    setNodes((nds) => [...nds, newNode]);
  }

  async function executePipeline() {
    const pipelineDefinition = {
      nodes,
      edges
    };

    const pipeline = await apiClient.createPipeline(pipelineDefinition);
    const execution = await apiClient.executePipeline(pipeline.id);

    // Monitor execution...
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex gap-4">
        <Button onClick={() => addNode('source')}>Add Source</Button>
        <Button onClick={() => addNode('transformation')}>
          Add Transformation
        </Button>
        <Button onClick={() => addNode('destination')}>
          Add Destination
        </Button>
        <Button onClick={executePipeline} variant="primary">
          Execute Pipeline
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
```

**Deliverables (Week 6):**
- [ ] Module 4 overview
- [ ] Lesson 4.1: Pipeline architecture
- [ ] Lesson 4.2: Visual builder tutorial
- [ ] Lesson 4.3: Source configuration
- [ ] Lesson 4.4: Transformation steps
- [ ] Lesson 4.5: Destination setup
- [ ] Lesson 4.6: Scheduling
- [ ] Lesson 4.7: Execution
- [ ] Lesson 4.8: Monitoring
- [ ] Exercise 4: Complete E-commerce pipeline
- [ ] Visual pipeline canvas
- [ ] Execution monitoring dashboard

---

## Phase 4: Modules 5 & 6 (Week 7-8)

### Module 5: Advanced Features

**Deliverables (Week 7):**
- [ ] Module 5 overview
- [ ] Lesson 5.1: Analytics dashboard tutorial
- [ ] Lesson 5.2: Real-time monitoring
- [ ] Lesson 5.3: Error handling strategies
- [ ] Lesson 5.4: Pipeline templates
- [ ] Lesson 5.5: Batch operations
- [ ] Exercise 5: Multi-source integration
- [ ] Advanced demos

---

### Module 6: Production Scenarios

**Scenario Template:**
```typescript
// app/modules/6-scenarios/scenario-1/page.tsx
export default function Scenario1() {
  return (
    <ScenarioLayout
      scenarioId="6.1"
      title="E-commerce Sales Pipeline"
      difficulty="intermediate"
      estimatedTime={90}
    >
      {/* Business Context */}
      <Section>
        <h2>Business Context</h2>
        <p>
          You're a data engineer at RetailCo, managing data from
          multiple sales channels...
        </p>
      </Section>

      {/* Requirements */}
      <Section>
        <h2>Requirements</h2>
        <ChecklistItem>Integrate 3 sales channels</ChecklistItem>
        <ChecklistItem>Enrich with customer/product data</ChecklistItem>
        <ChecklistItem>Calculate profit margins</ChecklistItem>
        <ChecklistItem>Schedule hourly updates</ChecklistItem>
      </Section>

      {/* Step-by-Step Guide */}
      <Section>
        <h2>Implementation Steps</h2>
        <Accordion>
          <AccordionItem title="Step 1: Create Source Connectors">
            {/* Detailed instructions */}
          </AccordionItem>
          <AccordionItem title="Step 2: Build Transformation">
            {/* Detailed instructions */}
          </AccordionItem>
          {/* More steps */}
        </Accordion>
      </Section>

      {/* Hands-on Exercise */}
      <Section>
        <h2>Your Turn</h2>
        <ScenarioExercise
          scenarioId="6.1"
          requirements={requirements}
          validation={validateScenario}
        />
      </Section>
    </ScenarioLayout>
  );
}
```

**Deliverables (Week 8):**
- [ ] Module 6 overview
- [ ] Scenario 6.1: E-commerce complete
- [ ] Scenario 6.2: IoT sensors
- [ ] Scenario 6.3: Financial reporting
- [ ] Scenario 6.4: Customer 360
- [ ] Capstone project template
- [ ] Scenario validation system
- [ ] Solution walkthroughs

---

## Phase 5: Polish & Testing (Week 9-10)

### Week 9: Polish & Refinement

**Tasks:**
- [ ] Content review and editing (all modules)
- [ ] UI/UX improvements
- [ ] Responsive design fixes
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Add missing screenshots/diagrams

### Week 10: Testing & Deployment

**Testing:**
- [ ] User acceptance testing
- [ ] Content accuracy review
- [ ] API integration testing
- [ ] Progress tracking testing
- [ ] Exercise validation testing
- [ ] Bug fixes

**Documentation:**
- [ ] Tutorial usage guide
- [ ] API integration documentation
- [ ] Deployment guide
- [ ] Content authoring guide

**Deployment:**
- [ ] Production build
- [ ] Environment configuration
- [ ] Deploy to hosting
- [ ] DNS setup
- [ ] SSL certificate
- [ ] Monitoring setup

---

## 📦 Deployment Checklist

### Pre-Deployment

- [ ] All modules complete and tested
- [ ] Sample data finalized
- [ ] API integration verified
- [ ] Performance optimized
- [ ] Accessibility compliant
- [ ] Documentation complete

### Deployment

```bash
# 1. Build for production
cd tutorial
npm run build

# 2. Test production build locally
npm run start

# 3. Deploy to Vercel (recommended)
vercel deploy --prod

# OR Deploy via Docker
docker build -t tutorial-app .
docker run -p 4000:3000 tutorial-app
```

### Post-Deployment

- [ ] Verify all pages load
- [ ] Test API connections
- [ ] Verify sample data accessible
- [ ] Test progress tracking
- [ ] Monitor error logs
- [ ] Collect user feedback

---

## 📊 Success Metrics

Track these metrics post-launch:

1. **Engagement**:
   - Tutorial start rate
   - Module completion rate
   - Average session duration
   - Return user rate

2. **Learning Effectiveness**:
   - Exercise success rate
   - Time per module
   - Hint usage frequency
   - User ratings

3. **Technical**:
   - Page load times
   - API response times
   - Error rates
   - Browser compatibility

---

## 🎯 Next Steps After Deployment

1. **Week 11-12**: Gather feedback and iterate
2. **Month 2**: Add video tutorials
3. **Month 3**: Community features
4. **Month 4**: Certification program
5. **Month 5**: Advanced scenarios
6. **Month 6**: Multi-language support

---

## 📞 Support During Development

**Resources:**
- **Specification**: TUTORIAL_APP_SPECIFICATION.md
- **Platform Docs**: /docs folder
- **API Docs**: http://localhost:8001/docs
- **User Guide**: docs/UserGuide.md
- **Use Cases**: docs/UseCases.md

**Questions?**
- Review platform documentation
- Check existing API endpoints
- Test with sample data first
- Document assumptions

---

## ✅ Implementation Checklist

Use this checklist to track overall progress:

### Phase 1: Foundation ☐
- [ ] Project setup
- [ ] UI components
- [ ] Tutorial components
- [ ] API integration
- [ ] Progress tracking
- [ ] Sample data
- [ ] Home page

### Phase 2: Modules 1 & 2 ☐
- [ ] Module 1 complete
- [ ] Module 2 complete
- [ ] Connector builder
- [ ] Interactive exercises

### Phase 3: Modules 3 & 4 ☐
- [ ] Module 3 complete
- [ ] Module 4 complete
- [ ] Transformation editor
- [ ] Pipeline canvas

### Phase 4: Modules 5 & 6 ☐
- [ ] Module 5 complete
- [ ] Module 6 complete
- [ ] All scenarios
- [ ] Capstone project

### Phase 5: Launch ☐
- [ ] Content polish
- [ ] Testing complete
- [ ] Documentation done
- [ ] Deployed to production
- [ ] Monitoring active

---

**Ready to start? Begin with Phase 1, Day 1!** 🚀
