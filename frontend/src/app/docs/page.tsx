'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  BookOpen, Code, Database, GitBranch, Search, Zap,
  Users, Shield, BarChart2, Wrench, AlertTriangle,
  FileText, ChevronDown, ChevronRight
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  subsections: { id: string; title: string }[];
}

const NAV: Section[] = [
  { id: 'overview',        title: 'Platform Overview',     icon: BookOpen,    subsections: [{ id: 'what', title: 'What is Jade Data Aggregator?' }, { id: 'architecture', title: 'Architecture' }, { id: 'quickstart', title: 'Quick Start' }] },
  { id: 'connectors',      title: 'Connectors',            icon: Database,    subsections: [{ id: 'conn-types', title: 'Connector Types' }, { id: 'conn-create', title: 'Creating a Connector' }, { id: 'conn-test', title: 'Testing a Connection' }, { id: 'conn-csv', title: 'CSV File Connector' }, { id: 'conn-postgres', title: 'PostgreSQL Connector' }] },
  { id: 'pipelines',       title: 'Pipelines',             icon: GitBranch,   subsections: [{ id: 'pipe-concept', title: 'Pipeline Concepts' }, { id: 'pipe-builder', title: 'Pipeline Builder' }, { id: 'pipe-nodes', title: 'Node Types' }, { id: 'pipe-execute', title: 'Running a Pipeline' }, { id: 'pipe-schedule', title: 'Scheduling' }] },
  { id: 'transformations', title: 'Data Transformations',  icon: Zap,         subsections: [{ id: 'tx-concept', title: 'What are Transformations?' }, { id: 'tx-filter', title: 'Filter' }, { id: 'tx-map', title: 'Map / Rename' }, { id: 'tx-aggregate', title: 'Aggregate' }, { id: 'tx-sort', title: 'Sort' }, { id: 'tx-expressions', title: 'Expressions & Functions' }] },
  { id: 'users',           title: 'User Management',       icon: Users,       subsections: [{ id: 'roles', title: 'Roles & Permissions' }, { id: 'user-create', title: 'Creating Users' }, { id: 'twofa', title: '2FA Authentication' }] },
  { id: 'analytics',       title: 'Analytics & Monitoring',icon: BarChart2,   subsections: [{ id: 'dashboard', title: 'Dashboard' }, { id: 'analytics-page', title: 'Analytics' }, { id: 'monitoring', title: 'Monitoring' }, { id: 'alerts', title: 'Alerts' }] },
  { id: 'api',             title: 'API Reference',         icon: Code,        subsections: [{ id: 'api-auth', title: 'Authentication' }, { id: 'api-pipelines', title: 'Pipelines' }, { id: 'api-connectors', title: 'Connectors' }, { id: 'api-transformations', title: 'Transformations' }, { id: 'api-users', title: 'Users' }] },
  { id: 'security',        title: 'Security',              icon: Shield,      subsections: [{ id: 'sec-auth', title: 'JWT Authentication' }, { id: 'sec-csrf', title: 'CSRF Protection' }, { id: 'sec-rbac', title: 'Role-Based Access' }] },
  { id: 'maintenance',     title: 'Maintenance',           icon: Wrench,      subsections: [{ id: 'maint-cleanup', title: 'Cleanup Operations' }, { id: 'maint-schedule', title: 'Scheduled Cleanup' }] },
  { id: 'troubleshooting', title: 'Troubleshooting',       icon: AlertTriangle, subsections: [{ id: 'ts-conn', title: 'Connection Issues' }, { id: 'ts-pipe', title: 'Pipeline Failures' }, { id: 'ts-perf', title: 'Performance' }] },
];

