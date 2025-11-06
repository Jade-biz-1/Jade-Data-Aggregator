'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LessonLayout from '@/components/tutorial/LessonLayout';
import NavigationButtons from '@/components/tutorial/NavigationButtons';
import { progressTracker } from '@/lib/progress';
import { MousePointer, Layers, ArrowRight, Plus, Settings } from 'lucide-react';

export default function Lesson2Page() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-2', 100);
  };

  const pipelineSteps = [
    { id: 'source', label: 'Source', icon: '=å', color: 'bg-blue-100 border-blue-300' },
    { id: 'transform', label: 'Transform', icon: '', color: 'bg-purple-100 border-purple-300' },
    { id: 'destination', label: 'Destination', icon: '=ä', color: 'bg-green-100 border-green-300' },
  ];

  return (
    <LessonLayout
      moduleTitle="Module 4: Data Pipelines"
      lessonTitle="Lesson 4.2: Visual Pipeline Builder"
      lessonId="module-4-lesson-2"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Building Pipelines Visually</h2>
          <p className="text-gray-700 mb-4">
            The visual pipeline builder lets you design data workflows by dragging and dropping
            components. This makes it easy to see the flow of data and configure each step.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Interactive Builder Demo</h2>
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <MousePointer className="w-4 h-4" />
              <span>Click on each step to configure it</span>
            </div>

            <div className="flex items-center justify-center gap-6 mb-6">
              {pipelineSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    onClick={() => setSelectedStep(step.id)}
                    className={`
                      cursor-pointer p-6 rounded-lg border-2 transition-all
                      ${step.color}
                      ${selectedStep === step.id ? 'ring-4 ring-primary-200 scale-105' : 'hover:scale-102'}
                    `}
                  >
                    <div className="text-4xl mb-2 text-center">{step.icon}</div>
                    <p className="font-semibold text-center">{step.label}</p>
                  </div>
                  {index < pipelineSteps.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {selectedStep && (
              <Card className="p-5 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    Configure {pipelineSteps.find(s => s.id === selectedStep)?.label}
                  </h3>
                  <Badge variant="primary">Selected</Badge>
                </div>
                {selectedStep === 'source' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Select your data source connector:</p>
                    <select className="w-full p-2 border rounded">
                      <option>CSV File Upload</option>
                      <option>REST API</option>
                      <option>PostgreSQL Database</option>
                      <option>MySQL Database</option>
                    </select>
                  </div>
                )}
                {selectedStep === 'transform' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Add transformation steps:</p>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field Mapping
                    </Button>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Validation
                    </Button>
                  </div>
                )}
                {selectedStep === 'destination' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Select where to send the data:</p>
                    <select className="w-full p-2 border rounded">
                      <option>PostgreSQL Database</option>
                      <option>MySQL Database</option>
                      <option>Data Warehouse</option>
                      <option>CSV Export</option>
                    </select>
                  </div>
                )}
              </Card>
            )}
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Builder Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5">
              <Layers className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Drag & Drop</h3>
              <p className="text-sm text-gray-600">
                Add components by dragging them onto the canvas. Reorder steps easily.
              </p>
            </Card>

            <Card className="p-5">
              <Settings className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Configuration Panel</h3>
              <p className="text-sm text-gray-600">
                Click any step to configure its settings in the side panel.
              </p>
            </Card>

            <Card className="p-5">
              <MousePointer className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Real-time Preview</h3>
              <p className="text-sm text-gray-600">
                See how data flows through your pipeline as you build it.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>=¡</span> Pro Tip
            </h3>
            <p className="text-sm text-gray-700">
              Start with a simple pipeline using just source and destination. Then add
              transformations incrementally and test each change. This makes debugging easier.
            </p>
          </Card>
        </section>

        <NavigationButtons
          previousHref="/modules/4-pipelines/lesson-1"
          nextHref="/modules/4-pipelines/lesson-3"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
