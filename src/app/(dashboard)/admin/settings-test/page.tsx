/**
 * Settings Test Page
 * Quick test to verify settings save/load functionality
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  getSystemConfig,
  getSetting,
  updateSetting,
  getAllSettings
} from '@/lib/settings/actions'
import { RefreshCw, Save, Eye } from 'lucide-react'

export default function SettingsTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [allSettings, setAllSettings] = useState<Record<string, unknown>>({})
  const [testValue, setTestValue] = useState('Hello World')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev])
    console.log(message)
  }

  const loadAllSettings = async () => {
    setLoading(true)
    addLog('Loading all settings...')
    try {
      const settings = await getAllSettings()
      setAllSettings(settings)
      addLog(`Loaded ${Object.keys(settings).length} settings`)
      toast({
        title: 'Settings Loaded',
        description: `Found ${Object.keys(settings).length} settings`
      })
    } catch (error) {
      addLog(`Error loading: ${error}`)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const testSaveLoad = async () => {
    setLoading(true)
    addLog('Starting save/load test...')
    
    try {
      // Test 1: Save a test setting
      addLog('Test 1: Saving test_setting...')
      const saveResult = await updateSetting('test_setting', { value: testValue, timestamp: new Date().toISOString() }, 'Test setting')
      if (saveResult.success) {
        addLog('✅ Save successful')
      } else {
        addLog(`❌ Save failed: ${saveResult.error}`)
        toast({
          title: 'Save Failed',
          description: saveResult.error,
          variant: 'destructive'
        })
        setLoading(false)
        return
      }

      // Test 2: Load it back
      addLog('Test 2: Loading test_setting...')
      const loadResult = await getSetting<{ value: string, timestamp: string }>('test_setting')
      if (loadResult) {
        addLog(`✅ Load successful: ${loadResult.value}`)
        if (loadResult.value === testValue) {
          addLog('✅ Value matches!')
          toast({
            title: 'Test Passed!',
            description: 'Settings save and load correctly'
          })
        } else {
          addLog(`❌ Value mismatch! Expected: ${testValue}, Got: ${loadResult.value}`)
          toast({
            title: 'Test Failed',
            description: 'Values do not match',
            variant: 'destructive'
          })
        }
      } else {
        addLog('❌ Load returned null')
        toast({
          title: 'Test Failed',
          description: 'Could not load saved setting',
          variant: 'destructive'
        })
      }

      // Test 3: System Config
      addLog('Test 3: Loading system_config...')
      const sysConfig = await getSystemConfig()
      if (sysConfig) {
        addLog(`✅ System config loaded: SLA response = ${sysConfig.sla_response_hours}h`)
      } else {
        addLog('❌ System config not found')
      }

      // Reload all settings
      await loadAllSettings()

    } catch (error) {
      addLog(`❌ Test error: ${error}`)
      toast({
        title: 'Test Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllSettings()
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings Test Page</h1>
        <p className="text-muted-foreground mt-1">
          Quick diagnostic for settings save/load functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test</CardTitle>
            <CardDescription>
              Test if settings can be saved and loaded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-value">Test Value</Label>
              <Input
                id="test-value"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Enter a test value"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={testSaveLoad} 
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Run Test
              </Button>
              <Button 
                variant="outline"
                onClick={loadAllSettings} 
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Current Settings ({Object.keys(allSettings).length})</CardTitle>
            <CardDescription>
              All settings in database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Object.keys(allSettings).length === 0 ? (
                <p className="text-sm text-muted-foreground">No settings found</p>
              ) : (
                Object.keys(allSettings).map(key => (
                  <div key={key} className="text-sm border-b pb-2">
                    <span className="font-medium">{key}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Real-time log of operations (also in browser console)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg h-[300px] overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No activity yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Raw Settings Data */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Raw Settings Data</CardTitle>
          <CardDescription>
            JSON dump of all settings (for debugging)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={JSON.stringify(allSettings, null, 2)}
            readOnly
            className="font-mono text-xs h-[400px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
