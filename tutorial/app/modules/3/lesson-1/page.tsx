'use client';

import React, { useState } from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { QuizQuestion, QuizOption } from '@/components/tutorial/QuizQuestion';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { progressTracker } from '@/lib/progress';
import {
  GitBranch,
  Filter,
  Shuffle,
  Code,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Lesson3_1Page() {
  const handleComplete = () => {
    progressTracker.startLesson('module-3-lesson-1', 'module-3');
    progressTracker.completeLesson('module-3-lesson-1', 100);
  };

  const transformationTypes = [
    {
      name: 'Field Mapping',
      icon: <Shuffle className="w-6 h-6" />,
      color: 'bg-blue-500',
      description: 'Rename, restructure, or reorganize fields from source to destination',
      examples: ['email → user_email', 'firstName + lastName → full_name', 'Nested object flattening'],
      useCase: 'When source and destination have different schemas'
    },
    {
      name: 'Filtering',
      icon: <Filter className="w-6 h-6" />,
      color: 'bg-green-500',
      description: 'Select only records that meet specific criteria',
      examples: ['status = "active"', 'created_at > "2024-01-01"', 'price > 100'],
      useCase: 'When you only need a subset of source data'
    },
    {
      name: 'Aggregation',
      icon: <Code className="w-6 h-6" />,
      color: 'bg-purple-500',
      description: 'Combine multiple records into summary data',
      examples: ['COUNT(*) by category', 'SUM(amount) by date', 'AVG(rating) by product'],
      useCase: 'When creating reports or analytics from raw data'
    },
    {
      name: 'Validation',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-orange-500',
      description: 'Check data quality and reject invalid records',
      examples: ['email format check', 'Required fields present', 'Value ranges valid'],
      useCase: 'When ensuring data quality before loading'
    },
  ];

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'To make data processing faster', isCorrect: false },
    { id: '2', text: 'To convert data from source format to destination format', isCorrect: true },
    { id: '3', text: 'To compress data for storage', isCorrect: false },
    { id: '4', text: 'To encrypt sensitive information', isCorrect: false },
  ];

  return (
    <LessonLayout
      title="Transformation Concepts"
      description="Understand what transformations are, why they're needed, and the different types available"
      module="Module 3: Data Transformations"
      lessonNumber={1}
      estimatedTime="15 min"
      difficulty="intermediate"
      objectives={[
        'Understand what data transformations are and why they\'re essential',
        'Learn the main types of transformations available',
        'Identify when to use each transformation type',
        'Understand the transformation lifecycle',
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Transformations?</h2>
          <p className="text-gray-700 mb-4">
            Data transformations are the rules and logic that convert data from one format to another.
            They bridge the gap between how your source systems store data and how your destination
            systems need to receive it.
          </p>
          <Alert variant="info">
            <strong>Key Concept:</strong> Transformations are the &quot;T&quot; in ETL (Extract, Transform, Load).
            They&apos;re executed between extracting data from sources and loading it into destinations.
          </Alert>
        </section>

        {/* Why Transformations */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Do We Need Transformations?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h4 className="font-semibold text-gray-900 mb-2">🔄 Schema Differences</h4>
              <p className="text-sm text-gray-600">
                Source and destination systems rarely have identical field names, structures, or data types.
                Transformations map between these differences.
              </p>
            </Card>
            <Card className="p-5">
              <h4 className="font-semibold text-gray-900 mb-2">✨ Data Quality</h4>
              <p className="text-sm text-gray-600">
                Clean, validate, and standardize data to ensure quality. Remove duplicates, fix formats,
                and handle missing values.
              </p>
            </Card>
            <Card className="p-5">
              <h4 className="font-semibold text-gray-900 mb-2">📊 Business Logic</h4>
              <p className="text-sm text-gray-600">
                Apply business rules, calculations, and enrichments. Combine fields, perform calculations,
                or add derived values.
              </p>
            </Card>
            <Card className="p-5">
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Data Reduction</h4>
              <p className="text-sm text-gray-600">
                Filter unnecessary data, aggregate to summaries, or select only relevant records to
                reduce data volume.
              </p>
            </Card>
          </div>
        </section>

        {/* Transformation Types */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Transformations</h2>
          <p className="text-gray-700 mb-6">
            The platform supports four main transformation types:
          </p>

          <div className="space-y-4">
            {transformationTypes.map((type) => (
              <Card key={type.name} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 ${type.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{type.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-gray-700">Examples:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {type.examples.map((ex, idx) => (
                          <Badge key={idx} variant="default">{ex}</Badge>
                        ))}
                      </div>
                    </div>
                    <Alert variant="info" className="text-sm">
                      <strong>Use when:</strong> {type.useCase}
                    </Alert>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Transformation Lifecycle */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transformation Lifecycle</h2>
          <p className="text-gray-700 mb-4">
            Understanding how transformations fit into the data pipeline:
          </p>

          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Extract</h4>
                  <p className="text-sm text-gray-600">Data is read from source connectors</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-green-600">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Transform</h4>
                  <p className="text-sm text-gray-600">Transformations are applied to modify the data</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-purple-600">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Validate</h4>
                  <p className="text-sm text-gray-600">Data quality checks ensure transformed data is valid</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-orange-600">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Load</h4>
                  <p className="text-sm text-gray-600">Clean, transformed data is loaded to destination</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Code Example */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transformation Example</h2>
          <p className="text-gray-700 mb-4">
            Here&apos;s a simple transformation that maps fields and applies validation:
          </p>

          <CodeBlock
            code={`# Example transformation configuration
transformation = {
    "name": "Clean User Data",
    "type": "field_mapping",

    # Map source fields to destination fields
    "field_mapping": {
        "email_address": "email",
        "first_name": "firstName",
        "last_name": "lastName",
        "registration_date": "createdAt"
    },

    # Validation rules
    "validation_rules": [
        {
            "field": "email",
            "type": "email_format",
            "required": True
        },
        {
            "field": "createdAt",
            "type": "date",
            "format": "ISO8601"
        }
    ],

    # Custom logic (optional)
    "custom_function": """
def transform_row(row):
    # Combine first and last name
    row['fullName'] = f"{row['firstName']} {row['lastName']}"

    # Convert email to lowercase
    row['email'] = row['email'].lower()

    return row
    """
}

# Apply transformation
transformed_data = apply_transformation(source_data, transformation)`}
            language="python"
            title="Sample Transformation"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Best Practices */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Keep Transformations Simple:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Break complex transformations into multiple steps. Easier to debug and maintain.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Validate Early:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Add validation rules to catch bad data before it reaches your destination.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Test with Sample Data:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Always test transformations with real sample data before production deployment.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Document Business Logic:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Add comments explaining why transformations exist, especially for business rules.
                  </p>
                </div>
              </li>
            </ul>
          </Card>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="What is the primary purpose of data transformations?"
            options={quizOptions}
            explanation="Transformations convert data from source format to destination format. They handle schema differences, apply business logic, validate data quality, and prepare data for loading into destination systems. While transformations can improve efficiency, their main purpose is data conversion and preparation."
            hint="Think about the 'T' in ETL (Extract, Transform, Load)."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Transformations convert data from source format to destination format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Four main types: Field Mapping, Filtering, Aggregation, and Validation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Transformations occur between Extract and Load in the ETL process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Keep transformations simple, validate early, and test with sample data</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/3-transformations/lesson-2"
          nextLabel="Next: Field Mapping"
          previousUrl="/modules/3-transformations"
          previousLabel="Back to Module Overview"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
