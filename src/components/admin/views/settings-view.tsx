'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings2, Mail, Building2, Tag } from 'lucide-react'
import { SystemConfigSettings } from '@/components/settings/system-config-settings'
import { DepartmentSettings } from '@/components/settings/department-settings'
import { EmailSettings } from '@/components/settings/email-settings'
import { CategorySettings } from '@/components/settings/category-settings'

export function SettingsView() {
  const [activeTab, setActiveTab] = useState('system')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage system configuration, departments, and categories
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 backdrop-blur-sm grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="system" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure SLA settings, response times, and system behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemConfigSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification preferences and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Department Management</CardTitle>
              <CardDescription>
                Manage organizational departments and teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Manage ticket and knowledge base categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategorySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
