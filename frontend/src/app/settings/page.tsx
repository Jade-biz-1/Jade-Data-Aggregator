'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Mail, 
  Lock, 
  Globe,
  Bell,
  Shield,
  Save,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { apiClient } from '@/lib/api';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  timezone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    timezone: 'UTC',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    pipelineAlerts: true,
    connectorAlerts: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30, // minutes
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        timezone: 'UTC',
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (name: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  const handleSecurityChange = (name: keyof typeof securitySettings, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('User not authenticated');
      return;
    }
    
    try {
      // Update profile via API
      const updatedUser = await apiClient.updateProfile(user.id, {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        username: profileData.username,
      });
      
      // Update the auth store with the new user data
      updateUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters');
      return;
    }
    
    try {
      // In a real app, this would call the password change endpoint
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      alert('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Notification settings updated:', notificationSettings);
    // In a real app, you would make an API call here
    alert('Notification settings updated successfully!');
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Security settings updated:', securitySettings);
    // In a real app, you would make an API call here
    alert('Security settings updated successfully!');
  };

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="First Name"
            name="firstName"
            value={profileData.firstName}
            onChange={handleProfileChange}
            placeholder="Enter your first name"
          />
        </div>
        
        <div>
          <Input
            label="Last Name"
            name="lastName"
            value={profileData.lastName}
            onChange={handleProfileChange}
            placeholder="Enter your last name"
          />
        </div>
        
        <div>
          <Input
            label="Username"
            name="username"
            value={profileData.username}
            onChange={handleProfileChange}
            placeholder="Enter your username"
          />
        </div>
        
        <div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={profileData.email}
            onChange={handleProfileChange}
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            name="timezone"
            value={profileData.timezone}
            onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:border-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="EST">EST (Eastern Standard Time)</option>
            <option value="PST">PST (Pacific Standard Time)</option>
            <option value="GMT">GMT (Greenwich Mean Time)</option>
            <option value="CET">CET (Central European Time)</option>
          </select>
        </div>
      </div>
      
      <div className="mt-8">
        <Button type="submit" className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Save Profile
        </Button>
      </div>
    </form>
  );

  const renderPasswordTab = () => (
    <form onSubmit={handlePasswordSubmit}>
      <div className="space-y-6">
        <div className="relative">
          <Input
            label="Current Password"
            name="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Enter your current password"
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="relative">
          <Input
            label="New Password"
            name="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            placeholder="Enter your new password"
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="relative">
          <Input
            label="Confirm New Password"
            name="confirmNewPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={passwordData.confirmNewPassword}
            onChange={handlePasswordChange}
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <Button type="submit" className="flex items-center">
          <Key className="h-4 w-4 mr-2" />
          Update Password
        </Button>
      </div>
    </form>
  );

  const renderNotificationsTab = () => (
    <form onSubmit={handleNotificationSubmit}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <button
            type="button"
            onClick={() => handleNotificationChange('emailNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              notificationSettings.emailNotifications ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">Receive push notifications in the app</p>
          </div>
          <button
            type="button"
            onClick={() => handleNotificationChange('pushNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              notificationSettings.pushNotifications ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Pipeline Alerts</h3>
            <p className="text-sm text-gray-500">Get notified when pipelines fail or have issues</p>
          </div>
          <button
            type="button"
            onClick={() => handleNotificationChange('pipelineAlerts')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              notificationSettings.pipelineAlerts ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                notificationSettings.pipelineAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Connector Alerts</h3>
            <p className="text-sm text-gray-500">Get notified when connectors have connection issues</p>
          </div>
          <button
            type="button"
            onClick={() => handleNotificationChange('connectorAlerts')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              notificationSettings.connectorAlerts ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                notificationSettings.connectorAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <Button type="submit" className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>
    </form>
  );

  const renderSecurityTab = () => (
    <form onSubmit={handleSecuritySubmit}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <button
            type="button"
            onClick={() => handleSecurityChange('twoFactorAuth', !securitySettings.twoFactorAuth)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              securitySettings.twoFactorAuth ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Login Alerts</h3>
            <p className="text-sm text-gray-500">Receive alerts when your account is accessed</p>
          </div>
          <button
            type="button"
            onClick={() => handleSecurityChange('loginAlerts', !securitySettings.loginAlerts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              securitySettings.loginAlerts ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Timeout
          </label>
          <select
            value={securitySettings.sessionTimeout}
            onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:border-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={0}>Never</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            How long before your session expires due to inactivity
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <Button type="submit" className="flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          Save Security Settings
        </Button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64">
            <Card>
              <CardContent className="p-0 mt-4">
                <nav className="space-y-1">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'password', label: 'Password', icon: Lock },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'security', label: 'Security', icon: Shield },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="mr-3 h-5 w-5" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  {activeTab === 'profile' && <User className="h-5 w-5 mr-2 text-gray-500" />}
                  {activeTab === 'password' && <Lock className="h-5 w-5 mr-2 text-gray-500" />}
                  {activeTab === 'notifications' && <Bell className="h-5 w-5 mr-2 text-gray-500" />}
                  {activeTab === 'security' && <Shield className="h-5 w-5 mr-2 text-gray-500" />}
                  <CardTitle className="capitalize">
                    {activeTab} Settings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : activeTab === 'profile' ? (
                  renderProfileTab()
                ) : activeTab === 'password' ? (
                  renderPasswordTab()
                ) : activeTab === 'notifications' ? (
                  renderNotificationsTab()
                ) : activeTab === 'security' ? (
                  renderSecurityTab()
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}