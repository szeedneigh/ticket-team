'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface DiagnosticCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: unknown
}

interface DiagnosticResults {
  timestamp: string
  user: {
    id: string
    email: string
    role: string
    full_name: string
  }
  checks: DiagnosticCheck[]
}

interface Props {
  results: DiagnosticResults
}

export function DiagnosticsClient({ results }: Props) {
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const toggleCheck = (checkName: string) => {
    const newSet = new Set(expandedChecks)
    if (newSet.has(checkName)) {
      newSet.delete(checkName)
    } else {
      newSet.add(checkName)
    }
    setExpandedChecks(newSet)
  }

  const copyResults = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const passCount = results.checks.filter(c => c.status === 'pass').length
  const failCount = results.checks.filter(c => c.status === 'fail').length
  const warningCount = results.checks.filter(c => c.status === 'warning').length
  const totalChecks = results.checks.length

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">System Diagnostics</h1>
            <p className="text-muted-foreground mt-1">
              Testing system settings and configuration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyResults}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Results'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/diagnostics">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChecks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Running As</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div>
              <p className="font-medium">{results.user.full_name || results.user.email}</p>
              <p className="text-sm text-muted-foreground">{results.user.email}</p>
            </div>
            <Badge variant={results.user.role === 'super_admin' ? 'default' : 'secondary'}>
              {results.user.role}
            </Badge>
            <div className="ml-auto text-sm text-muted-foreground">
              {new Date(results.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic Checks */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
        
        {results.checks.map((check, index) => {
          const isExpanded = expandedChecks.has(check.name)
          const StatusIcon = check.status === 'pass' 
            ? CheckCircle2 
            : check.status === 'fail' 
            ? XCircle 
            : AlertTriangle

          const statusColor = check.status === 'pass'
            ? 'text-green-600'
            : check.status === 'fail'
            ? 'text-red-600'
            : 'text-yellow-600'

          return (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCheck(check.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      <div>
                        <CardTitle className="text-base">{check.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {check.message}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={check.status === 'pass' ? 'default' : 'destructive'}
                        className={check.status === 'warning' ? 'bg-yellow-500' : ''}
                      >
                        {check.status.toUpperCase()}
                      </Badge>
                      {Boolean(check.details) && (
                        isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && Boolean(check.details) && (
                  <CardContent className="pt-0">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Next Steps */}
      {(failCount > 0 || warningCount > 0) && (
        <Card className="mt-8 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Issues Found
            </CardTitle>
            <CardDescription>
              Review the documentation for troubleshooting steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/docs/troubleshooting/SETTINGS-TROUBLESHOOTING.md" target="_blank">
                  View Troubleshooting Guide
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Or run the SQL fix script in your Supabase SQL Editor:
                <code className="block mt-2 p-2 bg-muted rounded text-xs">
                  docs/troubleshooting/SETTINGS-QUICK-FIX.sql
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Good */}
      {failCount === 0 && warningCount === 0 && (
        <Card className="mt-8 border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              All Systems Operational
            </CardTitle>
            <CardDescription>
              All diagnostic checks passed successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" asChild>
              <Link href="/admin/settings">
                Go to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
