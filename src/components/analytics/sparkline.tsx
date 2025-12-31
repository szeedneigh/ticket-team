'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  className?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function Sparkline({ 
  data, 
  color = 'currentColor', 
  height = 40,
  className 
}: SparklineProps) {
  const chartData = data.map((val, i) => ({ i, val }))

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
