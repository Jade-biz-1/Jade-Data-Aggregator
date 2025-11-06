'use client';

import React, { useState } from 'react';
import { TransformationEditor } from '@/components/sandbox';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Code, Database, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SAMPLE_SCENARIOS = [
  {
    id: 'uppercase',
    name: 'Uppercase Transformation',
    description: 'Convert all string values to uppercase',
    code: `# Convert all string values to uppercase
def transform(data):
    """Transform strings to uppercase"""
    if isinstance(data, dict):
        return {k: v.upper() if isinstance(v, str) else v
                for k, v in data.items()}
    return data`,
    input: {
      name: "john doe",
      email: "john@example.com",
      status: "active"
    }
  },
  {
    id: 'filter',
    name: 'Filter and Extract',
    description: 'Extract specific fields from data',
    code: `# Extract only specific fields
def transform(data):
    """Extract name and email only"""
    if isinstance(data, dict):
        return {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'full_name': f"{data.get('first_name', '')} {data.get('last_name', '')}"
        }
    return data`,
    input: {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      age: 30,
      phone: "555-1234",
      address: "123 Main St"
    }
  },
  {
    id: 'calculate',
    name: 'Calculate Fields',
    description: 'Add calculated fields to data',
    code: `# Add calculated fields
def transform(data):
    """Calculate total and add status"""
    if isinstance(data, dict):
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        total = price * quantity

        return {
            **data,
            'total': total,
            'discount': total * 0.1,
            'final_price': total * 0.9,
            'status': 'processed'
        }
    return data`,
    input: {
      product: "Widget A",
      price: 29.99,
      quantity: 5,
      customer: "John Doe"
    }
  },
  {
    id: 'array',
    name: 'Array Transformation',
    description: 'Transform array of items',
    code: `# Transform array of items
def transform(data):
    """Transform each item in array"""
    if isinstance(data, list):
        return [
            {
                'id': item.get('id'),
                'name': item.get('name', '').upper(),
                'value': item.get('value', 0) * 2
            }
            for item in data
        ]
    return data`,
    input: [
      { id: 1, name: "item one", value: 10 },
      { id: 2, name: "item two", value: 20 },
      { id: 3, name: "item three", value: 30 }
    ]
  }
];

export default function TransformationEditorDemo() {
  const [selectedScenario, setSelectedScenario] = useState(SAMPLE_SCENARIOS[0]);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  const handleSave = (code: string) => {
    setSavedCode(code);
    console.log('Transformation saved:', code);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Transformation Editor Demo
              </h1>
              <p className="text-gray-600">
                Interactive Python transformation editor with live testing
              </p>
            </div>
            <Badge variant="primary" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Module 3
            </Badge>
          </div>
        </div>

        {/* Features */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Monaco Editor</h3>
                <p className="text-sm text-gray-600">
                  VS Code-powered editor with syntax highlighting
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Live Testing</h3>
                <p className="text-sm text-gray-600">
                  Test transformations instantly with sample data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Preview Panels</h3>
                <p className="text-sm text-gray-600">
                  See input and output side-by-side
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Sample Scenarios */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sample Transformation Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SAMPLE_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedScenario.id === scenario.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-1">
                  {scenario.name}
                </h3>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Editor */}
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedScenario.name}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedScenario.description}
              </p>
            </div>
            {savedCode && (
              <Badge variant="success">Code saved successfully!</Badge>
            )}
          </div>

          <TransformationEditor
            key={selectedScenario.id}
            initialCode={selectedScenario.code}
            sampleInput={selectedScenario.input}
            onSave={handleSave}
            height="400px"
          />
        </Card>

        {/* Usage Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <div>
                <strong>Choose a scenario</strong> from the options above or start with the default code
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <div>
                <strong>Edit the Python code</strong> in the left panel. Define a <code className="bg-blue-100 px-1 rounded">transform(data)</code> function
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <div>
                <strong>Modify the sample input</strong> (optional) to test with different data
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <div>
                <strong>Click &quot;Run Test&quot;</strong> to execute your transformation and see the results
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                5
              </span>
              <div>
                <strong>Click &quot;Save&quot;</strong> when you&apos;re happy with your transformation
              </div>
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
