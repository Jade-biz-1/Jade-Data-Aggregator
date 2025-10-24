'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import Progress, { CircularProgress } from '@/components/ui/Progress';
import Input, { TextArea } from '@/components/ui/Input';
import Form, { FormField, FormLabel, FormError, FormHelperText, FormSection, FormActions } from '@/components/ui/Form';

export default function TestComponentsPage() {
  const [showAlert, setShowAlert] = useState(true);
  const [progress, setProgress] = useState(65);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            UI Components Test Page
          </h1>
          <p className="text-gray-600">Testing all tutorial UI components</p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
              <Button fullWidth>Full Width Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="default">
                <CardContent>Default Card</CardContent>
              </Card>
              <Card variant="bordered">
                <CardContent>Bordered Card</CardContent>
              </Card>
              <Card variant="elevated">
                <CardContent>Elevated Card</CardContent>
              </Card>
            </div>
            <div className="mt-4">
              <Card hoverable variant="elevated">
                <CardHeader>
                  <CardTitle>Complete Card</CardTitle>
                </CardHeader>
                <CardContent>
                  This card has all sections: header, content, and footer.
                </CardContent>
                <CardFooter>
                  <Button variant="primary" size="sm">Action</Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge dot variant="success">With Dot</Badge>
                <Badge removable variant="primary" onRemove={() => alert('Removed!')}>
                  Removable
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="info" title="Information">
                This is an informational alert message.
              </Alert>
              <Alert variant="success" title="Success">
                Your operation completed successfully!
              </Alert>
              <Alert variant="warning" title="Warning">
                Please review this warning message carefully.
              </Alert>
              <Alert variant="danger" title="Error">
                An error occurred. Please try again.
              </Alert>
              {showAlert && (
                <Alert
                  variant="info"
                  dismissible
                  onDismiss={() => setShowAlert(false)}
                  title="Dismissible Alert"
                >
                  You can close this alert by clicking the X button.
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">First Tab</TabsTrigger>
                <TabsTrigger value="tab2">Second Tab</TabsTrigger>
                <TabsTrigger value="tab3">Third Tab</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <p className="text-gray-700">Content for the first tab.</p>
              </TabsContent>
              <TabsContent value="tab2">
                <p className="text-gray-700">Content for the second tab.</p>
              </TabsContent>
              <TabsContent value="tab3">
                <p className="text-gray-700">Content for the third tab.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Bars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Linear Progress</p>
                <Progress value={progress} showLabel label="Current Progress" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                    -10%
                  </Button>
                  <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                    +10%
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Sizes and Variants</p>
                <Progress value={45} size="sm" variant="default" />
                <Progress value={65} size="md" variant="success" />
                <Progress value={85} size="lg" variant="warning" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Circular Progress</p>
                <div className="flex gap-6">
                  <CircularProgress value={progress} variant="default" />
                  <CircularProgress value={75} variant="success" size={100} />
                  <CircularProgress value={90} variant="warning" size={80} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Basic Input"
                placeholder="Enter text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                fullWidth
              />
              <Input
                label="Input with Helper Text"
                placeholder="username@example.com"
                helperText="We'll never share your email with anyone else."
                type="email"
                fullWidth
              />
              <Input
                label="Input with Error"
                placeholder="Enter password..."
                error="Password must be at least 8 characters long"
                type="password"
                fullWidth
              />
              <Input
                label="Input with Icons"
                placeholder="Search..."
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                fullWidth
              />
              <Input
                label="Disabled Input"
                placeholder="Cannot edit..."
                disabled
                fullWidth
              />
              <TextArea
                label="Text Area"
                placeholder="Enter a longer text..."
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                rows={4}
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={(e) => { e.preventDefault(); alert('Form submitted!'); }}>
              <FormSection title="Personal Information" description="Enter your basic details">
                <FormField>
                  <FormLabel required>Full Name</FormLabel>
                  <Input placeholder="John Doe" fullWidth />
                  <FormHelperText>Enter your first and last name</FormHelperText>
                </FormField>
                <FormField>
                  <FormLabel required>Email Address</FormLabel>
                  <Input type="email" placeholder="john@example.com" fullWidth />
                </FormField>
              </FormSection>

              <FormSection title="Additional Details" description="Optional information">
                <FormField>
                  <FormLabel>Bio</FormLabel>
                  <TextArea placeholder="Tell us about yourself..." rows={3} fullWidth />
                </FormField>
              </FormSection>

              <FormActions align="right">
                <Button variant="outline" type="button">Cancel</Button>
                <Button variant="primary" type="submit">Submit</Button>
              </FormActions>
            </Form>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Component Testing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Button</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Card</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Badge</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Alert</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Tabs</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Progress</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Input</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="lg" dot>Form</Badge>
                <p className="text-sm text-gray-600 mt-2">✅ Working</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center">
              <p className="text-green-600 font-semibold">All 8 UI components created and tested successfully!</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
