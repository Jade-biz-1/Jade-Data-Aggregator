'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ShoppingCart,
  Wifi,
  DollarSign,
  Users,
  Trophy,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Rocket
} from 'lucide-react';

export default function Module6Page() {
  const scenarios = [
    {
      id: 1,
      title: 'E-commerce Sales Pipeline',
      description: 'Build a real-time sales analytics pipeline processing orders, inventory, and customer data from multiple channels',
      icon: ShoppingCart,
      difficulty: 'Intermediate',
      duration: '45 min',
      url: '/modules/6/scenario-1',
      skills: ['Multi-source integration', 'Real-time processing', 'Inventory tracking', 'Sales analytics'],
      businessValue: 'Unified view of sales across all channels with real-time inventory updates'
    },
    {
      id: 2,
      title: 'IoT Sensor Data Processing',
      description: 'Process and analyze millions of sensor readings from IoT devices with real-time anomaly detection and alerting',
      icon: Wifi,
      difficulty: 'Advanced',
      duration: '60 min',
      url: '/modules/6/scenario-2',
      skills: ['Time-series data', 'Stream processing', 'Anomaly detection', 'High-volume ingestion'],
      businessValue: 'Proactive equipment monitoring and predictive maintenance'
    },
    {
      id: 3,
      title: 'Financial Reporting System',
      description: 'Create automated financial reports by aggregating data from accounting systems, banks, and payment processors',
      icon: DollarSign,
      difficulty: 'Advanced',
      duration: '50 min',
      url: '/modules/6/scenario-3',
      skills: ['Data reconciliation', 'Compliance tracking', 'Automated reporting', 'Audit trails'],
      businessValue: 'Automated financial close process with audit-ready reports'
    },
    {
      id: 4,
      title: 'Customer 360 View',
      description: 'Build a unified customer profile by consolidating data from CRM, support tickets, purchases, and interactions',
      icon: Users,
      difficulty: 'Advanced',
      duration: '55 min',
      url: '/modules/6/scenario-4',
      skills: ['Entity resolution', 'Data deduplication', 'Profile enrichment', 'Master data management'],
      businessValue: 'Complete customer view for personalized experiences and better service'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/modules"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to All Modules
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Module 6: Production Scenarios
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Real-world use cases and best practices
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="success" className="text-lg px-4 py-2">
              Production Ready
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">4</div>
                  <div className="text-sm text-gray-600">Real Scenarios</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">1</div>
                  <div className="text-sm text-gray-600">Capstone Project</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">~3.5 hrs</div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Module Overview */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            What You&apos;ll Build
          </h2>
          <p className="text-gray-700 mb-4">
            In this module, you&apos;ll work through four production-ready scenarios that mirror real-world
            data engineering challenges. Each scenario provides business context, technical requirements,
            and step-by-step implementation guidance. You&apos;ll apply everything you&apos;ve learned in Modules 1-5.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Solve real business problems with data pipelines
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Learn industry best practices and patterns
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Handle production-scale data volumes
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Build portfolio-ready data engineering projects
              </span>
            </div>
          </div>
        </Card>

        {/* Scenarios */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Production Scenarios</h2>
          <div className="space-y-6">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <scenario.icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Scenario {scenario.id}: {scenario.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{scenario.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge variant="default" className="whitespace-nowrap">
                          {scenario.duration}
                        </Badge>
                        <Badge
                          variant={scenario.difficulty === 'Advanced' ? 'warning' : 'default'}
                          className="whitespace-nowrap"
                        >
                          {scenario.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Key Skills:</div>
                      <div className="flex flex-wrap gap-2">
                        {scenario.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Business Value */}
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">Business Value:</div>
                      <div className="text-sm text-gray-600">{scenario.businessValue}</div>
                    </div>

                    <Link href={scenario.url}>
                      <Button size="sm" className="flex items-center gap-2">
                        Start Scenario
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Capstone Project */}
        <Card className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Final Capstone Project
              </h3>
              <p className="text-gray-700 mb-4">
                Design and implement a comprehensive data platform solution from scratch. This
                capstone project combines all four scenarios into a single integrated system with
                real-time dashboards, monitoring, and advanced analytics. This is your opportunity
                to demonstrate mastery of the entire Data Aggregator Platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Multi-scenario integration
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Production-grade architecture
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Advanced analytics and reporting
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Portfolio-ready project
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="warning" className="text-base px-3 py-1">
                  Expert Level
                </Badge>
                <span className="text-sm text-gray-600">
                  Estimated time: 2-3 hours
                </span>
              </div>
              <Link href="/modules/6/capstone">
                <Button variant="primary" className="flex items-center gap-2">
                  Start Capstone Project
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Prerequisites */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Prerequisites
          </h3>
          <p className="text-gray-700 mb-3">
            Before starting this module, you must have completed:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 1: Platform Basics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 2: Connectors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 3: Transformations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 4: Pipelines</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 5: Advanced Features</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
