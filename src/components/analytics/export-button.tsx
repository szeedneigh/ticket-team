/**
 * Export Button Component
 *
 * Provides export functionality for analytics data in various formats.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DownloadIcon, FileTextIcon, FileSpreadsheetIcon, FileJsonIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { ExportFormat } from '@/lib/types/analytics'

export interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void> | void
  formats?: ExportFormat[]
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ExportButton({
  onExport,
  formats = ['csv', 'json', 'pdf'],
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)

    try {
      await onExport(format)
      toast.success(`Exporting as ${format.toUpperCase()}...`)
    } catch (error) {
      toast.error(
        `Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
      case 'pdf':
        return <FileTextIcon className="mr-2 h-4 w-4" />
      case 'json':
        return <FileJsonIcon className="mr-2 h-4 w-4" />
    }
  }

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return 'Export as CSV'
      case 'pdf':
        return 'Export as PDF'
      case 'json':
        return 'Export as JSON'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
          className={className}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting}
          >
            {getFormatIcon(format)}
            {getFormatLabel(format)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple Export Button (no dropdown)
 * For single format exports
 */
export interface SimpleExportButtonProps {
  onExport: () => Promise<void> | void
  format: ExportFormat
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function SimpleExportButton({
  onExport,
  format,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
}: SimpleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      await onExport()
      toast.success(`Exporting as ${format.toUpperCase()}...`)
    } catch (error) {
      toast.error(
        `Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isExporting}
      onClick={handleExport}
      className={className}
    >
      <DownloadIcon className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
    </Button>
  )
}
