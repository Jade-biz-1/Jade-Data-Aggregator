'use client';

import React, { useState, ReactNode } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Play, RotateCcw, Code2, Eye } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface InteractiveDemoProps {
  title: string;
  description?: string;
  code: string;
  language?: string;
  children: ReactNode; // The actual interactive component to demo
  initialState?: any;
  onRun?: (state: any) => void;
  onReset?: () => void;
  showCode?: boolean;
  instructions?: string;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({
  title,
  description,
  code,
  language = 'javascript',
  children,
  initialState,
  onRun,
  onReset,
  showCode = true,
  instructions,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [state, setState] = useState(initialState || {});

  const handleRun = () => {
    setIsRunning(true);
    if (onRun) {
      onRun(state);
    }
    // Simulate execution with a longer delay for better UX
    setTimeout(() => setIsRunning(false), 1000);
  };

  const handleReset = () => {
    setState(initialState || {});
    if (onReset) {
      onReset();
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary-600" />
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isRunning}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            {onRun && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
              >
                <Play className="w-4 h-4 mr-1" />
                Run
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {instructions && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <Alert variant="info">
            <strong>Instructions:</strong> {instructions}
          </Alert>
        </div>
      )}

      {/* Content */}
      {showCode ? (
        <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 bg-gray-50 px-4">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code2 className="w-4 h-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="p-4 min-h-[200px]">
            <div className="bg-white rounded-lg border border-gray-200 p-4 relative">
              {isRunning && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-3 text-primary-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                    <span className="font-medium">Running...</span>
                  </div>
                </div>
              )}
              {children}
            </div>
          </TabsContent>

          <TabsContent value="code" className="p-0">
            <CodeBlock
              code={code}
              language={language}
              showLineNumbers={true}
              showCopyButton={true}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="p-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {children}
          </div>
        </div>
      )}
    </Card>
  );
};
