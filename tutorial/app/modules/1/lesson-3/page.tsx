'use client';

import React, { useState } from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { InteractiveDemo } from '@/components/tutorial/InteractiveDemo';
import { QuizQuestion, QuizOption } from '@/components/tutorial/QuizQuestion';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { progressTracker } from '@/lib/progress';
import {
  Shield,
  Crown,
  Users,
  Settings,
  Database,
  BarChart3,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

type Role = 'super_admin' | 'admin' | 'manager' | 'data_engineer' | 'analyst' | 'viewer';

interface Permission {
  feature: string;
  super_admin: boolean;
  admin: boolean;
  manager: boolean;
  data_engineer: boolean;
  analyst: boolean;
  viewer: boolean;
}

export default function Lesson1_3Page() {
  const [selectedRole, setSelectedRole] = useState<Role>('viewer');

  const handleComplete = () => {
    progressTracker.startLesson('module-1-lesson-3', 'module-1');
    progressTracker.completeLesson('module-1-lesson-3', 100);
  };

  const roles = [
    {
      id: 'super_admin' as Role,
      name: 'Super Admin',
      description: 'Full system access with all privileges',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
    },
    {
      id: 'admin' as Role,
      name: 'Admin',
      description: 'Manage users, resources, and system settings',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50',
    },
    {
      id: 'manager' as Role,
      name: 'Manager',
      description: 'Oversee pipelines, monitor teams, and generate reports',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      id: 'data_engineer' as Role,
      name: 'Data Engineer',
      description: 'Build and manage connectors, transformations, and pipelines',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
    },
    {
      id: 'analyst' as Role,
      name: 'Analyst',
      description: 'Run pipelines, analyze data, and create visualizations',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      id: 'viewer' as Role,
      name: 'Viewer',
      description: 'Read-only access to view resources and reports',
      icon: <Eye className="w-6 h-6" />,
      color: 'bg-gray-500',
      borderColor: 'border-gray-500',
      textColor: 'text-gray-600',
      bgLight: 'bg-gray-50',
    },
  ];

  const permissions: Permission[] = [
    { feature: 'View Dashboard', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: true, viewer: true },
    { feature: 'Create Connectors', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Edit Connectors', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Delete Connectors', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Create Transformations', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Edit Transformations', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Delete Transformations', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Create Pipelines', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Edit Pipelines', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Delete Pipelines', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: false, viewer: false },
    { feature: 'Run Pipelines', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: true, viewer: false },
    { feature: 'View Execution Logs', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: true, viewer: true },
    { feature: 'Manage Users', super_admin: true, admin: true, manager: false, data_engineer: false, analyst: false, viewer: false },
    { feature: 'Assign Roles', super_admin: true, admin: true, manager: false, data_engineer: false, analyst: false, viewer: false },
    { feature: 'System Configuration', super_admin: true, admin: true, manager: false, data_engineer: false, analyst: false, viewer: false },
    { feature: 'Export Data', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: true, viewer: false },
    { feature: 'Generate Reports', super_admin: true, admin: true, manager: true, data_engineer: true, analyst: true, viewer: false },
    { feature: 'View Audit Logs', super_admin: true, admin: true, manager: true, data_engineer: false, analyst: false, viewer: false },
  ];

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'Super Admin only', isCorrect: false },
    { id: '2', text: 'Super Admin and Admin', isCorrect: false },
    { id: '3', text: 'All roles except Viewer', isCorrect: false },
    { id: '4', text: 'Super Admin, Admin, Manager, Data Engineer, and Analyst', isCorrect: true },
  ];

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <LessonLayout
      title="Roles and Permissions"
      description="Understand the 6 user roles in the platform and their permission levels"
      module="Module 1: Platform Basics"
      lessonNumber={3}
      estimatedTime="15 min"
      difficulty="beginner"
      objectives={[
        'Learn about the 6 user roles and their purposes',
        'Understand the permission matrix and access levels',
        'Identify which role fits specific use cases',
        'Recognize security best practices for role assignment',
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Role-Based Access Control</h2>
          <p className="text-gray-700 mb-4">
            The Data Aggregator Platform implements Role-Based Access Control (RBAC) to ensure users
            have appropriate access levels based on their responsibilities. The system defines 6 distinct
            roles, each with specific permissions tailored to common data integration workflows.
          </p>
          <Alert variant="warning">
            <strong>Security Best Practice:</strong> Always assign the minimum role necessary for a user
            to perform their job functions. This principle of least privilege reduces security risks and
            prevents accidental data modifications.
          </Alert>
        </section>

        {/* Role Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The 6 User Roles</h2>
          <p className="text-gray-700 mb-4">
            Each role is designed for specific responsibilities within the data integration lifecycle:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card
                key={role.id}
                className={`p-5 transition-all hover:shadow-lg ${
                  selectedRole === role.id ? `ring-2 ${role.borderColor}` : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 ${role.color} rounded-lg flex items-center justify-center text-white`}>
                    {role.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{role.name}</h4>
                    <Badge variant={role.id === 'super_admin' ? 'error' : role.id === 'admin' ? 'warning' : 'default'}>
                      {role.id.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <Button
                  size="sm"
                  variant={selectedRole === role.id ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setSelectedRole(role.id)}
                >
                  {selectedRole === role.id ? 'Selected' : 'View Permissions'}
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Detailed Role Descriptions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Role Details</h2>

          <div className="space-y-4">
            <Card className="p-5 border-l-4 border-red-500">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-red-600" />
                <h4 className="font-semibold text-gray-900">Super Admin</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Full System Control:</strong> Has unrestricted access to all platform features,
                including system configuration, user management, and all data operations.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Typical Use Case:</strong> Platform administrators, DevOps teams
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Admin</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Administrative Privileges:</strong> Can manage users, assign roles, and configure
                most system settings. Cannot access low-level system configuration.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Typical Use Case:</strong> Team leads, IT administrators
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Manager</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Oversight & Monitoring:</strong> Can create and manage all data resources, monitor
                pipeline execution, and generate reports. Cannot manage users or system settings.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Typical Use Case:</strong> Project managers, data team supervisors
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-6 h-6 text-green-600" />
                <h4 className="font-semibold text-gray-900">Data Engineer</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Technical Development:</strong> Primary role for building data integration workflows.
                Can create, edit, and delete connectors, transformations, and pipelines.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Typical Use Case:</strong> Data engineers, ETL developers
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Analyst</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Data Execution:</strong> Can run existing pipelines, export data, and generate
                reports. Cannot create or modify pipelines, connectors, or transformations.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Typical Use Case:</strong> Data analysts, business intelligence users
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-gray-500">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-6 h-6 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Viewer</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Read-Only Access:</strong> Can view dashboard, resources, and execution logs.
                Cannot execute pipelines, export data, or modify any resources.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Typical Use Case:</strong> Stakeholders, auditors, read-only monitors
              </p>
            </Card>
          </div>
        </section>

        {/* Permission Matrix */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Permission Matrix</h2>
          <p className="text-gray-700 mb-4">
            This comprehensive matrix shows which roles have access to specific platform features:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Feature</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-900 border-b">Super<br/>Admin</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-900 border-b">Admin</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-900 border-b">Manager</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-900 border-b">Data<br/>Engineer</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-900 border-b">Analyst</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-900 border-b">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{perm.feature}</td>
                    <td className="px-3 py-2 text-center">
                      {perm.super_admin ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {perm.admin ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {perm.manager ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {perm.data_engineer ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {perm.analyst ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {perm.viewer ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Interactive Role Explorer */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Role Explorer</h2>
          <p className="text-gray-700 mb-4">
            Select a role above to see its specific permissions highlighted below:
          </p>

          <InteractiveDemo
            title="Role Permission Viewer"
            description="Explore what each role can do"
            code={`// Example: Checking user permissions
const hasPermission = (user, feature) => {
  const rolePermissions = {
    super_admin: ['*'], // All permissions
    admin: ['users.*', 'resources.*', 'config.view'],
    manager: ['resources.*', 'pipelines.run', 'reports.*'],
    data_engineer: ['connectors.*', 'transformations.*', 'pipelines.*'],
    analyst: ['pipelines.run', 'data.export', 'reports.create'],
    viewer: ['*.view']
  };

  const permissions = rolePermissions[user.role] || [];
  return permissions.includes('*') ||
         permissions.includes(feature) ||
         permissions.some(p => p.endsWith('.*') && feature.startsWith(p.slice(0, -2)));
};

// Usage
if (hasPermission(currentUser, 'pipelines.delete')) {
  // Show delete button
}`}
            language="typescript"
            instructions="Use the role selector above to see permissions for different roles"
          >
            {selectedRoleData && (
              <Card className={`p-6 ${selectedRoleData.bgLight} border-2 ${selectedRoleData.borderColor}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 ${selectedRoleData.color} rounded-xl flex items-center justify-center text-white`}>
                    {selectedRoleData.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedRoleData.name}</h4>
                    <p className="text-sm text-gray-600">{selectedRoleData.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-semibold text-gray-900 mb-2">Allowed Permissions:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions
                      .filter(p => p[selectedRole])
                      .map((perm, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{perm.feature}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {permissions.filter(p => !p[selectedRole]).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <h5 className="font-semibold text-gray-900 mb-2">Restricted Permissions:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {permissions
                        .filter(p => !p[selectedRole])
                        .slice(0, 6)
                        .map((perm, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span>{perm.feature}</span>
                          </div>
                        ))}
                      {permissions.filter(p => !p[selectedRole]).length > 6 && (
                        <div className="text-sm text-gray-500 italic">
                          +{permissions.filter(p => !p[selectedRole]).length - 6} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </InteractiveDemo>
        </section>

        {/* RBAC Implementation */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Implementation in Code</h2>
          <p className="text-gray-700 mb-4">
            Here's how role-based access control is implemented in the platform's backend:
          </p>

          <CodeBlock
            code={`from enum import Enum
from typing import List

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    DATA_ENGINEER = "data_engineer"
    ANALYST = "analyst"
    VIEWER = "viewer"

class Permission(str, Enum):
    VIEW_DASHBOARD = "view_dashboard"
    CREATE_CONNECTOR = "create_connector"
    EDIT_CONNECTOR = "edit_connector"
    DELETE_CONNECTOR = "delete_connector"
    CREATE_PIPELINE = "create_pipeline"
    RUN_PIPELINE = "run_pipeline"
    MANAGE_USERS = "manage_users"
    SYSTEM_CONFIG = "system_config"

# Role permission mapping
ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: list(Permission),  # All permissions
    UserRole.ADMIN: [
        Permission.VIEW_DASHBOARD,
        Permission.CREATE_CONNECTOR,
        Permission.EDIT_CONNECTOR,
        Permission.DELETE_CONNECTOR,
        Permission.CREATE_PIPELINE,
        Permission.RUN_PIPELINE,
        Permission.MANAGE_USERS,
    ],
    UserRole.DATA_ENGINEER: [
        Permission.VIEW_DASHBOARD,
        Permission.CREATE_CONNECTOR,
        Permission.EDIT_CONNECTOR,
        Permission.DELETE_CONNECTOR,
        Permission.CREATE_PIPELINE,
        Permission.RUN_PIPELINE,
    ],
    UserRole.ANALYST: [
        Permission.VIEW_DASHBOARD,
        Permission.RUN_PIPELINE,
    ],
    UserRole.VIEWER: [
        Permission.VIEW_DASHBOARD,
    ],
}

def has_permission(user_role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    return permission in ROLE_PERMISSIONS.get(user_role, [])`}
            language="python"
            title="RBAC Backend Implementation"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Best Practices */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Best Practices</h2>
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Principle of Least Privilege:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Always assign the minimum role required for users to complete their work. Avoid
                    giving Admin or Super Admin access unnecessarily.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Regular Access Reviews:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Periodically review user roles and permissions. Remove access for users who no longer
                    need it or have changed responsibilities.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Separation of Duties:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    For sensitive operations, consider requiring multiple approvals or implementing
                    a review process before execution.
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
            question="Which roles can run existing pipelines in the platform?"
            options={quizOptions}
            explanation="Five roles can run pipelines: Super Admin, Admin, Manager, Data Engineer, and Analyst. The Viewer role has read-only access and cannot execute pipelines. This allows users who need to work with data but don't need to build pipelines to still perform their analytical tasks."
            hint="Think about which roles need to execute data workflows versus just viewing them."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>The platform has 6 roles: Super Admin, Admin, Manager, Data Engineer, Analyst, and Viewer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Each role has specific permissions aligned with common job responsibilities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Always follow the principle of least privilege when assigning roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Role-based access control ensures security and prevents unauthorized access</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/1/lesson-4"
          nextLabel="Next: Basic Operations"
          previousUrl="/modules/1/lesson-2"
          previousLabel="Back: Dashboard Overview"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
