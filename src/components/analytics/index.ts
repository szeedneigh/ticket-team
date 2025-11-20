/**
 * Analytics Components
 *
 * Re-export all analytics visualization components for easier imports.
 */

export { KPICard, KPICardGrid } from './kpi-card'
export type { KPICardProps } from './kpi-card'

export { TrendChart, MultiLineTrendChart } from './trend-chart'
export type { TrendChartProps, TrendChartDataPoint, MultiLineTrendChartProps } from './trend-chart'

export { CategoryChart, CategoryLegend } from './category-chart'
export type { CategoryChartProps, CategoryChartDataPoint, CategoryLegendProps } from './category-chart'

export { BarChart, StackedBarChart } from './bar-chart'
export type { BarChartProps, BarChartDataPoint, StackedBarChartProps } from './bar-chart'

export { DataTable } from './data-table'
export type { DataTableProps, DataTableColumn } from './data-table'

export { DateRangePicker } from './date-range-picker'
export type { DateRangePickerProps } from './date-range-picker'

export { ExportButton, SimpleExportButton } from './export-button'
export type { ExportButtonProps, SimpleExportButtonProps } from './export-button'

// Lazy-loaded chart components for better performance
export {
  LazyTrendChart,
  LazyMultiLineTrendChart,
  LazyCategoryChart,
  LazyBarChart,
  LazyStackedBarChart,
} from './lazy-charts'