const CONTENT: Record<string, React.ReactNode> = {
  overview: (
    <div className="space-y-8">
      <section id="what">
        <h2 className="text-xl font-bold text-gray-900 mb-3">What is Jade Data Aggregator?</h2>
        <p className="text-gray-700 mb-4">
          Jade Data Aggregator is a full-stack data integration platform that lets you connect to any data source,
          apply transformations, and deliver clean data to any destination — all through a visual pipeline builder
          or a REST API. It is designed for data engineers, analysts, and administrators who need reliable,
          repeatable data flows without writing bespoke ETL code.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Connect', text: 'PostgreSQL, MySQL, CSV files, REST APIs and more via configurable Connectors.' },
            { title: 'Transform', text: 'Filter, map, rename, aggregate and sort data with a powerful expression engine.' },
            { title: 'Deliver', text: 'Write results back to any destination connector on a schedule or on demand.' },
          ].map(c => (
            <div key={c.title} className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <h3 className="font-semibold text-primary-900 mb-1">{c.title}</h3>
              <p className="text-sm text-primary-800">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="architecture">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Architecture</h2>
        <div className="bg-gray-50 rounded-lg p-4 border text-sm font-mono space-y-1">
          <div>┌─────────────────────────────────────────────────────┐</div>
          <div>│  Browser  →  Next.js Frontend (port 3000)          │</div>
          <div>│                      │                              │</div>
          <div>│             FastAPI Backend (port 8001)             │</div>
          <div>│               │              │                      │</div>
          <div>│        PostgreSQL DB    File Storage               │</div>
          <div>└─────────────────────────────────────────────────────┘</div>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li><strong>Frontend</strong>: Next.js 14, React, Tailwind CSS, React Flow (visual canvas)</li>
          <li><strong>Backend</strong>: FastAPI (Python 3.12), SQLAlchemy async, Pydantic v2</li>
          <li><strong>Database</strong>: PostgreSQL (via asyncpg)</li>
          <li><strong>Auth</strong>: JWT tokens in HttpOnly cookies + CSRF double-submit</li>
        </ul>
      </section>

      <section id="quickstart">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Quick Start</h2>
        <ol className="space-y-4">
          {[
            { step: '1', title: 'Start the application', code: 'docker-compose up -d' },
            { step: '2', title: 'Open the app', code: 'http://localhost:3000' },
            { step: '3', title: 'Log in with default admin', code: 'Username: admin\nPassword: (set in .env → ADMIN_PASSWORD)' },
            { step: '4', title: 'Create a Connector', code: 'Connectors → New Connector → choose type → fill credentials → Test → Save' },
            { step: '5', title: 'Build a Pipeline', code: 'Pipelines → New Pipeline → drag Source, Transformation, Destination nodes → Save' },
            { step: '6', title: 'Run the Pipeline', code: 'Pipelines list → Run button  (or set a schedule)' },
          ].map(s => (
            <li key={s.step} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{s.step}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">{s.title}</p>
                <pre className="bg-gray-100 rounded px-3 py-2 text-xs whitespace-pre-wrap">{s.code}</pre>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  ),

  connectors: (
    <div className="space-y-8">
      <section id="conn-types">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Connector Types</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>{['Type','Description','Required Fields'].map(h=><th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['PostgreSQL','Direct connection to a PostgreSQL database','Host, Port, Database, Username, Password'],
                ['MySQL','Direct connection to a MySQL/MariaDB database','Host, Port, Database, Username, Password'],
                ['CSV File','Upload or reference a local CSV file','File path or upload'],
                ['REST API','Call any HTTP/HTTPS endpoint','Base URL, Auth method, Headers'],
                ['S3 / Cloud Storage','Read/write files from object storage','Bucket, Region, Access Key, Secret'],
              ].map(([t,d,r])=>(
                <tr key={t} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-primary-700">{t}</td>
                  <td className="px-4 py-2 text-gray-700">{d}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="conn-create">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Creating a Connector</h2>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>Go to <strong>Connectors</strong> in the left sidebar.</li>
          <li>Click <strong>New Connector</strong>.</li>
          <li>Give the connector a descriptive <strong>name</strong> (e.g. "Production Postgres").</li>
          <li>Select the <strong>connector type</strong> from the dropdown.</li>
          <li>Fill in the connection fields — they change based on the chosen type.</li>
          <li>Click <strong>Test Connection</strong> to verify credentials before saving.</li>
          <li>Click <strong>Save</strong>. The connector is now available in the Pipeline Builder.</li>
        </ol>
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          <strong>Tip:</strong> Connector credentials are stored encrypted. Never share connector names or IDs publicly.
        </div>
      </section>

      <section id="conn-test">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Testing a Connection</h2>
        <p className="text-sm text-gray-700 mb-2">
          The <strong>Test Connection</strong> button verifies reachability and authentication before you save.
          A green checkmark means the backend successfully connected. If the test fails, check:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>The host/IP is reachable from the server (not just from your laptop).</li>
          <li>Firewall rules allow the backend container to reach the target host on the given port.</li>
          <li>The credentials (username/password) are correct for the target system.</li>
          <li>For PostgreSQL: the user has <code className="bg-gray-100 px-1 rounded">CONNECT</code> privilege on the database.</li>
        </ul>
      </section>

      <section id="conn-csv">
        <h2 className="text-xl font-bold text-gray-900 mb-3">CSV File Connector</h2>
        <p className="text-sm text-gray-700 mb-2">Use a CSV file as a data source by uploading it through the connector form.</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>The first row is treated as the header (column names).</li>
          <li>UTF-8 encoding is assumed. Files with other encodings may show garbled characters.</li>
          <li>To <strong>replace</strong> the file on an existing connector, open Edit and choose a new file.</li>
          <li>Leaving the file input blank on Edit keeps the existing file.</li>
          <li>The connector panel shows the current file path once saved.</li>
        </ul>
      </section>

      <section id="conn-postgres">
        <h2 className="text-xl font-bold text-gray-900 mb-3">PostgreSQL Connector</h2>
        <p className="text-sm text-gray-700 mb-2">The PostgreSQL connector uses <code className="bg-gray-100 px-1 rounded">asyncpg</code> for async connections.</p>
        <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1 border">
          <div>Host:     db.example.com</div>
          <div>Port:     5432</div>
          <div>Database: my_database</div>
          <div>Username: etl_user</div>
          <div>Password: ••••••••</div>
          <div>SSL Mode: require  (disable | allow | prefer | require | verify-ca | verify-full)</div>
        </div>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          <strong>Column introspection:</strong> When a PostgreSQL source node is configured in Query Type = Table,
          the Pipeline Builder automatically fetches column names so you can build map/filter rules without guessing field names.
        </div>
      </section>
    </div>
  ),

  pipelines: (
    <div className="space-y-8">
      <section id="pipe-concept">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Pipeline Concepts</h2>
        <p className="text-sm text-gray-700 mb-4">
          A Pipeline defines a data flow from one or more <strong>Source</strong> nodes through optional
          <strong> Transformation</strong> nodes to one or more <strong>Destination</strong> nodes.
          Each run fetches fresh data, applies the rules, and writes the output.
        </p>
        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-4 border">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">Source</span>
          <span className="text-gray-400">→</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-medium">Transform</span>
          <span className="text-gray-400">→</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium">Destination</span>
        </div>
      </section>

      <section id="pipe-builder">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Pipeline Builder</h2>
        <p className="text-sm text-gray-700 mb-3">The visual canvas lets you drag nodes and connect them with wires.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50"><tr>{['Action','How'].map(h=><th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Add a node','Drag from the left Node Palette onto the canvas'],
                ['Configure a node','Click the node → Config panel opens on the right'],
                ['Connect nodes','Drag from the output handle of one node to the input handle of another'],
                ['Delete a node','Select the node → press Backspace / Delete'],
                ['Auto-layout','Click Auto-Layout button (top-right) to tidy up the canvas'],
                ['Validate','Click Validate to check for missing configs and broken connections'],
                ['Save','Click Save Pipeline (top bar or canvas top-right)'],
              ].map(([a,h])=>(
                <tr key={a} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{a}</td>
                  <td className="px-4 py-2 text-gray-600">{h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="pipe-nodes">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Node Types</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-400 pl-4">
            <h3 className="font-semibold text-gray-900">Source Node</h3>
            <p className="text-sm text-gray-700 mt-1">Reads data from a connector. Sub-types: <em>Database Source</em> (SQL table or query), <em>API Source</em> (HTTP endpoint), <em>File Source</em> (CSV upload).</p>
            <p className="text-sm text-gray-600 mt-1">Configure: choose a Connector, then set Query Type (Table or Query), Table Name, and optional filters.</p>
          </div>
          <div className="border-l-4 border-purple-400 pl-4">
            <h3 className="font-semibold text-gray-900">Transformation Node</h3>
            <p className="text-sm text-gray-700 mt-1">Applies a rule to each row. Sub-types: <em>Filter</em>, <em>Map</em>, <em>Aggregate</em>, <em>Join</em>, <em>Sort</em>.</p>
            <p className="text-sm text-gray-600 mt-1">The column picker shows available columns from the upstream source so you can build rules without guessing names.</p>
          </div>
          <div className="border-l-4 border-green-400 pl-4">
            <h3 className="font-semibold text-gray-900">Destination Node</h3>
            <p className="text-sm text-gray-700 mt-1">Writes data to a connector. Sub-types: <em>Database</em>, <em>Data Warehouse</em>.</p>
            <p className="text-sm text-gray-600 mt-1">Configure: choose a destination connector, target table, and write mode (Insert / Upsert / Replace).</p>
          </div>
        </div>
      </section>

      <section id="pipe-execute">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Running a Pipeline</h2>
        <p className="text-sm text-gray-700 mb-2">There are three ways to execute a pipeline:</p>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li><strong>Manual run</strong>: click the Run button on the Pipelines list or inside the builder.</li>
          <li><strong>Dry-run test</strong>: use "Dry-Run Test" in the builder to process a small sample without writing to the destination.</li>
          <li><strong>Scheduled</strong>: set a cron schedule on the pipeline and the system runs it automatically.</li>
        </ul>
        <p className="text-sm text-gray-700 mt-3">
          Run results appear in <strong>Pipelines → Executions</strong> and in the Monitoring dashboard.
          Each run records start time, status, records processed, and any error messages.
        </p>
      </section>

      <section id="pipe-schedule">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Scheduling</h2>
        <p className="text-sm text-gray-700 mb-2">Pipelines support cron-style schedules. Common examples:</p>
        <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1 border">
          <div>0 * * * *       # Every hour</div>
          <div>0 6 * * *       # Every day at 6 AM</div>
          <div>0 6 * * 1       # Every Monday at 6 AM</div>
          <div>*/15 * * * *    # Every 15 minutes</div>
          <div>0 0 1 * *       # First day of every month</div>
        </div>
      </section>
    </div>
  ),

  transformations: (
    <div className="space-y-8">
      <section id="tx-concept">
        <h2 className="text-xl font-bold text-gray-900 mb-3">What are Transformations?</h2>
        <p className="text-sm text-gray-700 mb-3">
          A Transformation is a named, reusable rule set stored in the system. You create one here on the
          Transformations page, then reference it inside a pipeline's Transformation node.
          The pipeline executor applies it row-by-row during each run.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
          <strong>Workflow:</strong> Create Transformation here → Open Pipeline Builder → Add a Transformation node →
          Select the transformation type and enter rules → Connect to Source and Destination nodes.
        </div>
      </section>

      <section id="tx-filter">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Filter</h2>
        <p className="text-sm text-gray-700 mb-2">Keeps only rows that match a condition. Rows that don't match are dropped.</p>
        <p className="text-sm font-medium text-gray-800 mb-1">Rules JSON format:</p>
        <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`{"field": "status", "operator": "equals", "value": "active"}`}</pre>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50"><tr>{['Operator','Meaning','Example value'].map(h=><th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['equals','Exact match (string or number)','"active"'],
                ['not_equals','Not equal','"inactive"'],
                ['greater_than','Numeric >','"100"'],
                ['less_than','Numeric <','"50"'],
                ['contains','String substring match','"@example.com"'],
                ['starts_with','String prefix','"AU"'],
                ['is_null','Field is null/empty','(no value needed)'],
                ['is_not_null','Field is not null/empty','(no value needed)'],
              ].map(([o,m,e])=>(
                <tr key={o} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-primary-700">{o}</td>
                  <td className="px-3 py-2 text-gray-700">{m}</td>
                  <td className="px-3 py-2 text-gray-500 font-mono">{e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-2">For multiple conditions, use an array: <code className="bg-gray-100 px-1 rounded">[{'{...}'}, {'{...}'}]</code></p>
      </section>

      <section id="tx-map">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Map / Rename</h2>
        <p className="text-sm text-gray-700 mb-2">
          Renames columns and/or computes new columns using expressions. The output row contains only the mapped fields.
        </p>
        <p className="text-sm font-medium text-gray-800 mb-1">Rules JSON format — array of source→target pairs:</p>
        <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`[
  {"source": "first_name", "target": "given_name"},
  {"source": "upper(row[\\"email\\"])", "target": "email_upper"},
  {"source": "concat(row[\\"first_name\\"], \\" \\", row[\\"last_name\\"])", "target": "full_name"},
  {"source": "round(float(row[\\"price\\"]), 2)", "target": "price_rounded"}
]`}</pre>
        <ul className="mt-3 text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>If <code className="bg-gray-100 px-1 rounded">source</code> is a plain column name, the value is passed through unchanged.</li>
          <li>If it contains a function call or <code className="bg-gray-100 px-1 rounded">row[...]</code>, it is evaluated as a Python expression.</li>
          <li>The column chip panel in the pipeline builder lets you click column names to insert them.</li>
        </ul>
      </section>

      <section id="tx-aggregate">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Aggregate</h2>
        <p className="text-sm text-gray-700 mb-2">Groups rows and computes summary statistics per group.</p>
        <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`{
  "group_by": ["region", "product_category"],
  "aggregations": [
    {"field": "sales_amount", "function": "sum",   "alias": "total_sales"},
    {"field": "order_id",     "function": "count", "alias": "order_count"},
    {"field": "sales_amount", "function": "avg",   "alias": "avg_order"},
    {"field": "sales_amount", "function": "max",   "alias": "max_sale"}
  ]
}`}</pre>
        <p className="text-xs text-gray-600 mt-2">Supported functions: <code className="bg-gray-100 px-1 rounded">sum</code>, <code className="bg-gray-100 px-1 rounded">count</code>, <code className="bg-gray-100 px-1 rounded">avg</code>, <code className="bg-gray-100 px-1 rounded">min</code>, <code className="bg-gray-100 px-1 rounded">max</code>, <code className="bg-gray-100 px-1 rounded">first</code>, <code className="bg-gray-100 px-1 rounded">last</code></p>
      </section>

      <section id="tx-sort">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Sort</h2>
        <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`{
  "sort_by": [
    {"field": "created_at", "direction": "desc"},
    {"field": "name",       "direction": "asc"}
  ]
}`}</pre>
      </section>

      <section id="tx-expressions">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Expressions & Functions</h2>
        <p className="text-sm text-gray-700 mb-3">
          Map expressions are evaluated as Python expressions. Access columns via <code className="bg-gray-100 px-1 rounded">{'row["column_name"]'}</code>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { cat: 'String', fns: [
              { fn: 'upper(row["name"])', desc: 'Uppercase' },
              { fn: 'lower(row["email"])', desc: 'Lowercase' },
              { fn: 'strip(row["name"])', desc: 'Trim whitespace' },
              { fn: 'substr(row["code"], 0, 3)', desc: 'First 3 characters' },
              { fn: 'concat(row["f"], " ", row["l"])', desc: 'Concatenate' },
              { fn: 'replace(row["phone"], "-", "")', desc: 'Remove hyphens' },
            ]},
            { cat: 'Math & Type', fns: [
              { fn: 'int(row["qty"])', desc: 'Cast to integer' },
              { fn: 'float(row["price"])', desc: 'Cast to float' },
              { fn: 'round(float(row["price"]), 2)', desc: 'Round to 2dp' },
              { fn: 'abs(int(row["balance"]))', desc: 'Absolute value' },
              { fn: 'str(row["id"])', desc: 'Cast to string' },
              { fn: 'row["val"] or "default"', desc: 'Null coalesce' },
            ]},
          ].map(g => (
            <div key={g.cat} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-800 text-sm">{g.cat}</div>
              <table className="min-w-full text-xs">
                <tbody className="divide-y divide-gray-100">
                  {g.fns.map(f => (
                    <tr key={f.fn} className="hover:bg-gray-50">
                      <td className="px-4 py-1.5 font-mono text-primary-700">{f.fn}</td>
                      <td className="px-4 py-1.5 text-gray-600">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Browse the full list in <strong>Transformations → Function Library</strong>.
        </p>
      </section>
    </div>
  ),

  users: (
    <div className="space-y-8">
      <section id="roles">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Roles & Permissions</h2>
        <p className="text-sm text-gray-700 mb-3">The platform uses a 6-role RBAC system. Each role is additive — higher roles include all lower privileges.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50"><tr>{['Role','Typical user','Key permissions'].map(h=><th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Admin','Platform owner','Everything — user management, system settings, all data'],
                ['Developer','Tech lead / DevOps','Near-admin; cannot modify the admin account'],
                ['Designer','Data engineer','Create & edit pipelines, connectors, transformations'],
                ['Executor','Operations team','Run pipelines, view monitoring'],
                ['Executive','Management','Analytics, reports, read-only dashboard'],
                ['Viewer','Analyst','Read-only access to dashboard and reports'],
              ].map(([r,t,k])=>(
                <tr key={r} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-primary-700">{r}</td>
                  <td className="px-4 py-2 text-gray-700">{t}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs">{k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="user-create">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Creating Users</h2>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>Go to <strong>Users</strong> in the left sidebar (Admin/Developer only).</li>
          <li>Click <strong>Add User</strong>.</li>
          <li>Fill in username, email, password, and select a role.</li>
          <li>Save. The user can log in immediately.</li>
        </ol>
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-900">
          <strong>Password reset:</strong> Use the three-dot menu → Reset Password to generate a temporary password.
          The user should change it immediately after first login.
        </div>
      </section>

      <section id="twofa">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Two-Factor Authentication (2FA)</h2>
        <p className="text-sm text-gray-700 mb-2">
          Each user can enable TOTP-based 2FA from their profile/settings page.
        </p>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Go to <strong>Settings → Security</strong>.</li>
          <li>Click <strong>Enable 2FA</strong>.</li>
          <li>Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.).</li>
          <li>Enter the 6-digit code to confirm setup.</li>
          <li>Store the recovery codes in a safe place — they are shown only once.</li>
        </ol>
        <p className="text-sm text-gray-600 mt-2">Once enabled, every login will require the current TOTP code.</p>
      </section>
    </div>
  ),

  analytics: (
    <div className="space-y-8">
      <section id="dashboard">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Dashboard</h2>
        <p className="text-sm text-gray-700 mb-2">The main dashboard shows a real-time overview:</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Active Pipelines</strong> — count of pipelines with <code className="bg-gray-100 px-1 rounded">is_active = true</code></li>
          <li><strong>Records Today / This Week</strong> — sum of <code className="bg-gray-100 px-1 rounded">records_processed</code> from completed runs</li>
          <li><strong>Recent Activity</strong> — last 10 pipeline run events with status colour-coding</li>
          <li><strong>System Status</strong> — backend health check</li>
        </ul>
      </section>

      <section id="analytics-page">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Analytics</h2>
        <p className="text-sm text-gray-700 mb-2">The Analytics page (requires Executive role or higher) shows:</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Records Processed</strong> — total across all completed runs</li>
          <li><strong>Avg. Processing Time</strong> — mean duration of completed runs in seconds</li>
          <li><strong>Success Rate</strong> — completed / total runs × 100</li>
          <li><strong>Active Pipelines</strong> — pipelines with is_active = true</li>
          <li><strong>Time-series chart</strong> — records per day over the last 7 days</li>
          <li><strong>Top Pipelines</strong> — by records processed</li>
        </ul>
      </section>

      <section id="monitoring">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Monitoring</h2>
        <p className="text-sm text-gray-700 mb-2">The Monitoring page provides operational visibility:</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Pipeline Stats</strong> — total, active, running, failed pipeline counts</li>
          <li><strong>Run Counts</strong> — successful vs failed runs from the pipeline_runs table</li>
          <li><strong>Records Processed</strong> — total from completed runs only</li>
          <li><strong>Recent Alerts</strong> — triggered alert rules</li>
          <li><strong>Pipeline Performance</strong> — per-pipeline run history and latency</li>
        </ul>
      </section>

      <section id="alerts">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Alerts</h2>
        <p className="text-sm text-gray-700 mb-2">
          Alert rules trigger notifications when pipeline runs fail or thresholds are breached.
          Manage rules under <strong>Alerts → Rules</strong>.
        </p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Set a pipeline, condition (e.g. status = failed), and notification channel.</li>
          <li>Alert history is available under <strong>Alerts → History</strong>.</li>
        </ul>
      </section>
    </div>
  ),

  api: (
    <div className="space-y-8">
      <section id="api-auth">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Authentication</h2>
        <p className="text-sm text-gray-700 mb-2">Log in to receive a JWT access token (stored in an HttpOnly cookie):</p>
        <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=yourpassword`}</pre>
        <p className="text-sm text-gray-700 mt-2">Subsequent requests include the cookie automatically. For API clients, include the token as a Bearer header:</p>
        <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`Authorization: Bearer <access_token>`}</pre>
        <p className="text-sm text-gray-600 mt-2">Interactive API docs available at: <code className="bg-gray-100 px-1 rounded">http://localhost:8001/docs</code></p>
      </section>

      <section id="api-pipelines">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Pipelines API</h2>
        <div className="space-y-2 text-sm font-mono">
          {[
            ['GET',    '/api/v1/pipelines',           'List all pipelines'],
            ['POST',   '/api/v1/pipelines',           'Create pipeline'],
            ['GET',    '/api/v1/pipelines/{id}',      'Get pipeline by ID'],
            ['PUT',    '/api/v1/pipelines/{id}',      'Update pipeline'],
            ['DELETE', '/api/v1/pipelines/{id}',      'Delete pipeline'],
            ['POST',   '/api/v1/pipelines/{id}/run',  'Execute pipeline now'],
            ['GET',    '/api/v1/pipelines/{id}/runs', 'List run history'],
          ].map(([m,p,d])=>(
            <div key={p} className="flex gap-3 items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${m==='GET'?'bg-blue-100 text-blue-700':m==='POST'?'bg-green-100 text-green-700':m==='PUT'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{m}</span>
              <code className="text-xs text-gray-800">{p}</code>
              <span className="text-xs text-gray-500 font-sans">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="api-connectors">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Connectors API</h2>
        <div className="space-y-2 text-sm font-mono">
          {[
            ['GET',    '/api/v1/connectors',                'List connectors'],
            ['POST',   '/api/v1/connectors',                'Create connector'],
            ['PUT',    '/api/v1/connectors/{id}',           'Update connector'],
            ['DELETE', '/api/v1/connectors/{id}',           'Delete connector'],
            ['POST',   '/api/v1/connectors/{id}/test',      'Test connection'],
            ['GET',    '/api/v1/connectors/{id}/columns',   'Get column list (PostgreSQL/CSV)'],
          ].map(([m,p,d])=>(
            <div key={p} className="flex gap-3 items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${m==='GET'?'bg-blue-100 text-blue-700':m==='POST'?'bg-green-100 text-green-700':m==='PUT'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{m}</span>
              <code className="text-xs text-gray-800">{p}</code>
              <span className="text-xs text-gray-500 font-sans">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="api-transformations">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Transformations API</h2>
        <div className="space-y-2 text-sm font-mono">
          {[
            ['GET',    '/api/v1/transformations',       'List transformations'],
            ['POST',   '/api/v1/transformations',       'Create transformation'],
            ['PUT',    '/api/v1/transformations/{id}',  'Update transformation'],
            ['DELETE', '/api/v1/transformations/{id}',  'Delete transformation'],
          ].map(([m,p,d])=>(
            <div key={p} className="flex gap-3 items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${m==='GET'?'bg-blue-100 text-blue-700':m==='POST'?'bg-green-100 text-green-700':m==='PUT'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{m}</span>
              <code className="text-xs text-gray-800">{p}</code>
              <span className="text-xs text-gray-500 font-sans">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="api-users">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Users API</h2>
        <div className="space-y-2 text-sm font-mono">
          {[
            ['GET',  '/api/v1/users',           'List users (Developer+)'],
            ['POST', '/api/v1/users',           'Create user (Developer+)'],
            ['GET',  '/api/v1/users/me',        'Current user info'],
            ['GET',  '/api/v1/users/me/permissions', 'Current user permissions'],
            ['PUT',  '/api/v1/users/{id}',      'Update user'],
            ['POST', '/api/v1/users/{id}/activate',   'Activate user'],
            ['POST', '/api/v1/users/{id}/deactivate',  'Deactivate user'],
          ].map(([m,p,d])=>(
            <div key={p} className="flex gap-3 items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${m==='GET'?'bg-blue-100 text-blue-700':m==='POST'?'bg-green-100 text-green-700':m==='PUT'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{m}</span>
              <code className="text-xs text-gray-800">{p}</code>
              <span className="text-xs text-gray-500 font-sans">{d}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),

  security: (
    <div className="space-y-8">
      <section id="sec-auth">
        <h2 className="text-xl font-bold text-gray-900 mb-3">JWT Authentication</h2>
        <p className="text-sm text-gray-700">Access tokens are signed JWTs stored in an HttpOnly cookie (<code className="bg-gray-100 px-1 rounded">access_token</code>). They expire after the configured TTL. On expiry the user is redirected to the login page.</p>
      </section>
      <section id="sec-csrf">
        <h2 className="text-xl font-bold text-gray-900 mb-3">CSRF Protection</h2>
        <p className="text-sm text-gray-700">State-changing requests (POST/PUT/PATCH/DELETE) require a matching <code className="bg-gray-100 px-1 rounded">X-CSRF-Token</code> header that equals the value of the readable <code className="bg-gray-100 px-1 rounded">csrf_token</code> cookie (double-submit pattern). Requests carrying a Bearer token are exempt from CSRF checking since they cannot be forged cross-site.</p>
      </section>
      <section id="sec-rbac">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Role-Based Access Control</h2>
        <p className="text-sm text-gray-700">Every API endpoint is annotated with a minimum required role (e.g. <code className="bg-gray-100 px-1 rounded">require_designer()</code>). Requests from lower-privilege roles receive HTTP 403. The admin user is additionally protected — developer-role users cannot modify the admin account.</p>
      </section>
    </div>
  ),

  maintenance: (
    <div className="space-y-8">
      <section id="maint-cleanup">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Cleanup Operations</h2>
        <p className="text-sm text-gray-700 mb-3">The Maintenance page (<strong>Admin/Developer only</strong>) lets you manually clean up old data to keep the database lean.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50"><tr>{['Operation','What it removes'].map(h=><th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Activity Logs','User activity log entries older than the configured retention period (default 90 days)'],
                ['Execution Logs','Pipeline run logs older than the retention period (default 30 days)'],
                ['Temp Files','Temporary upload files older than 24 hours'],
                ['Orphaned Data','Records referencing deleted parents (e.g. pipeline runs for deleted pipelines)'],
                ['Expired Tokens','Auth tokens past their expiry date'],
                ['Run All','Runs all of the above in sequence'],
              ].map(([o,w])=>(
                <tr key={o} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{o}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs">{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section id="maint-schedule">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Scheduled Cleanup</h2>
        <p className="text-sm text-gray-700">The Schedule tab on the Maintenance page lets you enable automatic cleanup and choose a frequency (Daily / Weekly / Monthly). The cron job runs in the background at the configured time without user intervention.</p>
      </section>
    </div>
  ),

  troubleshooting: (
    <div className="space-y-8">
      <section id="ts-conn">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Connection Issues</h2>
        <div className="space-y-3">
          {[
            { prob: 'Test Connection says "Connection refused"', fix: 'The host is not reachable from the backend container. Check that the DB server is running, the host/port is correct, and firewalls allow traffic from the backend.' },
            { prob: 'Authentication failed', fix: 'Double-check username and password. For PostgreSQL, verify the user has CONNECT privilege on the database.' },
            { prob: 'SSL errors', fix: 'Set SSL Mode to "disable" for local/dev environments, or "require" for production. Verify certificates if using verify-ca / verify-full.' },
            { prob: 'CSV connector shows empty columns', fix: 'Ensure the file is valid UTF-8 and has a header row. Re-upload the file if it was overwritten externally.' },
          ].map(i => (
            <div key={i.prob} className="border-l-4 border-red-300 pl-4">
              <p className="font-medium text-gray-900 text-sm">{i.prob}</p>
              <p className="text-sm text-gray-700 mt-0.5">{i.fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ts-pipe">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Pipeline Failures</h2>
        <div className="space-y-3">
          {[
            { prob: 'Pipeline run stays "running" forever', fix: 'Check the backend logs. The executor may have crashed mid-run. Restart the backend service; the run will be marked failed on next health-check.' },
            { prob: 'Zero records processed', fix: 'The source query returned no rows. Check the source filter and verify data exists in the source table.' },
            { prob: 'Map transformation fails', fix: 'Inspect the expression syntax. Ensure column names use row["name"] format with correct case. Test with a Dry Run first.' },
            { prob: 'Destination write error', fix: 'Verify the destination connector is still reachable. For Insert mode, check for unique constraint violations. For Upsert, confirm a primary key is specified.' },
          ].map(i => (
            <div key={i.prob} className="border-l-4 border-orange-300 pl-4">
              <p className="font-medium text-gray-900 text-sm">{i.prob}</p>
              <p className="text-sm text-gray-700 mt-0.5">{i.fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ts-perf">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Performance</h2>
        <div className="space-y-3">
          {[
            { prob: 'Large pipelines are slow', fix: 'Use a Filter node early in the pipeline to reduce row count before expensive transformations. Consider running in off-peak hours via the scheduler.' },
            { prob: 'UI feels sluggish', fix: 'The analytics and monitoring pages make multiple DB queries on load. Reduce the time range filter or check if the backend server is under heavy load.' },
            { prob: 'Database growing too large', fix: 'Use the Maintenance page to clean up old activity logs and execution logs. Enable scheduled cleanup to automate this.' },
          ].map(i => (
            <div key={i.prob} className="border-l-4 border-blue-300 pl-4">
              <p className="font-medium text-gray-900 text-sm">{i.prob}</p>
              <p className="text-sm text-gray-700 mt-0.5">{i.fix}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};


export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = searchTerm
    ? NAV.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subsections.some(sub => sub.title.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : NAV;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-1 text-gray-600">Complete guide to the Jade Data Aggregator Platform</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-4">
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search docs…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
              <nav className="py-2 max-h-[70vh] overflow-y-auto">
                {filtered.map(section => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections[section.id] ?? section.id === activeSection;
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => { setActiveSection(section.id); toggleSection(section.id); }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? 'text-primary-700 bg-primary-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{section.title}</span>
                        {isExpanded ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                      </button>
                      {isExpanded && (
                        <div className="pl-10 pb-1">
                          {section.subsections.map(sub => (
                            <a
                              key={sub.id}
                              href={`#${sub.id}`}
                              className="block py-1 px-2 text-xs text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                            >
                              {sub.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
              {CONTENT[activeSection] ?? (
                <p className="text-gray-500">Select a section from the left to read its documentation.</p>
              )}

              <div className="mt-10 pt-6 border-t border-gray-200 flex items-center gap-4 text-sm text-gray-500">
                <span>Also available:</span>
                <a href="http://localhost:8001/docs" target="_blank" rel="noreferrer"
                   className="text-primary-600 hover:underline flex items-center gap-1">
                  <Code className="h-4 w-4" /> Swagger API Docs
                </a>
                <a href="http://localhost:8001/redoc" target="_blank" rel="noreferrer"
                   className="text-primary-600 hover:underline flex items-center gap-1">
                  <FileText className="h-4 w-4" /> ReDoc
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
