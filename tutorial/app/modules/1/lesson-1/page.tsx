'use client';

import React, { useState } from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { InteractiveDemo } from '@/components/tutorial/InteractiveDemo';
import { QuizQuestion, QuizOption } from '@/components/tutorial/QuizQuestion';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { progressTracker } from '@/lib/progress';
import { Lock, User, Mail, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Lesson1_1Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleLogin = () => {
    // Simulate login
    if (email && password) {
      setLoginStatus('success');
      setTimeout(() => setLoginStatus('idle'), 3000);
    } else {
      setLoginStatus('error');
      setTimeout(() => setLoginStatus('idle'), 3000);
    }
  };

  const handleComplete = () => {
    progressTracker.startLesson('module-1-lesson-1', 'module-1');
    progressTracker.completeLesson('module-1-lesson-1', 100);
  };

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'To make the platform look prettier', isCorrect: false },
    { id: '2', text: 'To verify user identity and protect sensitive data', isCorrect: true },
    { id: '3', text: 'To slow down the login process', isCorrect: false },
    { id: '4', text: 'Authentication is optional in the platform', isCorrect: false },
  ];

  return (
    <LessonLayout
      title="Login and Navigation"
      description="Learn how to securely access the Data Aggregator Platform and navigate its main interface"
      module="Module 1: Platform Basics"
      lessonNumber={1}
      estimatedTime="10 min"
      difficulty="beginner"
      objectives={[
        'Understand the authentication process',
        'Successfully log in to the platform',
        'Navigate the main menu and interface',
        'Locate key features and resources',
      ]}
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <p className="text-gray-700 mb-4">
            The Data Aggregator Platform uses secure authentication to protect your data and ensure that
            only authorized users can access the system. In this lesson, you&apos;ll learn how to log in and
            navigate the platform&apos;s main interface.
          </p>
          <Alert variant="info">
            <strong>Note:</strong> This tutorial uses a demo environment. In production, you would use your
            organization&apos;s credentials and follow your company&apos;s security policies.
          </Alert>
        </section>

        {/* Authentication Process */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Process</h2>
          <p className="text-gray-700 mb-4">
            The platform uses JWT (JSON Web Token) authentication for secure, stateless sessions. Here&apos;s how it works:
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary-600">1</span>
                </div>
                <div>
                  <strong>Enter Credentials:</strong> Provide your email and password on the login page.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary-600">2</span>
                </div>
                <div>
                  <strong>Server Verification:</strong> The server validates your credentials against the database.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary-600">3</span>
                </div>
                <div>
                  <strong>Token Generation:</strong> If valid, the server generates a JWT access token.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary-600">4</span>
                </div>
                <div>
                  <strong>Authenticated Session:</strong> The token is stored and included in subsequent API requests.
                </div>
              </li>
            </ol>
          </div>

          <CodeBlock
            code={`// Example: Login API Request
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: 'user@example.com',
    password: 'secure_password'
  })
});

const { access_token, token_type } = await response.json();

// Store token for future requests
localStorage.setItem('access_token', access_token);`}
            language="javascript"
            title="Login Authentication"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Interactive Login Demo */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Login Demo</h2>
          <p className="text-gray-700 mb-4">
            Try the login process below. Use the pre-filled demo credentials or enter your own.
          </p>

          <InteractiveDemo
            title="Login Form"
            description="Experience the authentication flow"
            code={`const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await apiClient.login({ email, password });
    if (response.success) {
      console.log('Login successful!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Log In</button>
    </form>
  );
};`}
            language="typescript"
            instructions="Enter credentials and click 'Log In' to see the authentication flow"
          >
            <Card className="p-6 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Login to Platform</h3>
                <p className="text-sm text-gray-600 mt-1">Enter your credentials to continue</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {loginStatus === 'success' && (
                  <Alert variant="success">
                    ✓ Login successful! Redirecting to dashboard...
                  </Alert>
                )}

                {loginStatus === 'error' && (
                  <Alert variant="danger">
                    ✗ Please enter both email and password.
                  </Alert>
                )}

                <Button
                  onClick={handleLogin}
                  className="w-full"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Demo credentials: demo@example.com / demo123
                </p>
              </div>
            </Card>
          </InteractiveDemo>
        </section>

        {/* Navigation Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Navigation</h2>
          <p className="text-gray-700 mb-4">
            Once logged in, you&apos;ll see the main dashboard. Here are the key navigation elements:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Top Navigation Bar</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Main menu and module access</li>
                <li>• Search functionality</li>
                <li>• Notifications</li>
                <li>• User profile menu</li>
              </ul>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Left Sidebar</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Dashboard link</li>
                <li>• Connectors management</li>
                <li>• Transformations</li>
                <li>• Pipelines</li>
              </ul>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Main Content Area</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Dashboard widgets</li>
                <li>• Data tables and views</li>
                <li>• Forms and editors</li>
                <li>• Visualizations</li>
              </ul>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Actions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create new connector</li>
                <li>• Build pipeline</li>
                <li>• Run existing pipeline</li>
                <li>• View documentation</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="Why is authentication important in the Data Aggregator Platform?"
            options={quizOptions}
            explanation="Authentication verifies user identity and ensures that only authorized users can access sensitive data and platform features. This is crucial for security, compliance, and data protection."
            hint="Think about security and data protection requirements."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>The platform uses JWT tokens for secure, stateless authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Login requires valid credentials (email and password)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>The main interface consists of top nav, sidebar, and content area</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Navigation is intuitive with clear access to all major features</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/1/lesson-2"
          nextLabel="Next: Dashboard Overview"
          previousUrl="/modules/1"
          previousLabel="Back to Module Overview"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
